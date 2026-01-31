# Test Data Management

Guidelines for managing test data effectively.

## Core Principles

1. **Realistic Data** - Test data should resemble production data
2. **Isolated State** - Each test owns its data
3. **Minimal Setup** - Only create what the test needs
4. **Deterministic** - Same test always uses same logical data
5. **No Production Data** - Never use real user data

## Faker for Realistic Data

Use Faker to generate realistic test data:

```ts
// factories/index.ts
import { faker } from '@faker-js/faker';

// Seed for deterministic tests (optional)
faker.seed(12345);

export const factories = {
  user: (overrides: Partial<User> = {}): User => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zip: faker.location.zipCode(),
    },
    createdAt: faker.date.past(),
    updatedAt: new Date(),
    ...overrides,
  }),

  product: (overrides: Partial<Product> = {}): Product => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    sku: faker.string.alphanumeric(10).toUpperCase(),
    inventory: faker.number.int({ min: 0, max: 100 }),
    category: faker.commerce.department(),
    createdAt: faker.date.past(),
    ...overrides,
  }),

  order: (overrides: Partial<Order> = {}): Order => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    items: [],
    total: 0,
    status: 'pending',
    shippingAddress: factories.address(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  address: (overrides: Partial<Address> = {}): Address => ({
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zip: faker.location.zipCode(),
    country: 'US',
    ...overrides,
  }),
};
```

## Database Factories

For integration tests that need real database records:

```ts
// factories/db.ts
import { db } from '../lib/db';
import { factories } from './index';

export const dbFactories = {
  user: async (overrides: Partial<User> = {}): Promise<User> => {
    const userData = factories.user(overrides);
    return db.user.create({ data: userData });
  },

  product: async (overrides: Partial<Product> = {}): Promise<Product> => {
    const productData = factories.product(overrides);
    return db.product.create({ data: productData });
  },

  order: async (
    user: User,
    items: Array<{ product: Product; quantity: number }>
  ): Promise<Order> => {
    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return db.order.create({
      data: {
        userId: user.id,
        total,
        status: 'pending',
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
      include: { items: true },
    });
  },
};
```

## Builder Pattern for Complex Objects

When objects have many configurations:

```ts
// builders/OrderBuilder.ts
import { faker } from '@faker-js/faker';

export class OrderBuilder {
  private data: Partial<Order> = {};
  private items: OrderItem[] = [];

  static create(): OrderBuilder {
    return new OrderBuilder();
  }

  withUser(user: User): this {
    this.data.userId = user.id;
    return this;
  }

  withItem(product: Product, quantity: number = 1): this {
    this.items.push({
      id: faker.string.uuid(),
      productId: product.id,
      quantity,
      price: product.price,
    });
    return this;
  }

  withStatus(status: OrderStatus): this {
    this.data.status = status;
    return this;
  }

  withDiscount(discount: Discount): this {
    this.data.discount = discount;
    return this;
  }

  shipped(): this {
    this.data.status = 'shipped';
    this.data.shippedAt = new Date();
    return this;
  }

  cancelled(): this {
    this.data.status = 'cancelled';
    this.data.cancelledAt = new Date();
    return this;
  }

  build(): Order {
    const total = this.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return {
      id: faker.string.uuid(),
      userId: this.data.userId ?? faker.string.uuid(),
      items: this.items,
      total: this.data.discount
        ? applyDiscount(total, this.data.discount)
        : total,
      status: this.data.status ?? 'pending',
      discount: this.data.discount,
      shippedAt: this.data.shippedAt,
      cancelledAt: this.data.cancelledAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async persist(db: Database): Promise<Order> {
    const order = this.build();
    return db.order.create({
      data: order,
      include: { items: true },
    });
  }
}

// Usage
const order = OrderBuilder.create()
  .withUser(testUser)
  .withItem(product1, 2)
  .withItem(product2, 1)
  .withDiscount({ type: 'percentage', value: 10 })
  .shipped()
  .build();
```

## Object Mother Pattern

Pre-configured scenarios for common test cases:

```ts
// mothers/UserMother.ts
import { dbFactories } from '../factories/db';

export const UserMother = {
  // Simple users
  admin: () => dbFactories.user({ role: 'admin', verified: true }),
  regular: () => dbFactories.user({ role: 'user', verified: true }),
  unverified: () => dbFactories.user({ verified: false }),
  suspended: () => dbFactories.user({ status: 'suspended' }),

  // Complex scenarios
  async withOrders(count: number = 3): Promise<User> {
    const user = await dbFactories.user();
    const products = await Promise.all(
      Array.from({ length: count }, () => dbFactories.product())
    );

    for (let i = 0; i < count; i++) {
      await dbFactories.order(user, [{ product: products[i], quantity: 1 }]);
    }

    return user;
  },

  async withExpiredSubscription(): Promise<User> {
    const user = await dbFactories.user();
    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'premium',
        expiresAt: new Date(Date.now() - 86400000), // Yesterday
      },
    });
    return user;
  },

  async withActiveSubscription(plan: Plan = 'premium'): Promise<User> {
    const user = await dbFactories.user();
    await db.subscription.create({
      data: {
        userId: user.id,
        plan,
        expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
      },
    });
    return user;
  },
};

// Usage in tests
it('shows renewal prompt for expired subscription', async () => {
  const user = await UserMother.withExpiredSubscription();
  const result = await checkSubscriptionStatus(user.id);
  expect(result.showRenewalPrompt).toBe(true);
});
```

## Fixtures for Static Data

Use fixtures for data that doesn't change:

