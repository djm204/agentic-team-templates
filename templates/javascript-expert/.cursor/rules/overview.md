# JavaScript & TypeScript Expert

Guidelines for principal-level JavaScript and TypeScript engineering across all runtimes, frameworks, and paradigms.

**This template covers both JavaScript and TypeScript.** TypeScript is the default — all code is written in strict TypeScript. The advanced type system is covered in `typescript-deep-dive.md`.

## Scope

This ruleset applies to:
- Node.js services, CLIs, and tooling
- React, Vue, Angular, Svelte, and other UI frameworks
- Vanilla JavaScript and Web APIs
- TypeScript (strict mode, always — see `typescript-deep-dive.md` for advanced patterns)
- Build tools, bundlers, and transpilers
- Testing at every level (unit, integration, E2E, performance)

## Core Philosophy

JavaScript is the runtime. Know it deeply:
- The event loop is not optional knowledge — it's the foundation
- Prototypes, closures, and the module system are first principles
- The spec (ECMAScript) is the source of truth, not blog posts
- Every abstraction leaks — understand what's underneath

## Key Principles

### 1. Language Mastery Over Framework Dependence

Frameworks come and go. JavaScript fundamentals are permanent:
- Understand `this` binding rules (default, implicit, explicit, `new`)
- Know the difference between the task queue, microtask queue, and rendering pipeline
- Use native APIs before reaching for libraries (`structuredClone`, `AbortController`, `Intl`, `URL`, `crypto.subtle`)
- Understand generator functions, iterators, and async iteration

### 2. Type Safety Is Non-Negotiable

```typescript
// Always: strict TypeScript
// tsconfig.json: "strict": true, "noUncheckedIndexedAccess": true

// Prefer discriminated unions over optional fields
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Use const assertions and template literal types
const EVENTS = ['click', 'keydown', 'submit'] as const;
type EventName = (typeof EVENTS)[number];

// Branded types for domain safety
type UserId = string & { readonly __brand: unique symbol };
type Email = string & { readonly __brand: unique symbol };
```

### 3. Functional by Default, Object-Oriented When It Fits

```typescript
// Prefer pure functions and composition
const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

const processUser = pipe(
  validateInput,
  normalizeEmail,
  hashPassword,
  persistToDb,
);

// Use classes for stateful services with clear lifecycle
class ConnectionPool {
  readonly #connections: Map<string, Connection>;
  constructor(private readonly config: PoolConfig) {
    this.#connections = new Map();
  }
}
```

### 4. Performance Is a Feature

- Profile before optimizing — measure, don't guess
- Understand V8 optimization patterns (monomorphic calls, hidden classes, inline caches)
- Know when to use `Map`/`Set` over plain objects and arrays
- Avoid unnecessary allocations in hot paths
- Use `WeakRef` and `FinalizationRegistry` when appropriate

### 5. Error Handling Is Control Flow

```typescript
// Use Result types, not thrown exceptions for expected failures
function parseConfig(raw: string): Result<Config> {
  try {
    const parsed = JSON.parse(raw);
    const validated = ConfigSchema.safeParse(parsed);
    if (!validated.success) {
      return { ok: false, error: new ValidationError(validated.error) };
    }
    return { ok: true, value: validated.data };
  } catch {
    return { ok: false, error: new ParseError('Invalid JSON') };
  }
}

// Reserve throw for programmer errors (invariant violations)
function assertNonNull<T>(value: T | null | undefined, msg: string): asserts value is T {
  if (value == null) throw new Error(`Invariant: ${msg}`);
}
```

## Project Structure

```
src/
├── core/              # Pure business logic, zero dependencies
├── adapters/          # External integrations (DB, HTTP, FS)
├── services/          # Orchestration layer
├── utils/             # Pure utility functions
├── types/             # TypeScript type definitions
├── __tests__/         # Test files (co-located or centralized)
└── index.ts           # Public API surface
```

## Definition of Done

A JavaScript feature is complete when:
- [ ] TypeScript strict mode passes with zero errors
- [ ] All code paths have explicit types (no `any`, no implicit `any`)
- [ ] Unit tests cover logic branches and edge cases
- [ ] Integration tests verify external boundaries
- [ ] Error cases are tested, not just happy paths
- [ ] No floating promises (all async paths handled)
- [ ] No memory leaks in long-running code paths
- [ ] Bundle impact assessed (for client-side code)
