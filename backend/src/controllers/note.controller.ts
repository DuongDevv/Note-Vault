import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { dbPool } from "../config/database";
import { ApiResponse } from "../utils/response.util";
import { requireUserId } from "../utils/auth.util";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { CryptoService } from "../services/crypto.service";
import {
  getNotesQuerySchema,
  createNoteSchema,
  updateNoteSchema,
  noteIdParamSchema,
  type NoteResponse,
} from "../schemas/note.schema";

interface NoteDbResult {
  id: string;
  user_id: string;
  topic_id: string | null;
  title: string;
  content: string | null;
  tags: string[];
  is_locked: boolean;
  is_pinned: boolean;
  encrypted_key: string | null;
  created_at: string;
  updated_at: string;
}

const NOTE_COLUMNS =
  "id, user_id, topic_id, title, content, tags, is_locked, is_pinned, encrypted_key, created_at, updated_at";
/**
 * Decrypts note content safely or masks if locked without credentials.
 */
function formatNoteResponse(
  row: NoteDbResult,
  userId: string,
  vaultPin?: string,
): NoteResponse {
  let decryptedContent: unknown = null;

  if (row.content) {
    if (row.is_locked) {
      if (vaultPin) {
        // Nếu note có encrypted_key -> dùng Enveloped Decryption
        if (row.encrypted_key) {
          decryptedContent = CryptoService.decryptEnveloped(
            row.content,
            row.encrypted_key,
            userId,
            vaultPin,
          );
        } else {
          // Fallback cho note cũ tạo trước khi có Enveloped Encryption
          decryptedContent = CryptoService.decryptNoteContent(
            row.content,
            userId,
            vaultPin,
          );
        }
      } else {
        // Masked content for locked notes when not unlocked with PIN
        decryptedContent = null;
      }
    } else {
      decryptedContent = row.encrypted_key
        ? CryptoService.decryptEnveloped(row.content, row.encrypted_key, userId)
        : CryptoService.decryptNoteContent(row.content, userId);
    }
  }

  return {
    id: row.id,
    userId: row.user_id,
    topicId: row.topic_id,
    title: row.title,
    content:
      decryptedContent === null
        ? null
        : typeof decryptedContent === "string"
          ? decryptedContent
          : JSON.stringify(decryptedContent),
    tags: row.tags,
    isLocked: row.is_locked,
    isPinned: row.is_pinned,
    encryptedKey: row.encrypted_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Lấy danh sách Ghi chú từ Database (GET /api/v1/notes)
export async function getNotes(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedQuery = getNotesQuerySchema.safeParse(req.query);
  const query = parsedQuery.success ? parsedQuery.data : {};
  const { topicId, search } = query;

  try {
    let sql = `
      SELECT ${NOTE_COLUMNS}
      FROM notes
      WHERE user_id = $1
    `;
    const params: unknown[] = [userId];

    if (topicId) {
      params.push(topicId);
      sql += ` AND topic_id = $${params.length}`;
    }

    if (search?.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (title ILIKE $${params.length} OR tags::text ILIKE $${params.length})`;
    }
    sql += ` ORDER BY created_at DESC`;
    const result = await dbPool.query<NoteDbResult>(sql, params);
    const formattedNotes = result.rows.map((row) =>
      formatNoteResponse(row, userId),
    );

    ApiResponse.success(
      res,
      200,
      "Lấy danh sách ghi chú thành công",
      formattedNotes,
    );
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

// Lấy chi tiết một Ghi chú theo ID (GET /api/v1/notes/:id)
export async function getNoteById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    ApiResponse.error(res, 400, "BAD_REQUEST", "ID ghi chú không hợp lệ");
    return;
  }

  const { id } = parsedParam.data;
  const rawPinHeader = req.headers["x-private-pin"];
  const vaultPin =
    typeof rawPinHeader === "string" ? rawPinHeader.trim() : undefined;

  try {
    const result = await dbPool.query<NoteDbResult>(
      `SELECT ${NOTE_COLUMNS}
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );

    const note = result.rows[0];
    if (!note) {
      ApiResponse.error(res, 404, "NOT_FOUND", "Không tìm thấy ghi chú");
      return;
    }

    if (vaultPin && note.is_locked) {
      const userRes = await dbPool.query<{ private_pin_hash: string | null }>(
        "SELECT private_pin_hash FROM users WHERE id = $1",
        [userId],
      );
      const pinHash = userRes.rows[0]?.private_pin_hash;
      if (!pinHash) {
        ApiResponse.error(
          res,
          400,
          "BAD_REQUEST",
          "Bạn chưa thiết lập mã Master PIN trên hệ thống",
        );
        return;
      }

      const isValidPin = await CryptoService.verifyHash(pinHash, vaultPin);
      if (!isValidPin) {
        ApiResponse.error(res, 403, "FORBIDDEN", "Mã PIN không chính xác");
        return;
      }
    }

    const formattedNote = formatNoteResponse(
      note,
      userId,
      vaultPin && note.is_locked ? vaultPin : undefined,
    );

    if (
      vaultPin &&
      note.is_locked &&
      formattedNote.content === null &&
      note.content !== null
    ) {
      ApiResponse.error(
        res,
        403,
        "FORBIDDEN",
        "Không thể giải mã nội dung với mã PIN này",
      );
      return;
    }
    ApiResponse.success(
      res,
      200,
      "Lấy chi tiết ghi chú thành công",
      formattedNote,
    );
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

// Tạo Ghi chú mới lưu vào Database (POST /api/v1/notes)
export async function createNote(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Tiêu đề ghi chú là bắt buộc";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }

  const { topicId, title, content, tags, isLocked, pin } = parsed.data;

  try {
    let encryptedPacked: string;
    let encryptedKey: string | null = null;

    if (isLocked && pin) {
      const enveloped = CryptoService.encryptEnveloped(content, userId, pin);
      encryptedPacked = enveloped.encryptedContent;
      encryptedKey = enveloped.encryptedKey;
    } else {
      encryptedPacked = CryptoService.encryptNoteContent(content, userId);
    }

    const noteId = randomUUID();
    const result = await dbPool.query<NoteDbResult>(
      `INSERT INTO notes (id, user_id, topic_id, title, content, tags, is_locked, encrypted_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${NOTE_COLUMNS}`,
      [
        noteId,
        userId,
        topicId ?? null,
        title,
        encryptedPacked,
        tags,
        isLocked,
        encryptedKey,
      ],
    );

    const newNote = result.rows[0];
    if (!newNote) {
      throw new Error("Không thể tạo ghi chú");
    }

    const formatted = formatNoteResponse(newNote, userId, pin);
    ApiResponse.success(res, 201, "Tạo ghi chú thành công", formatted);
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

// Xóa Ghi chú khỏi Database (DELETE /api/v1/notes/:id)
export async function deleteNote(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID ghi chú không hợp lệ";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }
  const { id } = parsedParam.data;

  try {
    const result = await dbPool.query<{ id: string }>(
      "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy ghi chú hoặc không có quyền xóa",
      );
      return;
    }

    ApiResponse.success(res, 200, "Xóa ghi chú thành công", { id });
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

// Cập nhật Ghi chú trong Database (PUT /api/v1/notes/:id)
export async function updateNote(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID ghi chú không hợp lệ";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }

  const parsedBody = updateNoteSchema.safeParse(req.body);
  if (!parsedBody.success) {
    const errorMsg =
      parsedBody.error.issues[0]?.message ?? "Dữ liệu cập nhật không hợp lệ";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }
  const { id } = parsedParam.data;
  const {
    topicId,
    title,
    content,
    tags,
    isLocked,
    pin: rawPin,
  } = parsedBody.data;
  const pin = typeof rawPin === "string" ? rawPin.trim() : undefined;
  try {
    const existing = await dbPool.query<NoteDbResult>(
      "SELECT id, topic_id, title, content, tags, is_locked, is_pinned, encrypted_key FROM notes WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    const current = existing.rows[0];
    if (!current) {
      ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy ghi chú để cập nhật",
      );
      return;
    }

    const newTopicId = topicId !== undefined ? topicId : current.topic_id;
    const newTitle = title ?? current.title;
    const newTags = tags ?? current.tags;
    const newIsLocked = isLocked ?? current.is_locked;
    if (newIsLocked !== current.is_locked) {
      if (!pin) {
        ApiResponse.error(
          res,
          400,
          "BAD_REQUEST",
          "Vui lòng nhập mã PIN để thực hiện thao tác này",
        );
        return;
      }

      const userRes = await dbPool.query<{ private_pin_hash: string | null }>(
        "SELECT private_pin_hash FROM users WHERE id = $1",
        [userId],
      );
      const pinHash = userRes.rows[0]?.private_pin_hash;
      if (!pinHash) {
        ApiResponse.error(
          res,
          400,
          "BAD_REQUEST",
          "Bạn chưa thiết lập mã Master PIN trên hệ thống",
        );
        return;
      }

      const isValidPin = await CryptoService.verifyHash(pinHash, pin);
      if (!isValidPin) {
        ApiResponse.error(res, 400, "BAD_REQUEST", "Mã PIN không chính xác");
        return;
      }
    }

    let encryptedContent = current.content;
    let encryptedKey = current.encrypted_key;

    if (content !== undefined) {
      if (newIsLocked) {
        if (pin) {
          const enveloped = CryptoService.encryptEnveloped(
            content,
            userId,
            pin,
          );
          encryptedContent = enveloped.encryptedContent;
          encryptedKey = enveloped.encryptedKey;
        } else if (current.encrypted_key) {
          // Giữ nguyên encryptedKey hiện tại, nhưng giải mã DEK để mã hóa lại content mới
          // Hoặc mã hóa lại bằng userKey fallback
          encryptedContent = CryptoService.encryptNoteContent(content, userId);
        } else {
          encryptedContent = CryptoService.encryptNoteContent(content, userId);
        }
      } else {
        encryptedContent = CryptoService.encryptNoteContent(content, userId);
        encryptedKey = null;
      }
    } else if (newIsLocked !== current.is_locked && current.content) {
      if (newIsLocked) {
        // Chuyển từ unlock sang lock: giải mã content cũ rồi bọc thành Enveloped Encryption
        const plain = current.encrypted_key
          ? CryptoService.decryptEnveloped(
              current.content,
              current.encrypted_key,
              userId,
            )
          : CryptoService.decryptNoteContent(current.content, userId);
        if (plain !== null && pin) {
          const enveloped = CryptoService.encryptEnveloped(plain, userId, pin);
          encryptedContent = enveloped.encryptedContent;
          encryptedKey = enveloped.encryptedKey;
        }
      } else {
        // Chuyển từ lock sang unlock: giải mã bằng pin rồi mã hóa lại bằng userKey bình thường
        const plain = current.encrypted_key
          ? CryptoService.decryptEnveloped(
              current.content,
              current.encrypted_key,
              userId,
              pin,
            )
          : CryptoService.decryptNoteContent(current.content, userId, pin);
        if (plain !== null) {
          encryptedContent = CryptoService.encryptNoteContent(plain, userId);
          encryptedKey = null;
        }
      }
    }

    const result = await dbPool.query<NoteDbResult>(
      `UPDATE notes
       SET topic_id = $1, title = $2, content = $3, tags = $4, is_locked = $5, encrypted_key = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING ${NOTE_COLUMNS}`,
      [
        newTopicId,
        newTitle,
        encryptedContent,
        newTags,
        newIsLocked,
        encryptedKey,
        id,
        userId,
      ],
    );

    const updatedNote = result.rows[0];
    if (!updatedNote) {
      throw new Error("Không thể cập nhật ghi chú");
    }

    const formatted = formatNoteResponse(updatedNote, userId, pin);
    ApiResponse.success(res, 200, "Cập nhật ghi chú thành công", formatted);
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

// Toggle trạng thái Ghim ghi chú (POST /api/v1/notes/:id/toggle-pin)
export async function toggleNotePin(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    ApiResponse.error(res, 400, "BAD_REQUEST", "ID ghi chú không hợp lệ");
    return;
  }
  const { id } = parsedParam.data;

  try {
    const result = await dbPool.query<NoteDbResult>(
      `UPDATE notes
       SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING ${NOTE_COLUMNS}`,
      [id, userId],
    );

    const updatedNote = result.rows[0];
    if (!updatedNote) {
      ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy ghi chú hoặc không có quyền chỉnh sửa",
      );
      return;
    }

    const formatted = formatNoteResponse(updatedNote, userId);
    ApiResponse.success(
      res,
      200,
      updatedNote.is_pinned ? "Ghim ghi chú thành công" : "Bỏ ghim ghi chú thành công",
      formatted,
    );
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

export const NoteController = {
  getNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
  toggleNotePin,
};
