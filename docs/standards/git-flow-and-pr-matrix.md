# Git Flow, Commit Conventions & PR Matrix

## 1. Branch Strategy & Naming Conventions

- **Main Production Branch**: `main` (always deployable, protected).
- **Development Integration**: `develop` (feature integration branch).
- **Topic Branches**: Branch off `develop`, prefix with purpose:
  - `feat/<short-description>`: New feature or capability.
  - `fix/<short-description>`: Bug fix or defect resolution.
  - `refactor/<short-description>`: Code cleanup or structural improvement.
  - `chore/<short-description>`: Dependency updates, config tweaks.

---

## 2. Conventional Commits (≤ 72 Characters)

Commit messages MUST adhere to the Conventional Commits specification:

```
<type>(<scope>): <concise description in lowercase>
```

- **Types**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `style`.
- **Imperative Mood**: "add feature" instead of "added feature" or "adds feature".
- **Character Limit**: Subject line MUST NOT exceed 72 characters.

---

## 3. 3-Tier PR Matrix

| Tier                | Size / Scope                           | Requirements                                   | Review Rigor                     |
| :------------------ | :------------------------------------- | :--------------------------------------------- | :------------------------------- |
| **Tier 1 (Small)**  | $\le 100$ lines, single file/component | Pre-commit checks pass                         | 1 reviewer, fast-track merge     |
| **Tier 2 (Medium)** | $100 - 400$ lines, bounded feature     | Unit tests, type checks, lint pass             | Detailed architectural review    |
| **Tier 3 (Large)**  | $> 400$ lines, schema/security changes | Migration proof, integration tests, ADR update | Multi-party audit & verification |

---

## 4. Pre-Commit Verification Gate

Before creating a PR or committing:

1. `bun run check-types` MUST pass with 0 errors across backend and frontend.
2. `bun run lint` (Oxlint) MUST pass with 0 errors.
3. Pre-commit hooks (`.husky/pre-commit`) MUST NOT be bypassed with `--no-verify` unless emergency break-fix.
