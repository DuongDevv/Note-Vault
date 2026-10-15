import { api, type UserProfileDto, type AuthResponseDataDto } from "./apiClient";
import {
  clearAuthToken,
  setAuthToken,
  setVaultToken,
  clearVaultToken,
  getVaultToken,
} from "./tokens";

export {
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  getVaultToken,
  setVaultToken,
  clearVaultToken,
  getAuthHeaders,
} from "./tokens";

export type AuthUser = UserProfileDto;
export type AuthResponseData = AuthResponseDataDto;

export async function loginUser(username: string, password: string): Promise<AuthResponseData> {
  const { data, error } = await api.POST("/auth/login", {
    body: { username, password },
  });

  if (error) {
    throw new Error(error.message);
  }

  setAuthToken(data.data.accessToken);
  return data.data;
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  displayName: string,
): Promise<AuthResponseData> {
  const { data, error } = await api.POST("/auth/register", {
    body: { username, email, password, displayName },
  });

  if (error) {
    throw new Error(error.message);
  }

  setAuthToken(data.data.accessToken);
  return data.data;
}

export async function fetchUserProfile(): Promise<AuthUser> {
  const { data, error } = await api.GET("/profile");

  if (error) {
    clearAuthToken();
    throw new Error(error.message);
  }

  return data.data;
}

export async function updatePrivatePin(newPin: string, currentPin?: string): Promise<void> {
  const { error } = await api.POST("/profile/private-pin", {
    body: {
      newPin,
      currentPin: currentPin ?? undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function verifyPrivatePin(
  pin: string,
): Promise<{ verified: boolean; vaultToken?: string }> {
  const { data, error } = await api.POST("/profile/verify-pin", {
    body: { pin },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.data.vaultToken) {
    setVaultToken(data.data.vaultToken);
  }

  return data.data;
}

export async function lockVaultSession(): Promise<void> {
  const vaultToken = getVaultToken();
  if (vaultToken) {
    await api.POST("/profile/lock-vault");
  }
  clearVaultToken();
}
