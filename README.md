# Note-Vault Enterprise Document & Data Engine

Note-Vault is an enterprise-grade document management engine and secure vault system built with a zero-trust architecture. It implements enveloped encryption protocols combining Argon2id key derivation with AES-256-GCM symmetric encryption for privacy-sensitive documents, structured relational data persistence, in-memory rate limiting, and multi-container Docker orchestration.

---

## Technical Features

- Zero-Trust Cryptographic Engine: Document contents with privacy controls enabled are encrypted using AES-256-GCM authenticated encryption with unique 12-byte initialization vectors and 16-byte authentication tags per record.
- Argon2id Key Derivation: Passwords and secondary 6-digit Master PINs are hashed using Argon2id with memory-hard cost factors (64MB memory, 3 iterations) to mitigate GPU brute-force and side-channel attacks.
- High Concurrency and Rate Limiting: Redis 8 handles request sliding-window rate limiting and token session invalidation with sub-millisecond latency.
- Notion-Style AST Document Storage: Supports rich-text document structures stored as flexible AST payloads.
- Relational Data Integrity: PostgreSQL 18 relational engine managed via Prisma ORM with explicit unique constraints and composite indexes for efficient pagination.
- Full Container Orchestration: Complete multi-stage Docker environment for isolation, reproducible builds, and unified orchestration via Docker Compose.

---

## Architecture Overview

```
+------------------------------------------------------------------------+
|                    REACT 19 FRONTEND (Port 5173)                       |
+-----------------------------------┬------------------------------------+
                                    | HTTP REST API
                                    v
+------------------------------------------------------------------------+
|                   EXPRESS BACKEND SERVER (Port 5000)                   |
|   |-- Security Headers (Helmet) & CORS Policy                          |
|   |-- Redis Rate Limiter Middleware                                    |
|   |-- JWT Authentication Guard & Zod Schema Validation                 |
+-----------------------------------┬------------------------------------+
                                    |
                  +-----------------+-----------------+
                  v                                   v
+-----------------------------------+   +--------------------------------+
|      REDIS 8 IN-MEMORY CACHE      |   |     POSTGRESQL 18 DATABASE     |
|  |-- Session Blacklisting         |   |  |-- Users & Argon2id Hash     |
|  |-- Sliding Window Rate Limit    |   |  |-- Notes (AES-256-GCM)       |
+-----------------------------------+   +--------------------------------+
```

---

## Tech Stack

### Backend
- Language & Runtime: Node.js 22 LTS, TypeScript (Strict Mode)
- Framework: Express.js (Layered Architecture)
- Primary Database: PostgreSQL 18 Alpine
- ORM Layer: Prisma ORM 8
- Cache Engine: Redis 8 Alpine
- Data Validation: Zod Schema Validation
- Security Libraries: Argon2, Node.js Native Crypto Engine

### Frontend
- Framework: React 19, Vite 8
- Styling: Tailwind CSS, Radix UI primitives
- State & Data Fetching: TanStack Query (React Query), Zustand

---

## Cryptographic Specification

### Passwords and Secondary Master PIN
- Hashing Algorithm: Argon2id (`argon2.argon2id`)
- Memory Cost: 65,536 KB (64 MB)
- Time Cost: 3 iterations
- Parallelism: 1 thread

### Document Payload Encryption
- Cipher Algorithm: AES-256-GCM (`aes-256-gcm`)
- Key Length: 256 bits (32 bytes derived via Key Derivation Function)
- Initialization Vector (IV): 12 bytes (96 bits) randomly generated per operation
- Authentication Tag: 16 bytes (128 bits) verified on decryption to ensure data integrity

---

## Database Schema & Indexes

### Tables
1. `users`: Stores user identity, Argon2id password hash, display name, and optional Argon2id secondary `private_pin_hash`.
2. `topics`: Stores document categories with per-user unique `(user_id, slug)` constraints.
3. `notes`: Stores standard and locked documents. Contains fields `id`, `user_id`, `topic_id`, `title`, `content`, `is_locked`, `is_pinned`, `tags`, `created_at`, `updated_at`.

### Composite Indexes
- `(user_id, is_pinned, created_at)`: Enables O(log N) sorting and pagination for user dashboard queries.

---

## REST API Specification

### Authentication Endpoints (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Register a new user account.
- `POST /api/v1/auth/login`: Authenticate credentials and receive a JWT Access Token.
- `POST /api/v1/auth/setup-pin`: Configure or update the 6-digit secondary Argon2id Master PIN.

### Category Management Endpoints (`/api/v1/topics`)
- `GET /api/v1/topics`: Retrieve user document topics.
- `POST /api/v1/topics`: Create a new category topic.
- `DELETE /api/v1/topics/:id`: Remove a category topic.

### Document Management Endpoints (`/api/v1/notes`)
- `GET /api/v1/notes`: List documents with filtering, search, and pagination.
- `POST /api/v1/notes`: Create a standard or locked document.
- `GET /api/v1/notes/:id`: Fetch document details.
- `PUT /api/v1/notes/:id`: Update document title, content payload, or metadata.
- `DELETE /api/v1/notes/:id`: Delete a document.
- `POST /api/v1/notes/:id/unlock`: Decrypt and view an AES-256-GCM locked document by validating the secondary Master PIN.

---

## Local Setup and Deployment

### Requirements
- Node.js 22 LTS or higher
- Docker Engine 24.0+ and Docker Compose v2

### Multi-Container Deployment via Docker Compose

```bash
# Clone the repository
git clone https://github.com/DuongDevv/Note-Vault.git
cd Note-Vault

# Start backend, PostgreSQL 18, and Redis 8 services
cd backend
docker compose up --build -d

# Start frontend development server
cd ../frontend
npm install
npm run dev
```

### Access Points
- Backend REST API: `http://localhost:5000`
- System Healthcheck: `http://localhost:5000/health`
- Frontend Web Interface: `http://localhost:5173`

---

## License

This project is released under the MIT License.
