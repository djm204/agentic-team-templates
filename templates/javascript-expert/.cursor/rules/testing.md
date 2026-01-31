# JavaScript Testing

Expert-level testing patterns across all JavaScript environments.

## Testing Philosophy

- Tests are production code — same quality standards apply
- Test behavior and contracts, never implementation details
- Every bug fix starts with a failing test that reproduces the bug
- If it's hard to test, the design is wrong — refactor the code, not the test

## Test Structure

### Arrange-Act-Assert

```typescript
describe('UserService', () => {
  it('creates a user with hashed password', async () => {
    // Arrange
    const input = { email: 'test@example.com', password: 'secret123' };
    const repo = createMockRepo();

    // Act
    const user = await createUser(repo, input);

    // Assert
    expect(user.email).toBe('test@example.com');
    expect(user.passwordHash).not.toBe('secret123');
    expect(await verify(user.passwordHash, 'secret123')).toBe(true);
  });
});
```

### Descriptive Test Names

```typescript
// Tests should read like specifications
describe('parseDate', () => {
  it('parses ISO 8601 strings into Date objects', () => { ... });
  it('returns null for invalid date strings', () => { ... });
  it('handles timezone offsets correctly', () => { ... });
  it('treats dates without timezone as UTC', () => { ... });
});

// Not:
it('works', () => { ... });
it('test 1', () => { ... });
it('should work correctly', () => { ... });
```

## Unit Testing

### Pure Functions

```typescript
import { describe, it, expect } from 'vitest';

// Exhaustive edge case coverage
describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('returns max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles min equal to max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it('handles negative ranges', () => {
    expect(clamp(0, -10, -5)).toBe(-5);
  });
});
```

### Parameterized Tests

```typescript
// Use it.each for data-driven tests
describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  spaces  ', 'spaces'],
    ['Special!@#Characters', 'specialcharacters'],
    ['already-slugified', 'already-slugified'],
    ['MiXeD CaSe', 'mixed-case'],
    ['', ''],
  ])('converts "%s" to "%s"', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
```

### Testing Async Code

```typescript
describe('fetchUser', () => {
  it('returns user data for valid ID', async () => {
    const user = await fetchUser('123');
    expect(user).toEqual({ id: '123', name: 'John' });
  });

  it('returns error result for missing user', async () => {
    const result = await fetchUser('nonexistent');
    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('respects AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      fetchUser('123', { signal: controller.signal })
    ).rejects.toThrow('aborted');
  });
});
```

## Integration Testing

### API Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApp } from '../app.js';

describe('POST /api/users', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = createApp({ db: createTestDb() });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates user and returns 201', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'new@example.com', name: 'New User' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      email: 'new@example.com',
      name: 'New User',
    });
  });

  it('returns 400 for invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'not-an-email', name: 'Bad' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('returns 409 for duplicate email', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'dupe@example.com', name: 'First' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { email: 'dupe@example.com', name: 'Second' },
    });

    expect(response.statusCode).toBe(409);
  });
});
```

### Database Testing

```typescript
// Use transactions for test isolation
describe('UserRepository', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
    await db.beginTransaction();
  });

  afterEach(async () => {
    await db.rollbackTransaction();
    await db.close();
  });

  it('finds user by email', async () => {
    await db.seed({ users: [{ email: 'test@example.com' }] });
    const repo = new UserRepository(db);

    const user = await repo.findByEmail('test@example.com');

    expect(user).not.toBeNull();
    expect(user!.email).toBe('test@example.com');
  });
});
```

## React Component Testing

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';

describe('TodoList', () => {
  it('adds a new todo when form is submitted', async () => {
    const user = userEvent.setup();
    render(<TodoList />);

    await user.type(screen.getByRole('textbox', { name: /new todo/i }), 'Buy milk');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('marks todo as complete when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoList initialTodos={[{ id: '1', text: 'Test', done: false }]} />);

    await user.click(screen.getByRole('checkbox', { name: /test/i }));

    expect(screen.getByRole('checkbox', { name: /test/i })).toBeChecked();
  });

  it('filters completed todos', async () => {
    const user = userEvent.setup();
    render(
      <TodoList initialTodos={[
        { id: '1', text: 'Done', done: true },
        { id: '2', text: 'Not done', done: false },
      ]} />
    );

    await user.click(screen.getByRole('button', { name: /active/i }));

    expect(screen.queryByText('Done')).not.toBeInTheDocument();
    expect(screen.getByText('Not done')).toBeInTheDocument();
  });
});
```

## Mocking

### Strategic Mocking

```typescript
// Mock at boundaries, not internals
// Good: Mock the HTTP client, not internal functions
const mockFetch = vi.fn();

// Bad: Mocking private methods or internal state
// If you need to mock internals, the design needs work

// Use dependency injection for testability
interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}

// Production
const smtpSender: EmailSender = { send: async (...args) => { /* SMTP */ } };

// Test
const mockSender: EmailSender = { send: vi.fn() };

const service = new NotificationService(mockSender);
await service.notifyUser(user, 'Welcome');
expect(mockSender.send).toHaveBeenCalledWith(user.email, 'Welcome', expect.any(String));
```

### MSW for API Mocking

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test User' });
  }),
  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 201 });
  }),
];

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override for specific test
it('handles server errors', async () => {
  server.use(
    http.get('/api/users/:id', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  const result = await fetchUser('123');
  expect(result.ok).toBe(false);
});
```

## E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('login, perform action, logout', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome')).toBeVisible();

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');
  });
});

// Visual regression
test('homepage matches snapshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

## Test Anti-Patterns

```typescript
// Never: Testing implementation details
expect(component.instance().state.isLoading).toBe(true); // BAD

// Never: Snapshot testing for logic (only for visual regression)
expect(complexObject).toMatchSnapshot(); // BAD — fragile, meaningless diffs

// Never: Sleeping instead of waiting
await new Promise(r => setTimeout(r, 1000)); // BAD
await waitFor(() => expect(screen.getByText('loaded')).toBeVisible()); // GOOD

// Never: Tests that depend on execution order
// Each test must be independently runnable

// Never: Ignoring flaky tests
// A flaky test is a bug — either in the test or the code. Fix it.

// Never: Testing third-party library behavior
// Trust your dependencies. Test YOUR code's integration with them.
```

## Coverage

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
    },
  },
});

// Coverage is a metric, not a goal
// 100% coverage with bad tests is worse than 70% coverage with great tests
// Focus on testing behavior and edge cases, not hitting line counts
```
