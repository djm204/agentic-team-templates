---
description: Test Types
alwaysApply: false
---

# Test Types

Apply the right test type based on confidence-to-cost ratio.

## Static Analysis (~10%)

Catches type mismatches, null access, unused variables, import errors at zero runtime cost. Use TypeScript strict mode and ESLint with strict rules. Catches ~20% of bugs instantly.

## Unit Tests (~20%)

Test pure functions and isolated logic. Fast (< 10ms), no I/O, deterministic.

```ts
describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, { type: 'percentage', value: 10 })).toBe(90);
  });
  it('does not produce negative values', () => {
    expect(calculateDiscount(10, { type: 'fixed', value: 100 })).toBe(0);
  });
});
```

**Test**: pure functions, utilities, validation, algorithms, business rules.
**Skip**: simple getters, framework code, trivial wrappers.

## Integration Tests (~60%)

Test components working together with real dependencies. Best confidence/cost ratio.

```ts
it('creates order with correct total', async () => {
  const order = await orderService.createOrder({
    userId: user.id, items: [{ productId: p.id, quantity: 2 }],
  });
  expect(order.total).toBe(200);
  expect(order.status).toBe('pending');
});
```

**Test**: service + DB, API routes, message handlers, multi-component interactions.

## E2E Tests (~10%)

Test critical user journeys through the full stack. Slow (10-60s), expensive, high confidence.

**Test**: checkout/payment flows, authentication, core user journeys.
**Skip**: every UI state, form validation, edge cases (use integration/unit).

## Decision Guide

```text
Pure logic, no deps?         → Unit test
Involves DB/services?        → Integration test
Critical user journey?       → E2E test
Everything else?             → Integration test
```

## Comparison

| Aspect | Unit | Integration | E2E |
|--------|------|-------------|-----|
| Speed | < 10ms | 100-500ms | 10-60s |
| Confidence | Medium | High | Highest |
| Maintenance | Low | Medium | High |
| Real deps | No | Yes | Yes |
