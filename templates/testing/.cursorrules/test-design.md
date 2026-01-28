# Test Design Patterns

Guidelines for designing effective, maintainable tests.

## Core Patterns

### Arrange-Act-Assert (AAA)

The fundamental pattern for all tests:

```ts
it('calculates order total with discount', () => {
  // Arrange - Set up test data and dependencies
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

**Rules:**
- Separate sections with blank lines
- One "Act" per test
- Keep "Arrange" minimal (use factories)
- Assertions should be obvious

### Given-When-Then (BDD)

Express tests in business language:

```ts
describe('Shopping Cart', () => {
  describe('given a cart with items', () => {
    const cart = createCart([item1, item2]);

    describe('when applying a discount code', () => {
      const result = cart.applyDiscount('SAVE20');

      it('then reduces the total by 20%', () => {
        expect(result.total).toBe(originalTotal * 0.8);
      });

      it('then marks discount as applied', () => {
        expect(result.discountApplied).toBe(true);
      });
    });
  });
});
```

### Test Isolation

Each test must be completely independent:

```ts
// Bad: Shared mutable state
let counter = 0;

it('test 1', () => {
  counter++;
  expect(counter).toBe(1);
});

it('test 2', () => {
  expect(counter).toBe(0); // FAILS! Depends on test order
});

// Good: Fresh state per test
describe('Counter', () => {
  let counter: Counter;

  beforeEach(() => {
    counter = new Counter();
  });

  it('starts at zero', () => {
    expect(counter.value).toBe(0);
  });

  it('increments by one', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });
});
```

## Test Data Patterns

### Factory Pattern

Create test data with sensible defaults:

```ts
// factories/user.ts
import { faker } from '@faker-js/faker';

interface UserFactoryOptions {
  email?: string;
  role?: 'user' | 'admin';
  verified?: boolean;
}

export const createTestUser = (overrides: UserFactoryOptions = {}): User => ({
  id: faker.string.uuid(),
  email: overrides.email ?? faker.internet.email(),
  name: faker.person.fullName(),
  role: overrides.role ?? 'user',
  verified: overrides.verified ?? true,
  createdAt: faker.date.past(),
  updatedAt: new Date(),
});

// Usage - only specify what matters for the test
const admin = createTestUser({ role: 'admin' });
const unverified = createTestUser({ verified: false });
```

### Builder Pattern

For complex objects with many configurations:

```ts
// builders/OrderBuilder.ts
export class OrderBuilder {
  private order: Partial<Order> = {};

  withId(id: string): this {
    this.order.id = id;
    return this;
  }

  withItems(items: OrderItem[]): this {
    this.order.items = items;
    return this;
  }

  withStatus(status: OrderStatus): this {
    this.order.status = status;
    return this;
  }

  withDiscount(discount: Discount): this {
    this.order.discount = discount;
    return this;
  }

  shipped(): this {
    this.order.status = 'shipped';
    this.order.shippedAt = new Date();
    return this;
  }

  build(): Order {
    return {
      id: this.order.id ?? faker.string.uuid(),
      items: this.order.items ?? [],
      status: this.order.status ?? 'pending',
      discount: this.order.discount,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Order;
  }
}

// Usage
const order = new OrderBuilder()
  .withItems([itemFactory()])
  .withDiscount({ type: 'fixed', value: 10 })
  .shipped()
  .build();
```

### Object Mother Pattern

Pre-configured objects for common scenarios:

```ts
// test/mothers/userMother.ts
export const UserMother = {
  admin: () => createTestUser({ role: 'admin', verified: true }),
  unverified: () => createTestUser({ verified: false }),
  suspended: () => createTestUser({ status: 'suspended' }),
  withOrders: async () => {
    const user = await db.user.create({ data: createTestUser() });
    await db.order.createMany({
      data: [
        createTestOrder({ userId: user.id }),
        createTestOrder({ userId: user.id }),
      ],
    });
    return user;
  },
};

// Usage
const admin = UserMother.admin();
const userWithOrders = await UserMother.withOrders();
```

## Assertion Patterns

### Focused Assertions

One logical assertion per test:

```ts
// Bad: Multiple unrelated assertions
it('processes order', async () => {
  const order = await processOrder(orderData);
  expect(order.id).toBeDefined();
  expect(order.status).toBe('confirmed');
  expect(order.total).toBe(100);
  expect(order.items).toHaveLength(2);
  expect(sendEmail).toHaveBeenCalled();
  expect(decrementInventory).toHaveBeenCalled();
});

// Good: Separate tests for each behavior
describe('processOrder', () => {
  it('creates order with confirmed status', async () => {
    const order = await processOrder(orderData);
    expect(order.status).toBe('confirmed');
  });

  it('calculates correct total', async () => {
    const order = await processOrder(orderData);
    expect(order.total).toBe(100);
  });

  it('sends confirmation email', async () => {
    await processOrder(orderData);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'order-confirmation' })
    );
  });
});
```

### Custom Matchers

Create domain-specific assertions:

```ts
// test/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () => `Expected ${received} ${pass ? 'not ' : ''}to be a valid email`,
    };
  },

  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        `Expected ${received} ${pass ? 'not ' : ''}to be within [${floor}, ${ceiling}]`,
    };
  },

  toHaveBeenCalledWithUser(
    received: jest.Mock,
    expectedUser: Partial<User>
  ) {
    const calls = received.mock.calls;
    const pass = calls.some(([user]) =>
      Object.entries(expectedUser).every(([key, value]) => user[key] === value)
    );
    return {
      pass,
      message: () =>
        `Expected mock ${pass ? 'not ' : ''}to have been called with user matching ${JSON.stringify(expectedUser)}`,
    };
  },
});

