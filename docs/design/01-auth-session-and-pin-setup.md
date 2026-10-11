---
title: "Thiết kế Luồng Xác thực Phiên & Cài đặt Master PIN"
docType: "feature-workflow"
status: "approved"
date: "2026-10-11"
author: "ngxc"
version: "1.1.0"
---

# Thiết kế Luồng Xác thực Phiên & Cài đặt Master PIN

## 1. Overview & Context

Tài liệu thiết kế quy trình xác thực người dùng, cấp phát phiên làm việc JWT và thiết lập/đổi mã **Master PIN** bí mật để bảo vệ các ghi chú riêng tư.

### Mục tiêu (Goals)

- Đảm bảo an toàn mật khẩu người dùng với thuật toán băm bộ nhớ cứng `Argon2id`.
- Thiết lập và quản lý vòng đời Master PIN để dẫn xuất khóa bọc (KEK) phục vụ mã hóa phong bì (Enveloped Encryption).
- Đồng bộ cờ `hasPrivatePin` giữa PostgreSQL, Express API và React Client state.

### Ngoài phạm vi (Non-Goals)

- Tự động khôi phục mã PIN khi quên (Zero-Knowledge: mất Master PIN đồng nghĩa với việc không thể giải mã các ghi chú đã khóa).

---

## 2. Architecture

```mermaid
flowchart TD
    Client[React 19 Client\nZustand + UI] -->|HTTPS REST| API[Express 5 Backend Server]
    API -->|Argon2id / AES-256-GCM| Crypto[CryptoService]
    API -->|Redis Protocol| Redis[(Redis 8 In-Memory Cache)]
    API -->|PostgreSQL Protocol| DB[(PostgreSQL 18 DB)]
```

---

## 3. Operational Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as React Client (LoginPage / PinSettingsDialog)
    participant AuthCtrl as Backend (AuthController)
    participant Crypto as CryptoService (Argon2id)
    participant DB as PostgreSQL (users table)

    %% Giai đoạn 1: Đăng nhập
    Note over User,DB: Giai đoạn 1: Đăng nhập & Lấy trạng thái PIN
    User->>UI: Nhập username + password
    UI->>AuthCtrl: POST /api/v1/auth/login { username, password }
    AuthCtrl->>DB: SELECT id, username, email, password_hash, display_name, (private_pin_hash IS NOT NULL) AS has_private_pin
    DB-->>AuthCtrl: User Record
    AuthCtrl->>Crypto: verifyHash(user.password_hash, password)
    Crypto-->>AuthCtrl: true
    AuthCtrl-->>UI: HTTP 200 { user: { id, username, hasPrivatePin }, accessToken }
    UI->>UI: Lưu accessToken vào localStorage & cập nhật App State

    %% Giai đoạn 2: Thiết lập Master PIN
    Note over User,DB: Giai đoạn 2: Thiết lập hoặc Đổi Master PIN
    User->>UI: Nhập PIN 6 số trên PinSettingsDialog
    UI->>AuthCtrl: POST /api/v1/profile/private-pin { newPin, currentPin? }
    AuthCtrl->>Crypto: hashData(newPin) -> Argon2id Hash
    Crypto-->>AuthCtrl: newPinHash
    AuthCtrl->>DB: UPDATE users SET private_pin_hash = newPinHash WHERE id = userId
    DB-->>AuthCtrl: Success
    AuthCtrl-->>UI: HTTP 200 "Cài đặt mã PIN thành công"
    UI->>UI: Cập nhật currentUser.hasPrivatePin = true
```

---

## 4. Security & Reliability

1. **Chống tấn công Brute-force**:
   - Áp dụng Redis sliding-window rate limiting trên các endpoint xác thực (`/api/v1/auth/login`: tối đa 5 requests/phút).
   - Cơ chế **Fail-Open**: Nếu Redis gặp sự cố, hệ thống cho phép request đi tiếp và log warning để bảo đảm tính sẵn sàng.
2. **Ký tự hợp lệ**:
   - Schema Zod `setPrivatePinSchema` chặn đứng mọi chuỗi không đúng biểu thức chính quy `/^\d{6}$/`.
3. **Không lưu trữ mã PIN thô**:
   - Tuyệt đối không lưu plaintext PIN trong Database hay Redis. Server chỉ lưu chuỗi băm Argon2id tại `users.private_pin_hash`.

---

## 5. Domain Invariant Taxonomy

| Invariant ID    | Mô tả bất biến                              | Cơ chế bảo đảm                              | Kiểm thử xác minh                       |
| :-------------- | :------------------------------------------ | :------------------------------------------ | :-------------------------------------- |
| **INV-AUTH-01** | Mật khẩu và PIN luôn được băm bằng Argon2id | `CryptoService.hashData`                    | `tests/services/crypto.service.test.ts` |
| **INV-AUTH-02** | Master PIN bắt buộc đúng 6 chữ số           | Zod `setPrivatePinSchema` regex `/^\d{6}$/` | `schemas/auth.schema.ts`                |
| **INV-AUTH-03** | Đổi PIN yêu cầu xác thực currentPin         | `AuthController.setPrivatePin` FOR UPDATE   | `controllers/auth.controller.ts`        |
