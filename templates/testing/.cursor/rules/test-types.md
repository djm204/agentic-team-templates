# Test Types

Guidelines for understanding and applying different types of tests effectively.

## Testing Trophy Strategy

The Testing Trophy prioritizes tests by confidence-to-cost ratio:

```
         ┌─────────────┐
         │     E2E     │  Highest confidence, highest cost
         ├─────────────┤
         │             │
         │ Integration │  Best confidence/cost ratio
         │             │
         ├─────────────┤
         │    Unit     │  Fast but narrow scope
         ├─────────────┤
         │   Static    │  Zero runtime cost
         └─────────────┘
```

## Static Analysis (~10%)

Catch errors at compile/lint time before tests even run.

### What It Catches

- Type mismatches
- Null/undefined access
- Unused variables
- Import errors
- Formatting inconsistencies
- Common security issues

### Tools

```ts
// TypeScript strict mode
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

```js
// ESLint configuration
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:security/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
```

### Cost-Benefit

- **Cost**: Near zero (runs in editor/CI)
- **Confidence**: Catches ~20% of bugs
- **Speed**: Instant feedback

## Unit Tests (~20%)

Test isolated pieces of logic without dependencies.

### What to Unit Test

- Pure functions (input → output)
- Utility functions
- Data transformations
- Validation logic
- Algorithms
- Business rules

### Characteristics

- **Fast**: < 10ms per test
- **Isolated**: No I/O, no databases, no network
- **Deterministic**: Same result every time
- **Focused**: One assertion per concept

### Example

```ts
import { describe, it, expect } from 'vitest';
import { calculateDiscount, formatCurrency, validateEmail } from './utils';

describe('calculateDiscount', () => {
  it('applies percentage discount correctly', () => {
    expect(calculateDiscount(100, { type: 'percentage', value: 10 })).toBe(90);
  });

  it('applies fixed discount correctly', () => {
    expect(calculateDiscount(100, { type: 'fixed', value: 15 })).toBe(85);
  });

  it('does not produce negative values', () => {
    expect(calculateDiscount(10, { type: 'fixed', value: 100 })).toBe(0);
  });

  it('handles zero amount', () => {
    expect(calculateDiscount(0, { type: 'percentage', value: 50 })).toBe(0);
  });
});

