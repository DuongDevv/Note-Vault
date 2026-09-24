import type { Response } from "express";
import crypto from "crypto";
import { dbPool } from "../config/database";
import { redisClient } from "../config/redis";
import { CryptoService } from "../services/crypto.service";
import { ApiResponse } from "../utils/response.util";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  verifyPinSchema,
  createPrivateNoteSchema,
  privateNoteIdParamSchema,
  type PrivateNoteDbRow,
  type ProfilePinDbRow,
} from "../schemas/private-note.schema";

// Xác thực PIN tab Riêng tư -> Cấp Session Token (POST /api/v1/private/verify-pin)
export async function verifyPin(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsed = verifyPinSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Vui lòng nhập mã PIN 6 chữ số";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { pin } = parsed.data;

  try {
    // Lấy Hash PIN từ Profile
    const result = await dbPool.query<ProfilePinDbRow>(
      "SELECT private_pin_hash FROM profiles WHERE user_id = $1",
      [userId],
    );

    const pinHash = result.rows[0]?.private_pin_hash;

    if (!pinHash) {
      return ApiResponse.error(
        res,
        400,
        "BAD_REQUEST",
        "Mày chưa đặt mã PIN tab Riêng tư. Hãy vào Cài đặt để tạo!",
      );
    }

    // Verify PIN với Hash Argon2id
    const isValid = await CryptoService.verifyHash(pinHash, pin);

    if (!isValid) {
      return ApiResponse.error(
        res,
        403,
        "FORBIDDEN",
        "Mã PIN không chính xác!",
      );
    }

    // Sinh Private Session Token sống trong 15 phút (900 giây)
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const TTL_SECONDS = 900; // 15 phút

    await redisClient.setEx(
      `private_session:${sessionToken}`,
      TTL_SECONDS,
      userId,
    );

    return ApiResponse.success(res, 200, "Xác thực PIN thành công", {
      privateSessionToken: sessionToken,
      expiresInSeconds: TTL_SECONDS,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Lấy danh sách & Giải mã Ghi chú riêng tư (GET /api/v1/private/notes)
export async function getPrivateNotes(
  req: AuthenticatedRequest,
  res: Response,
) {
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
    const result = await dbPool.query<PrivateNoteDbRow>(
      `SELECT id, title, encrypted_content, iv, auth_tag, is_pinned, created_at, updated_at                                                                                                              
              FROM private_notes                                                                                                                                                                                
              WHERE user_id = $1                                                                                                                                                                                
              ORDER BY is_pinned DESC, created_at DESC`,
      [userId],
    );

    // Giải mã AES-256-GCM cho từng ghi chú trước khi trả về Client
    const decryptedNotes = result.rows.map((note) => {
      try {
        const plainContent = CryptoService.decryptText(
          note.encrypted_content,
          note.iv,
          note.auth_tag,
        );
        return {
          id: note.id,
          title: note.title,
          content: plainContent, // Đã giải mã thành plain text
          isPinned: note.is_pinned,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
        };
      } catch {
        return {
          id: note.id,
          title: note.title,
          content: "[LỖI GIẢI MÃ: Dữ liệu bị chỉnh sửa trái phép!]",
          isPinned: note.is_pinned,
          createdAt: note.created_at,
        };
      }
    });

    return ApiResponse.success(
      res,
      200,
      "Lấy danh sách ghi chú riêng tư thành công",
      decryptedNotes,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Tạo Ghi chú riêng tư mới -> Mã hóa AES-256-GCM (POST /api/v1/private/notes)
export async function createPrivateNote(
  req: AuthenticatedRequest,
  res: Response,
) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsed = createPrivateNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Tiêu đề và nội dung là bắt buộc";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { title, content, isPinned } = parsed.data;

  try {
    // Mã hóa nội dung bằng AES-256-GCM
    const encrypted = CryptoService.encryptText(content);

    const result = await dbPool.query<
      Pick<PrivateNoteDbRow, "id" | "title" | "is_pinned" | "created_at">
    >(
      `INSERT INTO private_notes (user_id, title, encrypted_content, iv, auth_tag, is_pinned)                                                                                                            
              VALUES ($1, $2, $3, $4, $5, $6)                                                                                                                                                                   
              RETURNING id, title, is_pinned, created_at`,
      [
        userId,
        title,
        encrypted.encryptedContent,
        encrypted.iv,
        encrypted.authTag,
        isPinned,
      ],
    );

    const newNote = result.rows[0];
    if (!newNote) {
      throw new Error("Không thể tạo ghi chú riêng tư");
    }

    return ApiResponse.success(
      res,
      201,
      "Tạo ghi chú riêng tư thành công (Đã mã hóa bảo vệ)",
      newNote,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Xóa Ghi chú riêng tư (DELETE /api/v1/private/notes/:id)
export async function deletePrivateNote(
  req: AuthenticatedRequest,
  res: Response,
) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsedParam = privateNoteIdParamSchema.safeParse(req.params);
  if (!parsedParam.success) {
    const errorMsg =
      parsedParam.error.issues[0]?.message ?? "ID ghi chú không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { id } = parsedParam.data;

  try {
    const result = await dbPool.query<Pick<PrivateNoteDbRow, "id">>(
      "DELETE FROM private_notes WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );

    if (result.rows.length === 0) {
      return ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy ghi chú riêng tư",
      );
    }

    return ApiResponse.success(res, 200, "Xóa ghi chú riêng tư thành công");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

export const PrivateNoteController = {
  verifyPin,
  getPrivateNotes,
  createPrivateNote,
  deletePrivateNote,
};
