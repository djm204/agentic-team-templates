---
description: Database Patterns
alwaysApply: false
---

# Database Patterns

Best practices for working with databases in backend applications.

## Core Principles

- Separate database operations from business logic (repository pattern)
- Use transactions for related operations to maintain consistency
- Handle connection errors with retry and exponential backoff

## Query Optimization

- **Select only needed fields**: Avoid `SELECT *` in production queries
- **Use pagination**: Offset-based for simple cases, cursor-based for large datasets
- **Avoid N+1**: Use joins/includes or batch queries with `WHERE id IN (...)`
- **Index frequently queried columns**: Composite indexes for common query patterns

```ts
// Bad: N+1
for (const post of posts) {
  post.author = await db.user.findUnique({ where: { id: post.authorId } });
}
// Good: Single query
const posts = await db.post.findMany({ include: { author: true } });
```

## Migrations

- Version-control all migrations sequentially
- Write reversible migrations (up + down)
- Test in staging before production
- Consider zero-downtime migrations for large tables

## Connection Pooling

- Match pool size to expected concurrency
- Set idle and connection timeouts
- Handle pool exhaustion with query timeouts

## Data Integrity

```sql
-- Use constraints
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
UNIQUE (email)
CHECK (price >= 0)

-- Use appropriate types
id UUID, email VARCHAR(255), price DECIMAL(10,2), created_at TIMESTAMPTZ
```

## Soft Deletes

When needed, add `deletedAt` column and filter with `WHERE deletedAt IS NULL`. Be consistent across queries.

## Security

- **Always parameterized queries**: Never interpolate user input into SQL
- **Encrypt sensitive data at rest**: SSN, tokens, PII
- **Audit logging**: Track changes for sensitive operations with userId, action, timestamp

```ts
// Good
await db.query('SELECT * FROM users WHERE id = $1', [userId]);
// Bad: SQL injection
await db.query(`SELECT * FROM users WHERE id = '${userId}'`);
```
