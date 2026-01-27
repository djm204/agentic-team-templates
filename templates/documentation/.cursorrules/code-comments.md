# Code Comments

Guidelines for inline comments, docstrings, and API documentation.

## The Comment Hierarchy

### 1. Self-Documenting Code (Preferred)

Good naming eliminates the need for most comments.

```typescript
// Bad: Requires comment to understand
const d = 86400; // seconds in a day

// Good: Self-documenting
const SECONDS_PER_DAY = 86400;
```

```typescript
// Bad: Comment explains what code does
// Check if user is admin
if (user.role === 'admin') { ... }

// Good: Code speaks for itself
if (user.isAdmin()) { ... }
```

### 2. Inline Comments (Why, Not What)

Comments explain *why*, not *what*. The code shows what; comments show intent.

```typescript
// Good: Explains why
// Using retry logic because the payment API is flaky during peak hours
await retryWithBackoff(processPayment, 3);

// Bad: Explains what (obvious from code)
// Increment counter by 1
counter++;

// Bad: Outdated comment
// Send email to user
await sendSlackNotification(user); // Code changed, comment didn't
```

### 3. Warning Comments

Flag non-obvious gotchas and constraints.

```typescript
// WARNING: This function is not thread-safe. 
// Always call from the main thread.
function updateGlobalState() { ... }

// HACK: Workaround for Chrome bug #12345
// Remove after Chrome 120 ships
element.style.transform = 'translateZ(0)';

// TODO(username): Refactor when API v2 launches
// Tracking issue: #456
```

## API Documentation (Docstrings)

### Purpose

API documentation is **the contract** for how code must behave. It tells future developers:
- What the function/class does
- How to use it
- What to expect

### TypeScript/JavaScript (JSDoc/TSDoc)

```typescript
/**
 * Calculates the total price including tax and discounts.
 * 
 * @param items - Array of cart items to price
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param couponCode - Optional discount coupon
 * @returns The final price in cents
 * @throws {InvalidCouponError} If coupon code is expired or invalid
 * 
 * @example
 * ```ts
 * const total = calculateTotal(cartItems, 0.08, 'SAVE10');
 * ```
 */
function calculateTotal(
  items: CartItem[],
  taxRate: number,
  couponCode?: string
): number { ... }
```

### Python (Docstrings)

```python
def calculate_total(items: list[CartItem], tax_rate: float, coupon_code: str | None = None) -> int:
    """
    Calculate the total price including tax and discounts.

    Args:
        items: List of cart items to price.
        tax_rate: Tax rate as decimal (e.g., 0.08 for 8%).
        coupon_code: Optional discount coupon.

    Returns:
        The final price in cents.

    Raises:
        InvalidCouponError: If coupon code is expired or invalid.

    Example:
        >>> total = calculate_total(cart_items, 0.08, 'SAVE10')
    """
    ...
```

### Go (Godoc)

```go
// CalculateTotal computes the final price including tax and discounts.
//
// The taxRate should be provided as a decimal (e.g., 0.08 for 8%).
// If couponCode is empty, no discount is applied.
//
// Returns an error if the coupon code is expired or invalid.
func CalculateTotal(items []CartItem, taxRate float64, couponCode string) (int, error) {
    ...
}
```

## What to Document

### Always Document

```typescript
/**
 * Public functions and methods
 * - What it does (one sentence)
 * - Parameters and return values
 * - Exceptions/errors thrown
 * - Example usage for complex APIs
 */

/**
 * Non-obvious constraints
 * - Thread safety requirements
 * - Performance characteristics
 * - Valid input ranges
 */

/**
 * Side effects
 * - External API calls
 * - Database modifications
 * - File system changes
 */
```

### Skip Documentation For

```typescript
// Obvious getters/setters (unless they have side effects)
function getName(): string { return this.name; }

// Private implementation details
private parseInternal(data: Buffer): void { ... }

// Self-explanatory one-liners
const isActive = user.status === 'active';
```

## Class/Module Documentation

```typescript
/**
 * Manages user authentication and session lifecycle.
 * 
 * This service handles login, logout, token refresh, and session
 * validation. All methods are thread-safe.
 * 
 * @example Basic usage
 * ```ts
 * const auth = new AuthService(config);
 * const session = await auth.login(credentials);
 * ```
 * 
 * @example With token refresh
 * ```ts
 * auth.on('tokenExpiring', async () => {
 *   await auth.refreshToken();
 * });
 * ```
 */
class AuthService { ... }
```

## Comment Anti-Patterns

### Commented-Out Code

```typescript
// Bad: Use version control instead
// function oldImplementation() {
//   return legacyCalculation();
// }
function newImplementation() { ... }
```

### Noise Comments

```typescript
// Bad: Adds no value
// Constructor
constructor() { }

// Bad: Repeats the obvious
// Loop through users
for (const user of users) { }
```

### Outdated Comments

```typescript
// Bad: Comment lies about what code does
// Returns the user's full name
function getDisplayName(user: User): string {
  return user.username; // Actually returns username
}
```

## Comment Formatting

### Use Consistent Style

```typescript
// Single-line comments for brief notes
// Use sentence case with period.

/**
 * Multi-line comments for API documentation.
 * Keep lines under 80-100 characters.
 * Use proper grammar and punctuation.
 */

// TODO: Use consistent format for action items
// TODO(username): Include who if assignment needed
// FIXME: For bugs that need fixing
// HACK: For temporary workarounds
// NOTE: For important clarifications
```
