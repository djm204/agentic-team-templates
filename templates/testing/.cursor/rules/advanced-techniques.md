# Advanced Testing Techniques

Guidelines for property-based testing, mutation testing, contract testing, and chaos engineering.

## Property-Based Testing

Instead of testing specific examples, test properties that should hold for ALL inputs.

### Core Concept

```ts
// Example-based: Tests specific cases
it('sorts numbers ascending', () => {
  expect(sort([3, 1, 2])).toEqual([1, 2, 3]);
  expect(sort([5, 4])).toEqual([4, 5]);
});

// Property-based: Tests invariants
it('sorted array maintains length', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      return sort(arr).length === arr.length;
    })
  );
});
```

### Using fast-check

```ts
import { fc } from '@fast-check/vitest';
import { describe, it, expect } from 'vitest';

describe('Array operations', () => {
  it.prop([fc.array(fc.integer())])('sort is idempotent', (arr) => {
    expect(sort(sort(arr))).toEqual(sort(arr));
  });

  it.prop([fc.array(fc.integer())])('sort maintains elements', (arr) => {
    const sorted = sort(arr);
    const original = [...arr].sort((a, b) => a - b);
    expect(sorted).toEqual(original);
  });

  it.prop([fc.array(fc.integer())])('sorted array is ordered', (arr) => {
    const sorted = sort(arr);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]).toBeGreaterThanOrEqual(sorted[i - 1]);
    }
  });
});
```

### Common Properties to Test

```ts
// Roundtrip: encode/decode returns original
it.prop([fc.string()])('JSON roundtrip', (str) => {
  expect(JSON.parse(JSON.stringify(str))).toEqual(str);
});

// Symmetry: operation and inverse cancel out
it.prop([fc.integer()])('negate is symmetric', (n) => {
  expect(negate(negate(n))).toEqual(n);
});

// Invariant: property always holds
it.prop([fc.array(fc.integer())])('length is non-negative', (arr) => {
  expect(arr.length).toBeGreaterThanOrEqual(0);
});

// Idempotence: applying twice = applying once
it.prop([fc.string()])('trim is idempotent', (str) => {
  expect(str.trim().trim()).toEqual(str.trim());
});

// Commutative: order doesn't matter
it.prop([fc.integer(), fc.integer()])('add is commutative', (a, b) => {
  expect(add(a, b)).toEqual(add(b, a));
});

// Associative: grouping doesn't matter
it.prop([fc.integer(), fc.integer(), fc.integer()])('add is associative', (a, b, c) => {
  expect(add(add(a, b), c)).toEqual(add(a, add(b, c)));
});
```

### Custom Arbitraries

```ts
// Custom user generator
const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  age: fc.integer({ min: 18, max: 120 }),
  role: fc.constantFrom('user', 'admin', 'moderator'),
});

// Custom order generator
const orderArbitrary = fc.record({
  id: fc.uuid(),
  items: fc.array(
    fc.record({
      productId: fc.uuid(),
      quantity: fc.integer({ min: 1, max: 100 }),
      price: fc.float({ min: 0.01, max: 10000 }),
    }),
    { minLength: 1, maxLength: 10 }
  ),
});

it.prop([userArbitrary])('user email is always valid', (user) => {
  expect(isValidEmail(user.email)).toBe(true);
});

it.prop([orderArbitrary])('order total is positive', (order) => {
  const total = calculateTotal(order);
  expect(total).toBeGreaterThan(0);
});
```

### Shrinking

fast-check automatically finds minimal failing cases:

```ts
// If this fails for [1000, -500, 42]
// fast-check will shrink to find minimal case like [1, -1]
it.prop([fc.array(fc.integer())])('buggy function', (arr) => {
  expect(buggyFunction(arr)).toBe(true);
});
```

## Mutation Testing

Test your tests by introducing bugs and checking if tests catch them.

### How It Works

1. **Mutate**: Change code in small ways
2. **Test**: Run test suite
3. **Analyze**: Did tests catch the change?

```ts
// Original
function isAdult(age: number): boolean {
  return age >= 18;
}

// Mutations
return age > 18;   // Boundary mutation
return age >= 17;  // Constant mutation
return age <= 18;  // Operator mutation
return true;       // Return value mutation
```

### Stryker Configuration

```json
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "vitest",
  "reporters": ["clear-text", "html", "dashboard"],
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.d.ts"
  ],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  },
  "mutator": {
    "excludedMutations": [
      "StringLiteral",
      "ObjectLiteral"
    ]
  },
  "concurrency": 4,
  "timeoutMS": 10000
}
```

### Interpreting Results

