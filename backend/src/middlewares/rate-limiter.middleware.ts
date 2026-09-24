import type { Request, Response, NextFunction } from "express";
import { redisClient } from "../config/redis";
import { ApiResponse } from "../utils/response.util";

/**
 * Middleware giới hạn số lượng Request tới API nhạy cảm (vd: Auth/PIN)  
 * @param maxRequests Số lượt tối đa  
 * @param windowInSeconds Thời gian cửa sổ (giây)  
 */
export const rateLimiter = (maxRequests: number, windowInSeconds: number) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown_ip";
    const key = `rate_limit:${req.path}:${ip}`;

    try {
      const currentRequests = await redisClient.incr(key);

      if (currentRequests === 1) {
        await redisClient.expire(key, windowInSeconds);
      }

      if (currentRequests > maxRequests) {
        ApiResponse.error(
          res,
          429,
          "TOO_MANY_REQUESTS",
          `Bạn đã thử quá ${String(maxRequests)} lần. Vui lòng thử lại sau ${String(windowInSeconds)} giây!`,
        );
        return;
      }

      next();
    } catch (error) {
      console.error("[RATE LIMITER ERROR]:", error);
      next(); // Trong trường hợp Redis sập, cho đi tiếp để tránh gián đoạn dịch vụ
    }
  };
};
