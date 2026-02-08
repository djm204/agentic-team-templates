---
description: Frontend Testing
alwaysApply: false
---

# Frontend Testing

Guidelines for testing frontend applications effectively.

## Philosophy

Test user behaviour, not implementation details. Prioritize by confidence:
1. **Static Analysis** (TypeScript, ESLint) — cheap, fast
2. **Unit Tests** — pure functions, utilities
3. **Integration Tests** — components working together
4. **E2E Tests** — critical user flows

## Unit Tests

```ts
describe('formatCurrency', () => {
  it('formats USD', () => expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56'));
  it('handles zero', () => expect(formatCurrency(0, 'USD')).toBe('$0.00'));
});
```

## Component Tests

```tsx
test('shows error on invalid submit', async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

## Accessibility Tests

```tsx
test('no a11y violations', async () => {
  const { container } = render(<Button>Click</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

## E2E Tests (Critical Paths)

```ts
test('user completes purchase', async ({ page }) => {
  await page.goto('/products');
  await page.click('text=Add to Cart');
  await page.click('text=Checkout');
  await expect(page.locator('text=Order Confirmed')).toBeVisible();
});
```

## Query Priority

1. `getByRole` — most accessible
2. `getByLabelText` — form fields
3. `getByText` — content
4. `getByTestId` — last resort

## Mocking

- API calls: MSW (`setupServer` with handlers)
- Modules: `vi.mock('./analytics', () => ({ trackEvent: vi.fn() }))`
- Reset handlers in `afterEach`, close server in `afterAll`

## Best Practices

- Test what users see, not internal state or class names
- One assertion per concept; focused test names
- Co-locate tests: `Button.test.tsx` next to `Button.tsx`
- Separate E2E tests in `e2e/` directory