// Usage
expect(user.email).toBeValidEmail();
expect(score).toBeWithinRange(0, 100);
expect(mockSendEmail).toHaveBeenCalledWithUser({ role: 'admin' });
```

### Snapshot Testing

Use sparingly for complex, stable outputs:

```ts
// Good use: Serialized output that rarely changes
it('generates correct API response format', () => {
  const response = formatApiResponse(data);
  expect(response).toMatchSnapshot();
});

// Bad use: Dynamic content that changes frequently
it('renders user profile', () => {
  const profile = render(<UserProfile user={user} />);
  expect(profile).toMatchSnapshot(); // Will break on any change
});

// Better: Inline snapshots for small outputs
it('formats currency correctly', () => {
  expect(formatCurrency(1234.56, 'USD')).toMatchInlineSnapshot(`"$1,234.56"`);
});
```

## Test Organization Patterns

### Describe Blocks by Behavior

```ts
describe('OrderService', () => {
  describe('createOrder', () => {
    describe('with valid input', () => {
      it('creates order record');
      it('decrements inventory');
      it('sends confirmation email');
    });

    describe('with invalid input', () => {
      it('rejects empty cart');
      it('rejects out-of-stock items');
      it('rejects invalid user');
    });
  });

  describe('cancelOrder', () => {
    describe('when order is pending', () => {
      it('updates status to cancelled');
      it('restores inventory');
      it('refunds payment');
    });

    describe('when order is shipped', () => {
      it('throws CannotCancelError');
    });
  });
});
```

### Setup Hierarchy

```ts
describe('API Routes', () => {
  // Runs once before all tests in this describe
  beforeAll(async () => {
    await db.$connect();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  describe('/users', () => {
    // Runs before each test in /users
    beforeEach(async () => {
      await db.user.deleteMany();
    });

    describe('GET /users', () => {
      it('returns empty list when no users');
      it('returns all users');
    });

    describe('POST /users', () => {
      it('creates user with valid data');
      it('rejects invalid email');
    });
  });

  describe('/orders', () => {
    // Different setup for orders tests
    beforeEach(async () => {
      await db.order.deleteMany();
      await db.user.deleteMany();
      // Orders tests need a user
      await db.user.create({ data: testUser });
    });
  });
});
```

## Anti-Patterns to Avoid

### Testing Implementation Details

```ts
// Bad: Couples test to implementation
it('uses lodash sortBy internally', () => {
  const spy = vi.spyOn(_, 'sortBy');
  sortUsers(users);
  expect(spy).toHaveBeenCalled();
});

// Good: Tests behavior
it('sorts users by name ascending', () => {
  const result = sortUsers([
    { name: 'Charlie' },
    { name: 'Alice' },
    { name: 'Bob' },
  ]);
  expect(result.map(u => u.name)).toEqual(['Alice', 'Bob', 'Charlie']);
});
```

### Excessive Mocking

```ts
// Bad: Everything is mocked
const mockDb = vi.fn();
const mockCache = vi.fn();
const mockLogger = vi.fn();
const mockConfig = vi.fn();

it('does something', () => {
  // What are we even testing?
});

// Good: Integration test with real dependencies
it('persists user to database', async () => {
  const user = await userService.create(userData);
  const saved = await db.user.findUnique({ where: { id: user.id } });
  expect(saved.email).toBe(userData.email);
});
```

### Test Interdependence

```ts
// Bad: Tests depend on each other
let createdId: string;

it('creates item', async () => {
  const item = await create({ name: 'Test' });
  createdId = item.id;  // Stored for next test
});

it('gets item', async () => {
  const item = await get(createdId);  // Depends on previous test
  expect(item.name).toBe('Test');
});

// Good: Each test is self-contained
it('creates and retrieves item', async () => {
  const created = await create({ name: 'Test' });
  const retrieved = await get(created.id);
  expect(retrieved.name).toBe('Test');
});
```

### Magic Values

```ts
// Bad: What does 42 mean?
it('calculates something', () => {
  expect(calculate(42)).toBe(84);
});

// Good: Named constants explain intent
it('doubles the input value', () => {
  const input = 42;
  const expected = input * 2;
  expect(double(input)).toBe(expected);
});

// Or with descriptive test name
it('returns double the input', () => {
  expect(double(5)).toBe(10);
});
```

## Naming Conventions

### Test Names Should Be Sentences

```ts
// Bad: Vague names
it('works');
it('handles error');
it('test 1');

// Good: Descriptive sentences
it('returns empty array when no users exist');
it('throws NotFoundError when user does not exist');
it('sends welcome email after user registration');
```

### Use Consistent Prefixes

```ts
// Action verbs
it('creates order with valid data');
it('updates user profile');
it('deletes expired sessions');

// Condition verbs
it('returns null when user not found');
it('throws ValidationError for invalid email');
it('rejects duplicate email addresses');
```
