# Testing & Fixtures Standards

## 1. 3-Tier Testing Pyramid

- **Unit Tests (Tier 1)**: Pure function verification (crypto algorithms, Zod schema parsing, date formatting, filter pills). Must be fast, zero I/O, zero network.
- **Integration Tests (Tier 2)**: Service and route testing with simulated database/Redis boundaries (e.g. Express supertest with test DB, MSW for frontend).
- **End-to-End Tests (Tier 3)**: Critical user flows (Login $\rightarrow$ Unlock Vault $\rightarrow$ Create Encrypted Note $\rightarrow$ Logout).

---

## 2. Mock Service Worker (MSW) in Frontend

- **Single Source of Truth**: Mock handlers live in `frontend/src/mocks/handlers.ts`.
- **Runtime Interception**: MSW intercepts browser `fetch` calls in development to allow fully functional offline UI development.
- **Zod Validation**: Responses returned by MSW handlers and consumed by `api.ts` MUST pass runtime Zod validation (`src/types/note.ts`).

---

## 3. Test Fixture Conventions

- **Deterministic Fixtures**: Avoid non-deterministic `Date.now()` or unseeded random strings in test assertions.
- **SUT Isolation**: Tests MUST clean up test artifacts (test database records, Redis session keys) in `afterEach` or `afterAll`.
- **Ban Source Text Assertions**: Never test static string wording, incidental CSS styles, or internal private methods. Test observable contracts and behavior.
