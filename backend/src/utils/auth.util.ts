import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ApiResponse } from "./response.util";

export function requireUserId(
  req: AuthenticatedRequest,
  res: Response,
): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    ApiResponse.error(res, 401, "UNAUTHORIZED", "Chưa xác thực người dùng");
    return null;
  }
  return userId;
}
