import type { Response } from "express";

// Trả về Status 200, 201, 204 (Nếu thành công)
export function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown,
  meta?: unknown,
) {
  return res.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    meta,
  });
}

// Trả về Status: 400, 401, 403, 404, 409, 429, 500 (Nếu Response lỗi)
export function sendError(
  res: Response,
  statusCode: number,
  errorCodeOrMessage: string,
  messageOrError?: string,
  details?: unknown,
) {
  const isMachineCode = /^[A-Z0-9_]+$/.test(errorCodeOrMessage);
  const error = isMachineCode
    ? errorCodeOrMessage
    : (messageOrError ?? "ERROR");
  const message = isMachineCode
    ? (messageOrError ?? errorCodeOrMessage)
    : errorCodeOrMessage;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error,
    details,
    timeStamp: new Date().toISOString(),
  });
}

export const ApiResponse = {
  success: sendSuccess,
  error: sendError,
};
