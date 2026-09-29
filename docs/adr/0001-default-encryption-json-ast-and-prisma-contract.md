# 1. Default Encryption at Rest, Structured JSON-AST Content, and Prisma Contract Architecture

Date: 2026-09-25

## Status

Accepted

## Context

NoteVault is designed as a security-first personal knowledge base and encrypted vault. Prior implementations had several structural deficiencies:

1. **Partial / Optional Encryption**: Encryption was only applied to a separate `private_notes` table, leaving standard notes unencrypted in plaintext in the database.
2. **Raw HTML Storage**: Content was stored as raw HTML strings, which creates XSS vulnerability risks, breaks structured AST traversal, and prevents reliable CRDT/real-time collaboration.
3. **Dual Schema Sources**: The database definition was split between raw SQL DDL in `init-db.ts` and Prisma schema definitions, causing drift and duplicate manual TypeScript type interfaces (`NoteDbRow`, `TopicDbRow`).

## Decision

We adopt uniform default encryption at rest using AES-256-GCM across all notes, structured ProseMirror JSON AST serialization, and Prisma 8 Data Contract as the Single Source of Truth:

1. **Default Encryption Model**: All note records store ciphertext inside `content` using the standardized payload envelope containing `ciphertext`, `iv`, and `authTag`. Standard notes use the user account encryption key; PIN-protected notes (`is_locked: true`) use the Master PIN derived key.
2. **Content Format**: Plaintext payload before encryption MUST be a valid Tiptap / ProseMirror JSON AST object (`editor.getJSON()`).
3. **Database & Type Generation**: Prisma 8 contract (`backend/src/prisma/contract.prisma`) manages the schema and emits compiled contract artifacts (`contract.json`, `contract.d.ts`).

## Consequences

- Database breach exposes zero plaintext note data.
- XSS injection vector eliminated via JSON AST.
- Eliminated boilerplate manual database row types in TypeScript.
- Simplified CRUD logic around a single consolidated `notes` table.

### Explicit Tradeoffs

- **Zero-Knowledge Security vs Server-Side Full-Text Search**: Accept client-side search execution in memory to prevent exposing plaintext indexing vectors to the database engine.
- **Structured JSON AST vs Raw HTML Simplicity**: Accept ProseMirror document tree schema validation overhead to guarantee XSS immunity and rich-text block extensibility.
- **Contract Compilation Step vs Traditional Schema Files**: Accept running `prisma contract emit` during type-check pipeline to maintain single-source typing across frontend and backend.
