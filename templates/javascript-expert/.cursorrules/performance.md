# JavaScript Performance

Expert-level performance patterns for JavaScript across browser and server environments.

## Profiling First

Never optimize without data. Always profile before and after changes.

```typescript
// Node.js profiling
// node --prof app.js
// node --prof-process isolate-*.log

// Browser: use Performance API
performance.mark('operation-start');
doExpensiveWork();
performance.mark('operation-end');
performance.measure('operation', 'operation-start', 'operation-end');
const duration = performance.getEntriesByName('operation')[0]!.duration;
```

## V8 Optimization Patterns

### Monomorphic Functions

```typescript
// Good: Consistent argument shapes (monomorphic — V8 optimizes)
function processItem(item: { id: string; value: number }) {
  return item.id + item.value;
}

items.forEach(processItem); // All same shape — fast

// Bad: Polymorphic — different shapes deoptimize
function processAnything(item: any) {
  return item.id + item.value;
}
// Called with { id, value }, { id, value, extra }, { id, value, other }
// V8 can't optimize — megamorphic IC
```

### Hidden Classes

```typescript
// Good: Initialize all properties in the same order
class Point {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x; // Always x first
    this.y = y; // Always y second
  }
}

// Bad: Conditional property assignment
function createPoint(x: number, y: number, z?: number) {
  const p: any = {};
  p.x = x;
  if (z) p.z = z; // Different hidden class!
  p.y = y;
  return p;
}
```

## Data Structures

```typescript
// Map vs Object
// Use Map when: keys are dynamic, non-string keys, frequent add/delete
const cache = new Map<string, CacheEntry>();

// Use Object when: static shape, string keys, serialization needed
const config = { host: 'localhost', port: 3000 };

// Set vs Array for membership tests
// O(1) lookup vs O(n)
const allowedIds = new Set(['a', 'b', 'c']);
if (allowedIds.has(id)) { ... }

// TypedArrays for numeric data
const buffer = new Float64Array(1000);
// 8x more memory efficient than number[]
// Faster iteration for numeric operations
```

## Memory Management

```typescript
// Avoid memory leaks in event listeners
class Component {
  #controller = new AbortController();

  mount() {
    window.addEventListener('resize', this.#onResize, {
      signal: this.#controller.signal,
    });
  }

  unmount() {
    this.#controller.abort(); // Removes all listeners at once
  }

  #onResize = () => { ... };
}

// WeakMap for metadata on objects without preventing GC
const metadata = new WeakMap<object, Metadata>();

function annotate(obj: object, data: Metadata) {
  metadata.set(obj, data); // Won't prevent obj from being GC'd
}

// Avoid closures that capture large scopes
// Bad: Entire scope captured
function createHandler(largeData: BigObject[]) {
  const id = largeData[0]!.id; // Only need id
  return () => console.log(largeData); // Captures entire array!
}

// Good: Capture only what's needed
function createHandler(largeData: BigObject[]) {
  const id = largeData[0]!.id;
  return () => console.log(id); // Only captures id
}
```

## Async Performance

```typescript
// Batch concurrent operations with limits
async function processInBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// Use streams for large data — don't load everything into memory
// See node-patterns.md for stream examples

// requestAnimationFrame for visual updates (browser)
function animateValue(element: HTMLElement, from: number, to: number) {
  const start = performance.now();
  const duration = 300;

  const tick = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = from + (to - from) * progress;
    element.textContent = String(Math.round(value));
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}
```

## Bundle Size (Client-Side)

```typescript
// Dynamic imports for code splitting
const AdminPanel = lazy(() => import('./AdminPanel.js'));

// Tree-shakeable exports (named, not default)
export { validateEmail } from './validators.js';

// Avoid barrel file re-exports for large packages
// Bad: import { Button } from './components'; // Pulls everything
// Good: import { Button } from './components/Button.js';

// Check bundle impact before adding dependencies
// npx bundlephobia <package-name>

// Prefer native APIs over libraries
// Use Intl.DateTimeFormat instead of moment/date-fns for formatting
// Use structuredClone instead of lodash.cloneDeep
// Use URL instead of query-string
// Use AbortController instead of custom cancellation
// Use crypto.randomUUID() instead of uuid
```

## Anti-Patterns

```typescript
// Never: Premature optimization
// Measure first, optimize the bottleneck, measure again

// Never: Micro-optimizations that harm readability
// arr[arr.length - 1] vs arr.at(-1) — the difference is negligible

// Never: Caching without invalidation strategy
// Every cache needs a TTL, max size, or explicit invalidation

// Never: Synchronous operations blocking the event loop
// Use worker threads for CPU work
// Use async I/O for file/network operations
```
