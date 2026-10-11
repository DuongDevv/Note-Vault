import crypto from "crypto";
import { redisClient } from "../config/redis";

const DEFAULT_VAULT_SESSION_TTL_SECONDS = 900; // 15 minutes

/**
 * Service functions to manage short-lived private vault unlock sessions backed by Redis.
 * Complies with docs/standards/concurrency-and-locking.md section 3.
 */

/**
 * Generates a cryptographically random session token and stores the derived KEK in Redis.
 */
export async function createSession(
  userId: string,
  kekHex: string,
  ttlSeconds: number = DEFAULT_VAULT_SESSION_TTL_SECONDS,
): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const sessionKey = `vault_session:${userId}:${token}`;

  if (redisClient.isOpen) {
    await redisClient.set(sessionKey, kekHex, {
      expiration: { type: "EX", value: ttlSeconds },
    });
  }

  return token;
}

/**
 * Retrieves the cached KEK for an active vault session.
 */
export async function getSessionKek(userId: string, token: string): Promise<string | null> {
  if (!redisClient.isOpen) {
    return null;
  }

  const sessionKey = `vault_session:${userId}:${token}`;
  return await redisClient.get(sessionKey);
}

/**
 * Revokes a vault session immediately.
 */
export async function revokeSession(userId: string, token: string): Promise<boolean> {
  if (!redisClient.isOpen) {
    return false;
  }

  const sessionKey = `vault_session:${userId}:${token}`;
  // Use UNLINK instead of DEL for non-blocking asynchronous memory reclamation in Redis
  const deleted = await redisClient.unlink(sessionKey);
  return deleted > 0;
}

export const VaultSessionService = {
  createSession,
  getSessionKek,
  revokeSession,
};
