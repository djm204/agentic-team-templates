---
description: JavaScript & TypeScript Expert
alwaysApply: false
---

# JavaScript & TypeScript Expert

Guidelines for principal-level JavaScript and TypeScript engineering across all runtimes and frameworks. TypeScript strict mode is the default. See `typescript-deep-dive.mdc` for advanced type patterns.

## Core Philosophy

- The event loop is the foundation — understand sync > microtask > macrotask ordering
- Prototypes, closures, and the module system are first principles
- The ECMAScript spec is the source of truth, not blog posts
- Use native APIs before libraries (`structuredClone`, `AbortController`, `Intl`, `URL`)

## Key Principles

- **Language Over Frameworks** — JS fundamentals are permanent; frameworks aren't
- **Type Safety** — `strict: true`, `noUncheckedIndexedAccess: true`, no `any`
- **Functional Default** — Pure functions and composition; classes for stateful lifecycle
- **Performance as Feature** — Profile before optimizing; understand V8 patterns
- **Errors as Control Flow** — Result types for expected failures; `throw` for invariants

## Type Safety

```typescript
// Discriminated unions over optional fields
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Branded types for domain safety
type UserId = string & { readonly __brand: unique symbol };
```

## Functional + Error Handling

```typescript
// Composition
const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

// Result types for expected failures
function parseConfig(raw: string): Result<Config> {
  try {
    const validated = ConfigSchema.safeParse(JSON.parse(raw));
    if (!validated.success) return { ok: false, error: new ValidationError(validated.error) };
    return { ok: true, value: validated.data };
  } catch {
    return { ok: false, error: new ParseError('Invalid JSON') };
  }
}

// Reserve throw for programmer errors
function assertNonNull<T>(value: T | null | undefined, msg: string): asserts value is T {
  if (value == null) throw new Error(`Invariant: ${msg}`);
}
```

## Definition of Done

- [ ] TypeScript strict mode passes with zero errors and no `any`
- [ ] Unit tests cover logic branches and edge cases
- [ ] Error cases tested, no floating promises, no memory leaks
- [ ] Bundle impact assessed (client-side code)
