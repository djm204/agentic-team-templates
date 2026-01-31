# TDD Methodology

Guidelines for practicing Test-Driven Development effectively.

## The Red-Green-Refactor Cycle

TDD follows a disciplined three-step cycle:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌─────────┐      ┌─────────┐      ┌─────────────┐        │
│   │   RED   │ ───► │  GREEN  │ ───► │  REFACTOR   │ ───┐   │
│   │         │      │         │      │             │    │   │
│   │ Write   │      │ Make    │      │ Improve     │    │   │
│   │ failing │      │ it      │      │ code        │    │   │
│   │ test    │      │ pass    │      │ quality     │    │   │
│   └─────────┘      └─────────┘      └─────────────┘    │   │
│       ▲                                                │   │
│       └────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 1: RED (Write Failing Test)

Write a test that describes the behavior you want. It should fail because the code doesn't exist yet.

```ts
describe('calculateTax', () => {
  it('applies 10% tax rate to standard items', () => {
    const result = calculateTax(100, 'standard');
    expect(result).toBe(110);
  });
});
```

Run the test. Watch it fail. **This confirms your test is actually testing something.**

### Step 2: GREEN (Make It Pass)

Write the **minimum** code necessary to make the test pass. Don't over-engineer.

```ts
function calculateTax(amount: number, type: string): number {
  if (type === 'standard') {
    return amount * 1.10;
  }
  return amount;
}
```

### Step 3: REFACTOR (Improve Quality)

Now that tests pass, improve the code without changing behavior. Tests give you confidence to refactor.

```ts
const TAX_RATES: Record<string, number> = {
  standard: 0.10,
  reduced: 0.05,
  exempt: 0,
};

function calculateTax(amount: number, type: TaxType): number {
  const rate = TAX_RATES[type] ?? 0;
  return amount * (1 + rate);
}
```

## TDD Best Practices

### Keep Cycles Short

Each red-green-refactor cycle should take **2-10 minutes**. If you're stuck in red for more than 10 minutes, your slice is too big.

### One Test at a Time

Write one failing test, make it pass, refactor. Don't write multiple failing tests.

### Start with the Simplest Case

```ts
// Start here
it('returns 0 for empty cart', () => {
  expect(calculateTotal([])).toBe(0);
});

// Then add complexity
it('sums single item price', () => {
  expect(calculateTotal([{ price: 100 }])).toBe(100);
});

// Then more
it('sums multiple items', () => {
  expect(calculateTotal([{ price: 100 }, { price: 50 }])).toBe(150);
});
```

### Test the API, Not the Implementation

Write tests against the public interface. Don't test private methods.

```ts
// Bad: Testing internals
it('calls _parseInput internally', () => {
  const spy = vi.spyOn(parser, '_parseInput');
  parser.parse('data');
  expect(spy).toHaveBeenCalled();
});

// Good: Testing behavior
it('parses valid JSON', () => {
  const result = parser.parse('{"key": "value"}');
  expect(result).toEqual({ key: 'value' });
});
```

### Write the Test You Wish You Had

Ask yourself: "What test would give me confidence this works?" Then write that test.

## TDD Patterns

### Triangulation

Use multiple examples to drive toward a general solution:

```ts
it('calculates shipping for weight 1kg', () => {
  expect(calculateShipping(1)).toBe(5);
});

it('calculates shipping for weight 2kg', () => {
  expect(calculateShipping(2)).toBe(10);
});

// Now the pattern is clear: $5/kg
```

### Transformation Priority Premise

When making tests pass, prefer simpler transformations:

1. `{} → nil` (empty to null/nil)
2. `nil → constant` (null to specific value)
3. `constant → constant+` (simple to more complex)
4. `constant → scalar` (to variable)
5. `statement → statements` (add more statements)
6. `unconditional → if` (add conditional)
7. `scalar → collection` (to array/list)
8. `collection → collection+` (add to collection)
9. `statement → recursion` (add recursion)
10. `if → while` (conditional to loop)
11. `expression → function` (extract expression)
12. `variable → assignment` (complex assignment)

### Test List

Before coding, write a list of tests you think you'll need:

```
calculateDiscount:
- [ ] returns 0 for no discount
- [ ] applies percentage discount
- [ ] applies fixed discount
- [ ] caps discount at item price (no negative)
- [ ] handles zero price
- [ ] throws for negative discount value
```

Work through the list, adding tests you discover along the way.

## When TDD Adds Maximum Value

- **Complex business logic** - Rules that are easy to get wrong
- **Algorithms** - Sort, search, validation
- **State machines** - Transitions, edge cases
- **Financial calculations** - Money, taxes, discounts
- **Security logic** - Auth, permissions, validation
- **Integration points** - APIs, databases, queues

## When to Adapt TDD

### Spike and Stabilize

For exploratory work, spike first, then write tests:

1. Write throwaway code to understand the problem
2. Delete the spike
3. TDD the real implementation

### Outside-In vs Inside-Out

**Outside-In (London School):**
- Start with E2E test
- Mock dependencies
- Work inward

**Inside-Out (Chicago School):**
- Start with domain logic
- Build up from units
- Integrate at the end

Choose based on what you're building.

## Common TDD Mistakes

### 1. Skipping the Red Phase

If you write code before the test, you don't know if the test works.

### 2. Writing Too Many Tests at Once

This defeats the purpose. Write one test, make it pass, repeat.

### 3. Not Refactoring

The refactor step is not optional. Skipping it leaves messy code.

### 4. Testing Implementation Details

This makes refactoring painful. Test behavior, not internals.

### 5. Giant Leaps

If your test requires lots of code to pass, break it into smaller tests.

## Example: TDD Session

Let's TDD a password validator:

```ts
// Test 1: Red
it('rejects empty password', () => {
  expect(validatePassword('')).toEqual({ valid: false, errors: ['Password is required'] });
});

// Green
function validatePassword(password: string) {
  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }
  return { valid: true, errors: [] };
}

// Test 2: Red
it('rejects password under 8 characters', () => {
  expect(validatePassword('abc')).toEqual({ 
    valid: false, 
    errors: ['Password must be at least 8 characters'] 
  });
});

// Green
function validatePassword(password: string) {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  return { valid: errors.length === 0, errors };
}

// Test 3: Red
it('requires at least one uppercase letter', () => {
  expect(validatePassword('abcdefgh')).toEqual({
    valid: false,
    errors: ['Password must contain at least one uppercase letter'],
  });
});

// Green + Refactor
const RULES = [
  { test: (p: string) => p.length >= 8, error: 'Password must be at least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), error: 'Password must contain at least one uppercase letter' },
];

function validatePassword(password: string) {
  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  const errors = RULES
    .filter(rule => !rule.test(password))
    .map(rule => rule.error);

  return { valid: errors.length === 0, errors };
}
```

Each cycle is small, focused, and builds confidence.
