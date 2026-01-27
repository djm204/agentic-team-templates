# Error Handling

Best practices for handling errors in backend applications.

## Principles

### 1. Fail Fast
Detect errors early and fail immediately with clear diagnostics.

### 2. Fail Gracefully
Users should receive helpful messages, not stack traces.

### 3. Log Everything
Errors need context for debugging. Log appropriately.

### 4. Recover When Possible
Some errors are transient. Implement retry logic where appropriate.

## Error Types

### Custom Error Classes

```ts
// Base application error
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message: string, details?: ValidationDetail[]) {
    super(422, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, 'NOT_FOUND', `${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}
```

## Result Types

Use Result types for explicit error handling:

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Usage
const findUser = async (id: string): Promise<Result<User, NotFoundError>> => {
  const user = await db.user.findUnique({ where: { id } });

  if (!user) {
    return err(new NotFoundError('User', id));
  }

  return ok(user);
};

// Handling
const result = await findUser(id);
if (!result.ok) {
  return res.status(result.error.statusCode).json({
    error: { code: result.error.code, message: result.error.message }
  });
}
const user = result.value;
```

## Global Error Handler

```ts
// Centralized error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  logger.error({
    error: err.message,
    stack: err.stack,
    requestId: req.id,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });

  // Handle known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle validation errors (e.g., from Zod)
  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors,
      },
    });
  }

  // Handle unknown errors (don't leak details)
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.id,  // For support reference
    },
  });
};

// Register at end of middleware chain
app.use(errorHandler);
```

## Async Error Handling

### Wrap Async Handlers

```ts
// Utility to catch async errors
const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Usage
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ data: user });
}));
```

### Or Use Try-Catch

```ts
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});
```

## Error Responses

### Consistent Format

```ts
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable code
    message: string;        // Human-readable message
    details?: unknown;      // Additional context
    requestId?: string;     // For support/debugging
  };
}

// Examples
// 400 Bad Request
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid JSON in request body"
  }
}

// 422 Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "age", "message": "Must be a positive number" }
    ]
  }
}

// 500 Internal Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_abc123"
  }
}
```

## Retry Logic

For transient failures:

```ts
const retry = async <T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delay: number; backoff?: number }
): Promise<T> => {
  const { maxAttempts, delay, backoff = 2 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await sleep(waitTime);
    }
  }

  throw new Error('Retry failed');  // Unreachable but TypeScript needs it
};

// Usage
const result = await retry(
  () => externalApi.call(),
  { maxAttempts: 3, delay: 1000 }
);
```

## Logging Best Practices

### What to Log

```ts
// Log errors with context
logger.error({
  message: 'Failed to process payment',
  error: error.message,
  stack: error.stack,
  paymentId: payment.id,
  userId: user.id,
  amount: payment.amount,
  // Never log: card numbers, passwords, tokens
});

// Log important events
logger.info({
  message: 'Payment processed',
  paymentId: payment.id,
  userId: user.id,
});

// Log warnings for concerning but non-critical issues
logger.warn({
  message: 'Rate limit approaching',
  userId: user.id,
  remaining: 5,
});
```

### What NOT to Log

- Passwords and credentials
- API keys and tokens
- Credit card numbers
- Personal identification numbers
- Full request/response bodies with sensitive data

## Anti-Patterns

### Swallowing Errors

```ts
// Bad: Silent failure
try {
  await riskyOperation();
} catch (e) {
  // Nothing happens
}

// Good: Handle or rethrow
try {
  await riskyOperation();
} catch (e) {
  logger.error('Risky operation failed', e);
  throw new AppError(500, 'OPERATION_FAILED', 'Could not complete operation');
}
```

### Leaking Implementation Details

```ts
// Bad: Exposes internals
res.status(500).json({ error: error.stack });

// Good: Generic message
res.status(500).json({
  error: { code: 'INTERNAL_ERROR', message: 'An error occurred' }
});
```

### Catching Too Broadly

```ts
// Bad: Catches everything including programming errors
try {
  const data = processInput(input);
  await saveToDb(data);
  sendNotification(data);
} catch (e) {
  res.status(400).json({ error: 'Bad request' });
}

// Good: Catch specific errors
try {
  const data = processInput(input);
  await saveToDb(data);
  sendNotification(data);
} catch (e) {
  if (e instanceof ValidationError) {
    res.status(422).json({ error: e.message });
  } else if (e instanceof DatabaseError) {
    logger.error('Database error', e);
    res.status(500).json({ error: 'Database error' });
  } else {
    throw e;  // Let unknown errors bubble up
  }
}
```
