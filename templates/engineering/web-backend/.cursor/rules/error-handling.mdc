---
description: Error Handling
alwaysApply: false
---

# Error Handling

Best practices for handling errors in backend applications.

## Principles

- **Fail fast**: Detect errors early with clear diagnostics
- **Fail gracefully**: Users get helpful messages, not stack traces
- **Log with context**: Errors need requestId, userId, path for debugging
- **Recover when possible**: Retry transient failures with exponential backoff

## Custom Error Classes

```ts
class AppError extends Error {
  constructor(public statusCode: number, public code: string,
    message: string, public details?: unknown) { super(message); }
}
class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} ${id} not found`); }
}
```

Extend for ValidationError (422), UnauthorizedError (401), ForbiddenError (403), ConflictError (409).

## Result Types

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

Use for explicit error handling without exceptions in service layers.

## Global Error Handler

- Log error with context (message, stack, requestId, method, path, userId)
- Return structured `{error: {code, message, details?}}` for AppError subclasses
- Return generic 500 for unknown errors — never leak stack traces

## Async Error Handling

Wrap async handlers to forward rejections to error middleware:

```ts
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## Logging Rules

- **Log**: Error message, stack, requestId, userId, resource context
- **Never log**: Passwords, API keys, tokens, credit cards, PII

## Anti-Patterns

**Swallowing errors**: Empty `catch` blocks. Always log or rethrow.

**Leaking internals**: Returning `error.stack` to client. Use generic messages + requestId.

**Catching too broadly**: One catch for validation + DB + unknown errors. Catch specific types; let unknown errors bubble up.
