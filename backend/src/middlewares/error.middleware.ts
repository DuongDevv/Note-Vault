import type { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/response.util";

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("❌ [UNHANDLED EXCEPTION]:", err.stack);

  return ApiResponse.error(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    err.message || "Lỗi server nội bộ ngắt đột ngột",
    process.env["NODE_ENV"] === "development"
      ? { stack: err.stack }
      : undefined,
  );
};
