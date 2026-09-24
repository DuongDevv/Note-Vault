# Code Architecture & Design Principles

## 1. Deep Modules & Information Hiding

- **Thick Implementation, Narrow Interface**: Expose minimal, intention-revealing method signatures that conceal internal complexity (cryptographic ciphers, Redis session tokens, file serialization, state mutations).
- **Complexity Sink**: Internalize error recovery, defaults, and boundary normalization inside services rather than leaking them to controllers, routes, or UI components.
- **Define Errors Out of Existence**: Structure domain APIs so edge conditions resolve naturally and idempotently (e.g. deleting an already deleted note returns 200 rather than crashing).
- **Prohibit Shallow Pass-Throughs**: Every service method MUST enforce domain invariants, data transformations, or transaction boundaries.

---

## 2. AHA (Avoid Hasty Abstractions) & Rule of Three

- **Prefer Concrete Duplication Over Wrong Abstraction**: Write logic inline until exact repetition across 3 distinct domain contexts reveals the stable, unified invariant.
- **The Rule of Three Progression**:
  1. _First occurrence_: Inline concrete implementation.
  2. _Second occurrence_: Duplicate with localized adjustments.
  3. _Third occurrence_: Extract shared abstraction only when invariants, failure modes, and lifecycles are identical.
- **Dissolve Tangled Abstractions**: If a shared helper requires caller-type branching (`if (isMobile)` everywhere), separate the layout or component concerns cleanly.

---

## 3. Single Source of Truth (SSOT)

- **Domain Knowledge SSOT**: Maintain a single authoritative implementation for every business calculation (e.g. note counters, active topic selection, encryption keys).
- **Asset SSOT**: Icons and static assets reside in canonical locations (`src/assets/notevault-icon.svg`) referenced consistently by both web app and favicon.
- **Schema SSOT**: Zod schemas (`src/types/note.ts`) serve as the runtime validator and TypeScript type derivation source.

---

## 4. Command-Query Separation (CQS) & Idempotency

- **Commands (Mutations)**: State-changing operations execute atomically and return minimal confirmations.
- **Queries (Reads)**: Query operations MUST be side-effect-free, safe to retry, and leverage selective projections.
- **Idempotent Mutations**: State-mutating endpoints (note creation, locking, deletion) MUST enforce deterministic idempotency.

---

## 5. Law of Demeter (Least Knowledge)

- **Immediate Collaborators Only**: Methods interact strictly with injected dependencies, method arguments, and internally instantiated entities.
- **Prohibit Chained Traversals**: Avoid multi-hop object traversal chains across component or module boundaries.

---

## 6. Fail-Fast Source Integrity (Linux Philosophy)

- **Strict at the Source**: Database schemas, DTOs, and Zod schemas must strictly enforce domain invariants (`notNull()`, type guards). Never allow dirty, partial, or ambiguous data into the persistence layer.
- **Banned Defensive Shims**: Do NOT write defensive fallbacks (e.g. `val || default || "—"`) to silently mask schema loopholes. Fail fast and loudly if data violates invariants.
