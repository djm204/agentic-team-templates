# Backend Testing

Guidelines for testing backend applications effectively.

## Testing Pyramid

1. **Unit Tests** - Fast, isolated, test business logic
2. **Integration Tests** - Test components together, database interactions
3. **E2E/API Tests** - Test full request/response cycle

## Unit Tests

For pure business logic and utilities.

```ts
// services/pricing.test.ts
import { describe, it, expect } from 'vitest';
import { calculateDiscount, applyTax } from './pricing';

describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, { type: 'percentage', value: 10 })).toBe(90);
  });

  it('applies fixed discount', () => {
    expect(calculateDiscount(100, { type: 'fixed', value: 15 })).toBe(85);
  });

  it('does not go below zero', () => {
    expect(calculateDiscount(10, { type: 'fixed', value: 20 })).toBe(0);
  });

  it('handles zero price', () => {
    expect(calculateDiscount(0, { type: 'percentage', value: 50 })).toBe(0);
  });
});

describe('applyTax', () => {
  it('calculates tax correctly', () => {
    expect(applyTax(100, 0.08)).toBe(108);
  });

  it('rounds to two decimal places', () => {
    expect(applyTax(99.99, 0.0825)).toBe(108.24);
  });
});
```

## Integration Tests

Test with real database connections.

```ts
// repositories/userRepository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { userRepository } from './userRepository';

describe('userRepository', () => {
  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await db.user.deleteMany();
  });

  describe('create', () => {
    it('creates a user with valid data', async () => {
      const user = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('throws on duplicate email', async () => {
      await userRepository.create({ email: 'test@example.com', name: 'User 1' });

      await expect(
        userRepository.create({ email: 'test@example.com', name: 'User 2' })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const created = await userRepository.create({
        email: 'test@example.com',
        name: 'Test User',
      });

      const found = await userRepository.findById(created.id);

      expect(found).toEqual(created);
    });

    it('returns null when not found', async () => {
      const found = await userRepository.findById('nonexistent-id');

      expect(found).toBeNull();
    });
  });
});
```

## API Tests

Test the full HTTP request/response cycle.

```ts
// routes/users.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../lib/db';
import { generateToken } from '../lib/auth';

describe('Users API', () => {
  let authToken: string;

  beforeAll(async () => {
    await db.$connect();
    // Create test user and get token
    const user = await db.user.create({
      data: { email: 'admin@test.com', name: 'Admin', role: 'admin' },
    });
    authToken = generateToken(user);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    await db.user.deleteMany({ where: { email: { not: 'admin@test.com' } } });
  });

  describe('GET /users', () => {
    it('returns list of users', async () => {
      await db.user.create({ data: { email: 'user1@test.com', name: 'User 1' } });
      await db.user.create({ data: { email: 'user2@test.com', name: 'User 2' } });

      const response = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);  // 2 + admin
    });

    it('requires authentication', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
    });
  });

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
        .send({ email: 'invalid-email', name: 'Test' });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate email', async () => {
      await db.user.create({ data: { email: 'existing@test.com', name: 'Existing' } });

      const response = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'existing@test.com', name: 'Test' });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /users/:id', () => {
    it('updates user', async () => {
      const user = await db.user.create({
        data: { email: 'update@test.com', name: 'Original' },
      });

      const response = await request(app)
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated');
    });

    it('returns 404 for nonexistent user', async () => {
      const response = await request(app)
        .put('/users/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });
});
```

## Mocking

### Mock External Services

```ts
import { vi } from 'vitest';
import { sendEmail } from '../lib/email';
import { createUser } from './userService';

vi.mock('../lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('createUser', () => {
  it('sends welcome email after creation', async () => {
    await createUser({ email: 'test@example.com', name: 'Test' });

    expect(sendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      template: 'welcome',
      data: expect.objectContaining({ name: 'Test' }),
    });
  });
});
```

### Mock Database

```ts
// For unit testing services without database
import { vi } from 'vitest';
import { userRepository } from '../repositories/userRepository';
import { userService } from './userService';

vi.mock('../repositories/userRepository');

describe('userService', () => {
  it('returns user by email', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test' };
    vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);

    const result = await userService.findByEmail('test@example.com');

    expect(result).toEqual(mockUser);
    expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
  });
});
```

## Test Utilities

### Factories

```ts
// test/factories/user.ts
import { faker } from '@faker-js/faker';
import { db } from '../../lib/db';

export const createTestUser = async (overrides = {}) => {
  return db.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.person.fullName(),
      role: 'user',
      ...overrides,
    },
  });
};

// Usage in tests
const user = await createTestUser({ role: 'admin' });
```

### Test Database Setup

```ts
// test/setup.ts
import { db } from '../lib/db';

beforeAll(async () => {
  // Use test database
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  await db.$connect();
});

afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  // Clean all tables
  const tables = await db.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  `;
  for (const { tablename } of tables) {
    await db.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE`);
  }
});
```

## Best Practices

### Test Behavior, Not Implementation

```ts
// Bad: Testing implementation
it('calls repository.save', async () => {
  await userService.create(userData);
  expect(userRepository.save).toHaveBeenCalled();
});

// Good: Testing behavior
it('creates user with correct data', async () => {
  const user = await userService.create(userData);

  const saved = await db.user.findUnique({ where: { id: user.id } });
  expect(saved.email).toBe(userData.email);
});
```

### One Assertion Per Concept

```ts
// Good: Focused tests
it('returns 401 when not authenticated', async () => {
  const response = await request(app).get('/protected');
  expect(response.status).toBe(401);
});

it('returns 403 when not authorized', async () => {
  const response = await request(app)
    .get('/admin')
    .set('Authorization', `Bearer ${userToken}`);
  expect(response.status).toBe(403);
});
```

### Use Descriptive Test Names

```ts
// Good: Clear what's being tested
describe('POST /orders', () => {
  it('creates order when cart is valid', () => {});
  it('returns 400 when cart is empty', () => {});
  it('returns 409 when item is out of stock', () => {});
  it('decrements inventory after successful order', () => {});
});
```

## Test Organization

```
src/
├── services/
│   ├── userService.ts
│   └── userService.test.ts      # Co-located unit tests
├── repositories/
│   ├── userRepository.ts
│   └── userRepository.test.ts   # Integration tests
└── routes/
    ├── users.ts
    └── users.test.ts            # API tests

test/
├── setup.ts                     # Global test setup
├── factories/                   # Test data factories
└── fixtures/                    # Static test data
```
