---
description: JavaScript Testing
alwaysApply: false
---

# JavaScript Testing

- Tests are production code — same quality standards
- Test behavior and contracts, never implementation details
- Every bug fix starts with a failing test
- If it's hard to test, the design is wrong

## Unit Tests

```typescript
describe('clamp', () => {
  it('returns value when within range', () => { expect(clamp(5, 0, 10)).toBe(5); });
  it('returns min when below range', () => { expect(clamp(-5, 0, 10)).toBe(0); });
  it('returns max when above range', () => { expect(clamp(15, 0, 10)).toBe(10); });
});

// Parameterized
it.each([
  ['Hello World', 'hello-world'],
  ['Special!@#Chars', 'specialchars'],
])('slugify "%s" → "%s"', (input, expected) => { expect(slugify(input)).toBe(expected); });
```

## Component Tests

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('adds a new todo when form is submitted', async () => {
  const user = userEvent.setup();
  render(<TodoList />);
  await user.type(screen.getByRole('textbox', { name: /new todo/i }), 'Buy milk');
  await user.click(screen.getByRole('button', { name: /add/i }));
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});
```

## Mocking (MSW for APIs)

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
const server = setupServer(
  http.get('/api/users/:id', ({ params }) => HttpResponse.json({ id: params.id, name: 'Test' })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- Mock at boundaries (HTTP, DB), not internals — if you need to mock internals, redesign
- Use dependency injection for testability

## E2E Tests (Playwright)

```typescript
test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

## Anti-Patterns

- Never test implementation details (internal state, class names)
- Never `setTimeout` for waiting — use `waitFor` or `findBy`
- Never let tests depend on execution order; never ignore flaky tests
