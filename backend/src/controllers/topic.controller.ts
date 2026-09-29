import { randomUUID } from "node:crypto";
import type { Response } from "express";
import { dbPool } from "../config/database";
import { ApiResponse } from "../utils/response.util";
import { requireUserId } from "../utils/auth.util";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  createTopicSchema,
  updateTopicSchema,
  topicIdParamSchema,
  type TopicResponse,
} from "../schemas/topic.schema";

// Lấy danh sách Chủ đề của User (GET /api/v1/topics)
export async function getTopics(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  try {
    const result = await dbPool.query<TopicResponse>(
      `SELECT id, user_id as "userId", name, slug, color, icon, created_at as "createdAt", updated_at as "updatedAt"
       FROM topics
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId],
    );
    ApiResponse.success(
      res,
      200,
      "Lấy danh sách chủ đề thành công",
      result.rows,
    );
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

// Tạo Chủ đề mới (POST /api/v1/topics)
export async function createTopic(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsed = createTopicSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Tên chủ đề không được để rỗng";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }

  const { name, color, icon } = parsed.data;

  // Tự sinh slug từ name
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  try {
    const topicId = randomUUID();
    const result = await dbPool.query<TopicResponse>(
      `INSERT INTO topics (id, user_id, name, slug, color, icon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id as "userId", name, slug, color, icon, created_at as "createdAt", updated_at as "updatedAt"`,
      [topicId, userId, name, slug, color, icon],
    );

    const newTopic = result.rows[0];
    if (!newTopic) {
      throw new Error("Không thể tạo chủ đề mới");
    }
    ApiResponse.success(res, 201, "Tạo chủ đề thành công", newTopic);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      // Postgres Unique Constraint Violation
      ApiResponse.error(res, 409, "CONFLICT", "Chủ đề này đã tồn tại");
      return;
    }
    ApiResponse.serverError(res, error);
  }
}

export async function updateTopic(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedParam = topicIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID chủ đề không hợp lệ";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }
  const { id } = parsedParam.data;

  const parsedBody = updateTopicSchema.safeParse(req.body);
  if (!parsedBody.success) {
    const errorMsg =
      parsedBody.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }
  const { name, color, icon } = parsedBody.data;

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    updates.push(`name = $${paramIndex++}`, `slug = $${paramIndex++}`);
    values.push(name, slug);
  }
  if (color !== undefined) {
    updates.push(`color = $${paramIndex++}`);
    values.push(color);
  }
  if (icon !== undefined) {
    updates.push(`icon = $${paramIndex++}`);
    values.push(icon);
  }

  if (updates.length === 0) {
    ApiResponse.error(
      res,
      400,
      "BAD_REQUEST",
      "Không có trường nào để cập nhật",
    );
    return;
  }

  updates.push(`updated_at = NOW()`);
  values.push(id, userId);

  try {
    const result = await dbPool.query<TopicResponse>(
      `UPDATE topics
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING id, user_id as "userId", name, slug, color, icon, created_at as "createdAt", updated_at as "updatedAt"`,
      values,
    );

    if (result.rows.length === 0) {
      ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy chủ đề hoặc không có quyền",
      );
      return;
    }

    ApiResponse.success(res, 200, "Cập nhật chủ đề thành công", result.rows[0]);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      ApiResponse.error(res, 409, "CONFLICT", "Tên chủ đề này đã tồn tại");
      return;
    }
    ApiResponse.serverError(res, error);
  }
}

export async function deleteTopic(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req, res);
  if (!userId) return;

  const parsedParam = topicIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID chủ đề không hợp lệ";
    ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
    return;
  }

  const { id } = parsedParam.data;

  try {
    // Delete all child notes belonging to this topic
    await dbPool.query(
      "DELETE FROM notes WHERE topic_id = $1 AND user_id = $2",
      [id, userId],
    );

    const result = await dbPool.query<{ id: string }>(
      "DELETE FROM topics WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    if (result.rows.length === 0) {
      ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy chủ đề hoặc không có quyền xóa",
      );
      return;
    }

    ApiResponse.success(res, 200, "Xóa chủ đề thành công");
  } catch (error: unknown) {
    ApiResponse.serverError(res, error);
  }
}

export const TopicController = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
};
