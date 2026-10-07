<div align="center">

# NoteVault Backend API Server

### High-Security Express 5 Core API & Zero-Knowledge Enveloped Cryptographic Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Prisma ORM](https://img.shields.io/badge/Prisma-8.0_RC-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-316192?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-8.0-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Argon2](https://img.shields.io/badge/Argon2-0.45-563D7C)](https://github.com/ranisalt/node-argon2)
[![Oxlint](https://img.shields.io/badge/Oxlint-Fast_Linter-FFA500)](https://oxc.rs)
[![Docker](https://img.shields.io/badge/Docker-20_Slim-2496ED?logo=docker&logoColor=white)](Dockerfile)

</div>

---

## Architectural Highlights

- **Enveloped Encryption & Key Encapsulation (ADR 0003)**:
  - Multi-tier key management separating **Data Encryption Keys (DEKs)** from **Key Encryption Keys (KEKs)**.
  - Documents encrypted at rest via AES-256-GCM using unique per-note random 256-bit DEKs.
  - DEKs are encapsulated with the user's Argon2id Master PIN key (`vaultKey`) into the `encrypted_key` column.
  - **Instantaneous Atomic PIN Rotation**: Changing the user's Master PIN re-wraps encapsulated DEKs in an atomic PostgreSQL transaction without touching document bodies or causing HTTP gateway timeouts.
- **Strict Rate Limiting & Brute-Force Safeguards**:
  - Redis sliding-window counters protect sensitive routes (`/auth/login`, `/auth/register`, `/profile/private-pin`, `/profile/verify-pin`).
- **Standardized API Error Envelopes**:
  - Predictable error structure adhering to REST conventions with typed Zod payload validations.
- **Contract-First Typings (Prisma 8)**:
  - Direct export of contract typings via `prisma contract emit` into `contract.d.ts`, synchronizing contract safety across frontend and backend.
- **Multi-Stage Debian Container Build**:
  - Two-stage `Dockerfile` (builder + runner) with native g++ / python3 dependencies compiled cleanly for Argon2 C++ bindings.

---

## System Architecture

```text
backend/
├── src/
│   ├── config/               # Database, Redis, env & security configuration
│   ├── controllers/          # Request handlers (auth, note, topic)
│   ├── middlewares/          # JWT auth guard, rate limiter, error pipeline
│   ├── prisma/               # Prisma 8 schema contract, DB client, contract.d.ts
│   ├── routes/               # API v1 route definitions
│   │   └── v1/               # auth.routes.ts, note.routes.ts, topic.routes.ts
│   ├── schemas/              # Zod validation schemas (auth, note, topic)
│   ├── services/             # CryptoService (Argon2id, AES-256-GCM, KEK)
│   ├── utils/                # Auth tokens, response formatter utilities
│   ├── app.ts                # Express application bootstrap & middleware chain
│   └── server.ts             # Server entrypoint & port listener
├── migrations/               # Prisma 8 snapshot migrations
├── prisma/                   # Schema prisma definition
├── Dockerfile                # Multi-stage production container image
├── docker-compose.yml        # PostgreSQL 18 & Redis 8 services
└── package.json              # Backend scripts and dependencies
```

---

## API Reference

Base API Path: `http://localhost:5000/api/v1`

### Core Endpoints

| Domain       | Method & Route              |        Auth Guard         | Description                                                    |
| :----------- | :-------------------------- | :-----------------------: | :------------------------------------------------------------- |
| **Auth**     | `POST /auth/register`       |   Public (Rate Limited)   | Register a new user account with email & password              |
| **Auth**     | `POST /auth/login`          |   Public (Rate Limited)   | Authenticate user credentials and return Bearer JWT            |
| **Profile**  | `GET /profile`              |        Bearer JWT         | Fetch current authenticated user profile & PIN status          |
| **Security** | `POST /profile/private-pin` | Bearer JWT (Rate Limited) | Set or rotate Master PIN with atomic enveloped key re-wrapping |
| **Security** | `POST /profile/verify-pin`  | Bearer JWT (Rate Limited) | Verify Master PIN and issue unlock authorization               |
| **Topics**   | `GET /topics`               |        Bearer JWT         | List all topics/categories belonging to user                   |
| **Topics**   | `POST /topics`              |        Bearer JWT         | Create a new topic with title & color badge                    |
| **Topics**   | `PATCH /topics/:id`         |        Bearer JWT         | Update topic metadata                                          |
| **Topics**   | `DELETE /topics/:id`        |        Bearer JWT         | Delete a topic                                                 |
| **Notes**    | `GET /notes`                |        Bearer JWT         | Fetch paginated notes list with search, topic & tag filters    |
| **Notes**    | `GET /notes/:id`            |        Bearer JWT         | Get full note content (requires unlocked session if locked)    |
| **Notes**    | `POST /notes`               |        Bearer JWT         | Create new note (applies default or enveloped encryption)      |
| **Notes**    | `PUT /notes/:id`            |        Bearer JWT         | Update note content AST, tags, title, or locked status         |
| **Notes**    | `DELETE /notes/:id`         |        Bearer JWT         | Delete note permanently                                        |

---

## Quickstart

### Prerequisites

- **Bun** `v1.4+` (or Node.js 20+)
- **Docker & Docker Compose** (PostgreSQL 18, Redis 8)

### Environment Setup

Create `backend/.env` based on `.env.example`:

```bash
cp .env.example .env
```

Default configuration variables:

```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres_password
DB_NAME=note_vault_db
DB_URL="postgresql://postgres:postgres_password@localhost:5432/note_vault_db"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=super_secret_jwt_access_key_default
PRIVATE_NOTE_MASTER_KEY=default_32_bytes_key_for_aes_256
```

### Run Locally

```bash
# 1. Start database & cache services
docker compose up -d

# 2. Synchronize Prisma contracts and generate types
bun run contract:emit

# 3. Run database migrations
bun run db:migrate

# 4. Start backend server in watch mode
bun run dev
```

---

## Code Quality & Verification

```bash
# Type check TypeScript
bun run check-types

# Run Oxlint with type-awareness
bun run lint
```
