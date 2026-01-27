# Backend Security

Security best practices specific to backend API development.

## Input Validation

### Validate at the Boundary

All external input must be validated before processing.

```ts
import { z } from 'zod';

// Define schema
const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().max(150).optional(),
  role: z.enum(['user', 'admin']).default('user'),
});

// Validate in route handler
app.post('/users', async (req, res, next) => {
  const result = CreateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: result.error.errors,
      },
    });
  }

  const user = await createUser(result.data);
  res.status(201).json({ data: user });
});
```

### Sanitize Output

```ts
// Sanitize HTML content before storage
import DOMPurify from 'isomorphic-dompurify';

const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href'],
  });
};

// Remove sensitive fields before returning
const sanitizeUser = (user: User): PublicUser => {
  const { passwordHash, resetToken, ...publicFields } = user;
  return publicFields;
};
```

## Injection Prevention

### SQL Injection

```ts
// ALWAYS use parameterized queries

// Good: Parameterized query
const users = await db.query(
  'SELECT * FROM users WHERE email = $1 AND status = $2',
  [email, status]
);

// Good: ORM with built-in protection
const users = await db.user.findMany({
  where: { email, status },
});

// Bad: String interpolation
const users = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`  // SQL INJECTION!
);
```

### Command Injection

```ts
import { execFile } from 'child_process';

// Good: Use execFile with array arguments
execFile('convert', [inputPath, '-resize', '800x600', outputPath]);

// Bad: String concatenation
exec(`convert ${inputPath} -resize 800x600 ${outputPath}`);  // INJECTION!
```

### NoSQL Injection

```ts
// Good: Validate input types
const findUser = async (query: unknown) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(query);
  return db.collection('users').findOne({ _id: id });
};

// Bad: Accepting arbitrary objects
const findUser = async (query: any) => {
  return db.collection('users').findOne(query);  // Can inject $gt, $ne, etc.
};
```

## Rate Limiting

### Endpoint-Level Rate Limiting

```ts
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 100,              // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  skipSuccessfulRequests: true,
});

// Apply to routes
app.use('/api', apiLimiter);
app.post('/auth/login', authLimiter, loginHandler);
app.post('/auth/reset-password', authLimiter, resetPasswordHandler);
```

### User-Level Rate Limiting

```ts
// Track per-user limits for expensive operations
const userLimiter = async (userId: string, action: string, limit: number) => {
  const key = `ratelimit:${userId}:${action}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 3600);  // 1 hour window
  }

  if (current > limit) {
    throw new RateLimitError(`Too many ${action} requests`);
  }
};
```

## Security Headers

```ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS configuration
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## Secrets Management

### Environment Variables

```ts
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_KEY: z.string().min(16),
});

// Validate at startup
const env = envSchema.parse(process.env);
export { env };
```

### Never Log Secrets

```ts
// Bad
logger.info('Config loaded', { dbUrl: process.env.DATABASE_URL });

// Good
logger.info('Config loaded', {
  database: process.env.DATABASE_URL?.split('@')[1],  // Host only
  environment: process.env.NODE_ENV,
});
```

### Rotate Secrets

Support secret rotation without downtime:

```ts
// Accept both old and new secrets during rotation
const verifyToken = (token: string): Payload => {
  const secrets = [process.env.JWT_SECRET, process.env.JWT_SECRET_OLD].filter(Boolean);

  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch {
      continue;
    }
  }

  throw new UnauthorizedError('Invalid token');
};
```

## Request Validation

### Validate Content-Type

```ts
app.use(express.json({
  type: ['application/json'],
  limit: '1mb',
}));

// Reject unexpected content types
app.use((req, res, next) => {
  if (req.method !== 'GET' && !req.is('application/json')) {
    return res.status(415).json({
      error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Expected application/json' },
    });
  }
  next();
});
```

### Limit Request Size

```ts
app.use(express.json({ limit: '1mb' }));

// Per-route limits for file uploads
app.post('/upload', express.raw({ limit: '10mb' }), uploadHandler);
```

## Logging for Security

### Audit Logging

```ts
// Log security-relevant events
const auditLog = async (event: AuditEvent) => {
  await db.auditLog.create({
    data: {
      action: event.action,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      resource: event.resource,
      resourceId: event.resourceId,
      timestamp: new Date(),
      metadata: event.metadata,
    },
  });
};

// Usage
await auditLog({
  action: 'USER_LOGIN',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

await auditLog({
  action: 'PERMISSION_CHANGED',
  userId: admin.id,
  ip: req.ip,
  resource: 'user',
  resourceId: targetUser.id,
  metadata: { oldRole: 'user', newRole: 'admin' },
});
```

### Security Monitoring

Log patterns that might indicate attacks:

```ts
// Track failed login attempts
if (loginFailed) {
  logger.warn({
    event: 'LOGIN_FAILED',
    email,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

// Track suspicious patterns
if (validationErrors.length > 10) {
  logger.warn({
    event: 'SUSPICIOUS_INPUT',
    ip: req.ip,
    path: req.path,
    errorCount: validationErrors.length,
  });
}
```

## Security Checklist

Before deployment:

- [ ] All inputs validated with strict schemas
- [ ] Parameterized queries for all database operations
- [ ] Rate limiting on all endpoints
- [ ] Authentication required on protected routes
- [ ] Authorization checked for resource access
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] CORS properly configured
- [ ] Secrets not in code or logs
- [ ] HTTPS enforced
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging for security events
- [ ] Dependencies audited for vulnerabilities
