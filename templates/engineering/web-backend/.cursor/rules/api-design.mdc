---
description: API Design
alwaysApply: false
---

# API Design

Best practices for designing consistent, intuitive backend APIs.

## RESTful Conventions

- Use nouns, not verbs. Plural for collections.
- `GET /users`, `POST /users`, `GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`
- Nest for relationships: `GET /users/:id/posts`

## HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace | Yes |
| PATCH | Partial update | No |
| DELETE | Remove | Yes |

## Status Codes

- **Success**: 200 OK, 201 Created, 204 No Content
- **Client**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation, 429 Rate Limited
- **Server**: 500 Internal, 502 Bad Gateway, 503 Unavailable

## Response Format

```json
{"data": {"id": "123", "name": "John"}}
{"error": {"code": "VALIDATION_ERROR", "message": "...", "details": [...]}}
{"data": [...], "pagination": {"page": 1, "limit": 20, "total": 150}}
```

## Query Parameters

- **Filter**: `?role=admin&status=active`
- **Sort**: `?sort=-createdAt` (prefix `-` for desc)
- **Paginate**: `?page=2&limit=20` or `?cursor=xyz&limit=20`
- **Fields**: `?fields=id,name,email`

## Versioning

Prefer URL versioning: `GET /v1/users`. Alternative: `Accept: application/vnd.api+json; version=1`.

## Rate Limiting

Include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers. Return 429 with `Retry-After` when exceeded.

## Idempotency

Support `Idempotency-Key` header for POST requests to prevent duplicate operations.

## Documentation

- Use OpenAPI/Swagger specification
- Include examples for all endpoints
- Document error codes
- Keep docs in sync with code
