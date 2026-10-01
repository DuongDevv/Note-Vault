# Note-Vault Enterprise Document & Data Engine

Note-Vault is an enterprise-grade document management engine and secure vault system built with a zero-trust architecture. It implements enveloped encryption protocols combining Argon2id key derivation with AES-256-GCM symmetric encryption for privacy-sensitive documents, structured relational data persistence, in-memory rate limiting, client-side AST document editing, and multi-container Docker orchestration.

---

## Architecture Overview

```
+------------------------------------------------------------------------+
|                    REACT 19 FRONTEND (Port 5173)                       |
|   |-- Workspace Layout & State Management (Zustand 5)                  |
|   |-- Notion-Style Document Canvas (TipTap 3 AST Engine)              |
|   |-- Custom Node Views (SecretBlock, CodeBlock, ImageNode)            |
|   |-- Interactive Slash Commands & Drag-and-Drop Block Handles         |
|   |-- Client Security Dialogs (UnlockCard, PinSettingsDialog)          |
+-----------------------------------┬------------------------------------+
                                    | HTTP REST API
                                    v
+------------------------------------------------------------------------+
|                   EXPRESS BACKEND SERVER (Port 5000)                   |
|   |-- Security Headers (Helmet) & CORS Policy                          |
|   |-- Redis Rate Limiter Middleware                                    |
|   |-- JWT Authentication Guard & Zod Schema Validation                 |
|   |-- Crypto Service (Argon2id KDF + AES-256-GCM Encryption)           |
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

## Technical Features

### Frontend Document Architecture
- Notion-Style AST Canvas Engine: Document editing is driven by TipTap 3 and ProseMirror, outputting structured AST JSON payloads for lossless document storage.
- Custom Extension Node Views: Implements custom React components for complex document nodes:
  - `SecretBlockNodeView`: Embedded encrypted payload node within standard notes.
  - `CodeBlockNodeView`: Real-time syntax-highlighted code blocks powered by Lowlight 3 and Highlight.js 11.
  - `ImageNodeView`: Resizable, dynamic image blocks with custom insertion dialogs.
- Advanced Document Interactions: Features a Notion-style Slash (`/`) command menu for block insertion, floating contextual Bubble Menu toolbars for text formatting, and drag-and-drop block handles for paragraph reordering.
- Centralized Client Workspace State: State management is handled by Zustand 5 (`useWorkspaceStore`, `useUIStore`), decoupling document manipulation from UI rendering and maintaining optimistic updates.
- Master PIN & Vault Lock UI: Integrated 6-digit OTP PIN input controls, global search palette (`Cmd + K`), and in-canvas `UnlockCard` components for encrypted documents.

### Backend & Infrastructure Architecture
- Zero-Trust Cryptographic Engine: Document contents with privacy controls enabled are encrypted using AES-256-GCM authenticated encryption with unique 12-byte initialization vectors and 16-byte authentication tags per record.
- Argon2id Key Derivation: Passwords and secondary 6-digit Master PINs are hashed using Argon2id with memory-hard cost factors (64MB memory, 3 iterations) to mitigate GPU brute-force and side-channel attacks.
- High Concurrency and Rate Limiting: Redis 8 handles request sliding-window rate limiting and token session invalidation with sub-millisecond latency.
- Relational Data Integrity: PostgreSQL 18 relational engine managed via Prisma ORM with explicit unique constraints and composite indexes for efficient pagination.
- Full Container Orchestration: Complete multi-stage Docker environment for isolation, reproducible builds, and unified orchestration via Docker Compose.

---

## Technical Stack Specifications

### Frontend Subsystem
- Package Manager & Runtime: Bun (`bun.lock`)
- Core Framework: React 19 (`react@^19.2.8`), React DOM 19
- Next-Gen Compiler: React Compiler (`babel-plugin-react-compiler` automatic memoization)
- Build Tooling & Bundler: Vite 8 (`vite@^8.3.0`), `@rolldown/plugin-babel`
- Rich-Text Canvas Engine: TipTap 3 Suite (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-bubble-menu`, `@tiptap/extension-code-block-lowlight`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-suggestion`)
- Code Syntax Highlighting: Lowlight 3, Highlight.js 11
- Client Routing: React Router DOM v7 (`react-router-dom@^7.18.4`)
- State Management: Zustand 5 (`zustand@^5.0.15`)
- Component System: Base UI primitives (`@base-ui/react`), Shadcn UI, Command Palette (`cmdk`), Class Variance Authority (`cva`)
- Styling Engine: Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css`
- Typography & Fonts: `@fontsource-variable/geist`, `@fontsource-variable/inter`, `@fontsource/jetbrains-mono`
- Type-Safe Validation: Zod v4 (`zod@^4.6.5`)
- High-Speed Linter: Oxlint (`oxlint`, `oxlint-tsgolint`)

### Backend Subsystem
- Language & Runtime: Node.js 22 LTS, TypeScript (Strict Mode)
- Framework: Express.js (Layered Architecture)
- Primary Database: PostgreSQL 18 Alpine
- ORM Layer: Prisma ORM 8
- Cache Engine: Redis 8 Alpine
- Data Validation: Zod Schema Validation
- Cryptography Engine: Argon2id (`argon2`) & AES-256-GCM (`node:crypto`)

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

### Prerequisites
- Node.js 22 LTS or Bun 1.x
- Docker Engine 24.0+ and Docker Compose v2

### Deployment Guide

```bash
# Clone repository
git clone https://github.com/DuongDevv/Note-Vault.git
cd Note-Vault

# 1. Start Backend, PostgreSQL 18, and Redis 8 via Docker Compose
cd backend
docker compose up --build -d

# 2. Start Frontend Development Server (using Bun)
cd ../frontend
bun install
bun dev
```

> Note: If Bun is not installed in your local environment, you can use `npm install` and `npm run dev` as fallbacks.

### Access Points
- Backend REST API: `http://localhost:5000`
- System Healthcheck: `http://localhost:5000/health`
- Frontend Web Interface: `http://localhost:5173`

---

## Project Contributors & Engineering Team

- Project Manager (PM): Dang Duy Lam (https://github.com/VandesDang)
- Frontend Engineer (FE): Tran Van Ngoc (https://github.com/ngxccc)
- Backend Architect & Tech Lead (BE): Nguyen Quoc Duong (https://github.com/DuongDevv)

---

## License

This project is released under the MIT License.
