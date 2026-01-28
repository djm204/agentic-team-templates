# Test Reliability

Guidelines for preventing flaky tests and ensuring deterministic test execution.

## What is a Flaky Test?

A flaky test passes and fails intermittently without code changes. Flaky tests:
- Erode confidence in the test suite
- Waste developer time investigating false failures
- Lead to ignored failures that hide real bugs
- Slow down CI/CD pipelines with retries

**Goal**: Zero flaky tests in CI.

## Common Causes and Solutions

### 1. Timing Dependencies

**Problem**: Tests depend on specific timing that varies between runs.

```ts
// Bad: Fixed sleep that may not be enough
await page.click('button');
await sleep(1000);
expect(await page.textContent('h1')).toBe('Success');

// Bad: Checking too quickly
const result = startBackgroundJob();
expect(result.status).toBe('complete'); // Not done yet!
```

**Solution**: Use explicit waits and polling.

```ts
// Good: Wait for condition
await page.click('button');
await expect(page.locator('h1')).toHaveText('Success', { timeout: 5000 });

// Good: Poll for completion
const result = await waitFor(
  async () => {
    const job = await getJob(jobId);
    return job.status === 'complete' ? job : null;
  },
  { timeout: 10000, interval: 100 }
);
expect(result.status).toBe('complete');
```

```ts
// Utility: Generic polling function
async function waitFor<T>(
  condition: () => Promise<T | null>,
  options: { timeout: number; interval: number }
): Promise<T> {
  const start = Date.now();
  
  while (Date.now() - start < options.timeout) {
    const result = await condition();
    if (result !== null) return result;
    await sleep(options.interval);
  }
  
  throw new Error(`Condition not met within ${options.timeout}ms`);
}
```

### 2. Shared State

**Problem**: Tests affect each other through shared resources.

```ts
// Bad: Shared counter
let testCounter = 0;

it('test 1', () => {
  testCounter++;
  expect(testCounter).toBe(1);
});

it('test 2', () => {
  expect(testCounter).toBe(0); // Fails!
});

// Bad: Shared database state
it('creates user', async () => {
  await db.user.create({ data: { email: 'test@example.com' } });
});

it('gets all users', async () => {
  const users = await db.user.findMany();
  expect(users).toHaveLength(0); // Fails - leftover from previous test
});
```

**Solution**: Isolate test state.

```ts
// Good: Fresh state per test
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter();
  });

  it('starts at zero', () => {
    expect(counter.value).toBe(0);
  });

  it('increments', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });
});

// Good: Clean database per test
beforeEach(async () => {
  await db.$transaction([
    db.user.deleteMany(),
    db.order.deleteMany(),
  ]);
});
```

### 3. Test Order Dependency

**Problem**: Tests must run in specific order to pass.

```ts
// Bad: Test 2 depends on test 1
let createdUserId: string;

it('creates user', async () => {
  const user = await createUser({ name: 'Test' });
  createdUserId = user.id;
});

it('updates user', async () => {
  await updateUser(createdUserId, { name: 'Updated' }); // Depends on previous test
});
```

**Solution**: Each test is self-contained.

```ts
// Good: Independent tests
it('creates user', async () => {
  const user = await createUser({ name: 'Test' });
  expect(user.id).toBeDefined();
});

it('updates user', async () => {
  const user = await createUser({ name: 'Test' });
  const updated = await updateUser(user.id, { name: 'Updated' });
  expect(updated.name).toBe('Updated');
});
```

```ts
// Config: Randomize test order to catch dependencies
// vitest.config.ts
export default {
  test: {
    sequence: {
      shuffle: true,
    },
  },
};
```

### 4. Time-Dependent Code

**Problem**: Tests depend on current time.

```ts
// Bad: Depends on wall clock
it('generates expiry date', () => {
  const token = createToken();
  expect(token.expiresAt).toBeInstanceOf(Date); // Different every run
});

// Bad: Time-based logic
it('shows expired message', () => {
  const subscription = createSubscription({ expiresAt: yesterday() });
  expect(subscription.isExpired).toBe(true); // Depends on "now"
});
```

**Solution**: Mock time.

```ts
// Good: Controlled time
import { vi } from 'vitest';

it('generates expiry date', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

  const token = createToken({ expiresIn: '1h' });
  
  expect(token.expiresAt).toEqual(new Date('2025-01-01T01:00:00Z'));
  
  vi.useRealTimers();
});

// Good: Time as parameter
it('shows expired message', () => {
  const now = new Date('2025-01-01');
  const subscription = createSubscription({ 
    expiresAt: new Date('2024-12-31') 
  });
  
  expect(subscription.isExpiredAt(now)).toBe(true);
});
```

### 5. Random Data Without Seeds

**Problem**: Random test data causes inconsistent behavior.

```ts
// Bad: Random failures
it('processes order', () => {
  const order = {
    items: Array.from({ length: Math.random() * 10 }, () => createItem()),
  };
  expect(processOrder(order).total).toBeGreaterThan(0);
  // Sometimes 0 items!
});
```

**Solution**: Seed random generators or use deterministic factories.

```ts
// Good: Seeded randomness
import { faker } from '@faker-js/faker';

faker.seed(12345); // Same sequence every run

it('processes order', () => {
  const order = createOrder(); // Uses seeded faker
  expect(processOrder(order).total).toBeGreaterThan(0);
});

// Good: Explicit data
it('processes order', () => {
  const order = createOrder({
    items: [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ],
  });
  expect(processOrder(order).total).toBe(250);
});
```

