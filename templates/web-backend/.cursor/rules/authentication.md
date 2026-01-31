# Authentication & Authorization

Best practices for securing backend APIs.

## Authentication vs Authorization

- **Authentication**: Who are you? (Identity verification)
- **Authorization**: What can you do? (Permission checking)

## Authentication Strategies

### JWT (JSON Web Tokens)

**When to use**: Stateless APIs, microservices, mobile backends

```ts
// Generate token
const generateToken = (user: User): string => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }  // Short-lived access tokens
  );
};

// Verify token
const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};
```

**Token structure:**
```ts
// Header
{ "alg": "HS256", "typ": "JWT" }

// Payload (claims)
{
  "sub": "user_123",        // Subject (user ID)
  "email": "user@example.com",
  "role": "admin",
  "iat": 1640000000,        // Issued at
  "exp": 1640000900         // Expires at
}
```

### Session-Based

**When to use**: Traditional web apps, when you need server-side session control

```ts
// Create session
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.id;
  req.session.role = user.role;
  res.json({ success: true });
});

// Session middleware
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};
```

### OAuth 2.0

**When to use**: Third-party login (Google, GitHub), delegated authorization

```ts
// OAuth callback handler
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Verify state to prevent CSRF
  if (state !== req.session.oauthState) {
    return res.status(403).json({ error: 'Invalid state' });
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // Get user info
  const userInfo = await getUserInfo(tokens.access_token);

  // Create or update user
  const user = await upsertUser(userInfo);

  // Create session/JWT
  const jwt = generateToken(user);
  res.json({ token: jwt });
});
```

## Refresh Tokens

Use refresh tokens for long-lived sessions:

```ts
// Generate token pair
const generateTokens = (user: User) => {
  const accessToken = jwt.sign(
    { sub: user.id, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Refresh endpoint
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const payload = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Optional: Check if refresh token is revoked
    if (await isTokenRevoked(refreshToken)) {
      throw new Error('Token revoked');
    }

    const user = await getUser(payload.sub);
    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

## Authorization

### Role-Based Access Control (RBAC)

```ts
// Define roles and permissions
const permissions = {
  admin: ['users:read', 'users:write', 'posts:read', 'posts:write', 'posts:delete'],
  editor: ['posts:read', 'posts:write'],
  viewer: ['posts:read'],
};

// Authorization middleware
const requirePermission = (permission: string) => {
  return (req, res, next) => {
    const userPermissions = permissions[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// Usage
app.delete('/posts/:id', requirePermission('posts:delete'), deletePost);
```

### Resource-Based Authorization

```ts
// Check ownership
const requireOwnership = (resourceType: string) => {
  return async (req, res, next) => {
    const resource = await getResource(resourceType, req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (resource.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    req.resource = resource;
    next();
  };
};

// Usage
app.put('/posts/:id', requireOwnership('post'), updatePost);
```

## Password Security

### Hashing

```ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash password
const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

// Verify password
const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### Password Requirements

```ts
const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }

  return { valid: errors.length === 0, errors };
};
```

## Security Best Practices

### Rate Limiting

```ts
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  message: { error: 'Too many login attempts. Please try again later.' },
});

app.post('/login', authLimiter, loginHandler);
```

### Secure Cookie Settings

```ts
res.cookie('session', sessionId, {
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
});
```

### Token Storage

**Access tokens**: Memory or short-lived secure cookie
**Refresh tokens**: HTTP-only secure cookie or secure storage

### Never Log Sensitive Data

```ts
// Bad
logger.info(`Login attempt: ${email}, password: ${password}`);

// Good
logger.info(`Login attempt: ${email}`);
```

## Common Anti-Patterns

### Storing Plain Text Passwords

❌ Never store passwords in plain text
✅ Always hash with bcrypt or argon2

### Long-Lived Access Tokens

❌ Access tokens valid for days/months
✅ Short-lived access tokens (15-60 min) + refresh tokens

### Exposing Internal Errors

❌ `res.status(401).json({ error: 'User admin@example.com not found' })`
✅ `res.status(401).json({ error: 'Invalid credentials' })`

### Missing CSRF Protection

❌ State-changing requests without CSRF tokens
✅ CSRF tokens for all non-GET requests in session-based auth
