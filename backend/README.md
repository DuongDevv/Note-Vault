<div align="center">

# NoteVault Backend API

### Express 5 REST API & Enveloped Cryptographic Engine

[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-8.0_RC-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-8.0-DC382D?logo=redis&logoColor=white)](https://redis.io)

</div>

---

## Tính năng kỹ thuật chính

1. **Enveloped Encryption (ADR 0003)**:
   - Nội dung mã hóa bằng DEK ngẫu nhiên 256-bit (AES-256-GCM).
   - DEK được bọc bằng KEK derived từ Master PIN người dùng (Argon2id).
   - Đổi Master PIN hoàn tất tức thì trong một database transaction mà không tải hay ghi lại nội dung document.
2. **Rate Limiting**: Sliding-window Redis bảo vệ các route auth và PIN verification.
3. **Contract-First Typings**: Sinh contract type tự động qua `prisma contract emit`.

---

## API Endpoints (`/api/v1`)

| Module     | Method & Route                                                                               |    Auth    | Mô tả                                     |
| :--------- | :------------------------------------------------------------------------------------------- | :--------: | :---------------------------------------- |
| **Auth**   | `POST /auth/register`<br>`POST /auth/login`                                                  |   Public   | Đăng ký & đăng nhập lấy JWT token         |
| **PIN**    | `POST /profile/private-pin`<br>`POST /profile/verify-pin`                                    | Bearer JWT | Thiết lập/đổi PIN và xác thực mở khóa     |
| **Topics** | `GET /topics`<br>`POST /topics`<br>`DELETE /topics/:id`                                      | Bearer JWT | Quản lý danh mục ghi chú                  |
| **Notes**  | `GET /notes`<br>`POST /notes`<br>`GET /notes/:id`<br>`PUT /notes/:id`<br>`DELETE /notes/:id` | Bearer JWT | CRUD ghi chú, tìm kiếm và mã hóa nội dung |

---

## Quickstart

```bash
# Cấu hình môi trường
cp .env.example .env

# Khởi chạy DB & Redis
docker compose up -d

# Đồng bộ contract & migrate
bun run contract:emit
bun run db:migrate

# Chạy development server
bun run dev
```

---

## Quality Checks

```bash
bun run check-types  # Kiểm tra lỗi type
bun run lint         # Lint bằng Oxlint
```
