import type { Response } from "express";
import { dbPool } from "../config/database";
import { ApiResponse } from "../utils/response.util";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getNotesQuerySchema,
  createNoteSchema,
  updateNoteSchema,
  noteIdParamSchema,
  type NoteDbRow,
} from "../schemas/note.schema";

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
      SELECT id, user_id, topic_id, title, content, is_pinned, version, created_at, updated_at
      FROM notes
      WHERE user_id = $1
    `;
    const params: unknown[] = [userId];

    // Filter theo topicId nếu có
    if (topicId) {
      params.push(topicId);
      sql += ` AND topic_id = $${params.length}`;
    }

    // Filter theo từ khóa search nếu có
    if (search?.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (title ILIKE $${params.length} OR content ILIKE $${params.length})`;
    }

    // Sắp xếp ghim lên đầu, sau đó theo thời gian tạo mới nhất
    sql += ` ORDER BY is_pinned DESC, created_at DESC`;

    const result = await dbPool.query<NoteDbRow>(sql, params);

    return ApiResponse.success(
      res,
      200,
      "Lấy danh sách ghi chú thành công",
      result.rows,
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
      parsed.error.issues[0]?.message ?? "Tiêu đề và nội dung là bắt buộc";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { topicId, title, content, isPinned } = parsed.data;

  try {
    const result = await dbPool.query<NoteDbRow>(
      `INSERT INTO notes (user_id, topic_id, title, content, is_pinned)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, topic_id, title, content, is_pinned, version, created_at, updated_at`,
      [userId, topicId ?? null, title, content, isPinned],
    );

    const newNote = result.rows[0];
    if (!newNote) {
      throw new Error("Không thể tạo ghi chú");
    }

    return ApiResponse.success(res, 201, "Tạo ghi chú thành công", newNote);
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
    const result = await dbPool.query<Pick<NoteDbRow, "id">>(
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

    return ApiResponse.success(res, 200, "Xóa ghi chú thành công");
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
  const { topicId, title, content, isPinned } = parsedBody.data;

  try {
    const existing = await dbPool.query<NoteDbRow>(
      "SELECT id, topic_id, title, content, is_pinned, version FROM notes WHERE id = $1 AND user_id = $2",
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
    const newContent = content ?? current.content;
    const newIsPinned = isPinned ?? current.is_pinned;

    const result = await dbPool.query<NoteDbRow>(
      `UPDATE notes
       SET topic_id = $1, title = $2, content = $3, is_pinned = $4, version = version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING id, user_id, topic_id, title, content, is_pinned, version, created_at, updated_at`,
      [newTopicId, newTitle, newContent, newIsPinned, id, userId],
    );

    const updatedNote = result.rows[0];
    if (!updatedNote) {
      throw new Error("Không thể cập nhật ghi chú");
    }

    return ApiResponse.success(
      res,
      200,
      "Cập nhật ghi chú thành công",
      updatedNote,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

export const NoteController = {
  getNotes,
  createNote,
  deleteNote,
  updateNote,
};
