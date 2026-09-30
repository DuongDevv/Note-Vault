import argon2 from "argon2";
import crypto from "crypto";
import { config } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes IV for GCM

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string; // Hex
  authTag: string; // Hex
}

/**
 * Hashes passwords or Master PINs with Argon2id.
 */
export async function hashData(plainText: string): Promise<string> {
  return await argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64MB memory
    timeCost: 3, // 3 iterations
    parallelism: 1,
  });
}

/**
 * Verifies a plaintext input against an Argon2id hash.
 */
export async function verifyHash(
  hash: string,
  plainText: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Derives the base user encryption key for default at-rest encryption.
 */
export function deriveUserKey(userId: string): Buffer {
  const masterSecret = config.SECURITY.PRIVATE_NOTE_MASTER_KEY;
  return crypto.scryptSync(masterSecret, `user_${userId}_base_salt`, 32);
}

/**
 * Derives the vault encryption key using the user's Master PIN.
 */
export function deriveVaultKey(userId: string, masterPin: string): Buffer {
  return crypto.scryptSync(masterPin, `vault_${userId}_pin_salt`, 32);
}

/**
 * Encrypts arbitrary content (JSON AST or string) using AES-256-GCM.
 */
export function encryptPayload(data: unknown, key: Buffer): EncryptedPayload {
  const plainText = typeof data === "string" ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plainText, "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts AES-256-GCM encrypted payload and parses JSON if possible.
 */
export function decryptPayload(
  payload: EncryptedPayload,
  key: Buffer,
): unknown {
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(payload.ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

/**
 * Encrypts note content using Enveloped Encryption (DEK wrapped by KEK).
 * Generates a random 32-byte DEK, encrypts content with DEK,
 * then encrypts DEK with KEK (vaultKey derived from Master PIN or userKey).
 */
export function encryptEnveloped(
  content: unknown,
  userId: string,
  pin?: string,
): { encryptedContent: string; encryptedKey: string } {
  const dataKey = crypto.randomBytes(32);
  const contentPayload = encryptPayload(content, dataKey);
  const kek = pin ? deriveVaultKey(userId, pin) : deriveUserKey(userId);
  const keyPayload = encryptPayload(dataKey.toString("base64"), kek);

  return {
    encryptedContent: JSON.stringify(contentPayload),
    encryptedKey: JSON.stringify(keyPayload),
  };
}

/**
 * Decrypts note content using Enveloped Encryption.
 * Unwraps dataKey using KEK, then decrypts content using dataKey.
 */
export function decryptEnveloped(
  packedContent: string,
  packedKey: string,
  userId: string,
  pin?: string,
): unknown {
  try {
    const keyPayload = JSON.parse(packedKey) as unknown;
    if (!isEncryptedPayload(keyPayload)) return null;

    let dataKeyBase64: unknown = null;
    if (pin) {
      const vaultKey = deriveVaultKey(userId, pin);
      try {
        dataKeyBase64 = decryptPayload(keyPayload, vaultKey);
      } catch {
        const userKey = deriveUserKey(userId);
        dataKeyBase64 = decryptPayload(keyPayload, userKey);
      }
    } else {
      const userKey = deriveUserKey(userId);
      dataKeyBase64 = decryptPayload(keyPayload, userKey);
    }

    if (typeof dataKeyBase64 !== "string") return null;
    const dataKey = Buffer.from(dataKeyBase64, "base64");

    const contentPayload = JSON.parse(packedContent) as unknown;
    if (!isEncryptedPayload(contentPayload)) return packedContent;

    return decryptPayload(contentPayload, dataKey);
  } catch {
    return null;
  }
}

/**
 * Rotates the KEK wrapping a DEK (from old PIN to new PIN) without touching content.
 */
export function rewrapDataKey(
  packedKey: string,
  userId: string,
  oldPin: string,
  newPin: string,
): string {
  const keyPayload = JSON.parse(packedKey) as unknown;
  if (!isEncryptedPayload(keyPayload)) {
    throw new Error("Mã hóa khóa không đúng định dạng");
  }

  const oldVaultKey = deriveVaultKey(userId, oldPin);
  let dataKeyBase64: unknown;
  try {
    dataKeyBase64 = decryptPayload(keyPayload, oldVaultKey);
  } catch {
    // Fallback nếu note trước đó bọc bằng userKey
    const userKey = deriveUserKey(userId);
    dataKeyBase64 = decryptPayload(keyPayload, userKey);
  }

  if (typeof dataKeyBase64 !== "string") {
    throw new Error("Không thể giải mã khóa dữ liệu với mã PIN cũ");
  }

  const newVaultKey = deriveVaultKey(userId, newPin);
  const newKeyPayload = encryptPayload(dataKeyBase64, newVaultKey);
  return JSON.stringify(newKeyPayload);
}

export function encryptNoteContent(
  content: unknown,
  userId: string,
  pin?: string,
): string {
  const key = pin ? deriveVaultKey(userId, pin) : deriveUserKey(userId);
  const payload = encryptPayload(content, key);
  return JSON.stringify(payload);
}

function isEncryptedPayload(data: unknown): data is EncryptedPayload {
  if (typeof data !== "object" || data === null) return false;
  if (!("ciphertext" in data) || !("iv" in data) || !("authTag" in data)) {
    return false;
  }
  const obj = data;
  return (
    typeof obj.ciphertext === "string" &&
    typeof obj.iv === "string" &&
    typeof obj.authTag === "string"
  );
}

/**
 * Convenience helper: Decrypts a packed JSON string into structured content.
 */
export function decryptNoteContent(
  packedJson: string,
  userId: string,
  pin?: string,
): unknown {
  try {
    const parsed: unknown = JSON.parse(packedJson);
    if (!isEncryptedPayload(parsed)) {
      return packedJson;
    }

    if (pin) {
      const vaultKey = deriveVaultKey(userId, pin);
      try {
        return decryptPayload(parsed, vaultKey);
      } catch {
        // Fallback: nếu ghi chú trước đó từng được lưu với userKey
        const userKey = deriveUserKey(userId);
        return decryptPayload(parsed, userKey);
      }
    }

    const userKey = deriveUserKey(userId);
    return decryptPayload(parsed, userKey);
  } catch {
    return null;
  }
}

export const CryptoService = {
  hashData,
  verifyHash,
  deriveUserKey,
  deriveVaultKey,
  encryptPayload,
  decryptPayload,
  encryptNoteContent,
  decryptNoteContent,
  encryptEnveloped,
  decryptEnveloped,
  rewrapDataKey,
};