### 6. Network Dependencies

**Problem**: Tests depend on external services.

```ts
// Bad: Hits real API
it('fetches weather', async () => {
  const weather = await fetchWeather('NYC');
  expect(weather.temp).toBeGreaterThan(-50); // API might be down
});
```

**Solution**: Mock external services.

```ts
// Good: Mock at network level with MSW
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('https://api.weather.com/current', () => {
    return HttpResponse.json({ temp: 72, condition: 'sunny' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('fetches weather', async () => {
  const weather = await fetchWeather('NYC');
  expect(weather.temp).toBe(72);
});
```

### 7. Resource Leaks

**Problem**: Resources not cleaned up between tests.

```ts
// Bad: Database connections accumulate
let connection: Connection;

beforeEach(() => {
  connection = createConnection();
});

it('test 1', async () => {
  await connection.query('SELECT 1');
});

// Connection leak! Never closed
```

**Solution**: Proper cleanup.

```ts
// Good: Cleanup in afterEach
let connection: Connection;

beforeEach(() => {
  connection = createConnection();
});

afterEach(async () => {
  await connection.close();
});

// Good: Use try/finally in test
it('test with resource', async () => {
  const connection = createConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    await connection.close();
  }
});

// Good: Use disposal pattern
it('test with resource', async () => {
  await using connection = createConnection();
  await connection.query('SELECT 1');
  // Automatically disposed
});
```

### 8. Race Conditions

**Problem**: Concurrent operations with non-deterministic ordering.

```ts
// Bad: Parallel operations may interleave
it('counts correctly', async () => {
  const counter = new AtomicCounter();
  
  await Promise.all([
    counter.increment(),
    counter.increment(),
    counter.increment(),
  ]);
  
  expect(counter.value).toBe(3); // May fail due to race
});
```

**Solution**: Proper synchronization or sequential execution.

```ts
// Good: Sequential operations
it('counts correctly', async () => {
  const counter = new AtomicCounter();
  
  await counter.increment();
  await counter.increment();
  await counter.increment();
  
  expect(counter.value).toBe(3);
});

// Good: Proper atomic implementation
class AtomicCounter {
  private value = 0;
  private mutex = new Mutex();

  async increment(): Promise<void> {
    await this.mutex.runExclusive(() => {
      this.value++;
    });
  }
}
```

## Detecting Flaky Tests

### Repeat Runs

```bash
# Run tests multiple times
for i in {1..10}; do npm test; done

# Or with vitest
npx vitest --repeat 10
```

### CI Configuration

```yaml
# Retry and track
- name: Run Tests
  run: npm test
  env:
    VITEST_RETRY: 2

- name: Upload Flaky Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: flaky-tests
    path: flaky-tests.json
```

### Quarantine System

```ts
// Quarantine flaky tests
it.skip.if(process.env.QUARANTINE === 'true')(
  'sometimes fails - JIRA-123',
  async () => {
    // Flaky test code
  }
);

// Or use a custom decorator
describe('OrderService', () => {
  quarantined('sometimes fails due to race condition', async () => {
    // Known flaky test
  });
});

function quarantined(name: string, fn: () => Promise<void>) {
  if (process.env.RUN_QUARANTINED === 'true') {
    it(name, fn);
  } else {
    it.skip(`[QUARANTINED] ${name}`, fn);
  }
}
```

## Test Isolation Strategies

### 1. Database Per Test

```ts
// Use transactions that rollback
beforeEach(async () => {
  await db.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await db.$executeRaw`ROLLBACK`;
});
```

### 2. Containerized Databases

```ts
// testcontainers for isolated databases
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: PostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer().start();
  process.env.DATABASE_URL = container.getConnectionUri();
});

afterAll(async () => {
  await container.stop();
});
```

### 3. Parallel Test Workers

```ts
// vitest.config.ts - isolate workers
export default {
  test: {
    pool: 'forks', // True process isolation
    poolOptions: {
      forks: {
        singleFork: false,
      },
    },
    // Or use threads with isolation
    isolate: true,
  },
};
```

## Debugging Flaky Tests

### Add Logging

```ts
it('sometimes fails', async () => {
  console.log('Test started at:', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV);
  
  const result = await doSomething();
  console.log('Result:', JSON.stringify(result));
  
  expect(result.success).toBe(true);
});
```

### Capture Screenshots (E2E)

```ts
import { test } from '@playwright/test';

test('checkout flow', async ({ page }) => {
  await page.goto('/checkout');
  
  // Capture state before assertion
  await page.screenshot({ path: 'debug/before-submit.png' });
  
  await page.click('button[type="submit"]');
  
  // Capture state after action
  await page.screenshot({ path: 'debug/after-submit.png' });
  
  await expect(page.locator('h1')).toHaveText('Success');
});
```

### Record Test Execution

```ts
// Trace mode for debugging
// playwright.config.ts
export default {
  use: {
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
};
```

## Best Practices Summary

| Practice | Implementation |
|----------|----------------|
| Avoid sleep() | Use explicit waits |
| Isolate state | Fresh setup per test |
| Mock external services | Use MSW or similar |
| Control time | Use vi.useFakeTimers() |
| Seed random data | faker.seed() |
| Clean up resources | afterEach cleanup |
| Randomize order | sequence.shuffle: true |
| Track flaky tests | Quarantine and fix |
