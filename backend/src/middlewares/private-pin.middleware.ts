import type { Response, NextFunction } from "express";
import { redisClient } from "../config/redis";
import { ApiResponse } from "../utils/response.util";
import type { AuthenticatedRequest } from "./auth.middleware";

export const verifyPrivateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const rawHeader = req.headers["x-private-token"];
  const privateToken = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  const userId = req.user?.userId;

  if (!privateToken) {
    ApiResponse.error(
      res,
      403,
      "FORBIDDEN",
      "Yêu cầu Header X-Private-Token để truy cập vùng Riêng tư",
    );
    return;
  }

  try {
    // Check Token trong Redis xem có hợp lệ và thuộc về User này không
    const storedUserId = await redisClient.get(
      `private_session:${privateToken}`,
    );

    if (!storedUserId || storedUserId !== userId) {
      ApiResponse.error(
        res,
        403,
        "FORBIDDEN",
        "Phiên truy cập Riêng tư đã hết hạn hoặc không hợp lệ. Vui lòng nhập lại PIN!",
      );
      return;
    }

    next(); // Cho phép đi tiếp
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Lỗi server nội bộ";
    ApiResponse.error(res, 500, "INTERNAL_SERVER_ERROR", message);
    return;
  }
};