```ts
// fixtures/countries.json
[
  { "code": "US", "name": "United States", "currency": "USD" },
  { "code": "GB", "name": "United Kingdom", "currency": "GBP" },
  { "code": "EU", "name": "European Union", "currency": "EUR" }
]

// fixtures/taxRates.json
{
  "US": { "standard": 0.08, "reduced": 0.04, "exempt": 0 },
  "GB": { "standard": 0.20, "reduced": 0.05, "exempt": 0 },
  "EU": { "standard": 0.21, "reduced": 0.10, "exempt": 0 }
}

// Usage
import countries from '../fixtures/countries.json';
import taxRates from '../fixtures/taxRates.json';

it.each(countries)('calculates tax for $name', ({ code }) => {
  const rate = taxRates[code].standard;
  expect(calculateTax(100, code)).toBe(100 * (1 + rate));
});
```

## Database Cleanup Strategies

### Transaction Rollback (Fastest)

```ts
// test/setup.ts
import { db } from '../lib/db';

beforeEach(async () => {
  // Start transaction
  await db.$executeRaw`BEGIN`;
});

afterEach(async () => {
  // Rollback - no cleanup needed
  await db.$executeRaw`ROLLBACK`;
});
```

### Truncate Tables

```ts
// test/setup.ts
export async function cleanDatabase() {
  const tables = ['order_item', 'order', 'product', 'user'];

  await db.$transaction(
    tables.map((table) =>
      db.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`)
    )
  );
}

beforeEach(async () => {
  await cleanDatabase();
});
```

### Delete in Order (Safest)

```ts
// test/setup.ts
export async function cleanDatabase() {
  // Delete in dependency order (children first)
  await db.$transaction([
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.product.deleteMany(),
    db.user.deleteMany(),
  ]);
}
```

## Seeding Test Database

```ts
// test/seed.ts
import { dbFactories } from './factories/db';

export async function seedTestDatabase() {
  // Create base data
  const admin = await dbFactories.user({
    email: 'admin@test.com',
    role: 'admin',
  });

  const regularUser = await dbFactories.user({
    email: 'user@test.com',
    role: 'user',
  });

  const products = await Promise.all([
    dbFactories.product({ name: 'Widget A', price: 100 }),
    dbFactories.product({ name: 'Widget B', price: 200 }),
    dbFactories.product({ name: 'Widget C', price: 50 }),
  ]);

  return { admin, regularUser, products };
}

// Usage in global setup
// test/globalSetup.ts
export default async function globalSetup() {
  const testDb = await createTestDatabase();
  await runMigrations(testDb);
  await seedTestDatabase();
}
```

## Deterministic Random Data

When you need "random" data but reproducible tests:

```ts
// Seed Faker for determinism
import { faker } from '@faker-js/faker';

// Global seed for all tests
faker.seed(12345);

// Or per-test seeding based on test name
beforeEach((context) => {
  const seed = hashCode(context.task.name);
  faker.seed(seed);
});

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

## Snapshot Testing for Data

When test data is complex and stability is important:

```ts
// Capture expected data shape
it('generates correct order data', () => {
  const order = OrderBuilder.create()
    .withItem(product, 2)
    .build();

  expect(order).toMatchSnapshot({
    id: expect.any(String),
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});
```

## Parameterized Tests

Test multiple scenarios efficiently:

```ts
// Using test.each
describe('validateEmail', () => {
  const validEmails = [
    'test@example.com',
    'user.name@domain.org',
    'user+tag@example.co.uk',
  ];

  const invalidEmails = [
    '',
    'invalid',
    '@nodomain.com',
    'spaces in@email.com',
    'no@tld',
  ];

  it.each(validEmails)('accepts valid email: %s', (email) => {
    expect(validateEmail(email)).toBe(true);
  });

  it.each(invalidEmails)('rejects invalid email: %s', (email) => {
    expect(validateEmail(email)).toBe(false);
  });
});

// With test case objects
describe('calculateShipping', () => {
  const testCases = [
    { weight: 0, distance: 100, expected: 0 },
    { weight: 1, distance: 100, expected: 5 },
    { weight: 5, distance: 100, expected: 15 },
    { weight: 1, distance: 500, expected: 10 },
    { weight: 10, distance: 1000, expected: 50 },
  ];

  it.each(testCases)(
    'calculates $expected for weight=$weight, distance=$distance',
    ({ weight, distance, expected }) => {
      expect(calculateShipping(weight, distance)).toBe(expected);
    }
  );
});
```

## Anti-Patterns

### Shared Mutable State

```ts
// Bad: Tests affect each other
let testUser = createUser();

it('test 1', () => {
  testUser.name = 'Changed';
});

it('test 2', () => {
  expect(testUser.name).toBe('Original'); // Fails!
});

// Good: Fresh data per test
let testUser: User;

beforeEach(() => {
  testUser = createUser();
});
```

### Hard-Coded IDs

```ts
// Bad: Magic IDs
const order = await getOrder('550e8400-e29b-41d4-a716-446655440000');

// Good: Generated IDs
const created = await createOrder(data);
const order = await getOrder(created.id);
```

### Production Data

```ts
// Bad: Using real user data
const user = { email: 'real.customer@example.com', ... };

// Good: Fake data
const user = factories.user();
```

### Over-specified Data

```ts
// Bad: Too much irrelevant data
it('calculates discount', () => {
  const order = {
    id: '123',
    userId: 'user-1',
    items: [/* ... */],
    createdAt: new Date(),
    updatedAt: new Date(),
    shippingAddress: { /* ... */ },
    billingAddress: { /* ... */ },
    notes: 'Please handle with care',
    // ... 20 more fields
  };
  expect(calculateDiscount(order)).toBe(10);
});

// Good: Only relevant data
it('calculates discount', () => {
  const order = factories.order({
    total: 100,
    discount: { type: 'percentage', value: 10 },
  });
  expect(calculateDiscount(order)).toBe(10);
});
```
