---
title: "Thiết kế Luồng Mở Khóa Ghi Chú & Phiên Vault Redis"
docType: "feature-workflow"
status: "approved"
date: "2026-10-11"
author: "ngxc"
version: "1.1.0"
---

# Thiết kế Luồng Mở Khóa Ghi Chú & Phiên Vault Redis

## 1. Overview & Context

Tài liệu thiết kế quy trình mở khóa ghi chú bảo mật bằng Master PIN, cấp phát phiên làm việc Vault tạm thời trên Redis (15m TTL) và giải mã nội dung Enveloped Encryption.

### Mục tiêu (Goals)

- Nhập PIN 1 lần để mở phiên làm việc Vault (`vaultToken`) có thời hạn 15 phút lưu trên Redis.
- Các request đọc ghi chú tiếp theo sử dụng `x-vault-token` để lấy KEK từ Redis (~0.5ms), tránh băm lại Argon2id/scryptSync.
- Cho phép người dùng chủ động bấm "Khóa phiên Vault" để thu hồi quyền truy cập tức thì bằng lệnh `UNLINK`.

### Ngoài phạm vi (Non-Goals)

- Lưu trữ KEK vĩnh viễn trên client hoặc server (sau 15 phút idle, phiên tự động hết hạn).

---

## 2. Architecture

```mermaid
flowchart TD
    Client[UnlockCard / TopNav] -->|POST /profile/verify-pin| Server[Express Server]
    Server -->|Lưu KEK 15m TTL| Redis[(Redis 8 In-Memory Cache)]
    Client -->|GET /notes/:id x-vault-token| Server
    Server -->|Lấy KEK từ Redis| Redis
    Server -->|decryptEnvelopedWithKek| Crypto[CryptoService]
    Server -->|Trả về nội dung giải mã| Client
```

---

## 3. Operational Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant Card as UnlockCard (DocumentCanvas)
    participant Store as useWorkspaceStore (unlockNoteWithPin)
    participant AuthAPI as api.verifyPrivatePin
    participant NoteAPI as api.fetchNoteById
    participant Backend as Backend Express Server
    participant Redis as Redis 8 Cache
    participant Crypto as CryptoService (Enveloped)
    participant DB as PostgreSQL

    User->>Card: Nhập 6 số Master PIN trên UnlockCard & Bấm giải mã
    Card->>Store: unlockNoteWithPin(noteId, pin)

    %% Bước 1: Xác thực PIN và tạo phiên Redis Vault
    Store->>AuthAPI: verifyPrivatePin("123456")
    AuthAPI->>Backend: POST /api/v1/profile/verify-pin { pin: "123456" }
    Backend->>DB: Lấy private_pin_hash của user
    Backend->>Crypto: verifyHash(pinHash, "123456") -> true
    Backend->>Crypto: deriveVaultKey(userId, "123456") -> KEK Buffer
    Backend->>Redis: SET vault_session:<userId>:<token> = KEK (hex) EX 900
    Backend-->>AuthAPI: HTTP 200 { verified: true, vaultToken }
    AuthAPI->>AuthAPI: Lưu vaultToken vào sessionStorage & đính kèm header

    %% Bước 2: Tải và giải mã ghi chú
    Store->>NoteAPI: fetchNoteById(noteId, pin, vaultToken)
    NoteAPI->>Backend: GET /api/v1/notes/:id (Headers x-vault-token)
    Backend->>Redis: GET vault_session:<userId>:<token> -> KEK Buffer
    Backend->>DB: SELECT * FROM notes WHERE id = noteId
    Backend->>Crypto: decryptEnvelopedWithKek(content, encrypted_key, userId, KEK)
    Crypto-->>Backend: Plaintext JSON AST
    Backend-->>NoteAPI: HTTP 200 { id, title, content: JSON AST, isLocked: true }
    NoteAPI-->>Store: Note đã giải mã
    Store->>Store: set({ notes: updated, unlockedNoteId: noteId })
    Store-->>Card: Thành công
    Card-->>User: Canvas chuyển sang render NoteEditor với nội dung tài liệu
```

---

## 4. Security & Reliability

1. **Thu hồi phiên làm việc tức thì (Instant Session Revocation)**:
   - Khi người dùng bấm "Khóa phiên Vault", endpoint `POST /api/v1/profile/lock-vault` gọi lệnh `redisClient.unlink(sessionKey)` để xóa ngay lập tức KEK khỏi bộ nhớ, hủy toàn bộ quyền xem note khóa trên mọi tab.
2. **Cơ chế dự phòng Fail-Open**:
   - Nếu Redis tạm thời offline, client fallback gửi PIN qua header `x-private-pin`. Backend sẽ xác thực qua PostgreSQL và giải mã trực tiếp, đảm bảo hệ thống không bị ngừng trệ hoàn toàn.
3. **Bảo mật lưu trữ Client**:
   - `vaultToken` chỉ được lưu trong `sessionStorage`, tự động hủy hoàn toàn khi người dùng đóng trình duyệt.

---

## 5. Domain Invariant Taxonomy

| Invariant ID     | Mô tả bất biến                                                         | Cơ chế bảo đảm                             | Kiểm thử xác minh                              |
| :--------------- | :--------------------------------------------------------------------- | :----------------------------------------- | :--------------------------------------------- |
| **INV-VAULT-01** | Phiên Vault token trên Redis có TTL tối đa 900 giây (15 phút)          | `VaultSessionService.createSession` EX 900 | `tests/services/vault-session.service.test.ts` |
| **INV-VAULT-02** | Khóa phiên Vault xóa session key bằng lệnh UNLINK bất đồng bộ          | `VaultSessionService.revokeSession`        | `tests/services/vault-session.service.test.ts` |
| **INV-VAULT-03** | Giải mã với KEK sai hoặc thiếu credentials luôn trả về `content: null` | `formatNoteResponse` masking               | `controllers/note.controller.ts`               |
