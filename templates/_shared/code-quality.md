# Code Quality Standards

Universal code quality principles applicable across all languages and frameworks.

## SOLID Principles

### Single Responsibility (S)
One function, one job. One class, one purpose.

```
// Good
function validateEmail(email: string): boolean { ... }
function sendEmail(email: string, body: string): void { ... }

// Bad
function validateAndSendEmail(email: string, body: string): boolean { ... }
```

### Open/Closed (O)
Extend via composition, not modification.

```
// Good: Extend behavior through composition
const enhancedLogger = compose(addTimestamp, addContext)(baseLogger);

// Bad: Modify existing code to add features
function logger(msg) {
  if (config.addTimestamp) { ... }  // Adding more conditionals over time
}
```

### Liskov Substitution (L)
Subtypes must be substitutable for their base types.

### Interface Segregation (I)
Small, focused interfaces over large, general ones.

### Dependency Inversion (D)
Depend on abstractions, not concrete implementations.

```
// Good: Inject dependencies
function processOrder(orderRepo: OrderRepository) { ... }

// Bad: Import concrete implementations
import { MySQLOrderRepo } from './mysql-repo';
function processOrder() { const repo = new MySQLOrderRepo(); ... }
```

## DRY (Don't Repeat Yourself)

- Abstract repeated patterns into utilities
- Create reusable components/functions
- One source of truth for validation logic, constants, configurations
- BUT: Don't over-abstract. Three similar lines is often better than a premature abstraction.

## Clean Code Practices

### Naming
- Use intention-revealing names
- Avoid abbreviations unless universally understood
- Be consistent with naming conventions
- Names should be searchable

```
// Good
const maxConnectionRetries = 3;
const userEmailAddress = getEmail(user);

// Bad
const max = 3;
const e = getE(u);
```

### Functions
- Keep functions small (ideally < 20 lines)
- Functions should do one thing
- Minimize arguments (0-3 is ideal)
- Avoid side effects when possible
- Return early to reduce nesting

```
// Good: Return early
function getDiscount(user) {
  if (!user) return 0;
  if (!user.isPremium) return 0;
  return user.discountRate;
}

// Bad: Deep nesting
function getDiscount(user) {
  if (user) {
    if (user.isPremium) {
      return user.discountRate;
    }
  }
  return 0;
}
```

### Comments
- Code should be self-documenting
- Comments explain *why*, not *what*
- Delete commented-out code (that's what git is for)
- Keep comments up-to-date or delete them

```
// Good: Explains why
// Using retry logic because the external API is flaky during peak hours
await retryWithBackoff(apiCall, 3);

// Bad: Explains what (obvious from code)
// Increment counter by 1
counter++;
```

## Error Handling

- Never swallow errors silently
- Provide meaningful error messages
- Fail fast with clear diagnostics
- Handle errors at the appropriate level

```
// Good
function parseConfig(path: string): Result<Config, ConfigError> {
  const content = readFile(path);
  if (!content.ok) {
    return err(new ConfigError(`Failed to read config at ${path}: ${content.error}`));
  }
  // ...
}

// Bad
function parseConfig(path: string): Config | null {
  try {
    // ...
  } catch (e) {
    return null;  // Caller has no idea what went wrong
  }
}
```

## Immutability

Prefer immutable data structures and pure functions.

```
// Good: Immutable update
const updatedUser = { ...user, name: newName };

// Bad: Mutation
user.name = newName;
```

## Avoid Over-Engineering

- Only make changes that are directly requested or clearly necessary
- Don't add features, refactor code, or make "improvements" beyond what was asked
- Don't add error handling for scenarios that can't happen
- Don't create helpers or abstractions for one-time operations
- Don't design for hypothetical future requirements
