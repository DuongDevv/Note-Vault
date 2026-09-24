# Code Comment Taxonomy & Standards

## Core Philosophy

> **"Code tells you HOW, Comments tell you WHY."**  
> Self-documenting code with expressive naming is always preferred over explanatory comments.

---

## The 4-Tier Comment Taxonomy

- **Tier 1 (Public APIs & Utilities)**: TSDoc / JSDoc (`/** ... */`) specifying intent, params, returns, and invariants.
- **Tier 2 (Technical Rationale)**: Natural English sentences explaining why non-obvious logic exists or what disaster is prevented.
- **Tier 3 (Tracked Debt)**: `// TODO(ticket-or-context):` comments naming the issue or condition.
- **Tier 4 (Prohibited)**: Echoing code, excusing poor naming, dead commented code, changelog tags, or non-English comments.

---

### Tier 1: TSDoc / JSDoc (`/** ... */`) — Public & Shared APIs

**Scope**: Exported utilities (`utils/`), shared hooks (`hooks/`), crypto services, and complex API endpoints.

```ts
/**
 * Encrypts arbitrary plaintext using AES-256-GCM.
 *
 * @param plainText The unencrypted UTF-8 content to protect.
 * @returns EncryptedPayload containing ciphertext, iv, and authTag.
 */
```

---

### Tier 2: Technical Rationale Comments (Natural Prose) — Why, Not What

**Scope**: Non-obvious architectural decisions, security safeguards, concurrency handling, and resilience strategies.  
**Format**: Concise, natural English sentences explaining the technical reason, invariant, or failure mode prevented.

```ts
// Fail-open strategy if Redis rate-limiter is offline, prioritizing API availability.
return true;
```

---

### Tier 3: `// TODO:` Comments — Tracked Technical Debt

**Rule**: NEVER write bare `// TODO: fix this`. Every TODO must name the context, issue, or condition: `// TODO(ticket-id): context`.

---

### Tier 4: Banned Comments (Strictly Prohibited)

- **Echoing Code**: Stating what code already expresses (`// get note by id`).
- **Excusing Poor Code**: Writing comments instead of clean variable/function names.
- **Dead Code**: Commented-out lines (Git tracks history).
- **Changelog / Author Tags**: Use `git blame` and `git log`.
- **Non-English Comments**: All comments in source files MUST be in English.
