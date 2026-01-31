# Frontend Testing

Guidelines for testing frontend applications effectively.

## Testing Philosophy

### Test User Behavior, Not Implementation

Focus on what users see and do, not internal component details.

```tsx
// Good: Test what user sees
test('shows error when form is invalid', async () => {
  render(<LoginForm />);

  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});

// Bad: Test implementation details
test('sets hasError state to true', () => {
  const { result } = renderHook(() => useLoginForm());

  act(() => result.current.validate());

  expect(result.current.hasError).toBe(true);  // Testing internal state
});
```

### The Testing Trophy

Prioritize tests by confidence and cost:
1. **Static Analysis** (TypeScript, ESLint) - Cheap, fast
2. **Unit Tests** - Pure functions, utilities
3. **Integration Tests** - Components working together
4. **E2E Tests** - Critical user flows

## Unit Tests

For pure functions and utilities.

```ts
// utils/formatCurrency.test.ts
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats USD correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-50, 'USD')).toBe('-$50.00');
  });
});
```

## Component Tests

Test components as users interact with them.

### Basic Component Test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('increments when plus button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter initialValue={0} />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onChange with new value', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Counter initialValue={0} onChange={handleChange} />);

    await user.click(screen.getByRole('button', { name: /increment/i }));

    expect(handleChange).toHaveBeenCalledWith(1);
  });
});
```

### Testing Forms

```tsx
describe('LoginForm', () => {
  it('submits form with email and password', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<LoginForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
});
```

### Testing Async Operations

```tsx
describe('UserProfile', () => {
  it('shows loading state then user data', async () => {
    render(<UserProfile userId="123" />);

    // Loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it('shows error state on failure', async () => {
    server.use(
      rest.get('/api/users/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<UserProfile userId="123" />);

    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

## Accessibility Tests

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## E2E Tests

For critical user journeys.

```ts
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('user can complete purchase', async ({ page }) => {
    // Add item to cart
    await page.goto('/products');
    await page.click('[data-testid="product-1"] >> text=Add to Cart');

    // Go to cart
    await page.click('text=Cart (1)');
    expect(page.url()).toContain('/cart');

    // Proceed to checkout
    await page.click('text=Checkout');

    // Fill shipping info
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="address"]', '123 Main St');

    // Complete purchase
    await page.click('text=Place Order');

    // Verify success
    await expect(page.locator('text=Order Confirmed')).toBeVisible();
  });
});
```

## Mocking

### Mock API Calls

```tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Mock Modules

```tsx
vi.mock('./analytics', () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from './analytics';

test('tracks button click', async () => {
  const user = userEvent.setup();
  render(<TrackedButton />);

  await user.click(screen.getByRole('button'));

  expect(trackEvent).toHaveBeenCalledWith('button_click');
});
```

## Best Practices

### Query Priority

Use queries in this order (most accessible first):
1. `getByRole` - Accessible to everyone
2. `getByLabelText` - Good for form fields
3. `getByPlaceholderText` - Less ideal but okay
4. `getByText` - For non-interactive content
5. `getByTestId` - Last resort

### Avoid Testing Implementation Details

```tsx
// Bad: Testing internal state
expect(component.state.isOpen).toBe(true);

// Bad: Testing class names
expect(container.querySelector('.modal--open')).toBeInTheDocument();

// Good: Testing what user sees
expect(screen.getByRole('dialog')).toBeVisible();
```

### One Assertion Per Concept

```tsx
// Good: Focused tests
it('shows user name', () => {
  render(<UserCard user={mockUser} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});

it('shows user email', () => {
  render(<UserCard user={mockUser} />);
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});

// Acceptable: Related assertions
it('shows user info', () => {
  render(<UserCard user={mockUser} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});
```

## Test Organization

```
src/
├── components/
│   └── Button/
│       ├── Button.tsx
│       └── Button.test.tsx  # Co-located unit tests
├── features/
│   └── auth/
│       └── __tests__/       # Feature integration tests
│           └── login.test.tsx
└── test/
    ├── setup.ts             # Test configuration
    └── utils.tsx            # Test utilities

e2e/
├── auth.spec.ts             # E2E tests
└── checkout.spec.ts
```
