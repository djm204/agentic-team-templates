# JavaScript Language Deep Dive

Advanced JavaScript patterns and idioms for expert-level engineering.

## The Event Loop

Understanding execution order is fundamental:

```typescript
// Know the execution order: synchronous > microtasks > macrotasks
console.log('1 - sync');

setTimeout(() => console.log('2 - macrotask'), 0);

Promise.resolve().then(() => console.log('3 - microtask'));

queueMicrotask(() => console.log('4 - microtask'));

console.log('5 - sync');

// Output: 1, 5, 3, 4, 2
```

### Async Patterns

```typescript
// Prefer async/await over raw promises
// But know when Promise combinators are the right tool

// Parallel independent operations
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
]);

// Race with timeout
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);

// Settle all, handle individually
const results = await Promise.allSettled(tasks.map(processTask));
const failures = results.filter(
  (r): r is PromiseRejectedResult => r.status === 'rejected'
);

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

## Closures and Scope

```typescript
// Closures for encapsulation
const createRateLimiter = (maxCalls: number, windowMs: number) => {
  const calls: number[] = [];

  return <T>(fn: () => T): T | null => {
    const now = Date.now();
    const windowStart = now - windowMs;
    // Remove expired entries
    while (calls.length > 0 && calls[0]! < windowStart) calls.shift();

    if (calls.length >= maxCalls) return null;
    calls.push(now);
    return fn();
  };
};

// Private state with closures (pre-#private fields pattern)
// Prefer #private fields in classes, closures in functions
```

## Proxy and Reflect

```typescript
// Observable objects
const createObservable = <T extends object>(
  target: T,
  onChange: (prop: string | symbol, value: unknown) => void,
): T =>
  new Proxy(target, {
    set(obj, prop, value, receiver) {
      const result = Reflect.set(obj, prop, value, receiver);
      onChange(prop, value);
      return result;
    },
  });

// Validation proxies
const createValidated = <T extends Record<string, unknown>>(
  target: T,
  validators: Partial<Record<keyof T, (v: unknown) => boolean>>,
): T =>
  new Proxy(target, {
    set(obj, prop, value, receiver) {
      const validate = validators[prop as keyof T];
      if (validate && !validate(value)) {
        throw new TypeError(`Invalid value for ${String(prop)}`);
      }
      return Reflect.set(obj, prop, value, receiver);
    },
  });
```

## WeakRef and FinalizationRegistry

```typescript
// Cache that doesn't prevent garbage collection
class WeakCache<K extends object, V> {
  readonly #cache = new Map<string, WeakRef<V & object>>();
  readonly #registry = new FinalizationRegistry<string>((key) => {
    this.#cache.delete(key);
  });

  set(key: string, value: V & object): void {
    this.#cache.set(key, new WeakRef(value));
    this.#registry.register(value, key);
  }

  get(key: string): V | undefined {
    return this.#cache.get(key)?.deref();
  }
}
```

## Iterators and Generators

```typescript
// Custom iterable
class Range implements Iterable<number> {
  constructor(
    private readonly start: number,
    private readonly end: number,
    private readonly step = 1,
  ) {}

  *[Symbol.iterator](): Generator<number> {
    for (let i = this.start; i < this.end; i += this.step) {
      yield i;
    }
  }
}

// Lazy evaluation with generators
function* filter<T>(iterable: Iterable<T>, predicate: (item: T) => boolean) {
  for (const item of iterable) {
    if (predicate(item)) yield item;
  }
}

function* map<T, U>(iterable: Iterable<T>, transform: (item: T) => U) {
  for (const item of iterable) {
    yield transform(item);
  }
}

function* take<T>(iterable: Iterable<T>, count: number) {
  let i = 0;
  for (const item of iterable) {
    if (i++ >= count) break;
    yield item;
  }
}

// Compose lazy operations — no intermediate arrays
const result = [...take(
  map(
    filter(hugeDataset, item => item.active),
    item => item.name,
  ),
  10,
)];
```

## Structured Clone and Transfer

```typescript
// Deep clone without JSON.parse(JSON.stringify(...))
const clone = structuredClone(complexObject);

// Transfer ownership (zero-copy for ArrayBuffers)
const buffer = new ArrayBuffer(1024);
worker.postMessage({ buffer }, [buffer]);
// buffer.byteLength is now 0 — ownership transferred
```

## Module Patterns

```typescript
// Named exports for tree-shaking
export const validateEmail = (email: string): boolean => { ... };
export const validatePhone = (phone: string): boolean => { ... };

// Barrel files only at package boundaries, never internal
// src/validators/index.ts — public API
export { validateEmail } from './email.js';
export { validatePhone } from './phone.js';

// Dynamic imports for code splitting
const module = await import(`./locales/${locale}.js`);

// Import attributes (for JSON, CSS modules)
import config from './config.json' with { type: 'json' };
```

## Anti-Patterns to Avoid

```typescript
// Never: for...in on arrays (iterates prototype chain)
for (const key in array) { } // BAD

// Instead: for...of, .forEach, .map, .reduce
for (const item of array) { } // GOOD

// Never: == for comparison (type coercion surprises)
if (value == null) { } // Only acceptable case (null + undefined check)

// Never: delete on arrays (creates sparse array)
delete arr[2]; // BAD — leaves hole
arr.splice(2, 1); // GOOD

// Never: blocking the event loop
// Use worker_threads for CPU-intensive work in Node.js
// Use Web Workers in the browser

// Never: implicit globals
function bad() { x = 5; } // Creates global!
// Always use const/let, always use strict mode
```
