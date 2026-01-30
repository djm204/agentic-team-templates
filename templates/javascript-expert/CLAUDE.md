# JavaScript Expert Development Guide

Comprehensive guidelines for principal-level JavaScript engineering across all runtimes, frameworks, and paradigms.

---

## Overview

This guide applies to:
- Node.js services, CLIs, and tooling
- React, Vue, Angular, Svelte, and other UI frameworks
- Vanilla JavaScript and Web APIs
- TypeScript (strict mode, always)
- Build tools, bundlers, and transpilers
- Testing at every level (unit, integration, E2E, performance)

### Core Philosophy

JavaScript is the runtime. Know it deeply:
- The event loop is not optional knowledge — it's the foundation
- Prototypes, closures, and the module system are first principles
- The spec (ECMAScript) is the source of truth, not blog posts
- Every abstraction leaks — understand what's underneath

### Key Principles

1. **Language Mastery Over Framework Dependence** - Frameworks come and go, JS fundamentals are permanent
2. **Type Safety Is Non-Negotiable** - TypeScript strict mode, always
3. **Functional by Default** - Pure functions and composition, classes when lifecycle demands it
4. **Performance Is a Feature** - Profile before optimizing, measure don't guess
5. **Error Handling Is Control Flow** - Result types over thrown exceptions

### Project Structure

```
src/
├── core/              # Pure business logic, zero dependencies
├── adapters/          # External integrations (DB, HTTP, FS)
├── services/          # Orchestration layer
├── utils/             # Pure utility functions
├── types/             # TypeScript type definitions
├── __tests__/         # Test files
└── index.ts           # Public API surface
```

---

## Language Deep Dive

### The Event Loop

Understanding execution order is fundamental:

```typescript
console.log('1 - sync');
setTimeout(() => console.log('2 - macrotask'), 0);
Promise.resolve().then(() => console.log('3 - microtask'));
queueMicrotask(() => console.log('4 - microtask'));
console.log('5 - sync');
// Output: 1, 5, 3, 4, 2
```

### Type Safety

```typescript
// Discriminated unions over optional fields
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Branded types for domain safety
type UserId = string & { readonly __brand: unique symbol };

// Const assertions and template literal types
const EVENTS = ['click', 'keydown', 'submit'] as const;
type EventName = (typeof EVENTS)[number];
```

### Functional Patterns

```typescript
const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T => fns.reduce((acc, fn) => fn(acc), value);

const processUser = pipe(validateInput, normalizeEmail, hashPassword);
```

### Async Patterns

```typescript
// Parallel independent operations
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

// Race with timeout
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);

// Async iteration for streams
async function* readChunks(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
```

### Generators and Lazy Evaluation

```typescript
function* filter<T>(iterable: Iterable<T>, predicate: (item: T) => boolean) {
  for (const item of iterable) {
    if (predicate(item)) yield item;
  }
}

function* take<T>(iterable: Iterable<T>, count: number) {
  let i = 0;
  for (const item of iterable) {
    if (i++ >= count) break;
    yield item;
  }
}
```

### Error Handling

```typescript
// Result types for expected failures
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

// Reserve throw for invariant violations
function assertNonNull<T>(value: T | null | undefined, msg: string): asserts value is T {
  if (value == null) throw new Error(`Invariant: ${msg}`);
}
```

---

## Node.js Patterns

### Graceful Shutdown

```typescript
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close();
  await db.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### Streams

```typescript
import { pipeline } from 'node:stream/promises';

await pipeline(
  createReadStream('input.log'),
  new Transform({
    transform(chunk, _encoding, callback) {
      const filtered = chunk.toString()
        .split('\n')
        .filter((line: string) => line.includes('ERROR'))
        .join('\n');
      callback(null, filtered);
    },
  }),
  createGzip(),
  createWriteStream('errors.log.gz'),
);
```

### Worker Threads

```typescript
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

