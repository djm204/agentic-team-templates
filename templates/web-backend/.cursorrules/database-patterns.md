# Database Patterns

Best practices for working with databases in backend applications.

## General Principles

### 1. Use a Data Access Layer

Separate database operations from business logic.

```ts
// repository/userRepository.ts
export const userRepository = {
  async findById(id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  },

  async create(data: CreateUserInput): Promise<User> {
    return db.user.create({ data });
  },

  async update(id: string, data: UpdateUserInput): Promise<User> {
    return db.user.update({ where: { id }, data });
  },
};

// services/userService.ts
export const createUser = async (input: CreateUserInput) => {
  // Business logic here
  const validated = validateUserInput(input);
  return userRepository.create(validated);
};
```

### 2. Use Transactions for Related Operations

```ts
// Good: Atomic operation
await db.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId: order.productId },
    data: { quantity: { decrement: order.quantity } },
  });
  await tx.payment.create({ data: { orderId: order.id, ...paymentData } });
});

// Bad: Non-atomic, can leave inconsistent state
const order = await db.order.create({ data: orderData });
await db.inventory.update({ ... });  // What if this fails?
await db.payment.create({ ... });
```

### 3. Handle Connection Errors

```ts
const connectWithRetry = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await db.$connect();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);  // Exponential backoff
    }
  }
};
```

## Query Optimization

### Select Only Needed Fields

```ts
// Good: Select specific fields
const users = await db.user.findMany({
  select: { id: true, name: true, email: true },
});

// Bad: Select everything when you don't need it
const users = await db.user.findMany();  // Returns all fields including large blobs
```

### Use Pagination

```ts
// Offset-based (simple, but slow for large offsets)
const users = await db.user.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' },
});

// Cursor-based (better for large datasets)
const users = await db.user.findMany({
  take: limit,
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { id: 'asc' },
});
```

### Avoid N+1 Queries

```ts
// Bad: N+1 queries
const posts = await db.post.findMany();
for (const post of posts) {
  post.author = await db.user.findUnique({ where: { id: post.authorId } });
}

// Good: Single query with include
const posts = await db.post.findMany({
  include: { author: true },
});

// Good: Batch query
const posts = await db.post.findMany();
const authorIds = [...new Set(posts.map(p => p.authorId))];
const authors = await db.user.findMany({ where: { id: { in: authorIds } } });
const authorMap = new Map(authors.map(a => [a.id, a]));
posts.forEach(p => p.author = authorMap.get(p.authorId));
```

### Use Indexes

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- Composite index for common query patterns
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
```

## Migrations

### Version Control Migrations

```
migrations/
├── 001_create_users_table.sql
├── 002_add_email_index.sql
├── 003_create_posts_table.sql
└── 004_add_user_avatar.sql
```

### Write Reversible Migrations

```sql
-- migrations/003_create_posts_table.sql

-- Up
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Down
DROP TABLE posts;
```

### Test Migrations

- Test in staging before production
- Have a rollback plan
- Consider zero-downtime migrations for large tables

## Connection Pooling

### Configure Pool Size

```ts
// Match pool size to expected concurrency
const pool = new Pool({
  host: process.env.DB_HOST,
  max: 20,              // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Handle Pool Exhaustion

```ts
// Set appropriate timeouts
const result = await Promise.race([
  db.query(sql),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), 5000)
  ),
]);
```

## Data Integrity

### Use Constraints

```sql
-- Primary keys
PRIMARY KEY (id)

-- Foreign keys with appropriate actions
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

-- Unique constraints
UNIQUE (email)

-- Check constraints
CHECK (price >= 0)
CHECK (status IN ('pending', 'active', 'completed'))
```

### Use Appropriate Data Types

```sql
-- Good: Appropriate types
id UUID PRIMARY KEY
email VARCHAR(255) NOT NULL
price DECIMAL(10, 2)
created_at TIMESTAMP WITH TIME ZONE

-- Bad: Wrong types
id TEXT
price FLOAT  -- Precision issues
created_at VARCHAR(50)
```

## Soft Deletes (When Needed)

```ts
// Schema
model User {
  id        String    @id
  email     String    @unique
  deletedAt DateTime?
}

// Query active records
const activeUsers = await db.user.findMany({
  where: { deletedAt: null },
});

// Soft delete
await db.user.update({
  where: { id },
  data: { deletedAt: new Date() },
});
```

## Security

### Parameterized Queries

```ts
// Good: Parameterized
const user = await db.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// Bad: SQL injection vulnerability
const user = await db.query(
  `SELECT * FROM users WHERE id = '${userId}'`
);
```

### Encrypt Sensitive Data

```ts
// Encrypt at rest
const encrypted = encrypt(sensitiveData, encryptionKey);
await db.user.update({
  where: { id },
  data: { ssn: encrypted },
});

// Decrypt when needed
const user = await db.user.findUnique({ where: { id } });
const ssn = decrypt(user.ssn, encryptionKey);
```

### Audit Logging

```ts
// Track changes for sensitive operations
await db.auditLog.create({
  data: {
    action: 'USER_UPDATE',
    userId: currentUser.id,
    targetId: targetUser.id,
    changes: JSON.stringify(diff(before, after)),
    timestamp: new Date(),
  },
});
```
