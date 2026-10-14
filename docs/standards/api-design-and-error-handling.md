# API Design & Error Handling Standards

## 1. RESTful URL & Route Naming Conventions

- **Resource-Oriented & Plural Nouns**: Routes MUST use plural nouns in lowercase `kebab-case` (`/api/v1/notes`, `/api/v1/topics`, `/api/v1/private-notes`).
- **Command vs Query Distinction**:
  - Retrieval (Safe, Idempotent): `GET /api/v1/notes?topicId=...`
  - Resource creation: `POST /api/v1/notes`
  - Actions/Sub-resources: `POST /api/v1/auth/unlock-vault`, `POST /api/v1/notes/:id/toggle-lock`

---

## 2. Standard Response Envelope

All API endpoints MUST adhere to the standardized `ApiResponse` envelope:

### Success Response (`ApiResponse.success`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách ghi chú thành công",
  "data": [{ "id": "uuid-1", "title": "Ghi chú...", "isLocked": false }]
}
```

### Error Response (`ApiResponse.error`)

```json
{
  "success": false,
  "statusCode": 401,
  "errorCode": "UNAUTHORIZED",
  "message": "JWT Token đã hết hạn hoặc không hợp lệ",
  "details": null
}
```

---

## 3. HTTP Status Code Decision Matrix

| Status Code             | Meaning                 | When to Use                                            |
| :---------------------- | :---------------------- | :----------------------------------------------------- |
| `200 OK`                | Success with payload    | Successful `GET`, `PUT`, `PATCH`, or idempotent update |
| `201 Created`           | Resource created        | Successful `POST` creating a note or topic             |
| `400 Bad Request`       | Client validation error | Missing title, malformed JSON body                     |
| `401 Unauthorized`      | Missing / Invalid Auth  | Bearer token missing, expired, or invalid              |
| `403 Forbidden`         | Access Denied           | Incorrect Master PIN or invalid private session token  |
| `404 Not Found`         | Entity Missing          | Non-existent note or topic ID                          |
| `409 Conflict`          | State Conflict          | Duplicate topic slug, concurrent edit race             |
| `429 Too Many Requests` | Rate Limit Exceeded     | Brute-force protection on PIN entry                    |
| `500 Internal Error`    | Server Exception        | Unexpected database or crypto exception (sanitized)    |

---

## 4. Idempotency & State Safety

- State-mutating commands MUST be idempotent where applicable (e.g. repeated delete returns success or 404 cleanly).
- Vault unlock requests MUST use short-lived session tokens (e.g. 15-minute Redis TTL) rather than perpetual credentials.

---

## 5. OpenAPI 3.1 Contract & End-to-End Type Safety

To prevent runtime data drift between backend and frontend, all endpoints MUST adhere to the OpenAPI 3.1 contract pipeline:

### 5.1 Schema Single Source of Truth

- Route validation schemas MUST be defined with **Zod** in `backend/src/schemas/`.
- Success responses MUST be wrapped using `createSuccessEnvelopeSchema(dataSchema)` from `backend/src/schemas/response.schema.ts`.
- Error responses MUST adhere to `errorEnvelopeSchema` with `status: false`, `statusCode`, `errorCode`, and `message`.

### 5.2 Contract Generation & Distribution

- The complete specification is built via `backend/src/openapi/spec.ts` and emitted statically to `docs/openapi.json` via:
  ```bash
  bun run openapi:generate
  ```
- The API server MUST expose the live specification at runtime via `GET /api/v1/openapi.json`.

### 5.3 Frontend Consumption & Client Invariants

- Frontend type definitions are auto-generated from `docs/openapi.json` into `frontend/src/types/api.generated.d.ts` via:
  ```bash
  bun run gen:api
  ```
- All HTTP interactions in the frontend MUST consume the typed client `api` (`openapi-fetch`) configured in `frontend/src/services/apiClient.ts`.
- Manual `fetch` calls, handwritten duplicated request/response interfaces, and unsafe type assertions (`as unknown as ...`) are strictly prohibited.
- Token storage helpers MUST reside in `frontend/src/services/tokens.ts` to prevent circular imports with the client middleware.