if (isMainThread) {
  const runWorker = <T>(data: unknown): Promise<T> =>
    new Promise((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url), { workerData: data });
      worker.on('message', resolve);
      worker.on('error', reject);
    });
} else {
  const result = performExpensiveComputation(workerData);
  parentPort!.postMessage(result);
}
```

### Configuration

```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url(),
});

export const env = EnvSchema.parse(process.env);
```

---

## React Patterns

### Server Components First (React 19+)

```tsx
// Default: Server Component — no 'use client'
async function ProjectList() {
  const projects = await db.projects.findMany();
  return <ul>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</ul>;
}

// Only add 'use client' when you need interactivity
'use client';
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Composition Patterns

```tsx
// Compound components
function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.List = function TabList({ children }) { ... };
Tabs.Panel = function TabPanel({ children, index }) { ... };
```

### State Management Hierarchy

1. `useState` — local state
2. `useReducer` — complex local state with actions
3. Context — low-frequency shared state (theme, auth, locale)
4. External store (Zustand, Jotai) — high-frequency shared state

### Anti-Patterns

```tsx
// Never: useEffect for derived state
const fullName = `${firstName} ${lastName}`; // Just compute it

// Never: index as key for dynamic lists
{items.map(item => <Item key={item.id} item={item} />)}

// Never: Object literals as default props
const EMPTY: readonly Item[] = [];
function List({ items = EMPTY }: { items?: readonly Item[] }) { ... }
```

---

## Testing

### Philosophy

- Tests are production code — same quality standards
- Test behavior and contracts, never implementation details
- Every bug fix starts with a failing test
- If it's hard to test, the design is wrong

### Unit Tests

```typescript
describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('returns min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('returns max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
```

### Parameterized Tests

```typescript
it.each([
  ['Hello World', 'hello-world'],
  ['  spaces  ', 'spaces'],
  ['Special!@#Characters', 'specialcharacters'],
])('converts "%s" to "%s"', (input, expected) => {
  expect(slugify(input)).toBe(expected);
});
```

### Component Tests

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

### API Mocking with MSW

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/users/:id', ({ params }) => {
    return HttpResponse.json({ id: params.id, name: 'Test User' });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### E2E Tests

```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
});
```

### Test Anti-Patterns

- Never test implementation details (internal state, class names)
- Never use `setTimeout` for waiting — use `waitFor` or `findBy`
- Never let tests depend on execution order
- Never ignore flaky tests — a flaky test is a bug

---

## Performance

### Profiling First

```typescript
performance.mark('operation-start');
doExpensiveWork();
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');
```

### V8 Optimization

- Keep function argument shapes consistent (monomorphic)
- Initialize all object properties in the same order
- Use `Map`/`Set` for dynamic collections, plain objects for static shapes
- Use `TypedArray` for numeric data

### Memory Management

- Use `AbortController` signals for event listener cleanup
- Use `WeakMap`/`WeakRef` for caches that shouldn't prevent GC
- Avoid closures that capture large scopes — extract only what's needed

### Bundle Size

- Dynamic imports for code splitting
- Named exports for tree-shaking
- Prefer native APIs (`structuredClone`, `Intl`, `URL`, `crypto.randomUUID`)

---

## Tooling

### TypeScript Config

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

### Dependency Hygiene

- Pin exact versions for applications
- Audit regularly (`npm audit`)
- Prefer zero-dependency packages
- Check bundle size before adding (`bundlephobia.com`)

---

## Definition of Done

A JavaScript feature is complete when:

- [ ] TypeScript strict mode passes with zero errors
- [ ] All code paths have explicit types (no `any`)
- [ ] Unit tests cover logic branches and edge cases
- [ ] Integration tests verify external boundaries
- [ ] Error cases are tested, not just happy paths
- [ ] No floating promises
- [ ] No memory leaks in long-running paths
- [ ] Bundle impact assessed (client-side code)
- [ ] Code reviewed and approved
