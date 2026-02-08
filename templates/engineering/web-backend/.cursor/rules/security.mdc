---
description: Backend Security
alwaysApply: false
---

# Backend Security

Security best practices specific to backend API development.

## Input Validation

- Validate all external input at the boundary with strict schemas (Zod, Joi)
- Reject invalid input with 422 and structured error details
- Sanitize HTML content before storage (DOMPurify)
- Strip sensitive fields (passwordHash, tokens) before returning responses

## Injection Prevention

```ts
// SQL: Always parameterized
await db.query('SELECT * FROM users WHERE email = $1', [email]);
// Command: Use execFile with array args
execFile('convert', [inputPath, '-resize', '800x600', outputPath]);
// NoSQL: Validate input types to prevent $gt/$ne injection
```

Never use string interpolation for queries or shell commands.

## Rate Limiting

- General API: 100 req/min per IP
- Auth endpoints: 5 attempts per 15min, skip successful requests
- Per-user limits for expensive operations via Redis counters

## Security Headers

- Use helmet for CSP, HSTS, referrer policy
- Configure CORS with explicit allowed origins, credentials, methods
- Limit request body size (`express.json({ limit: '1mb' })`)
- Reject unexpected Content-Types with 415

## Secrets Management

- Validate env vars at startup with schema (Zod)
- Never log secrets — log host only, not full connection strings
- Support secret rotation: accept both old and new secrets during transition

## Audit Logging

Log security events: login attempts (success/failure), permission changes, resource access. Include userId, IP, userAgent, action, timestamp.

## Security Checklist

- [ ] All inputs validated with strict schemas
- [ ] Parameterized queries everywhere
- [ ] Rate limiting on all endpoints
- [ ] Auth + authorization on protected routes
- [ ] Security headers configured (HSTS, CSP, CORS)
- [ ] Secrets not in code or logs
- [ ] Error messages don't leak internals
