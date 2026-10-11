---
title: "Thiết kế Luồng Khóa Ghi Chú & Mã Hóa Phong Bì"
docType: "feature-workflow"
status: "approved"
date: "2026-10-11"
author: "ngxc"
version: "1.1.0"
---

# Thiết kế Luồng Khóa Ghi Chú & Mã Hóa Phong Bì

## 1. Overview & Context

Tài liệu thiết kế quy trình nâng cấp một ghi chú thông thường thành ghi chú bảo vệ bằng Master PIN thông qua cơ chế **Mã hóa phong bì (Enveloped Encryption)**.

### Mục tiêu (Goals)

- Bắt buộc xác thực Master PIN hiện tại của người dùng trước khi tiến hành khóa ghi chú.
- Sinh khóa DEK ngẫu nhiên 32 bytes độc lập mã hóa nội dung, sau đó dùng KEK dẫn xuất từ PIN để bọc lại DEK và lưu vào cột `encrypted_key`.
- Khi đã khóa thành công, ngay lập tức che phủ (`mask: null`) nội dung hiển thị trên UI.

### Ngoài phạm vi (Non-Goals)

- Cho phép đặt mỗi ghi chú một mã PIN khác nhau (toàn bộ hệ thống quy chuẩn theo một Master PIN chung).

---

## 2. Architecture

```mermaid
flowchart TD
    UI[LockPinDialog Modal] -->|PATCH /notes/:id isLocked=true, pin| Server[Express Server]
    Server -->|verifyHash| Auth[Argon2id Verifier]
    Server -->|encryptEnveloped DEK + KEK| Crypto[CryptoService]
    Server -->|UPDATE notes encrypted_key| DB[(PostgreSQL Database)]
```

---

## 3. Operational Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as TopNav / NoteActionMenu
    participant Modal as LockPinDialog Modal
    participant Store as useWorkspaceStore (toggleNoteLock)
    participant Backend as Backend (PATCH /api/v1/notes/:id)
    participant Crypto as CryptoService (Enveloped Encryption)
    participant DB as PostgreSQL (notes table)

    User->>UI: Bấm chọn "Khóa bằng mã PIN"
    UI->>Modal: Mở LockPinDialog (yêu cầu nhập 6 số Master PIN)
    User->>Modal: Nhập 6 chữ số Master PIN & bấm xác nhận
    Modal->>Store: toggleNoteLock(noteId, pin)
    Store->>Backend: PATCH /api/v1/notes/:id { isLocked: true, pin: "123456" }

    Backend->>DB: Lấy private_pin_hash của user
    DB-->>Backend: Hash Record
    Backend->>Crypto: verifyHash(pinHash, "123456")
    alt PIN không khớp
        Crypto-->>Backend: false
        Backend-->>Modal: HTTP 400 "Mã PIN không chính xác"
        Modal-->>User: Hiển thị lỗi & yêu cầu nhập lại
    else PIN khớp
        Crypto-->>Backend: true
        Backend->>Crypto: decryptNoteContent(oldContent, userId) -> Plaintext AST
        Backend->>Crypto: encryptEnveloped(plaintext, userId, pin)
        Note over Crypto: Sinh DEK ngẫu nhiên 32 bytes\nMã hóa content bằng DEK\nBọc DEK bằng KEK(PIN)
        Crypto-->>Backend: { encryptedContent, encryptedKey }

        Backend->>DB: UPDATE notes SET is_locked = true, content = encryptedContent, encrypted_key = encryptedKey, updated_at = NOW() WHERE id = noteId
        DB-->>Backend: Success
        Backend-->>Store: HTTP 200 { id, isLocked: true, content: null }
        Store->>Store: Cập nhật local state: content = null, isLocked = true
        Modal->>Modal: Đóng dialog
        Store-->>User: DocumentCanvas lập tức chuyển sang giao diện UnlockCard
    end
```

---

## 4. Security & Reliability

1. **Kiểm tra quyền sở hữu và xác thực PIN kép**:
   - Backend chỉ cho phép bật cờ `isLocked: true` khi có trường `pin` hợp lệ khớp với `private_pin_hash`.
2. **Không làm rò rỉ nội dung sau khi khóa**:
   - Phản hồi từ server và state trong Zustand store đều chuyển trường `content` thành `null`.

---

## 5. Domain Invariant Taxonomy

| Invariant ID    | Mô tả bất biến                                               | Cơ chế bảo đảm                               | Kiểm thử xác minh                       |
| :-------------- | :----------------------------------------------------------- | :------------------------------------------- | :-------------------------------------- |
| **INV-LOCK-01** | Bật `isLocked: true` bắt buộc phải kèm theo mã PIN chính xác | `NoteController.updateNote` pin verification | `controllers/note.controller.ts`        |
| **INV-LOCK-02** | Ghi chú bị khóa luôn có `encrypted_key` hợp lệ               | `CryptoService.encryptEnveloped`             | `tests/services/crypto.service.test.ts` |
| **INV-LOCK-03** | Khóa ghi chú lập tức che giấu nội dung (`content: null`)     | Response formatting logic                    | `controllers/note.controller.ts`        |
