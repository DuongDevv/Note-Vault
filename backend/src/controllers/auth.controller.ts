import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { dbPool } from "../config/database";
import { config } from "../config/env";
import { CryptoService } from "../services/crypto.service";
import { ApiResponse } from "../utils/response.util";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  registerSchema,
  loginSchema,
  setPrivatePinSchema,
  verifyPinSchema,
  type UserProfileResponse,
} from "../schemas/auth.schema";

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  private_pin_hash: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfileDbRow extends UserRow {
  has_private_pin: boolean;
}
// Đăng ký tài khoản mới (POST /api/v1/auth/register)
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Thông tin đăng ký không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { username, email, password, displayName } = parsed.data;

  try {
    const checkUser = await dbPool.query<{ id: string }>(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email],
    );

    if (checkUser.rows.length > 0) {
      return ApiResponse.error(
        res,
        409,
        "CONFLICT",
        "Username hoặc Email đã được sử dụng",
      );
    }

    // Hash mật khẩu bằng Argon2id
    const passwordHash = await CryptoService.hashData(password);

    const userId = randomUUID();
    const userRes = await dbPool.query<UserRow>(
      `INSERT INTO users (id, username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, display_name, created_at, updated_at`,
      [userId, username, email, passwordHash, displayName],
    );

    const newUser = userRes.rows[0];
    if (!newUser) {
      throw new Error("Không thể khởi tạo người dùng");
    }

    // Sinh JWT Token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      config.SECURITY.JWT_SECRET,
      { expiresIn: config.SECURITY.JWT_EXPIRES_IN },
    );

    return ApiResponse.success(res, 201, "Đăng ký tài khoản thành công", {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.display_name,
        hasPrivatePin: false,
      },
      accessToken: token,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Đăng nhập (POST /api/v1/auth/login)
export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Vui lòng nhập username và password";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { username, password } = parsed.data;

  try {
    const result = await dbPool.query<UserProfileDbRow>(
      `SELECT id, username, email, password_hash, display_name,
              (private_pin_hash IS NOT NULL) AS has_private_pin
       FROM users
       WHERE username = $1`,
      [username],
    );
    const user = result.rows[0];
    if (!user) {
      return ApiResponse.error(
        res,
        401,
        "UNAUTHORIZED",
        "Username hoặc mật khẩu không chính xác",
      );
    }
    const isValidPassword = await CryptoService.verifyHash(
      user.password_hash,
      password,
    );

    if (!isValidPassword) {
      return ApiResponse.error(
        res,
        401,
        "UNAUTHORIZED",
        "Username hoặc mật khẩu không chính xác",
      );
    }

    // Sinh JWT Token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.SECURITY.JWT_SECRET,
      { expiresIn: config.SECURITY.JWT_EXPIRES_IN },
    );

    return ApiResponse.success(res, 200, "Đăng nhập thành công", {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        hasPrivatePin: user.has_private_pin,
      },
      accessToken: token,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Lấy thông tin Profile (GET /api/v1/profile)
export async function getProfile(req: AuthenticatedRequest, res: Response) {
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
    const result = await dbPool.query<UserProfileDbRow>(
      `SELECT id, username, email, display_name,
              (private_pin_hash IS NOT NULL) AS has_private_pin,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId],
    );

    const user = result.rows[0];
    if (!user) {
      return ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy người dùng",
      );
    }

    const profileResponse: UserProfileResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      hasPrivatePin: user.has_private_pin,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return ApiResponse.success(
      res,
      200,
      "Lấy thông tin Profile thành công",
      profileResponse,
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

// Đặt / Đổi Private PIN (POST /api/v1/profile/private-pin)
export async function setPrivatePin(req: AuthenticatedRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Chưa xác thực người dùng",
    );
  }

  const parsed = setPrivatePinSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ??
      "Mã PIN bắt buộc phải gồm đúng 6 chữ số";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { currentPin, newPin } = parsed.data;
  const client = await dbPool.connect();

  try {
    await client.query("BEGIN");

    // Lấy thông tin hash hiện tại của user
    const userRes = await client.query<{ private_pin_hash: string | null }>(
      "SELECT private_pin_hash FROM users WHERE id = $1 FOR UPDATE",
      [userId],
    );

    const existingPinHash = userRes.rows[0]?.private_pin_hash;

    // Nếu tài khoản đã có PIN từ trước, bắt buộc phải truyền currentPin và xác thực
    if (existingPinHash) {
      if (!currentPin) {
        await client.query("ROLLBACK");
        return ApiResponse.error(
          res,
          400,
          "BAD_REQUEST",
          "Vui lòng nhập mã PIN hiện tại để xác thực thay đổi",
        );
      }

      const isCurrentPinValid = await CryptoService.verifyHash(
        existingPinHash,
        currentPin.trim(),
      );
      if (!isCurrentPinValid) {
        await client.query("ROLLBACK");
        return ApiResponse.error(
          res,
          403,
          "FORBIDDEN",
          "Mã PIN hiện tại không chính xác",
        );
      }

      // Enveloped Key Rotation: Re-wrap toàn bộ encrypted_key của các note đang khóa
      const lockedNotesRes = await client.query<{
        id: string;
        content: string | null;
        encrypted_key: string | null;
      }>(
        "SELECT id, content, encrypted_key FROM notes WHERE user_id = $1 AND is_locked = true FOR UPDATE",
        [userId],
      );

      for (const note of lockedNotesRes.rows) {
        if (note.encrypted_key) {
          // Note đã có DEK: chỉ cần rewrap KEK (từ oldPin sang newPin)
          const rewrappedKey = CryptoService.rewrapDataKey(
            note.encrypted_key,
            userId,
            currentPin.trim(),
            newPin.trim(),
          );
          await client.query(
            "UPDATE notes SET encrypted_key = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
            [rewrappedKey, note.id],
          );
        } else if (note.content) {
          // Note cũ chưa có DEK (mã hóa trực tiếp bằng PIN cũ): giải mã rồi bọc Enveloped mới
          const plain = CryptoService.decryptNoteContent(
            note.content,
            userId,
            currentPin.trim(),
          );
          if (plain !== null) {
            const enveloped = CryptoService.encryptEnveloped(
              plain,
              userId,
              newPin.trim(),
            );
            await client.query(
              "UPDATE notes SET content = $1, encrypted_key = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
              [enveloped.encryptedContent, enveloped.encryptedKey, note.id],
            );
          }
        }
      }
    }

    // Cập nhật mã hash PIN mới
    const newPinHash = await CryptoService.hashData(newPin.trim());
    await client.query(
      "UPDATE users SET private_pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newPinHash, userId],
    );

    await client.query("COMMIT");
    return ApiResponse.success(res, 200, "Cài đặt mã PIN bảo vệ thành công");
  } catch (error: unknown) {
    await client.query("ROLLBACK");
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  } finally {
    client.release();
  }
}

// Xác thực PIN bảo vệ (POST /api/v1/profile/verify-pin)
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
      parsed.error.issues[0]?.message ?? "Vui lòng nhập mã PIN hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { pin } = parsed.data;

  try {
    const result = await dbPool.query<{ private_pin_hash: string | null }>(
      "SELECT private_pin_hash FROM users WHERE id = $1",
      [userId],
    );

    const pinHash = result.rows[0]?.private_pin_hash;
    if (!pinHash) {
      return ApiResponse.error(
        res,
        400,
        "BAD_REQUEST",
        "Bạn chưa thiết lập mã PIN bảo vệ.",
      );
    }

    const isValid = await CryptoService.verifyHash(pinHash, pin);
    if (!isValid) {
      return ApiResponse.error(
        res,
        403,
        "FORBIDDEN",
        "Mã PIN không chính xác!",
      );
    }

    return ApiResponse.success(res, 200, "Xác thực mã PIN thành công", {
      verified: true,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    return ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
  }
}

export const AuthController = {
  register,
  login,
  getProfile,
  setPrivatePin,
  verifyPin,
};
