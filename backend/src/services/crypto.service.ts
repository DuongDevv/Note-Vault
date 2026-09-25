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
 * Convenience helper: Encrypts note content and returns a packed JSON string.
 */
export function encryptNoteContent(
  content: unknown,
  userId: string,
  pin?: string,
): string {
  const key = pin ? deriveVaultKey(userId, pin) : deriveUserKey(userId);
  const payload = encryptPayload(content, key);
  return JSON.stringify(payload);
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
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("ciphertext" in parsed) ||
      !("iv" in parsed) ||
      !("authTag" in parsed)
    ) {
      return packedJson;
    }
    const record = parsed as Record<string, unknown>;
    const payload: EncryptedPayload = {
      ciphertext: String(record["ciphertext"]),
      iv: String(record["iv"]),
      authTag: String(record["authTag"]),
    };

    if (pin) {
      try {
        const vaultKey = deriveVaultKey(userId, pin);
        return decryptPayload(payload, vaultKey);
      } catch {
        // Fallback to user key if encrypted under base account key
        const userKey = deriveUserKey(userId);
        return decryptPayload(payload, userKey);
      }
    }

    const userKey = deriveUserKey(userId);
    return decryptPayload(payload, userKey);
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
};
