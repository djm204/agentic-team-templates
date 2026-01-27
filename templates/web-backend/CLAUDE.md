# Web Backend Development Guide

Comprehensive guidelines for building robust backend APIs and services.

---

## Overview

This guide applies to:
- RESTful APIs
- GraphQL APIs
- Microservices
- Backend-for-frontend (BFF) services

### Key Principles

1. **Security First** - Every input is hostile until validated
2. **Reliability** - Handle errors gracefully, fail fast
3. **Observability** - Log meaningfully, track metrics
4. **Scalability** - Design for horizontal scaling

### Project Structure

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

---

## API Design

### RESTful Conventions

```
GET    /users           # List users
POST   /users           # Create user
GET    /users/:id       # Get user
PUT    /users/:id       # Update user
DELETE /users/:id       # Delete user
GET    /users/:id/posts # Get user's posts
```

### HTTP Status Codes

**Success**: 200 OK, 201 Created, 204 No Content
**Client Errors**: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Validation Error, 429 Rate Limited
**Server Errors**: 500 Internal Error, 502 Bad Gateway, 503 Service Unavailable

### Response Format

```json
// Success
{ "data": { "id": "123", "name": "John" } }

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "email", "message": "Invalid format" }]
  }
}

// Collection
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 150 }
}
```

### Query Parameters

- **Filtering**: `?role=admin&status=active`
- **Sorting**: `?sort=-createdAt` (prefix `-` for descending)
- **Pagination**: `?page=2&limit=20` or `?cursor=xyz&limit=20`
- **Fields**: `?fields=id,name,email`

---

## Database Patterns

### Data Access Layer

```ts
// repository/userRepository.ts
export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  },
  async create(data: CreateUserInput): Promise<User> {
    return db.user.create({ data });
  },
};
```

### Transactions

```ts
await db.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({ ... });
  await tx.payment.create({ ... });
});
```

### Avoid N+1 Queries

```ts
// Bad: N+1
const posts = await db.post.findMany();
for (const post of posts) {
  post.author = await db.user.findUnique({ where: { id: post.authorId } });
}

// Good: Include
const posts = await db.post.findMany({ include: { author: true } });
```

### Use Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);
```

---

## Authentication & Authorization

### JWT Authentication

```ts
const generateToken = (user: User): string => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};
```

### Authorization Middleware

```ts
const requirePermission = (permission: string) => {
  return (req, res, next) => {
    const userPermissions = permissions[req.user.role] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
```

### Password Security

- Hash with bcrypt (12+ rounds)
- Enforce minimum requirements
- Rate limit login attempts

### Security Best Practices

- Short-lived access tokens + refresh tokens
- HTTP-only, Secure, SameSite cookies
- CSRF tokens for session-based auth
- Never log credentials

---

## Error Handling

### Custom Error Classes

```ts
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: ValidationDetail[]) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id ${id} not found`);
  }
}
```

### Global Error Handler

```ts
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack, requestId: req.id });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
};
```

### Result Types

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const findUser = async (id: string): Promise<Result<User, NotFoundError>> => {
  const user = await db.user.findUnique({ where: { id } });
  return user ? { ok: true, value: user } : { ok: false, error: new NotFoundError('User', id) };
};
```

---

## Security

### Input Validation

```ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin']).default('user'),
});

const result = CreateUserSchema.safeParse(req.body);
if (!result.success) {
  return res.status(422).json({ error: { details: result.error.errors } });
}
```

### Injection Prevention

```ts
// SQL: Always use parameterized queries
const users = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Command: Use execFile with array arguments
execFile('convert', [inputPath, '-resize', '800x600', outputPath]);
```

### Rate Limiting

```ts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts' },
});

app.post('/login', authLimiter, loginHandler);
```

### Security Headers

```ts
app.use(helmet({
  contentSecurityPolicy: { ... },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

### Security Checklist

- [ ] All inputs validated
- [ ] Parameterized queries
- [ ] Rate limiting in place
- [ ] Auth required on protected routes
- [ ] Security headers configured
- [ ] Secrets not in code or logs
- [ ] HTTPS enforced
- [ ] Dependencies audited

---

## Testing

### Unit Tests

```ts
describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, { type: 'percentage', value: 10 })).toBe(90);
  });
});
```

### Integration Tests

```ts
describe('userRepository', () => {
  beforeEach(async () => await db.user.deleteMany());

  it('creates a user', async () => {
    const user = await userRepository.create({ email: 'test@example.com', name: 'Test' });
    expect(user.id).toBeDefined();
  });
});
```

### API Tests

```ts
describe('POST /users', () => {
  it('creates a new user', async () => {
    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'new@test.com', name: 'New User' });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('new@test.com');
  });

  it('validates email format', async () => {
    const response = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ email: 'invalid', name: 'Test' });

    expect(response.status).toBe(422);
  });
});
```

---

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
- [ ] Code reviewed and approved
