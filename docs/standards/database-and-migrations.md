# Database & Migrations Standards

## 1. Naming Conventions & Schema Structure

- **Table Names**: Plural `snake_case` (`notes`, `topics`, `private_notes`, `users`).
- **Column Names**: Lowercase `snake_case` (`id`, `user_id`, `topic_id`, `is_pinned`, `created_at`, `updated_at`).
- **Primary Keys**: UUID v4 / UUID v7 strings (`id UUID PRIMARY KEY DEFAULT gen_random_uuid()`).
- **Foreign Keys**: Named as `<singular_table>_id` with foreign key constraints (`user_id REFERENCES users(id) ON DELETE CASCADE`).
- **Timestamps**: All persistent tables MUST contain `created_at` and `updated_at` with timezone (`TIMESTAMPTZ DEFAULT NOW()`).

---

## 2. Querying Principles & Indexing

- **Selective Projections**: Never perform unconstrained `SELECT *` in production queries; request only required columns.
- **Index Foreign Keys**: Every foreign key column used in queries or joins MUST have an index.
- **Compound Indexes for Filtering**:
  - Filter by user and topic: `CREATE INDEX idx_notes_user_topic ON notes (user_id, topic_id);`
  - Sort by pinned and recency: `CREATE INDEX idx_notes_pinned_created ON notes (user_id, is_pinned DESC, created_at DESC);`

---

## 3. Migration Lifecycle & Prisma Rules

- **Zero-Downtime Expand/Contract**:
  - Phase 1 (Expand): Add column as nullable or with safe default; deploy code writing to both.
  - Phase 2 (Backfill): Migrate historical records.
  - Phase 3 (Contract): Make column required or drop old column after old code is decommissioned.
- **Contract Schema Validation**:
  - Maintain synchronization between Prisma schema (`schema.prisma` / `contract.prisma`) and actual database tables.
  - Test migrations locally and in staging before applying to production.
