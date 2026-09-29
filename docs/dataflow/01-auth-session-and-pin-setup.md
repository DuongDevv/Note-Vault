---
title: "Dataflow 01: Authentication Session & Master PIN Setup"
docType: "feature-workflow"
status: "approved"
date: "2026-09-29"
version: "1.0.0"
---

# Dataflow 01: Authentication Session & Master PIN Setup

## 1. Overview & Architectural Intent

Quy trình xác thực người dùng, cấp phát phiên làm việc JWT và thiết lập mã **Master PIN** bí mật để bảo vệ các ghi chú riêng tư.

- **Mật khẩu tài khoản**: Được băm bằng thuật toán `Argon2id` trước khi lưu vào `users.password_hash`.
- **Master PIN**: Mã bí mật 6 số dùng để dẫn xuất khóa giải mã vault (`deriveVaultKey`), được băm bằng `Argon2id` lưu tại `users.private_pin_hash`.
- **Session State**: JWT lưu trong Client `localStorage` và gửi qua header `Authorization: Bearer <token>`.

---

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as React Client (LoginPage / PinSettingsDialog)
    participant AuthCtrl as Backend (AuthController)
    participant Crypto as CryptoService (Argon2id)
    participant DB as PostgreSQL (users table)

    %% Flow A: Login
    Note over User,DB: Giai đoạn 1: Đăng nhập & Lấy trạng thái PIN
    User->>UI: Nhập username + password
    UI->>AuthCtrl: POST /api/v1/auth/login { username, password }
    AuthCtrl->>DB: SELECT id, password_hash, (private_pin_hash IS NOT NULL) AS has_private_pin
    DB-->>AuthCtrl: User Record
    AuthCtrl->>Crypto: verifyHash(user.password_hash, password)
    Crypto-->>AuthCtrl: true
    AuthCtrl-->>UI: HTTP 200 { user: { id, username, hasPrivatePin }, accessToken }
    UI->>UI: Lưu accessToken vào localStorage & cập nhật App State

    %% Flow B: Setup PIN
    Note over User,DB: Giai đoạn 2: Thiết lập Master PIN lần đầu
    User->>UI: Nhập PIN 6 số trên PinSettingsDialog
    UI->>AuthCtrl: POST /api/v1/profile/private-pin { newPin }
    AuthCtrl->>Crypto: hashData(newPin) -> Argon2id Hash
    Crypto-->>AuthCtrl: pinHash
    AuthCtrl->>DB: UPDATE users SET private_pin_hash = pinHash WHERE id = userId
    DB-->>AuthCtrl: Success
    AuthCtrl-->>UI: HTTP 200 "Cài đặt mã PIN thành công"
    UI->>UI: Cập nhật currentUser.hasPrivatePin = true
```

---

## 3. Data Transformation & Contracts

| Bước  | Thực thể       | Dữ liệu đầu vào (Input)       | Xử lý biến đổi                                    | Kết quả lưu trữ / Trả về                   |
| :---- | :------------- | :---------------------------- | :------------------------------------------------ | :----------------------------------------- |
| **1** | Mật khẩu Login | `password: "secretP@ss123"`   | `Argon2id.verify()` đối chiếu với `password_hash` | Token `JWT` hạn 24h kèm cờ `hasPrivatePin` |
| **2** | Master PIN     | `newPin: "123456"` (6 chữ số) | `Argon2id.hash(newPin)` sinh muối ngẫu nhiên      | `users.private_pin_hash` trong PostgreSQL  |

---

## 4. Defense-in-Depth & Error Edge Cases

1. **Brute-force Throttling**: API `/auth/login` và `/profile/private-pin` áp dụng Rate Limiter nghiêm ngặt (tối đa 5 lần thử / phút).
2. **Ký tự hợp lệ**: Zod Schema `setPrivatePinSchema` chặn đứng mọi chuỗi không đúng regex `/^\d{6}$/`.
3. **Không lưu trữ mã PIN thô**: Tuyệt đối không lưu plaintext PIN trong Database hay Redis.
