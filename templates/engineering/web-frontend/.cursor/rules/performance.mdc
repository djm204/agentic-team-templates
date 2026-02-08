---
description: Frontend Performance
alwaysApply: false
---

# Frontend Performance

Guidelines for building fast, responsive web applications.

## Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s — preload critical resources, optimize images
- **INP** (Interaction to Next Paint): < 200ms — break long tasks, defer non-critical JS
- **CLS** (Cumulative Layout Shift): < 0.1 — set image dimensions, reserve space for dynamic content

## Code Splitting

```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
<Suspense fallback={<Loading />}><Dashboard /></Suspense>
```

Split by route and by heavy component.

## Bundle Size

```tsx
// Bad: import entire library
import _ from 'lodash';
// Good: import specific function
import debounce from 'lodash/debounce';
```

## Prevent Re-renders

```tsx
const ExpensiveList = memo(({ items }) => /* ... */);
const sorted = useMemo(() => items.sort(/*...*/), [items]);
const handleClick = useCallback(() => /* ... */, []);
```

## Virtualize Long Lists

Use `@tanstack/react-virtual` or similar for lists with 100+ items. Only render visible rows.

## Image Optimization

- Modern formats: WebP, AVIF with `<picture>` fallbacks
- Lazy loading: `<img loading="lazy" />`
- Always specify width/height to prevent CLS
- Responsive `srcset` with appropriate `sizes`

## Network Optimization

- Preload critical fonts and hero images
- `<link rel="preconnect">` for API domains
- Enable gzip/brotli compression
- Cache static assets aggressively

## Performance Budgets

- JavaScript: < 200KB gzipped
- CSS: < 50KB gzipped
- LCP: < 2.5s
- TTI: < 5s

## Anti-Patterns

**Blocking main thread**: Synchronous heavy computation. Use web workers or break into chunks.

**Layout thrashing**: Reading then writing DOM in loops. Batch reads, then batch writes.

**Importing everything**: `import * from './utils'`. Import only what you need for tree-shaking.
