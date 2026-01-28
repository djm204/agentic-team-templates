# Testing Development Guide

Comprehensive guidelines for building world-class test suites that provide confidence, enable rapid delivery, and catch defects early.

---

## Overview

This guide applies to:
- Unit testing
- Integration testing
- End-to-end testing
- Performance testing
- Contract testing
- Property-based testing
- Mutation testing

### Core Philosophy

**Tests are a first-class deliverable.** They are not an afterthought, a checkbox, or technical debt to be addressed "later." A feature without tests is incomplete.

### Key Principles

1. **Test Behavior, Not Implementation** - Tests should verify what the system does, not how it does it
2. **Testing Trophy Over Pyramid** - Prioritize integration tests for maximum confidence
3. **Tests as Documentation** - Tests are executable specifications
4. **Fast Feedback Loops** - Tests must run quickly to be useful
5. **Deterministic Results** - Same inputs must produce same outputs, always

### Testing Trophy Distribution

```
          ┌───────────────────┐
          │    End-to-End     │  ~10%
          │   (Critical Paths)│
          ├───────────────────┤
          │                   │
          │   Integration     │  ~60%
          │      Tests        │
          │                   │
          ├───────────────────┤
          │   Unit Tests      │  ~20%
          ├───────────────────┤
          │ Static Analysis   │  ~10%
          └───────────────────┘
```

---

## TDD Methodology

### Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────┐      ┌─────────┐      ┌─────────────┐        │
│   │   RED   │ ───► │  GREEN  │ ───► │  REFACTOR   │ ───┐   │
│   │ (Write  │      │ (Make   │      │ (Improve    │    │   │
│   │  failing│      │  it     │      │  code       │    │   │
│   │  test)  │      │  pass)  │      │  quality)   │    │   │
│   └─────────┘      └─────────┘      └─────────────┘    │   │
│       ▲                                                │   │
│       └────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TDD Best Practices

1. **Write the test first** - Forces you to think about the interface before implementation
2. **Keep cycles short** - Each cycle should be 2-10 minutes
3. **One assertion per test** - Each test verifies one behavior
4. **Never refactor on red** - Only refactor when tests pass
5. **Commit after each green** - Small, atomic commits

### When TDD Adds Value

- Complex business logic
- Long-term projects with stable requirements
- Systems with many integrations
- Code that handles edge cases
- Security-critical code

### When to Skip TDD

- Rapid prototypes (but throw them away)
- Exploratory spikes
- One-off scripts

---

## Test Types

### Static Analysis (~10% of effort)

Catch errors before runtime.

```ts
// TypeScript strict mode catches nullability issues
function greet(name: string): string {
  return `Hello, ${name}!`;
}

greet(null);  // Error: Argument of type 'null' is not assignable
```

**Tools:**
- TypeScript (strict mode)
- ESLint with strict rules
- Prettier for formatting
- Biome for fast linting

### Unit Tests (~20% of effort)

Test pure functions and isolated logic.

```ts
// Pure function - perfect for unit testing
import { describe, it, expect } from 'vitest';

describe('calculateTax', () => {
  it('calculates 10% tax for standard rate', () => {
    expect(calculateTax(100, 'standard')).toBe(110);
  });

  it('calculates 0% tax for exempt items', () => {
    expect(calculateTax(100, 'exempt')).toBe(100);
  });

  it('handles zero amount', () => {
    expect(calculateTax(0, 'standard')).toBe(0);
  });

  it('throws for negative amount', () => {
    expect(() => calculateTax(-100, 'standard')).toThrow('Amount must be positive');
  });
});
```

**Best Practices:**
- Test edge cases (zero, empty, null, boundaries)
- Test error conditions explicitly
- Use parameterized tests for variations
- Keep tests focused and fast

### Integration Tests (~60% of effort)

Test components working together. This is where you get the most value.

