export class HttpError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

/**
 * Robust fetch wrapper that gracefully handles server offline,
 * gateway timeouts, empty responses, and non-JSON payloads.
 */
export async function safeFetchJson(
  endpoint: string,
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  let res: Response;
  const fullUrl = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  try {
    res = await fetch(fullUrl, options);
  } catch (err: unknown) {
    // Network failure (e.g. backend server is not running or connection refused)
    const isNetworkError =
      err instanceof TypeError &&
      (err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("Load failed"));

    if (isNetworkError) {
      throw new HttpError("Không thể kết nối đến máy chủ.", 0, "NETWORK_ERROR");
    }
    throw new HttpError(
      err instanceof Error ? err.message : "Lỗi kết nối mạng",
      0,
      "UNKNOWN_FETCH_ERROR",
    );
  }

  // Handle common Gateway/Proxy failure status codes when backend is down
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new HttpError(
      `Máy chủ backend tạm thời không khả dụng (${String(res.status)} ${res.statusText}).`,
      res.status,
      "GATEWAY_ERROR",
    );
  }

  const rawText = await res.text();
  let parsed: unknown = null;

  if (rawText.trim().length > 0) {
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Non-JSON response (e.g. HTML error page or plain text)
      if (!res.ok) {
        throw new HttpError(
          rawText.length < 100
            ? rawText
            : `Yêu cầu thất bại với mã lỗi HTTP ${String(res.status)}`,
          res.status,
          "HTTP_ERROR",
        );
      }
      throw new HttpError(
        "Phản hồi từ máy chủ không đúng định dạng JSON chuẩn",
        res.status,
        "INVALID_JSON_RESPONSE",
      );
    }
  }

  return {
    ok: res.ok,
    status: res.status,
    data: parsed,
  };
}
