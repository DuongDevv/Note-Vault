# ADR-0001: Default Encryption at Rest, Structured JSON-AST Content, and Prisma Contract Architecture

- **Status**: ACCEPTED
- **Date**: 2026-09-25
- **Deciders**: @team

## Context & Problem Statement

NoteVault is designed as a security-first personal knowledge base and encrypted vault. Prior implementations had several structural deficiencies:

1. **Partial / Optional Encryption**: Encryption was only applied to a separate `private_notes` table, leaving standard notes unencrypted in plaintext in the database.
2. **Raw HTML Storage**: Content was stored as raw HTML strings, which creates XSS vulnerability risks, breaks structured AST traversal, and prevents reliable CRDT/real-time collaboration.
3. **Dual Schema Sources**: The database definition was split between raw SQL DDL in `init-db.ts` and Prisma schema definitions, causing drift and duplicate manual TypeScript type interfaces (`NoteDbRow`, `TopicDbRow`).

## Decision Drivers

- **Security by Default**: Every note in NoteVault MUST be encrypted at rest using AES-256-GCM. Unencrypted plaintext storage is strictly prohibited.
- **Single Source of Truth (SSOT)**: Prisma 8 contract (`contract.prisma`) is the single authoritative source of database models and TypeScript types.
- **Enterprise Rich-Text Serialization**: Note content MUST be structured JSON AST (ProseMirror / Tiptap format) rather than unconstrained raw HTML.
- **Tiered Encryption Keys (Standard vs Vault PIN)**:
  - Standard notes: Encrypted with the user's primary derived key (transparent decryption for authenticated sessions).
  - PIN-locked notes (`is_locked: true`): Encrypted with a key derived from the user's Master PIN (Argon2id + AES-256-GCM), requiring private vault authentication.

## Considered Options

1. **Option A: Plaintext Notes + Separate Private Notes Table**
   - _Pros_: Simple SQL full-text search.
   - _Cons_: Severe security vulnerability on database breach; complex dual-table architecture; locks mutate entity IDs.
2. **Option B: Uniform Default Encryption with Structured JSON AST (Chosen)**
   - _Pros_: Zero-knowledge posture across all records; consistent schema; ProseMirror AST eliminates XSS and supports extensible block models; single table with boolean lock state.
   - _Cons_: Server-side text search requires indexed encrypted search metadata or client-side indexing.

## Decision Outcome

We adopt **Option B**:

1. **Default Encryption Model**:
   - All note records store ciphertext inside `content` using the standardized payload envelope:
     ```json
     {
       "ciphertext": "...",
       "iv": "...",
       "authTag": "..."
     }
     ```
   - Standard notes use the user account encryption key.
   - PIN-protected notes (`is_locked: true`) use the Master PIN derived key (Argon2id).
2. **Content Format**:
   - Plaintext payload before encryption MUST be a valid Tiptap / ProseMirror JSON AST object.
3. **Database & Type Generation**:
   - Remove `init-db.ts` completely.
   - Prisma 8 contract (`src/prisma/contract.prisma`) manages the schema.
   - Application controllers and services import generated types from `src/prisma/contract.d.ts` (`Models.public_Note`, `Models.public_Topic`, `Models.public_User`).

## Consequences

- **Positive**:
  - Database breach exposes zero plaintext note data.
  - XSS injection vector eliminated via JSON AST.
  - Eliminated boilerplate manual database row types in TypeScript.
  - Simplified CRUD logic around a single consolidated `notes` table.
- **Negative**:
  - Full-text search requires client-side search or searchable blind indexing (HMAC tags).
  - Client must transmit ProseMirror JSON structure (`editor.getJSON()`).
