# Web Backend Development

Guidelines for building robust backend APIs and services.

## Scope

This ruleset applies to:
- RESTful APIs
- GraphQL APIs
- Microservices
- Backend-for-frontend (BFF) services
- Server-side web applications

## Core Technologies

Backend development typically involves:
- Server frameworks (Express, Fastify, Koa, Hono, etc.)
- Database systems (PostgreSQL, MySQL, MongoDB, Redis, etc.)
- Authentication/Authorization (JWT, OAuth, sessions)
- API documentation (OpenAPI/Swagger)
- Testing frameworks

## Key Principles

### 1. Security First
Every input is hostile until validated. Defense in depth.

### 2. Reliability
Handle errors gracefully. Fail fast with clear diagnostics.

### 3. Observability
Log meaningfully. Track metrics. Enable debugging.

### 4. Scalability
Design for horizontal scaling. Avoid single points of failure.

## Project Structure

```
src/
├── routes/           # Route handlers/controllers
├── services/         # Business logic
├── repositories/     # Data access layer
├── middleware/       # Request/response middleware
├── lib/              # Shared utilities
├── types/            # TypeScript definitions
├── validation/       # Input validation schemas
└── config/           # Configuration management
```

## API Design Principles

- Use consistent naming conventions
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Version your APIs
- Document endpoints thoroughly

## Definition of Done

A backend feature is complete when:
- [ ] Endpoint works as specified
- [ ] Input validation implemented
- [ ] Error handling covers edge cases
- [ ] Authentication/authorization enforced
- [ ] Unit and integration tests passing
- [ ] API documentation updated
- [ ] No security vulnerabilities
- [ ] Logging in place for debugging
