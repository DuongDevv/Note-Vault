<div align="center">

# NoteVault

### Secure Personal Knowledge Base with Enveloped Note Encryption

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Bun](https://img.shields.io/badge/Bun-1.4-000000?logo=bun&logoColor=white)](https://bun.sh)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-8.0-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_Demo-000000?logo=vercel&logoColor=white)](https://note-vault-dusky.vercel.app)

**Live Demo:** [https://note-vault-dusky.vercel.app](https://note-vault-dusky.vercel.app)

</div>

---

## Overview

NoteVault là hệ thống ghi chú bảo mật cá nhân theo phong cách Notion. Ứng dụng kết hợp trình soạn thảo TipTap với mô hình Enveloped Encryption: mỗi ghi chú khóa bằng một DEK riêng biệt (AES-256-GCM), DEK được bọc bằng KEK phái sinh từ Master PIN (Argon2id), cho phép đổi Master PIN tức thì mà không cần giải mã lại nội dung ghi chú.

---

## Thành viên nhóm thực hiện

| STT | Họ và tên              |     MSSV     | Vai trò                                                                                                                     |
| :-: | :--------------------- | :----------: | :-------------------------------------------------------------------------------------------------------------------------- |
|  1  | Đặng Duy Lam           | `0306241125` | Trưởng nhóm, Kiến trúc Frontend & Quản lý State<br>• Luồng dữ liệu Zustand Stores<br>• Autosave Debounce pipeline           |
|  2  | Trần Văn Ngọc          | `0306241131` | Phát triển Trình soạn thảo & Custom Blocks<br>• Tích hợp TipTap, xây dựng Menu gõ lệnh Slash Command & Floating Bubble Menu |
|  3  | Nguyễn Quốc Đương      | `0306241102` | Giao diện Bảo mật & Xử lý mã PIN<br>• Luồng mở khoá, bảo mật ghi chú                                                        |
|  4  | Nguyễn Trần Ngọc Duyên | `0306241187` | Design System, Điều hướng & Tìm kiếm<br>• Cây thư mục Sidebar, Gắn thẻ & Tìm kiếm nhanh                                     |

---

## Sơ đồ Kiến trúc Giao diện

```mermaid
graph TD
    Layout[Workspace Layout]
    Sidebar[Sidebar: Cây chủ đề & Ghi chú gần đây]
    Canvas[Document Canvas: TipTap Editor & Custom Blocks]
    Modals[Hộp thoại: Tìm kiếm ⌘K & Master PIN]
    State[(Zustand State: Workspace & UI)]

    Layout --> Sidebar
    Layout --> Canvas
    Layout --> Modals

    Sidebar <--> State
    Canvas <--> State
    Modals <--> State
```

---

## Sơ đồ Luồng Dữ liệu

```mermaid
flowchart LR
    User([Người dùng]) -->|Soạn thảo| Editor[TipTap Editor]
    Editor -->|Debounce 800ms| AST[JSON AST]
    AST -->|Optimistic Update| State[(Zustand Store)]
    State -->|REST API| Backend[Express Backend]
    Backend -->|Mã hóa AES-256| DB[(PostgreSQL)]

    User -.->|Khóa PIN| Purge[In-Memory Purge] -.-> State
```

## Services & Ports

| Service             | Stack                           |  Port   | Mô tả                                         |
| :------------------ | :------------------------------ | :-----: | :-------------------------------------------- |
| **REST API Server** | Express 5 + Prisma 8            | `:5000` | Xác thực JWT, Enveloped Crypto, REST APIs     |
| **Web Dashboard**   | React 19 + Vite 8 + Tailwind v4 | `:5173` | Notion canvas, TipTap editor, PIN modal       |
| **PostgreSQL**      | PostgreSQL 18 (Docker)          | `:5432` | Lưu trữ dữ liệu và DEK đã mã hóa              |
| **Redis**           | Redis 8 (Docker)                | `:6379` | Sliding-window rate limiter chống brute-force |

---

## Yêu cầu môi trường

Hệ thống yêu cầu các phiên bản môi trường và runtime tối thiểu như sau:

| Công cụ / Dịch vụ           | Phiên bản khuyến nghị           | Mục đích sử dụng                                               |
| :-------------------------- | :------------------------------ | :------------------------------------------------------------- |
| **Bun**                     | `^1.4.0` (khuyên dùng `1.4.2+`) | Package manager & runtime thực thi script monorepo             |
| **Node.js**                 | `>= 22.0.0` (tùy chọn)          | Node runtime (nếu chạy bản build server `node dist/server.js`) |
| **PostgreSQL**              | `18.x` (Alpine qua Docker)      | Cơ sở dữ liệu chính, lưu trữ ciphertext và DEK bọc             |
| **Redis**                   | `8.x` (Alpine qua Docker)       | Cache bộ nhớ và sliding-window rate limiting                   |
| **Docker & Docker Compose** | Docker v26+ / Compose v2.20+    | Quản lý container cho PostgreSQL 18 và Redis 8                 |

---

## Quickstart

### 1. Khởi động hạ tầng Docker

```bash
docker compose -f backend/docker-compose.yml up -d
```

### 2. Thiết lập biến môi trường cho Backend

> [!IMPORTANT]
> **Bắt buộc có file `backend/.env` để chạy backend.** Server sẽ không thể kết nối Database/Redis hoặc ký token JWT nếu thiếu cấu hình này.

Tạo file `.env` từ file mẫu:

```bash
cp backend/.env.example backend/.env
```

_(Kiểm tra các biến cấu hình kết nối DB, Redis và các khóa bảo mật `JWT_SECRET`, `PRIVATE_NOTE_MASTER_KEY` theo nhu cầu)._

### 3. Cài đặt & đồng bộ Types

```bash
bun install
bun run sync:types
```

### 4. Chạy môi trường phát triển

```bash
bun run dev # Chạy backend và frontend cùng lúc
bun run dev:frontend # Chỉ chạy frontend
bun run dev:backend # Chỉ chạy backend
```

- Web UI (Production): [https://note-vault-dusky.vercel.app](https://note-vault-dusky.vercel.app)
- Web UI (Local): [http://localhost:5173](http://localhost:5173)
- API (Local): [http://localhost:5000](http://localhost:5000)

---

## Quality Gates

```bash
bun run check-types  # Kiểm tra toàn bộ TypeScript
bun run lint         # Lint code bằng Oxlint
```

---

## Cấu trúc dự án

```text
.
├── backend/          # REST API Server (Express 5, Prisma 8, Argon2id)
├── frontend/         # Web Client (React 19, TipTap, Tailwind v4, Zustand)
└── docs/             # ADRs, Dataflow, Figma
```
