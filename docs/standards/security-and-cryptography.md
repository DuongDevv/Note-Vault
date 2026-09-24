# Security & Cryptography Standards

## 1. Password & PIN Hashing: Argon2id

- **Algorithm**: `argon2id` (RFC 9106) with memory-hard parameters resisting GPU/ASIC brute-force attacks.
- **Parameters**:
  - `memoryCost`: 65536 (64 MB RAM)
  - `timeCost`: 3 iterations
  - `parallelism`: 1 thread
- **Application**: Used for user authentication passwords and Master PIN for vault access.

---

## 2. Note Encryption at Rest: AES-256-GCM

- **Algorithm**: Authenticated Encryption with Associated Data (`aes-256-gcm`).
- **Initialization Vector (IV)**: MUST be cryptographically random 16 bytes per encryption operation via `crypto.randomBytes(16)`. NEVER reuse IVs.
- **Authentication Tag**: 16 bytes auth tag verifying both confidentiality and integrity.
- **Format**:
  ```ts
  interface EncryptedPayload {
    encryptedContent: string; // Base64 ciphertext
    iv: string; // Hex string (32 chars)
    authTag: string; // Hex string (32 chars)
  }
  ```
- **Tamper Detection**: If decryption fails or authentication tag does not match, reject immediately.

---

## 3. JWT & Secret Management

- **Secrets**: Load secrets strictly through `config/env.ts` with no hardcoded fallback strings in production.
- **Token Expiration**: Access tokens MUST have short lifespans (default: `15m` to `1d`).
- **Timing-Safe Comparison**: Use `crypto.timingSafeEqual` when comparing hashes, tokens, or signatures to prevent timing side-channel attacks.

---

## 4. Anti-Enumeration & Error Sanitization

- **Authentication Errors**: Return generic messages ("Tài khoản hoặc mật khẩu không chính xác") rather than disclosing whether a username exists.
- **Exception Sanitization**: Never leak raw SQL query errors, internal stack traces, or crypto keys in HTTP API error responses.
