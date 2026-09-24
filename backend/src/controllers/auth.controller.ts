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
  type UserDbRow,
  type ProfileDbRow,
} from "../schemas/auth.schema";

// Đăng ký tài khoản mới (POST /api/v1/auth/register)
export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMsg =
      parsed.error.issues[0]?.message ?? "Dữ liệu đăng ký không hợp lệ";
    return ApiResponse.error(res, 400, "BAD_REQUEST", errorMsg);
  }

  const { username, email, password, displayName } = parsed.data;

  try {
    // Check trùng email/username
    const checkUser = await dbPool.query<Pick<UserDbRow, "id">>(
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

    // Bắt đầu Transaction tạo User + Profile
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");

      // Insert User
      const userRes = await client.query<
        Pick<UserDbRow, "id" | "username" | "email">
      >(
        "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
        [username, email, passwordHash],
      );
      const newUser = userRes.rows[0];
      if (!newUser) {
        throw new Error("Không thể khởi tạo người dùng");
      }

      // Insert Profile mặc định
      await client.query(
        "INSERT INTO profiles (user_id, display_name) VALUES ($1, $2)",
        [newUser.id, displayName],
      );

      await client.query("COMMIT");

      // Sinh JWT Token
      const token = jwt.sign(
        { userId: newUser.id, username: newUser.username },
        config.SECURITY.JWT_SECRET,
        { expiresIn: config.SECURITY.JWT_EXPIRES_IN },
      );

      return ApiResponse.success(res, 201, "Đăng ký tài khoản thành công", {
        user: newUser,
        accessToken: token,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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
    const result = await dbPool.query<UserDbRow>(
      "SELECT id, username, email, password_hash FROM users WHERE username = $1",
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
      user: { id: user.id, username: user.username },
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
    const result = await dbPool.query<ProfileDbRow>(
      `SELECT u.id, u.username, u.email, p.display_name, p.theme,                                                                                                                                        
                  (p.private_pin_hash IS NOT NULL) AS has_private_pin                                                                                                                                        
          FROM users u                                                                                                                                                                                      
          JOIN profiles p ON u.id = p.user_id                                                                                                                                                               
          WHERE u.id = $1`,
      [userId],
    );

    const profile = result.rows[0];
    if (!profile) {
      return ApiResponse.error(
        res,
        404,
        "NOT_FOUND",
        "Không tìm thấy người dùng",
      );
    }

    return ApiResponse.success(
      res,
      200,
      "Lấy thông tin Profile thành công",
      profile,
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

  const { newPin } = parsed.data;

  try {
    const pinHash = await CryptoService.hashData(newPin);

    await dbPool.query(
      "UPDATE profiles SET private_pin_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [pinHash, userId],
    );

    return ApiResponse.success(
      res,
      200,
      "Cài đặt mã PIN tab Riêng tư thành công",
    );
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
};
