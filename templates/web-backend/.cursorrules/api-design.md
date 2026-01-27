# API Design

Best practices for designing consistent, intuitive APIs.

## RESTful Conventions

### Resource Naming

Use nouns, not verbs. Plural for collections.

```
# Good
GET    /users           # List users
POST   /users           # Create user
GET    /users/:id       # Get user
PUT    /users/:id       # Update user
DELETE /users/:id       # Delete user

GET    /users/:id/posts # Get user's posts

# Bad
GET    /getUsers
POST   /createUser
GET    /user/:id
POST   /users/:id/delete
```

### HTTP Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET    | Read resource | Yes | Yes |
| POST   | Create resource | No | No |
| PUT    | Replace resource | Yes | No |
| PATCH  | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

### Status Codes

**Success:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `204 No Content` - Success with no body (DELETE)

**Client Errors:**
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Not permitted
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limited

**Server Errors:**
- `500 Internal Server Error` - Unexpected error
- `502 Bad Gateway` - Upstream error
- `503 Service Unavailable` - Temporarily down

## Request/Response Format

### Request Body

```json
// POST /users
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "admin"
}
```

### Success Response

```json
// 201 Created
{
  "data": {
    "id": "usr_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin",
    "createdAt": "2025-01-20T10:00:00Z"
  }
}
```

### Error Response

```json
// 422 Unprocessable Entity
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "role", "message": "Must be 'user' or 'admin'" }
    ]
  }
}
```

### Collection Response

```json
// GET /users?page=1&limit=20
{
  "data": [
    { "id": "usr_123", "name": "John" },
    { "id": "usr_456", "name": "Jane" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Query Parameters

### Filtering

```
GET /users?role=admin&status=active
GET /posts?createdAfter=2025-01-01
```

### Sorting

```
GET /users?sort=name         # Ascending
GET /users?sort=-createdAt   # Descending (prefix with -)
GET /users?sort=role,-name   # Multiple fields
```

### Pagination

```
# Offset-based
GET /users?page=2&limit=20

# Cursor-based (for large datasets)
GET /users?cursor=eyJpZCI6MTIzfQ&limit=20
```

### Field Selection

```
GET /users?fields=id,name,email
GET /users/:id?include=posts,comments
```

## Versioning

### URL Versioning (Recommended)

```
GET /v1/users
GET /v2/users
```

### Header Versioning

```
GET /users
Accept: application/vnd.api+json; version=1
```

## Rate Limiting

Include rate limit headers:

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

When exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds."
  }
}
```

## Idempotency

Support idempotency keys for POST requests:

```
POST /payments
Idempotency-Key: unique-client-id-123

{
  "amount": 1000,
  "currency": "USD"
}
```

## HATEOAS (Optional)

Include links for discoverability:

```json
{
  "data": {
    "id": "usr_123",
    "name": "John"
  },
  "links": {
    "self": "/users/usr_123",
    "posts": "/users/usr_123/posts",
    "avatar": "/users/usr_123/avatar"
  }
}
```

## Documentation

- Use OpenAPI/Swagger specification
- Include examples for all endpoints
- Document error codes
- Keep documentation in sync with code

```yaml
# openapi.yaml
paths:
  /users:
    post:
      summary: Create a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example:
              email: "user@example.com"
              name: "John Doe"
      responses:
        '201':
          description: User created
        '422':
          description: Validation error
```
