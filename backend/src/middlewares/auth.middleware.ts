import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config/env";
import { ApiResponse } from "../utils/response.util";

const jwtUserPayloadSchema = z.object({
  userId: z.string(),
  username: z.string(),
});

export type AuthUser = z.infer<typeof jwtUserPayloadSchema>;

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "Thiếu JWT Token hoặc Format không đúng (Bearer <token>)",
    );
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    ApiResponse.error(res, 401, "UNAUTHORIZED", "Token không được để rỗng");
    return;
  }

  try {
    const rawDecoded = jwt.verify(token, config.SECURITY.JWT_SECRET);
    const parsed = jwtUserPayloadSchema.safeParse(rawDecoded);

    if (!parsed.success) {
      ApiResponse.error(res, 401, "UNAUTHORIZED", "JWT Token không hợp lệ");
      return;
    }

    req.user = parsed.data; // Gán thông tin user vào Request object
    next(); // Cho phép đi tiếp vào Controller
  } catch {
    ApiResponse.error(
      res,
      401,
      "UNAUTHORIZED",
      "JWT Token đã hết hạn hoặc không hợp lệ",
    );
    return;
  }
};