```ts
// Integration test with real database
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { userService } from '../services/userService';

describe('UserService', () => {
  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    await db.user.deleteMany();
  });

  it('creates user with hashed password', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      password: 'securePassword123',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.password).not.toBe('securePassword123'); // Hashed
  });

  it('prevents duplicate emails', async () => {
    await userService.create({ email: 'test@example.com', password: 'pass1' });

    await expect(
      userService.create({ email: 'test@example.com', password: 'pass2' })
    ).rejects.toThrow('Email already exists');
  });

  it('finds user by email', async () => {
    const created = await userService.create({
      email: 'test@example.com',
      password: 'pass',
    });

    const found = await userService.findByEmail('test@example.com');

    expect(found?.id).toBe(created.id);
  });
});
```

**What to Test:**
- Service layer with real repositories
- API routes with real database
- Message handlers with real queues
- Multiple components interacting

### End-to-End Tests (~10% of effort)

Test critical user journeys only.

```ts
// Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('user can complete purchase', async ({ page }) => {
    // Arrange
    await page.goto('/products');
    
    // Add to cart
    await page.click('[data-testid="product-1"] >> text=Add to Cart');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
    
    // Go to checkout
    await page.click('text=Checkout');
    await expect(page).toHaveURL('/checkout');
    
    // Fill shipping info
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'Anytown');
    await page.fill('[name="zip"]', '12345');
    
    // Complete purchase
    await page.click('text=Place Order');
    
    // Verify success
    await expect(page.locator('h1')).toHaveText('Order Confirmed');
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });
});
```

**What to Test:**
- Critical revenue paths (checkout, signup)
- Authentication flows
- Core user journeys
- Cross-browser compatibility (sparse)

**What NOT to Test:**
- Every UI permutation
- Form validation (use integration tests)
- Edge cases (use unit/integration tests)

---

## Test Design Patterns

### Arrange-Act-Assert (AAA)

```ts
it('calculates order total with discount', () => {
  // Arrange - Set up test data
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];
  const discount = { type: 'percentage', value: 10 };

  // Act - Execute the code under test
  const total = calculateOrderTotal(items, discount);

  // Assert - Verify the result
  expect(total).toBe(225); // (200 + 50) * 0.9
});
```

### Given-When-Then (BDD)

```ts
describe('Shopping Cart', () => {
  describe('given items in cart', () => {
    describe('when removing an item', () => {
      it('then cart count decreases', () => {
        const cart = createCart([item1, item2]);
        
        cart.remove(item1.id);
        
        expect(cart.count).toBe(1);
      });
    });
  });
});
```

### Test Factories

```ts
// factories/user.ts
import { faker } from '@faker-js/faker';

interface UserFactoryOptions {
  email?: string;
  role?: 'user' | 'admin';
  verified?: boolean;
}

export const createTestUser = (overrides: UserFactoryOptions = {}) => ({
  id: faker.string.uuid(),
  email: overrides.email ?? faker.internet.email(),
  name: faker.person.fullName(),
  role: overrides.role ?? 'user',
  verified: overrides.verified ?? true,
  createdAt: faker.date.past(),
});

// Usage
const admin = createTestUser({ role: 'admin' });
const unverified = createTestUser({ verified: false });
```

### Test Builders

```ts
// builders/OrderBuilder.ts
export class OrderBuilder {
  private order: Partial<Order> = {};

  withId(id: string) {
    this.order.id = id;
    return this;
  }

  withItems(items: OrderItem[]) {
    this.order.items = items;
    return this;
  }

  withStatus(status: OrderStatus) {
    this.order.status = status;
    return this;
  }

  withDiscount(discount: Discount) {
    this.order.discount = discount;
    return this;
  }

  build(): Order {
    return {
      id: this.order.id ?? faker.string.uuid(),
      items: this.order.items ?? [],
      status: this.order.status ?? 'pending',
      discount: this.order.discount,
      createdAt: new Date(),
    } as Order;
  }
}

// Usage
const order = new OrderBuilder()
  .withStatus('completed')
  .withItems([itemFactory()])
  .withDiscount({ type: 'fixed', value: 10 })
  .build();
```

### Custom Matchers

```ts
// test/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid email`
          : `Expected ${received} to be a valid email`,
    };
  },

  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be within range ${floor} - ${ceiling}`
          : `Expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },
});

// Usage
expect(user.email).toBeValidEmail();
expect(score).toBeWithinRange(0, 100);
```

---

## Test Data Management

### Factories with Faker

```ts
// factories/index.ts
import { faker } from '@faker-js/faker';

