---
title: "Dataflow 04: Note Locking & Vault Key Re-Encryption"
docType: "feature-workflow"
status: "approved"
date: "2026-09-29"
version: "1.0.0"
---

# Dataflow 04: Note Locking & Vault Key Re-Encryption

## 1. Overview & Architectural Intent

Quy trình biến đổi một ghi chú tiêu chuẩn thành **Ghi chú riêng tư có bảo vệ bằng mã PIN (Vault Note)**:

- **Xác thực trước khi Khóa**: Yêu cầu người dùng nhập mã Master PIN 6 số trên `LockPinDialog`.
- **Mã hóa lại thực sự (Genuine Re-encryption)**: Backend giải mã nội dung từ `userKey`, sau đó mã hóa lại bằng `vaultKey = deriveVaultKey(userId, pin)`.
- **Xóa sạch bộ nhớ RAM phía Client**: Ngay khi khóa thành công, Client gán `content: null` để ngăn chặn lộ dữ liệu qua F12 DevTools và kích hoạt ngay màn hình `UnlockCard`.

---

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as React UI (TopNav / Sidebar)
    participant UIStore as useUIStore
    participant Dialog as LockPinDialog
    participant Store as useWorkspaceStore
    participant API as api.toggleNoteLock
    participant Backend as Backend (PUT /notes/:id)
    participant Crypto as CryptoService (AES-256-GCM)
    participant DB as PostgreSQL

    User->>UI: Bấm icon "Khóa ghi chú"
    UI->>UIStore: requestLockToggle(note, hasPrivatePin)
    UIStore->>UIStore: set({ lockTargetNote: { id, mode: "lock", title } })
    UIStore-->>Dialog: Mở LockPinDialog (mode: "lock")
    User->>Dialog: Nhập mã PIN 6 số & Submit
    Dialog->>Store: toggleNoteLock(lockTargetNote.id, pin)
    Store->>API: toggleNoteLock(noteId, isLocked, pin)
    API->>Backend: PUT /api/v1/notes/:id { isLocked: true, pin: "123456" }

    Backend->>DB: Lấy user.private_pin_hash & note hiện tại
    DB-->>Backend: Records
    Backend->>Crypto: verifyHash(user.private_pin_hash, pin)
    Crypto-->>Backend: true (PIN hợp lệ)

    Note over Backend,Crypto: Giải mã từ User Key -> Mã hóa sang Vault Key
    Backend->>Crypto: decryptNoteContent(current.content, userId) [User Key]
    Crypto-->>Backend: Plaintext JSON AST
    Backend->>Crypto: encryptNoteContent(plain, userId, pin) [Vault Key]
    Crypto-->>Backend: New Encrypted Payload

    Backend->>DB: UPDATE notes SET is_locked = true, content = newEncryptedPayload WHERE id = id
    DB-->>Backend: Success
    Backend-->>API: HTTP 200 { isLocked: true, content: null }
    API-->>Store: Updated Note
    Store->>Store: set({ notes: map(n => n.id === id ? { ...n, isLocked: true, content: null } : n) })
    Store-->>UI: State cập nhật -> Canvas render UnlockCard ngay lập tức
```

---

## 3. Data Transformation & Encryption Layer Cutover

```
[Trước khi Khóa - Standard Note]
Ciphertext mã hóa bởi: deriveUserKey(userId)
PostgreSQL: is_locked = false

         │
         ▼  PUT /api/v1/notes/:id { isLocked: true, pin: "123456" }
         │  1. Giải mã bằng deriveUserKey(userId)
         │  2. Mã hóa lại bằng deriveVaultKey(userId, pin)
         │
[Sau khi Khóa - Locked Vault Note]
Ciphertext mã hóa bởi: deriveVaultKey(userId, "123456")
PostgreSQL: is_locked = true
Client RAM: content = null (Purged)
```

---

## 4. Defense-in-Depth & Error Edge Cases

1. **Chặn đứng Khóa ảo (No Virtual Lock)**: Không bao giờ cho phép đổi cờ `is_locked: true` nếu không truyền kèm `pin` hợp lệ.
2. **Không Fallback ngầm**: `decryptNoteContent` không fallback về `userKey` khi có tham số `pin`, đảm bảo tính toàn vẹn của Vault.
3. **Chống rò rỉ bộ nhớ (Memory Sanitization)**: Client xóa bỏ toàn bộ `content` trong state ngay khi khóa hoàn tất.
