---
description: Backend Testing
alwaysApply: false
---

# Backend Testing

Guidelines for testing backend applications effectively.

## Testing Pyramid

1. **Unit Tests** — Fast, isolated, test business logic and utilities
2. **Integration Tests** — Test with real database, repository layer
3. **API Tests** — Full HTTP request/response cycle with supertest

## Unit Tests

```ts
describe('calculateDiscount', () => {
  it('applies percentage', () => {
    expect(calculateDiscount(100, { type: 'percentage', value: 10 })).toBe(90);
  });
  it('does not go below zero', () => {
    expect(calculateDiscount(10, { type: 'fixed', value: 20 })).toBe(0);
  });
});
```

## Integration Tests

```ts
describe('userRepository', () => {
  beforeEach(() => db.user.deleteMany());
  it('creates user', async () => {
    const user = await userRepository.create({ email: 'a@b.com', name: 'Test' });
    expect(user.id).toBeDefined();
  });
  it('throws on duplicate email', async () => {
    await userRepository.create({ email: 'a@b.com', name: 'U1' });
    await expect(userRepository.create({ email: 'a@b.com', name: 'U2' })).rejects.toThrow();
  });
});
```

## API Tests

```ts
it('creates user', async () => {
  const res = await request(app).post('/users')
    .set('Authorization', `Bearer ${token}`)
    .send({ email: 'new@test.com', name: 'New' });
  expect(res.status).toBe(201);
});
it('validates email', async () => {
  const res = await request(app).post('/users')
    .set('Authorization', `Bearer ${token}`)
    .send({ email: 'invalid', name: 'Test' });
  expect(res.status).toBe(422);
});
```

## Mocking

- Mock external services (email, payment) with `vi.mock()`
- Mock database only for unit-testing service logic; use real DB for integration
- Use factories with `@faker-js/faker` for test data

## Best Practices

- **Test behavior, not implementation**: Assert on persisted data, not `repo.save` calls
- **One assertion per concept**: Separate tests for auth, validation, success cases
- **Descriptive names**: `creates order when cart is valid`, `returns 409 when out of stock`
- **Co-locate tests**: `userService.test.ts` next to `userService.ts`
- **Clean state**: Truncate tables in `beforeEach`, use test database