// Seed for deterministic tests
faker.seed(12345);

export const factories = {
  user: (overrides = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    createdAt: faker.date.past(),
    ...overrides,
  }),

  product: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price()),
    sku: faker.string.alphanumeric(10),
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    items: [],
    total: 0,
    status: 'pending',
    createdAt: new Date(),
    ...overrides,
  }),
};
```

### Database Fixtures

```ts
// fixtures/setup.ts
import { db } from '../lib/db';
import { factories } from './factories';

export async function seedTestDatabase() {
  // Clear all data
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.product.deleteMany(),
    db.user.deleteMany(),
  ]);

  // Seed users
  const users = await Promise.all([
    db.user.create({ data: factories.user({ email: 'admin@test.com', role: 'admin' }) }),
    db.user.create({ data: factories.user({ email: 'user@test.com', role: 'user' }) }),
  ]);

  // Seed products
  const products = await Promise.all(
    Array.from({ length: 10 }, () => 
      db.product.create({ data: factories.product() })
    )
  );

  return { users, products };
}

export async function cleanupTestDatabase() {
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.product.deleteMany(),
    db.user.deleteMany(),
  ]);
}
```

### Snapshot Testing (Use Sparingly)

```ts
// Only for stable, complex output
it('renders user profile correctly', () => {
  const profile = renderProfile(testUser);
  expect(profile).toMatchSnapshot();
});