```
Mutation testing finished.
Ran 847 tests against 124 mutants.

┌─────────────────────────────────────────────────────┐
│ File                     │ % Score │ Killed │ Survived │
├─────────────────────────────────────────────────────┤
│ src/services/order.ts    │  78.3%  │   47   │    13    │
│ src/services/user.ts     │  91.2%  │   31   │     3    │
│ src/utils/validation.ts  │  95.0%  │   19   │     1    │
└─────────────────────────────────────────────────────┘

Mutation score: 85.48%
```

### Fixing Survived Mutants

```ts
// Survived mutant: age >= 18 → age > 18
// This means no test checks the boundary condition

// Add test for boundary
it('person aged 18 is adult', () => {
  expect(isAdult(18)).toBe(true);
});

it('person aged 17 is not adult', () => {
  expect(isAdult(17)).toBe(false);
});
```

## Contract Testing

Verify that services can communicate correctly without running them together.

### Consumer-Driven Contracts with Pact

```ts
// Consumer side: Define expectations
import { PactV3, MatchersV3 } from '@pact-foundation/pact';

const { like, eachLike, regex } = MatchersV3;

const provider = new PactV3({
  consumer: 'OrderService',
  provider: 'UserService',
  logLevel: 'warn',
});

describe('User API Contract', () => {
  it('gets user by ID', async () => {
    await provider
      .given('user 123 exists')
      .uponReceiving('a request for user 123')
      .withRequest({
        method: 'GET',
        path: '/users/123',
        headers: {
          Accept: 'application/json',
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: like('123'),
          name: like('John Doe'),
          email: regex(/^[\w-]+@[\w-]+\.\w+$/, 'john@example.com'),
          role: like('user'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new UserApiClient(mockServer.url);
      const user = await client.getUser('123');

      expect(user.id).toBe('123');
      expect(user.email).toContain('@');
    });
  });

  it('handles user not found', async () => {
    await provider
      .given('user does not exist')
      .uponReceiving('a request for nonexistent user')
      .withRequest({
        method: 'GET',
        path: '/users/nonexistent',
      })
      .willRespondWith({
        status: 404,
        body: {
          error: like('User not found'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new UserApiClient(mockServer.url);
      await expect(client.getUser('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
```

### Provider Verification

```ts
// Provider side: Verify against contracts
import { Verifier } from '@pact-foundation/pact';

describe('User Service Provider', () => {
  it('validates the contract with OrderService', async () => {
    const verifier = new Verifier({
      providerBaseUrl: 'http://localhost:3000',
      pactUrls: ['./pacts/orderservice-userservice.json'],
      // Or from Pact Broker
      // pactBrokerUrl: 'https://pact-broker.example.com',
      // providerVersion: process.env.GIT_SHA,
      stateHandlers: {
        'user 123 exists': async () => {
          await db.user.create({
            data: { id: '123', name: 'John Doe', email: 'john@example.com' },
          });
        },
        'user does not exist': async () => {
          await db.user.deleteMany();
        },
      },
    });

    await verifier.verifyProvider();
  });
});
```

### Publishing Contracts

```yaml
# CI workflow
- name: Publish Pact
  run: |
    npx pact-broker publish ./pacts \
      --consumer-app-version=${{ github.sha }} \
      --branch=${{ github.ref_name }} \
      --broker-base-url=${{ secrets.PACT_BROKER_URL }} \
      --broker-token=${{ secrets.PACT_BROKER_TOKEN }}
```

## Chaos Testing

Intentionally introduce failures to test system resilience.

### Application-Level Chaos

```ts
// chaos/ChaosProxy.ts
export class ChaosProxy {
  private target: string;
  private failures: { count: number; status: number } | null = null;
  private latency: number = 0;
  private requestCount: number = 0;

  constructor(target: string) {
    this.target = target;
  }

  injectLatency(ms: number): void {
    this.latency = ms;
  }

  injectFailures(config: { count: number; status: number }): void {
    this.failures = config;
  }

  async request(options: RequestOptions): Promise<Response> {
    this.requestCount++;

    // Inject latency
    if (this.latency > 0) {
      await sleep(this.latency);
    }

    // Inject failures
    if (this.failures && this.failures.count > 0) {
      this.failures.count--;
      return new Response(null, { status: this.failures.status });
    }

    return fetch(`${this.target}${options.path}`, options);
  }

  getRequestCount(): number {
    return this.requestCount;
  }

  restore(): void {
    this.failures = null;
    this.latency = 0;
    this.requestCount = 0;
  }
}
```

### Chaos Testing Examples

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChaosProxy } from './chaos/ChaosProxy';
import { OrderService } from './services/OrderService';

