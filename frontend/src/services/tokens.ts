const TOKEN_STORAGE_KEY = "notevault_token";
const VAULT_TOKEN_STORAGE_KEY = "notevault_vault_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getVaultToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(VAULT_TOKEN_STORAGE_KEY);
}

export function setVaultToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(VAULT_TOKEN_STORAGE_KEY, token);
}

export function clearVaultToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(VAULT_TOKEN_STORAGE_KEY);
}

export function getAuthHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const vaultToken = getVaultToken();
  if (vaultToken) {
    headers["x-vault-token"] = vaultToken;
  }

  return headers;
}
