# Concurrency, Rate Limiting & Locking Standards

## 1. Rate Limiting via Redis Token Buckets

- **Target Endpoints**: Any sensitive, brute-force-susceptible route (Login, Master PIN unlock, Password reset) MUST be rate-limited.
- **Implementation**: Sliding window / counter in Redis with explicit TTL:
  - `rate_limit:login:<ip>`: Maximum 5 attempts per 15 minutes.
  - `rate_limit:private_pin:<userId>`: Maximum 3 failed attempts per 5 minutes.
- **Fail-Open Strategy**: If Redis is temporarily unavailable, log the error and permit traffic to avoid global denial of service.

---

## 2. Optimistic Concurrency Control (Version Checks)

- **Version Column**: Mutable shared entities (e.g. `notes`) track a numeric `version` column.
- **Concurrent Update Handling**:
  ```sql
  UPDATE notes
  SET content = $1, version = version + 1, updated_at = NOW()
  WHERE id = $2 AND version = $3;
  ```
- **Conflict Handling**: If 0 rows are updated, raise `409 Conflict` to indicate an intervening edit, prompting client-side merge resolution.

---

## 3. Session Locking & Private Vault TTL

- **Session Tokens**: Unlocking the private vault issues a temporary `x-private-token` stored in Redis with an auto-expiring TTL (default: 900 seconds / 15 minutes).
- **Locking the Vault**: Removing the key from Redis or allowing TTL expiration immediately revokes private vault access across all instances.
