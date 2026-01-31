# Frontend Performance

Guidelines for building fast, responsive web applications.

## Core Web Vitals

### Largest Contentful Paint (LCP)
Measures loading performance. Target: < 2.5 seconds.

**Optimize by:**
- Optimize critical rendering path
- Preload critical resources
- Use efficient image formats (WebP, AVIF)
- Implement proper caching

### First Input Delay (FID) / Interaction to Next Paint (INP)
Measures interactivity. Target: < 100ms / < 200ms.

**Optimize by:**
- Break up long tasks
- Minimize main thread work
- Use web workers for heavy computation
- Defer non-critical JavaScript

### Cumulative Layout Shift (CLS)
Measures visual stability. Target: < 0.1.

**Optimize by:**
- Always include size attributes on images/video
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS containment

## JavaScript Performance

### Code Splitting

Load code only when needed.

```tsx
// Route-based splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}

// Component-based splitting
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  return (
    <div>
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart data={data} />
      </Suspense>
    </div>
  );
}
```

### Minimize Bundle Size

```tsx
// Bad: Import entire library
import _ from 'lodash';
_.debounce(fn, 300);

// Good: Import only what you need
import debounce from 'lodash/debounce';
debounce(fn, 300);

// Better: Use native or smaller alternatives
function debounce(fn, ms) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
```

### Avoid Memory Leaks

```tsx
useEffect(() => {
  const controller = new AbortController();

  fetchData({ signal: controller.signal })
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });

  // Cleanup on unmount
  return () => controller.abort();
}, []);

useEffect(() => {
  const handler = () => { ... };
  window.addEventListener('resize', handler);

  // Remove listener on cleanup
  return () => window.removeEventListener('resize', handler);
}, []);
```

## React-Specific Optimizations

### Prevent Unnecessary Re-renders

```tsx
// Memoize expensive components
const ExpensiveList = memo(({ items }: Props) => {
  return items.map(item => <ExpensiveItem key={item.id} {...item} />);
});

// Memoize expensive calculations
const sortedItems = useMemo(
  () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// Memoize callbacks passed to children
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);
```

### Virtualize Long Lists

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: virtualItem.start,
              height: virtualItem.size,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Defer Non-Critical Updates

```tsx
// Use startTransition for non-urgent updates
import { startTransition } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleChange = (e) => {
    // Urgent: Update input immediately
    setQuery(e.target.value);

    // Non-urgent: Can be interrupted
    startTransition(() => {
      setResults(filterResults(e.target.value));
    });
  };
}
```

## Image Optimization

### Use Modern Formats

```tsx
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

### Lazy Load Images

```tsx
// Native lazy loading
<img src="image.jpg" loading="lazy" alt="Description" />

// With blur placeholder
<Image
  src="/image.jpg"
  alt="Description"
  placeholder="blur"
  blurDataURL={blurHash}
/>
```

### Proper Sizing

```tsx
// Always specify dimensions
<img
  src="image.jpg"
  width={800}
  height={600}
  alt="Description"
/>

// Responsive images
<img
  src="image-800.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="Description"
/>
```

## Network Optimization

### Preload Critical Resources

```html
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/hero.jpg" as="image" />
<link rel="preconnect" href="https://api.example.com" />
```

### Cache Effectively

```ts
// Service worker caching
// Cache static assets aggressively
// Network-first for API calls
// Stale-while-revalidate for semi-static content
```

### Compress Assets

- Enable gzip/brotli compression on server
- Minify JS, CSS, HTML
- Optimize SVGs

## Monitoring

### Performance Metrics

```ts
// Web Vitals library
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(console.log);
onFID(console.log);
onLCP(console.log);
```

### Performance Budgets

Set limits and alert on regression:
- JavaScript bundle: < 200KB (gzipped)
- CSS: < 50KB (gzipped)
- LCP: < 2.5s
- TTI: < 5s

## Anti-Patterns

### Blocking the Main Thread

```tsx
// Bad: Synchronous heavy computation
const sorted = hugeArray.sort((a, b) => complexComparison(a, b));

// Good: Use web worker or break into chunks
const worker = new Worker('sort-worker.js');
worker.postMessage(hugeArray);
```

### Layout Thrashing

```tsx
// Bad: Read/write in loop
items.forEach(item => {
  const height = item.offsetHeight;  // Read
  item.style.height = height + 10;    // Write
});

// Good: Batch reads then writes
const heights = items.map(item => item.offsetHeight);
items.forEach((item, i) => {
  item.style.height = heights[i] + 10;
});
```

### Importing Everything

```tsx
// Bad
import * as utils from './utils';

// Good
import { specificUtil } from './utils';
```