// Inline snapshots for small outputs
it('formats currency correctly', () => {
  expect(formatCurrency(1234.56, 'USD')).toMatchInlineSnapshot(`"$1,234.56"`);
});
```

---

## Quality Metrics

### Coverage Targets (Meaningful, Not Maximum)

| Metric | Target | Why |
|--------|--------|-----|
| Line Coverage | 80%+ | Baseline hygiene |
| Branch Coverage | 75%+ | Decision paths tested |
| Function Coverage | 90%+ | All public APIs tested |
| **Mutation Score** | 70%+ | Tests actually catch bugs |

### Mutation Testing

```ts
// stryker.conf.json
{
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "testRunner": "vitest",
  "reporters": ["clear-text", "html"],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

Mutation testing modifies your code and checks if tests catch the change:

```ts
// Original
function isAdult(age: number): boolean {
  return age >= 18;
}

// Mutant 1: Change >= to >
return age > 18;  // Should be caught by test for age 18

// Mutant 2: Change 18 to 17
return age >= 17; // Should be caught by boundary test
```

### Quality Gates

```yaml
# .github/workflows/quality-gates.yml
quality-gates:
  runs-on: ubuntu-latest
  steps:
    - name: Run Tests
      run: npm test -- --coverage

    - name: Check Coverage
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "Coverage $COVERAGE% is below 80% threshold"
          exit 1
        fi

    - name: Run Mutation Tests
      run: npx stryker run

    - name: Check Mutation Score
      run: |
        SCORE=$(cat reports/mutation/mutation-score.json | jq '.mutationScore')
        if (( $(echo "$SCORE < 70" | bc -l) )); then
          echo "Mutation score $SCORE% is below 70% threshold"
          exit 1
        fi
```

---

## Performance Testing

### Load Testing with k6

```js
// load-tests/checkout.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up more
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
  },
};

export default function () {
  // Get product
  const productRes = http.get('http://api.example.com/products/1');
  check(productRes, { 'product status 200': (r) => r.status === 200 });

  // Add to cart
  const cartRes = http.post(
    'http://api.example.com/cart',
    JSON.stringify({ productId: 1, quantity: 1 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(cartRes, { 'cart status 200': (r) => r.status === 200 });

  sleep(1); // Think time
}
```

### Performance Test Types

| Type | Purpose | Duration |
|------|---------|----------|
| Smoke | Verify system works | 1-2 min |
| Load | Normal expected load | 10-30 min |
| Stress | Beyond normal load | 30-60 min |
| Spike | Sudden load increase | 10-20 min |
| Soak | Extended period | 4-24 hours |

---

## Advanced Techniques

### Property-Based Testing

Test properties that should hold for all inputs.

```ts
import { fc } from '@fast-check/vitest';
import { describe, it, expect } from 'vitest';

describe('sort function', () => {
  it.prop([fc.array(fc.integer())])('maintains array length', (arr) => {
    expect(sort(arr).length).toBe(arr.length);
  });

  it.prop([fc.array(fc.integer())])('is idempotent', (arr) => {
    expect(sort(sort(arr))).toEqual(sort(arr));
  });

  it.prop([fc.array(fc.integer())])('produces sorted output', (arr) => {
    const sorted = sort(arr);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
    }
  });
});
```

### Contract Testing (Pact)

```ts
// consumer.pact.spec.ts
import { PactV3 } from '@pact-foundation/pact';
import { UserApiClient } from './userApiClient';

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'UserService',
});

describe('User API Contract', () => {
  it('gets user by ID', async () => {
    await provider
      .given('user 123 exists')
      .uponReceiving('a request for user 123')
      .withRequest({
        method: 'GET',
        path: '/users/123',
      })
      .willRespondWith({
        status: 200,
        body: {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new UserApiClient(mockServer.url);
      const user = await client.getUser('123');
      
      expect(user.id).toBe('123');
      expect(user.name).toBe('John Doe');
    });
  });
});
```

### Chaos Testing Integration

```ts
// chaos/network-failure.test.ts
import { describe, it, expect } from 'vitest';
import { createChaosProxy } from './chaosProxy';
import { orderService } from '../services/orderService';

describe('Order Service Resilience', () => {
  it('handles payment gateway timeout gracefully', async () => {
    const chaos = createChaosProxy('payment-gateway');
    
    // Inject 5 second delay
    chaos.injectLatency(5000);
    
    try {
      const result = await orderService.createOrder({
        items: [{ productId: '1', quantity: 1 }],
        userId: 'user-1',
      });

      // Should timeout and return pending status
      expect(result.status).toBe('pending');
      expect(result.paymentStatus).toBe('timeout');
    } finally {
      chaos.restore();
    }
  });

  it('retries on transient failures', async () => {
    const chaos = createChaosProxy('inventory-service');
    
    // Fail first 2 requests, then succeed
    chaos.injectFailures({ count: 2, status: 503 });
    
    try {
      const result = await orderService.checkInventory('product-1');
      
      expect(result.available).toBe(true);
      expect(chaos.getRequestCount()).toBe(3); // 2 failures + 1 success
    } finally {
      chaos.restore();
    }
  });
});
```

---

## Flaky Test Prevention

### Root Causes and Solutions

| Cause | Solution |
|-------|----------|
| Timing dependencies | Use explicit waits, not sleep |
| Shared state | Isolate test data, reset between tests |
| Order dependencies | Each test must be independent |
| External services | Mock or use containers |
| Race conditions | Avoid async assumptions |
| Time-based logic | Mock Date/time functions |

### Deterministic Testing

```ts
// Bad: Non-deterministic
it('creates user with timestamp', () => {
  const user = createUser({ name: 'Test' });
  expect(user.createdAt).toBeDefined(); // Will vary
});

// Good: Deterministic
it('creates user with timestamp', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2025-01-01'));
  
  const user = createUser({ name: 'Test' });
  
  expect(user.createdAt).toEqual(new Date('2025-01-01'));
  
  vi.useRealTimers();
});
```

### Explicit Waits

```ts
// Bad: Arbitrary sleep
await page.click('button');
await page.waitForTimeout(2000);
expect(await page.textContent('h1')).toBe('Success');

// Good: Wait for condition
await page.click('button');
await expect(page.locator('h1')).toHaveText('Success', { timeout: 5000 });
```

### Test Isolation

```ts
// vitest.config.ts
export default {
  test: {
    isolate: true,           // Isolate test files
    sequence: {
      shuffle: true,         // Randomize order to catch dependencies
    },
    pool: 'forks',           // True isolation between tests
  },
};
```

---

## CI/CD Integration

### Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  push:
    branches: [main]
  pull_request:

jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm test -- --reporter=junit --outputFile=test-results.xml
      
      - uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results.xml

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run db:migrate
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: load-tests/smoke.js
          flags: --out json=results.json
      
      - uses: actions/upload-artifact@v4
        with:
          name: k6-results
          path: results.json
```

### Test Reporting

```ts
// vitest.config.ts
export default {
  test: {
    reporters: ['default', 'junit', 'html'],
    outputFile: {
      junit: 'test-results/junit.xml',
      html: 'test-results/report.html',
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
    },
  },
};
```

---

## Project Structure

```
src/
├── services/
│   ├── userService.ts
│   └── userService.test.ts        # Co-located unit tests
├── repositories/
│   ├── userRepository.ts
│   └── userRepository.test.ts     # Integration tests
└── routes/
    ├── users.ts
    └── users.test.ts              # API tests

tests/
├── setup.ts                       # Global test setup
├── factories/                     # Test data factories
│   ├── index.ts
│   ├── user.ts
│   └── order.ts
├── fixtures/                      # Static test data
│   └── products.json
├── mocks/                         # Manual mocks
│   └── emailService.ts
├── e2e/                           # Playwright tests
│   ├── checkout.spec.ts
│   └── auth.spec.ts
├── load/                          # k6 performance tests
│   ├── smoke.js
│   └── stress.js
└── contracts/                     # Pact contract tests
    └── userApi.pact.spec.ts
```

---

## Definition of Done

A test suite is complete when:

- [ ] All critical paths have integration tests
- [ ] Pure functions have unit tests
- [ ] Edge cases are explicitly tested
- [ ] Error conditions are tested
- [ ] Tests are deterministic (pass 100% on re-run)
- [ ] No flaky tests in CI (quarantine if found)
- [ ] Coverage meets thresholds (80%+ lines, 70%+ mutation)
- [ ] Performance baselines established
- [ ] Contract tests for external dependencies
- [ ] Tests run in under 5 minutes (unit + integration)
- [ ] E2E tests cover critical revenue paths
- [ ] Test documentation is up to date

---

## Anti-Patterns to Avoid

### 1. Testing Implementation Details

```ts
// Bad: Testing internals
it('calls _processData internally', () => {
  const spy = vi.spyOn(service, '_processData');
  service.handleRequest(data);
  expect(spy).toHaveBeenCalled();
});

// Good: Testing behavior
it('returns processed result', () => {
  const result = service.handleRequest(data);
  expect(result.processed).toBe(true);
});
```

### 2. Excessive Mocking

```ts
// Bad: Mock everything
const mockDb = vi.fn();
const mockCache = vi.fn();
const mockLogger = vi.fn();
const mockConfig = vi.fn();

// Good: Use real dependencies in integration tests
// Only mock external services you don't control
```

### 3. Shared Mutable State

```ts
// Bad: Shared state between tests
let user: User;

beforeAll(() => {
  user = createUser();
});

it('test 1', () => {
  user.name = 'Changed';  // Mutates shared state
});

it('test 2', () => {
  expect(user.name).toBe('Original');  // FAILS!
});

// Good: Create fresh state per test
beforeEach(() => {
  user = createUser();
});
```

### 4. Testing Everything with E2E

```ts
// Bad: Using E2E for form validation
test('email validation', async ({ page }) => {
  await page.fill('[name=email]', 'invalid');
  await expect(page.locator('.error')).toBeVisible();
});

// Good: Unit test the validation logic
it('rejects invalid email', () => {
  expect(validateEmail('invalid')).toBe(false);
});
```

### 5. Ignoring Flaky Tests

```ts
// Bad: Skip and forget
it.skip('sometimes fails', () => { ... });

// Good: Fix or quarantine with tracking
it.todo('fix: race condition in async handler - JIRA-123');
```

---

## Quick Reference

### Vitest Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- src/services/user.test.ts

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

### Playwright Commands

```bash
# Run E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test checkout.spec.ts

# Debug mode
npx playwright test --debug

# Generate tests
npx playwright codegen localhost:3000
```

### k6 Commands

```bash
# Run load test
k6 run load-tests/smoke.js

# Run with more VUs
k6 run --vus 100 --duration 5m load-tests/stress.js

# Output to cloud
k6 run --out cloud load-tests/smoke.js
```
