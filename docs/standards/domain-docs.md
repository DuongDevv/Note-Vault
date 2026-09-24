# Domain Documentation & Architecture Decision Records (ADRs)

## 1. Domain Glossary (`CONTEXT.md`)

- **Location**: `CONTEXT.md` at the repository root.
- **Rule**: Every core entity, security boundary, and UI terminology MUST be grounded in the glossary. Use exact defined terms; strictly adhere to the banned synonym lists (`_Avoid_`).
- **Maintenance**: Update `CONTEXT.md` whenever an architectural change or domain boundary shifts.

---

## 2. Architecture Decision Records (`docs/adr/`)

- **Location**: `docs/adr/NNNN-<kebab-case-title>.md` (numbered sequentially from `0001`).
- **Status Lifecycles**: `PROPOSED`, `ACCEPTED`, `SUPERSEDED`, `REJECTED`.

### ADR Structure

```markdown
# ADR-0001: <Title>

- **Status**: ACCEPTED
- **Date**: YYYY-MM-DD
- **Deciders**: @team

## Context & Problem Statement

Concise description of the context, technical constraints, and motivation.

## Decision Drivers

- Driver 1 (e.g. data security at rest)
- Driver 2 (e.g. client-side responsiveness)

## Considered Options

1. Option A
2. Option B

## Decision Outcome

Chosen option with rationale and trade-off analysis.

## Consequences

- **Positive**: What becomes easier.
- **Negative**: What becomes harder or requires mitigation.
```

---

## 3. Consumer Rules for Agents

1. **Read Before Writing**: Inspect `CONTEXT.md` before writing features, database schemas, or API contracts.
2. **Consult ADRs**: Check `docs/adr/` before proposing structural or architectural redesigns.
