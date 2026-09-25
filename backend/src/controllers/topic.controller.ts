import type { Response } from "express";
import { dbPool } from "../config/database";
import { ApiResponse } from "../utils/response.util";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  createTopicSchema,
  topicIdParamSchema,
  type TopicResponse,
} from "../schemas/topic.schema";

// Lấy danh sách Chủ đề của User (GET /api/v1/topics)
export async function getTopics(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  try {
    const result = await dbPool.query<TopicResponse>(
      `SELECT id, user_id as "userId", name, slug, color, icon, created_at as "createdAt", updated_at as "updatedAt"
       FROM topics
       WHERE user_id = $1
       ORDER BY name ASC`,
      [userId],
    );

    return ApiResponse.success(
      res,
      200,
      "Lấy danh sách chủ đề thành công",
      result.rows,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Tạo Chủ đề mới (POST /api/v1/topics)
export async function createTopic(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsed = createTopicSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Tên chủ đề không được để rỗng";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { name, color, icon } = parsed.data;

  // Tự sinh slug từ name
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  try {
    const result = await dbPool.query<TopicResponse>(
      `INSERT INTO topics (user_id, name, slug, color, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id as "userId", name, slug, color, icon, created_at as "createdAt", updated_at as "updatedAt"`,
      [userId, name, slug, color, icon],
    );

    const newTopic = result.rows[0];
    if (!newTopic) {
      throw new Error("Không thể tạo chủ đề mới");
    }

    return ApiResponse.success(res, 201, "Tạo chủ đề thành công", newTopic);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      // Postgres Unique Constraint Violation
      return ApiResponse.error(res, 409, "CONFLICT", "Chủ đề này đã tồn tại");
    }
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Xóa Chủ đề (DELETE /api/v1/topics/:id)
export async function deleteTopic(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsedParam = topicIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID chủ đề không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { id } = parsedParam.data;

  try {
    const result = await dbPool.query<{ id: string }>(
      "DELETE FROM topics WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy chủ đề hoặc không có quyền xóa",
      );
    }

    return ApiResponse.success(res, 200, "Xóa chủ đề thành công");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

export const TopicController = {
  getTopics,
  createTopic,
  deleteTopic,
};
