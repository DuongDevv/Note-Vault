import { describe, expect, it } from "bun:test";
import { VaultSessionService } from "../../src/services/vault-session.service";
import { redisClient } from "../../src/config/redis";

describe("VaultSessionService", () => {
  const userId = "test-user-vault-1";
  const kekHex = Buffer.from("0123456789abcdef0123456789abcdef", "utf8").toString("hex");

  it("should create and store vault session in redis when redis is open", async () => {
    Object.defineProperty(redisClient, "isOpen", {
      value: true,
      configurable: true,
      writable: true,
    });

    let storedKey = "";
    let storedVal = "";
    let storedTtl = 0;

    Object.defineProperty(redisClient, "set", {
      value: async (
        key: string,
        val: string,
        options?: { EX?: number; expiration?: { type: string; value: number } },
      ) => {
        storedKey = key;
        storedVal = val;
        storedTtl = options?.expiration?.value ?? options?.EX ?? 0;
        return "OK";
      },
      configurable: true,
      writable: true,
    });

    const token = await VaultSessionService.createSession(userId, kekHex);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(16);
    expect(storedKey).toBe(`vault_session:${userId}:${token}`);
    expect(storedVal).toBe(kekHex);
    expect(storedTtl).toBe(900); // 15 mins default
  });

  it("should retrieve vault session KEK if valid", async () => {
    Object.defineProperty(redisClient, "isOpen", {
      value: true,
      configurable: true,
      writable: true,
    });

    const token = "mock-valid-token-123";

    Object.defineProperty(redisClient, "get", {
      value: async (key: string) => {
        if (key === `vault_session:${userId}:${token}`) {
          return kekHex;
        }
        return null;
      },
      configurable: true,
      writable: true,
    });

    const retrievedKek = await VaultSessionService.getSessionKek(userId, token);
    expect(retrievedKek).toBe(kekHex);
  });

  it("should return null if session key does not exist or expired", async () => {
    Object.defineProperty(redisClient, "isOpen", {
      value: true,
      configurable: true,
      writable: true,
    });

    Object.defineProperty(redisClient, "get", {
      value: async () => null,
      configurable: true,
      writable: true,
    });

    const retrieved = await VaultSessionService.getSessionKek(userId, "expired-token");
    expect(retrieved).toBeNull();
  });

  it("should revoke session by unlinking key in redis", async () => {
    Object.defineProperty(redisClient, "isOpen", {
      value: true,
      configurable: true,
      writable: true,
    });

    let unlinkedKey = "";
    Object.defineProperty(redisClient, "unlink", {
      value: async (key: string) => {
        unlinkedKey = key;
        return 1;
      },
      configurable: true,
      writable: true,
    });

    const token = "token-to-revoke";
    await VaultSessionService.revokeSession(userId, token);
    expect(unlinkedKey).toBe(`vault_session:${userId}:${token}`);
  });
});
