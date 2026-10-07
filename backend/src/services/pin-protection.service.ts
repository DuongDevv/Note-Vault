import { redisClient } from "../config/redis";

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attempts: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes (900 seconds)

/**
 * Returns the Redis key for tracking failed PIN attempts.
 */
export function getPinAttemptsKey(userId: string): string {
  return `pin_attempts:${userId}`;
}

/**
 * Checks whether the user is currently locked out from vault operations.
 *
 * @param userId Unique user ID.
 * @returns LockoutStatus indicating lock state, remaining seconds, and attempt count.
 */
export async function isLockedOut(userId: string): Promise<LockoutStatus> {
  const key = getPinAttemptsKey(userId);

  try {
    if (!redisClient.isOpen) {
      // Fail-open strategy if Redis is offline to prioritize API availability.
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    const rawAttempts = await redisClient.get(key);
    if (!rawAttempts) {
      return { isLocked: false, remainingSeconds: 0, attempts: 0 };
    }

    const attempts = parseInt(rawAttempts, 10) || 0;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const ttl = await redisClient.ttl(key);
      if (ttl > 0) {
        return { isLocked: true, remainingSeconds: ttl, attempts };
      }
      // If TTL has expired or was not set, delete stale key.
      await redisClient.del(key);
    }

    return { isLocked: false, remainingSeconds: 0, attempts };
  } catch (error) {
    console.warn("[PIN_PROTECTION] Failed to check lockout status from Redis:", error);
    // Fail-open strategy: permit traffic if Redis operation errors out.
    return { isLocked: false, remainingSeconds: 0, attempts: 0 };
  }
}

/**
 * Records a failed PIN attempt for the given user, incrementing the failure counter
 * and applying a 15-minute lockout if attempts reach or exceed the limit.
 *
 * @param userId Unique user ID.
 * @returns Updated LockoutStatus.
 */
export async function recordFailedAttempt(userId: string): Promise<LockoutStatus> {
  const key = getPinAttemptsKey(userId);

  try {
    if (!redisClient.isOpen) {
      // Fail-open strategy if Redis is offline.
      return { isLocked: false, remainingSeconds: 0, attempts: 1 };
    }

    const attempts = await redisClient.incr(key);

    if (attempts === 1) {
      // Set window TTL on the first failed attempt.
      await redisClient.expire(key, LOCKOUT_DURATION_SECONDS);
    }

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      // Refresh to a full 15-minute lockout window once maximum failed attempts are reached.
      await redisClient.expire(key, LOCKOUT_DURATION_SECONDS);
      return {
        isLocked: true,
        remainingSeconds: LOCKOUT_DURATION_SECONDS,
        attempts,
      };
    }

    const ttl = await redisClient.ttl(key);
    return {
      isLocked: false,
      remainingSeconds: Math.max(0, ttl),
      attempts,
    };
  } catch (error) {
    console.warn("[PIN_PROTECTION] Failed to record failed attempt in Redis:", error);
    return { isLocked: false, remainingSeconds: 0, attempts: 1 };
  }
}

/**
 * Resets the failed attempts counter upon successful PIN verification.
 *
 * @param userId Unique user ID.
 */
export async function resetAttempts(userId: string): Promise<void> {
  const key = getPinAttemptsKey(userId);

  try {
    if (!redisClient.isOpen) {
      return;
    }
    await redisClient.del(key);
  } catch (error) {
    console.warn("[PIN_PROTECTION] Failed to reset attempts in Redis:", error);
  }
}

export const PinProtectionService = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_SECONDS,
  getPinAttemptsKey,
  isLockedOut,
  recordFailedAttempt,
  resetAttempts,
};
