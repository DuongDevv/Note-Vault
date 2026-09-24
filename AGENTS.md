# AGENTS.md

## Critical Directive: Always Initialize & Follow Todo

- **Mandatory Todo Initialization**: For any non-trivial or multi-step task, you MUST immediately initialize a phased todo list using the `todo` tool.
- **Strict Comply & Transition**: Follow the todo list item-by-item. Mark tasks as completed (`done`) immediately after completing them, and transition to the next task in the same turn.

---

## AI-Human Collaboration Protocol

- **Boilerplate Scaffolding**: AI scaffolds boilerplate code only (Zod schemas, database schemas/services, route handlers, UI components, test harness).
- **Core Business Logic**: AI MUST NEVER write core business logic, domain calculations, cryptographic algorithms, or database transactions directly without review.
- **Structured TODO Guiding**: For all core logic, AI provides structured step-by-step `// TODO:` guidance and architectural review; human writes the implementation directly.

---

## Engineering Standards

MUST read the corresponding standard file under `docs/standards/` before modifying related code or tests:

- **Issue tracking & tickets** → `docs/standards/issue-tracker.md`
- **Domain glossary & ADRs** → `docs/standards/domain-docs.md`
- **Comments & docstrings** → `docs/standards/code-comment-taxonomy.md`
- **Routes, DTOs, and error responses** → `docs/standards/api-design-and-error-handling.md`
- **Schemas, queries, and migrations** → `docs/standards/database-and-migrations.md`
- **Locks, race conditions, and transactions** → `docs/standards/concurrency-and-locking.md`
- **Tests, factories, and fixtures** → `docs/standards/testing-and-fixtures.md`
- **Auth, hashing, and sanitization** → `docs/standards/security-and-cryptography.md`
- **Branches, commits, and PRs** → `docs/standards/git-flow-and-pr-matrix.md`
- **Architecture & Deep Modules** → `docs/standards/code-architecture-and-design-principles.md`

---

## Tech Stack & Commands

- **Architecture:** Monorepo (`backend/` & `frontend/`)
- **Runtime:** Bun v1.4+
- **Backend Service:** Node.js + Express 5 + Prisma 8 + PostgreSQL + Redis (`backend/`)
- **Frontend App:** Vite 8 + React 19 + Tailwind CSS v4 + shadcn UI + MSW + Zod (`frontend/`)
- **Development Commands:**
  - Fullstack: `bun run dev` (from root)
  - Backend: `bun run dev:backend`
  - Frontend: `bun run dev:frontend`
- **Quality & Verification:**
  - Type Check: `bun run --cwd backend check-types && bun run --cwd frontend check-types`
  - Linting: `bun run --cwd backend lint && bun run --cwd frontend lint` (powered by Oxlint)
  - Pre-commit Hook: Managed via Husky + lint-staged (`.husky/pre-commit`, `.lintstagedrc.json`)

---

## Project Structure

- `backend/` — Express 5 REST API Server (`src/routes/`, `src/controllers/`, `src/middlewares/`, `src/services/`, `src/prisma/`)
- `frontend/` — React 19 Single Page Dashboard (`src/components/`, `src/services/`, `src/types/`, `src/mocks/`)
- `docs/standards/` — 10 Engineering Standard documents
- `docs/adr/` — Architectural Decision Records
- `docker-compose.yml` — Local PostgreSQL & Redis infrastructure

---

## Working Guidelines & Skill Workflows

1. **User Control First:** Never run unverified bulk code changes. Always present choices and clarify intent.
2. **Domain Terms:** Read `CONTEXT.md` for project-specific domain terms and ADRs.
3. **Engineered Skill Workflows:**
   - **Requirement Alignment:** Use `/grill-with-docs` (or `/grill-me`) to clarify feature scope and update ADRs/glossary.
   - **Specification & Tickets:** Use `/to-spec` to lock specs and `/to-tickets` to split into tracer-bullet tickets.
   - **Feature Implementation:** Use `/implement` + `/tdd` to write features test-first.
   - **Bug Diagnosis:** Use `/diagnosing-bugs` for disciplined 5-phase bug root-cause analysis.
   - **Code Review:** Use `/code-review` before committing to verify spec compliance and code standards.
   - **Architecture Maintenance:** Use `/improve-codebase-architecture` periodically to deepen module design.
