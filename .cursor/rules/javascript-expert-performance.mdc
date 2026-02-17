---
description: JavaScript Performance
alwaysApply: false
---

# JavaScript Performance

Profile first. Measure before and after. Never optimize without data.

## V8 Optimization

```typescript
// Good: Monomorphic — consistent shapes, V8 optimizes
function process(item: { id: string; value: number }) { return item.id + item.value; }
items.forEach(process); // All same shape — fast

// Bad: Polymorphic — different shapes deoptimize to megamorphic IC
function processAny(item: any) { return item.id + item.value; }
```

- Initialize all object properties in the same order (hidden classes)
- Use `Map`/`Set` for dynamic keys, plain objects for static shapes
- `TypedArray` for numeric data (8x more memory efficient than `number[]`)
- `Set.has()` is O(1) vs `Array.includes()` O(n)

## Memory Management

```typescript
// AbortController for bulk listener cleanup
class Component {
  #controller = new AbortController();
  mount() { window.addEventListener('resize', this.#onResize, { signal: this.#controller.signal }); }
  unmount() { this.#controller.abort(); }
  #onResize = () => { /* ... */ };
}
```

- `WeakMap`/`WeakRef` for caches that shouldn't prevent GC
- Avoid closures capturing large scopes — extract only what's needed

## Async Performance

```typescript
// Batch concurrent operations with limits
async function processInBatches<T, R>(items: T[], fn: (item: T) => Promise<R>, batchSize: number): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    results.push(...await Promise.all(items.slice(i, i + batchSize).map(fn)));
  }
  return results;
}
```

## Bundle Size (Client-Side)

- Dynamic imports for code splitting: `lazy(() => import('./AdminPanel.js'))`
- Named exports for tree-shaking; avoid barrel re-exports for large packages
- Prefer native APIs: `structuredClone`, `Intl.DateTimeFormat`, `crypto.randomUUID()`

## Anti-Patterns

- Never micro-optimize at the cost of readability
- Never cache without TTL, max size, or explicit invalidation
- Never block the event loop — use worker threads for CPU work
