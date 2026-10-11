import { describe, expect, it } from "bun:test";
import { CryptoService } from "../../src/services/crypto.service";

describe("CryptoService - Vault Key & Decryption with KEK", () => {
  const userId = "test-user-123";
  const pin = "123456";
  const sampleContent = {
    type: "doc",
    content: [{ type: "paragraph", text: "Secret Vault Content" }],
  };

  it("should encrypt and decrypt enveloped note using derived vaultKey (KEK)", () => {
    // 1. Derive vault key (KEK) directly from PIN
    const vaultKey = CryptoService.deriveVaultKey(userId, pin);
    expect(vaultKey).toBeInstanceOf(Buffer);
    expect(vaultKey.length).toBe(32);

    // 2. Encrypt note enveloped using PIN
    const { encryptedContent, encryptedKey } = CryptoService.encryptEnveloped(
      sampleContent,
      userId,
      pin,
    );
    expect(typeof encryptedContent).toBe("string");
    expect(typeof encryptedKey).toBe("string");

    // 3. Decrypt with PIN
    const decryptedWithPin = CryptoService.decryptEnveloped(
      encryptedContent,
      encryptedKey,
      userId,
      pin,
    );
    expect(decryptedWithPin).toEqual(sampleContent);

    // 4. Decrypt directly using vaultKeyBuffer (KEK)
    const decryptedWithKek = CryptoService.decryptEnvelopedWithKek(
      encryptedContent,
      encryptedKey,
      userId,
      vaultKey,
    );
    expect(decryptedWithKek).toEqual(sampleContent);
  });

  it("should fail decryption when using wrong KEK", () => {
    const wrongKek = CryptoService.deriveVaultKey(userId, "654321");
    const { encryptedContent, encryptedKey } = CryptoService.encryptEnveloped(
      sampleContent,
      userId,
      pin,
    );

    const decrypted = CryptoService.decryptEnvelopedWithKek(
      encryptedContent,
      encryptedKey,
      userId,
      wrongKek,
    );
    expect(decrypted).toBeNull();
  });
});
