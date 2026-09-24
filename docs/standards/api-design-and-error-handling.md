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