describe('Order Service Resilience', () => {
  let paymentChaos: ChaosProxy;
  let inventoryChaos: ChaosProxy;
  let orderService: OrderService;

  beforeEach(() => {
    paymentChaos = new ChaosProxy('http://payment-service');
    inventoryChaos = new ChaosProxy('http://inventory-service');
    orderService = new OrderService({
      paymentClient: paymentChaos,
      inventoryClient: inventoryChaos,
    });
  });

  afterEach(() => {
    paymentChaos.restore();
    inventoryChaos.restore();
  });

  it('retries on transient payment failures', async () => {
    // First 2 requests fail, then succeed
    paymentChaos.injectFailures({ count: 2, status: 503 });

    const result = await orderService.processPayment({
      orderId: '123',
      amount: 100,
    });

    expect(result.success).toBe(true);
    expect(paymentChaos.getRequestCount()).toBe(3);
  });

  it('handles payment timeout gracefully', async () => {
    paymentChaos.injectLatency(5000);

    const result = await orderService.processPayment({
      orderId: '123',
      amount: 100,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('payment_timeout');
    expect(result.retryable).toBe(true);
  });

  it('falls back when inventory service is down', async () => {
    inventoryChaos.injectFailures({ count: 10, status: 500 });

    const result = await orderService.checkInventory('product-1');

    // Should use cached data or pessimistic default
    expect(result.available).toBe(false);
    expect(result.source).toBe('fallback');
  });

  it('circuit breaker opens after repeated failures', async () => {
    paymentChaos.injectFailures({ count: 100, status: 500 });

    // Make multiple requests to trip circuit breaker
    for (let i = 0; i < 10; i++) {
      await orderService.processPayment({ orderId: `${i}`, amount: 100 });
    }

    // Circuit should be open now
    const result = await orderService.processPayment({
      orderId: '999',
      amount: 100,
    });

    expect(result.error).toBe('circuit_open');
    // Shouldn't have made another actual request
    expect(paymentChaos.getRequestCount()).toBeLessThan(15);
  });
});
```

### Infrastructure Chaos

Using Chaos Mesh in Kubernetes:

```yaml
# chaos/network-delay.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: payment-delay
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - production
    labelSelectors:
      app: payment-service
  delay:
    latency: "500ms"
    jitter: "100ms"
  duration: "5m"
```

```ts
// Test that runs chaos experiment
import { execSync } from 'child_process';

describe('Production Resilience', () => {
  it('handles payment service latency', async () => {
    // Apply chaos
    execSync('kubectl apply -f chaos/network-delay.yaml');

    try {
      // Run actual load test
      const results = await runLoadTest({
        scenario: 'checkout',
        duration: '5m',
        vus: 50,
      });

      // Verify SLOs are maintained
      expect(results.errorRate).toBeLessThan(0.05);
      expect(results.p95Latency).toBeLessThan(3000);
    } finally {
      // Remove chaos
      execSync('kubectl delete -f chaos/network-delay.yaml');
    }
  });
});
```

## Fuzzing

Automated testing with random/malformed inputs.

```ts
// Using a fuzzing library
import { fuzz } from '@jazzer.js/core';

fuzz('processUserInput', (data: Uint8Array) => {
  const input = new TextDecoder().decode(data);

  // Should never throw unexpected errors
  try {
    const result = processUserInput(input);
    // If it returns, it should be valid
    expect(result).toBeDefined();
  } catch (error) {
    // Only expected errors allowed
    expect(error).toBeInstanceOf(ValidationError);
  }
});

// API fuzzing
describe('API Fuzzing', () => {
  it.prop([fc.json()])('handles arbitrary JSON', async (json) => {
    const response = await request(app)
      .post('/api/data')
      .send(json);

    // Should never crash
    expect([200, 400, 422]).toContain(response.status);
  });

  it.prop([fc.string()])('handles arbitrary strings in name', async (name) => {
    const response = await request(app)
      .post('/api/users')
      .send({ name, email: 'test@example.com' });

    // Should validate, not crash
    expect([201, 400, 422]).toContain(response.status);
  });
});
```

## Combining Techniques

```ts
describe('OrderService Comprehensive Tests', () => {
  // Property-based: Test invariants
  it.prop([orderArbitrary])('order total is never negative', (order) => {
    expect(calculateTotal(order)).toBeGreaterThanOrEqual(0);
  });

  // Mutation testing catches weak tests automatically

  // Contract: Verify integration points
  it('adheres to payment service contract', async () => {
    await provider.executeTest(/* ... */);
  });

  // Chaos: Test resilience
  it('handles payment failures gracefully', async () => {
    paymentChaos.injectFailures({ count: 2, status: 503 });
    // ...
  });
});
```
