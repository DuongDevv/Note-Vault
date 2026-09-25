import type { Response } from "express";
import { dbPool } from "../config/database";
import { ApiResponse } from "../utils/response.util";
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
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

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
    try {
      if (row.is_locked) {
        if (vaultPin) {
          decryptedContent = CryptoService.decryptNoteContent(
            row.content,
            userId,
            vaultPin,
          );
        } else {
          // Masked content for locked notes on list view
          decryptedContent = null;
        }
      } else {
        decryptedContent = CryptoService.decryptNoteContent(
          row.content,
          userId,
        );
      }
    } catch {
      decryptedContent = row.content;
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
    isPinned: row.is_pinned,
    isLocked: row.is_locked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Lấy danh sách Ghi chú từ Database (GET /api/v1/notes)
export async function getNotes(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsedQuery = getNotesQuerySchema.safeParse(req.query);
  const query = parsedQuery.success ? parsedQuery.data : {};
  const { topicId, search } = query;

  try {
    let sql = `
      SELECT id, user_id, topic_id, title, content, tags, is_pinned, is_locked, created_at, updated_at
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

    sql += ` ORDER BY is_pinned DESC, created_at DESC`;

    const result = await dbPool.query<NoteDbResult>(sql, params);
    const formattedNotes = result.rows.map((row) =>
      formatNoteResponse(row, userId),
    );

    return ApiResponse.success(
      res,
      200,
      "Lấy danh sách ghi chú thành công",
      formattedNotes,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Lấy chi tiết một Ghi chú theo ID (GET /api/v1/notes/:id)
export async function getNoteById(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    return ApiResponse.error(
      res,
      400,
      "BAD_REQUEST",
      "ID ghi chú không hợp lệ",
    );
  }

  const { id } = parsedParam.data;
  const rawPinHeader = req.headers["x-private-pin"];
  const vaultPin = typeof rawPinHeader === "string" ? rawPinHeader : undefined;

  try {
    const result = await dbPool.query<NoteDbResult>(
      `SELECT id, user_id, topic_id, title, content, tags, is_pinned, is_locked, created_at, updated_at
       FROM notes
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );

    const note = result.rows[0];
    if (!note) {
      return ApiResponse.error(res, 404, "NOT_FOUND", "Không tìm thấy ghi chú");
    }

    const formattedNote = formatNoteResponse(note, userId, vaultPin);
    return ApiResponse.success(
      res,
      200,
      "Lấy chi tiết ghi chú thành công",
      formattedNote,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Tạo Ghi chú mới lưu vào Database (POST /api/v1/notes)
export async function createNote(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Tiêu đề ghi chú là bắt buộc";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { topicId, title, content, tags, isPinned, isLocked, pin } =
    parsed.data;

  try {
    // Encrypt at rest by default
    const encryptedPacked = CryptoService.encryptNoteContent(
      content,
      userId,
      isLocked ? pin : undefined,
    );

    const result = await dbPool.query<NoteDbResult>(
      `INSERT INTO notes (user_id, topic_id, title, content, tags, is_pinned, is_locked)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, topic_id, title, content, tags, is_pinned, is_locked, created_at, updated_at`,
      [
        userId,
        topicId ?? null,
        title,
        encryptedPacked,
        tags,
        isPinned,
        isLocked,
      ],
    );

    const newNote = result.rows[0];
    if (!newNote) {
      throw new Error("Không thể tạo ghi chú");
    }

    const formatted = formatNoteResponse(newNote, userId, pin);
    return ApiResponse.success(res, 201, "Tạo ghi chú thành công", formatted);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Xóa Ghi chú khỏi Database (DELETE /api/v1/notes/:id)
export async function deleteNote(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID ghi chú không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { id } = parsedParam.data;

  try {
    const result = await dbPool.query<{ id: string }>(
      "DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy ghi chú hoặc không có quyền xóa",
      );
    }

    return ApiResponse.success(res, 200, "Xóa ghi chú thành công", { id });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Cập nhật Ghi chú trong Database (PUT /api/v1/notes/:id)
export async function updateNote(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsedParam = noteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID ghi chú không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const parsedBody = updateNoteSchema.safeParse(req.body);
  if (!parsedBody.success) {
    const errorMsg =
      parsedBody.error.issues[0]?.message ?? "Dữ liệu cập nhật không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { id } = parsedParam.data;
  const { topicId, title, content, tags, isPinned, isLocked, pin } =
    parsedBody.data;

  try {
    const existing = await dbPool.query<NoteDbResult>(
      "SELECT id, topic_id, title, content, tags, is_pinned, is_locked FROM notes WHERE id = $1 AND user_id = $2",
      [id, userId],
    );

    const current = existing.rows[0];
    if (!current) {
      return ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy ghi chú để cập nhật",
      );
    }

    const newTopicId = topicId !== undefined ? topicId : current.topic_id;
    const newTitle = title ?? current.title;
    const newTags = tags ?? current.tags;
    const newIsPinned = isPinned ?? current.is_pinned;
    const newIsLocked = isLocked ?? current.is_locked;

    let encryptedContent = current.content;
    if (content !== undefined) {
      encryptedContent = CryptoService.encryptNoteContent(
        content,
        userId,
        newIsLocked ? pin : undefined,
      );
    }

    const result = await dbPool.query<NoteDbResult>(
      `UPDATE notes
       SET topic_id = $1, title = $2, content = $3, tags = $4, is_pinned = $5, is_locked = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, topic_id, title, content, tags, is_pinned, is_locked, created_at, updated_at`,
      [
        newTopicId,
        newTitle,
        encryptedContent,
        newTags,
        newIsPinned,
        newIsLocked,
        id,
        userId,
      ],
    );

    const updatedNote = result.rows[0];
    if (!updatedNote) {
      throw new Error("Không thể cập nhật ghi chú");
    }

    const formatted = formatNoteResponse(updatedNote, userId, pin);
    return ApiResponse.success(
      res,
      200,
      "Cập nhật ghi chú thành công",
      formatted,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

export const NoteController = {
  getNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
};
