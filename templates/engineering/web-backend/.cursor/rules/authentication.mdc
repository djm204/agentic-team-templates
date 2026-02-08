---
description: Authentication & Authorization
alwaysApply: false
---

# Authentication & Authorization

Best practices for securing backend APIs.

- **Authentication**: Who are you? (identity verification)
- **Authorization**: What can you do? (permission checking)

## Authentication Strategies

| Strategy | When to Use |
|----------|------------|
| JWT | Stateless APIs, microservices, mobile backends |
| Session-based | Traditional web apps, server-side session control |
| OAuth 2.0 | Third-party login (Google, GitHub), delegated auth |

## JWT Best Practices

- Short-lived access tokens (15min) + refresh tokens (7 days)
- Include `sub`, `email`, `role`, `iat`, `exp` claims
- Verify signature and expiration on every request
- Store access tokens in memory; refresh tokens in HTTP-only cookies

## Refresh Token Flow

- Generate access + refresh token pair on login
- Client sends expired access token -> server issues new pair via refresh
- Check revocation list before issuing new tokens
- Rotate refresh tokens on each use

## Authorization Patterns

**RBAC** (Role-Based): Map roles to permission arrays, check in middleware.

```ts
const requirePermission = (perm: string) => (req, res, next) => {
  if (!permissions[req.user.role]?.includes(perm))
    return res.status(403).json({ error: 'Forbidden' });
  next();
};
```

**Resource-Based**: Check ownership — user owns resource or is admin.

## Password Security

- Hash with bcrypt (12+ rounds) or argon2
- Enforce minimum length (8+), uppercase, lowercase, number
- Rate limit login attempts (5 per 15min per IP)

## Security Essentials

- HTTP-only, Secure, SameSite=Strict cookies
- CSRF tokens for session-based auth
- Verify OAuth `state` parameter to prevent CSRF
- Never log credentials or tokens
- Generic error messages: "Invalid credentials" (don't confirm usernames)

## Anti-Patterns

**Plain text passwords**: Always hash with bcrypt/argon2.

**Long-lived access tokens**: Use short-lived access (15min) + refresh tokens.

**Leaking user info in errors**: `"User admin@example.com not found"` confirms the username exists.