describe('validateEmail', () => {
  it.each([
    ['test@example.com', true],
    ['user.name@domain.org', true],
    ['invalid', false],
    ['@nodomain.com', false],
    ['spaces in@email.com', false],
  ])('validateEmail(%s) returns %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});
```

### What NOT to Unit Test

- Simple getters/setters
- Framework code
- Third-party libraries
- Trivial wrappers

## Integration Tests (~60%)

Test multiple components working together. **This is where you get the most value.**

### What to Integration Test

- Service layer with real database
- API routes end-to-end (minus external services)
- Repository functions with database
- Message handlers with real queues
- Multiple services interacting

### Characteristics

- **Realistic**: Uses real dependencies (database, cache)
- **Valuable**: Catches integration issues
- **Moderate speed**: 100-500ms per test
- **Isolated data**: Each test has clean state

### Example: Service Integration

```ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../lib/db';
import { orderService } from './orderService';
import { createTestUser, createTestProduct } from '../test/factories';

describe('OrderService', () => {
  let user: User;
  let products: Product[];

  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  beforeEach(async () => {
    // Clean slate
    await db.$transaction([
      db.orderItem.deleteMany(),
      db.order.deleteMany(),
      db.product.deleteMany(),
      db.user.deleteMany(),
    ]);

    // Setup test data
    user = await createTestUser();
    products = await Promise.all([
      createTestProduct({ price: 100, inventory: 10 }),
      createTestProduct({ price: 50, inventory: 5 }),
    ]);
  });

  describe('createOrder', () => {
    it('creates order with correct total', async () => {
      const order = await orderService.createOrder({
        userId: user.id,
        items: [
          { productId: products[0].id, quantity: 2 },
          { productId: products[1].id, quantity: 1 },
        ],
      });

      expect(order.total).toBe(250); // (100 * 2) + (50 * 1)
      expect(order.status).toBe('pending');
      expect(order.items).toHaveLength(2);
    });

    it('decrements product inventory', async () => {
      await orderService.createOrder({
        userId: user.id,
        items: [{ productId: products[0].id, quantity: 3 }],
      });

      const updatedProduct = await db.product.findUnique({
        where: { id: products[0].id },
      });
      expect(updatedProduct?.inventory).toBe(7); // 10 - 3
    });

    it('rejects order when inventory insufficient', async () => {
      await expect(
        orderService.createOrder({
          userId: user.id,
          items: [{ productId: products[0].id, quantity: 100 }],
        })
      ).rejects.toThrow('Insufficient inventory');
    });

    it('rolls back on partial failure', async () => {
      const initialInventory = products[0].inventory;

      await expect(
        orderService.createOrder({
          userId: user.id,
          items: [
            { productId: products[0].id, quantity: 1 },
            { productId: 'nonexistent', quantity: 1 },
          ],
        })
      ).rejects.toThrow();

      // Inventory should not have changed
      const product = await db.product.findUnique({ where: { id: products[0].id } });
      expect(product?.inventory).toBe(initialInventory);
    });
  });
});
```

### Example: API Integration

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { db } from '../lib/db';
import { createTestUser, createAuthToken } from '../test/factories';

describe('POST /api/orders', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await db.order.deleteMany();
    await db.user.deleteMany();

    const user = await createTestUser();
    userId = user.id;
    authToken = createAuthToken(user);
  });

  it('creates order for authenticated user', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [{ productId: 'prod-1', quantity: 2 }],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.userId).toBe(userId);
  });

  it('returns 401 without authentication', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ items: [] });

    expect(response.status).toBe(401);
  });

  it('returns 422 for invalid request body', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ items: 'not-an-array' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## End-to-End Tests (~10%)

Test critical user journeys through the full stack.

### What to E2E Test

- Critical revenue paths (checkout, payment)
- Authentication flows
- Core user journeys
- Cross-browser compatibility (sparse)

### What NOT to E2E Test

- Every UI state
- Form validation (use integration tests)
- Edge cases (use unit tests)
- Error handling (use integration tests)

### Characteristics

- **Slow**: 10-60 seconds per test
- **Expensive**: Full environment needed
- **Brittle**: More moving parts = more failure points
- **High confidence**: Tests the real thing

### Example

```ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test user via API
    await page.request.post('/api/test/seed-user');
  });

  test('user can complete purchase', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Add to cart
    await page.goto('/products');
    await page.click('[data-testid="product-1"] >> text=Add to Cart');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // Checkout
    await page.click('text=Checkout');
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="city"]', 'Anytown');
    await page.fill('[name="zip"]', '12345');
    await page.click('text=Place Order');

    // Verify
    await expect(page.locator('h1')).toHaveText('Order Confirmed');
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });

  test('handles payment failure gracefully', async ({ page }) => {
    await page.goto('/checkout');
    // Use test card that triggers decline
    await page.fill('[name="card-number"]', '4000000000000002');
    await page.click('text=Pay');

    await expect(page.locator('.error')).toHaveText('Payment declined');
    await expect(page).toHaveURL('/checkout'); // Stays on page
  });
});
```

## Comparison Matrix

| Aspect | Static | Unit | Integration | E2E |
|--------|--------|------|-------------|-----|
| Speed | Instant | <10ms | 100-500ms | 10-60s |
| Confidence | Low | Medium | High | Highest |
| Maintenance | Very Low | Low | Medium | High |
| Isolation | N/A | Complete | Partial | None |
| Real deps | No | No | Yes | Yes |
| When to run | Always | Always | Always | Critical paths |

## Decision Guide

```
Is it pure logic with no dependencies?
├── Yes → Unit test
└── No
    └── Does it involve database/services?
        ├── Yes → Integration test
        └── No
            └── Is it a critical user journey?
                ├── Yes → E2E test
                └── No → Integration test
```
