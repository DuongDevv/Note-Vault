import { z } from "zod";
import { safeFetchJson } from "./http";

const TOKEN_STORAGE_KEY = "notevault_token";

export const AuthUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  displayName: z.string(),
  hasPrivatePin: z.boolean().optional(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseDataSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
});
export type AuthResponseData = z.infer<typeof AuthResponseDataSchema>;

function createEnvelopeSchema<T>(dataSchema: z.ZodType<T>) {
  return z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema.optional(),
  });
}

const EmptyEnvelopeSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getAuthHeaders(
  customHeaders?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function authRequest(
  endpoint: string,
  body: Record<string, unknown>,
  fallbackMessage: string,
): Promise<AuthResponseData> {
  const { ok, data } = await safeFetchJson(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const envelope = createEnvelopeSchema(AuthResponseDataSchema).parse(data);

  if (!ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message ?? fallbackMessage);
  }

  setAuthToken(envelope.data.accessToken);
  return envelope.data;
}

export async function loginUser(
  username: string,
  password: string,
): Promise<AuthResponseData> {
  return await authRequest(
    "/api/v1/auth/login",
    { username, password },
    "Tài khoản hoặc mật khẩu không chính xác",
  );
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponseData> {
  return await authRequest(
    "/api/v1/auth/register",
    { username, email, password, displayName },
    "Đăng ký tài khoản thất bại",
  );
}

export async function fetchUserProfile(): Promise<AuthUser> {
  const { ok, data } = await safeFetchJson("/api/v1/profile", {
    headers: getAuthHeaders(),
  });

  if (!ok) {
    clearAuthToken();
    throw new Error("Phiên đăng nhập đã hết hạn");
  }

  const payload = createEnvelopeSchema(AuthUserSchema).parse(data);

  if (!payload.success || !payload.data) {
    throw new Error("Không thể tải thông tin tài khoản");
  }

  return payload.data;
}

export async function updatePrivatePin(
  newPin: string,
  currentPin?: string,
): Promise<void> {
  const { ok, data } = await safeFetchJson("/api/v1/profile/private-pin", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      newPin,
      currentPin: currentPin ?? undefined,
    }),
  });

  const payload = EmptyEnvelopeSchema.parse(data);
  if (!ok || !payload.success) {
    throw new Error(payload.message ?? "Không thể cập nhật mã PIN");
  }
}

export async function verifyPrivatePin(pin: string): Promise<boolean> {
  const { ok, data } = await safeFetchJson("/api/v1/profile/verify-pin", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ pin }),
  });

  const payload = EmptyEnvelopeSchema.parse(data);
  return ok && payload.success;
}
