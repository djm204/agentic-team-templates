# Fullstack Testing

Testing strategies for full-stack applications.

## Testing Layers

```
┌─────────────────────────────────────────────────────┐
│                    E2E Tests                        │
│         (Full user journeys, critical paths)        │
├─────────────────────────────────────────────────────┤
│              Integration Tests                      │
│     (API tests, component + API, DB tests)          │
├─────────────────────────────────────────────────────┤
│                 Unit Tests                          │
│  (Pure functions, isolated components, services)    │
└─────────────────────────────────────────────────────┘
```

## End-to-End Tests

Test complete user flows across the full stack.

### Critical Path Testing

```ts
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up and access dashboard', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'Test User');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('user can log in with existing account', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'existing@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
```

### Data Flow Testing

```ts
// e2e/crud.spec.ts
test.describe('Post Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAs(page, 'testuser@example.com');
  });

  test('user can create, edit, and delete a post', async ({ page }) => {
    // Create
    await page.goto('/posts/new');
    await page.fill('[name="title"]', 'Test Post');
    await page.fill('[name="content"]', 'Test content');
    await page.click('button[type="submit"]');

    // Verify creation
    await expect(page).toHaveURL(/\/posts\/[\w-]+/);
    await expect(page.locator('h1')).toHaveText('Test Post');

    // Edit
    await page.click('text=Edit');
    await page.fill('[name="title"]', 'Updated Post');
    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toHaveText('Updated Post');

    // Delete
    await page.click('text=Delete');
    await page.click('text=Confirm');

    await expect(page).toHaveURL('/posts');
    await expect(page.locator('text=Updated Post')).not.toBeVisible();
  });
});
```

### API Integration in E2E

```ts
// e2e/helpers.ts
import { test as base } from '@playwright/test';

// Extend test with API context
export const test = base.extend<{ api: APIRequestContext }>({
  api: async ({ playwright }, use) => {
    const api = await playwright.request.newContext({
      baseURL: process.env.API_URL,
    });
    await use(api);
  },
});

// Use in tests
test('displays data from API', async ({ page, api }) => {
  // Seed data via API
  await api.post('/api/posts', {
    data: { title: 'Seeded Post', content: 'Content' },
  });

  // Verify in UI
  await page.goto('/posts');
  await expect(page.locator('text=Seeded Post')).toBeVisible();
});
```

## Integration Tests

### Full Stack Integration

```ts
// tests/integration/users.test.ts
import { createTestApp } from '../helpers/app';
import { createTestDb, cleanDb } from '../helpers/db';

describe('User Management Integration', () => {
  let app: Express;
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDb();
    app = createTestApp(db);
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await cleanDb(db);
  });

  it('creates user and returns in list', async () => {
    // Create via API
    const createRes = await request(app)
      .post('/api/users')
      .send({ email: 'new@example.com', name: 'New User' });

    expect(createRes.status).toBe(201);

    // Verify via API
    const listRes = await request(app).get('/api/users');
    expect(listRes.body.data).toContainEqual(
      expect.objectContaining({ email: 'new@example.com' })
    );

    // Verify in database
    const dbUser = await db.user.findUnique({
      where: { email: 'new@example.com' },
    });
    expect(dbUser).not.toBeNull();
  });
});
```

### Component + API Integration

```tsx
// tests/integration/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { UserProfile } from '@/components/UserProfile';

const server = setupServer(
  rest.get('/api/users/:id', (req, res, ctx) => {
    return res(ctx.json({
      data: { id: req.params.id, name: 'John Doe', email: 'john@example.com' },
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserProfile', () => {
  it('fetches and displays user data', async () => {
    render(<UserProfile userId="123" />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Data loaded
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    server.use(
      rest.get('/api/users/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## Contract Testing

Verify frontend and backend agree on API shape.

```ts
// tests/contract/user.contract.test.ts
import { CreateUserSchema, UserResponseSchema } from '@myapp/shared';

describe('User API Contract', () => {
  it('POST /users accepts valid CreateUserInput', async () => {
    const input = {
      email: 'test@example.com',
      name: 'Test User',
    };

    // Validate against shared schema
    const parseResult = CreateUserSchema.safeParse(input);
    expect(parseResult.success).toBe(true);

    // Send to actual API
    const response = await request(app)
      .post('/api/users')
      .send(input);

    expect(response.status).toBe(201);
  });

  it('GET /users returns valid UserResponse[]', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(200);

    // Validate response against shared schema
    for (const user of response.body.data) {
      const parseResult = UserResponseSchema.safeParse(user);
      expect(parseResult.success).toBe(true);
    }
  });
});
```

## Test Data Management

### Factories

```ts
// tests/factories/user.ts
import { faker } from '@faker-js/faker';
import { CreateUserInput, User } from '@myapp/shared';

export const createUserInput = (overrides?: Partial<CreateUserInput>): CreateUserInput => ({
  email: faker.internet.email(),
  name: faker.person.fullName(),
  ...overrides,
});

export const createUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

### Database Seeding

```ts
// tests/helpers/seed.ts
export const seedDatabase = async (db: Database) => {
  const adminUser = await db.user.create({
    data: createUserInput({ email: 'admin@test.com', role: 'admin' }),
  });

  const regularUser = await db.user.create({
    data: createUserInput({ email: 'user@test.com' }),
  });

  const posts = await Promise.all([
    db.post.create({ data: { title: 'Post 1', authorId: regularUser.id } }),
    db.post.create({ data: { title: 'Post 2', authorId: regularUser.id } }),
  ]);

  return { adminUser, regularUser, posts };
};
```

## Test Organization

```
project/
├── packages/
│   ├── web/
│   │   └── __tests__/          # Frontend unit/integration tests
│   └── api/
│       └── __tests__/          # Backend unit/integration tests
├── tests/
│   ├── e2e/                    # End-to-end tests
│   │   ├── auth.spec.ts
│   │   └── crud.spec.ts
│   ├── integration/            # Cross-package integration tests
│   │   └── users.test.ts
│   ├── contract/               # API contract tests
│   │   └── user.contract.test.ts
│   ├── factories/              # Test data factories
│   └── helpers/                # Test utilities
└── playwright.config.ts
```

## Best Practices

### 1. Test at the Right Level

- **Unit tests**: Pure functions, isolated logic
- **Integration tests**: Components with API, database operations
- **E2E tests**: Critical user journeys only

### 2. Keep E2E Tests Fast

```ts
// Use API to set up state instead of UI
test.beforeEach(async ({ api }) => {
  await api.post('/api/test/seed', { scenario: 'userWithPosts' });
});
```

### 3. Test Error Scenarios

```ts
test('shows error when API fails', async ({ page }) => {
  // Mock API failure
  await page.route('/api/users', (route) =>
    route.fulfill({ status: 500 })
  );

  await page.goto('/users');
  await expect(page.locator('text=Failed to load')).toBeVisible();
});
```

### 4. Use Realistic Data

```ts
// Use faker for realistic test data
const user = {
  email: faker.internet.email(),
  name: faker.person.fullName(),
};
```
