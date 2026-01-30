# React Patterns

Expert-level React patterns for building production UI applications.

## Component Design

### Server Components First (React 19+)

```tsx
// Default: Server Components — no 'use client' directive
// They run on the server, have zero client bundle cost
async function ProjectList() {
  const projects = await db.projects.findMany();
  return (
    <ul>
      {projects.map(p => <ProjectCard key={p.id} project={p} />)}
    </ul>
  );
}

// Only add 'use client' when you need:
// - useState, useEffect, useReducer
// - Browser APIs (window, document)
// - Event handlers (onClick, onChange)
// - Custom hooks that use client features
'use client';
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Composition Patterns

```tsx
// Compound components for related UI
function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabList({ children }: { children: React.ReactNode }) { ... };
Tabs.Panel = function TabPanel({ children, index }: { children: React.ReactNode; index: number }) { ... };

// Usage — clean, declarative API
<Tabs>
  <Tabs.List>
    <Tab>Overview</Tab>
    <Tab>Details</Tab>
  </Tabs.List>
  <Tabs.Panel index={0}>Overview content</Tabs.Panel>
  <Tabs.Panel index={1}>Details content</Tabs.Panel>
</Tabs>
```

### Render Props and Children as Function

```tsx
// For maximum flexibility in rendering
interface DataLoaderProps<T> {
  load: () => Promise<T>;
  children: (data: T) => React.ReactNode;
  fallback?: React.ReactNode;
}

function DataLoader<T>({ load, children, fallback }: DataLoaderProps<T>) {
  const data = use(load());
  return <>{children(data)}</>;
}

// Usage
<Suspense fallback={<Spinner />}>
  <DataLoader load={fetchUsers}>
    {users => <UserList users={users} />}
  </DataLoader>
</Suspense>
```

## Hooks

### Custom Hook Patterns

```tsx
// Encapsulate complex state logic
function useOptimisticUpdate<T>(
  current: T,
  updateFn: (value: T) => Promise<void>,
) {
  const [optimistic, setOptimistic] = useState(current);
  const [isPending, startTransition] = useTransition();

  const update = (next: T) => {
    setOptimistic(next);
    startTransition(async () => {
      try {
        await updateFn(next);
      } catch {
        setOptimistic(current); // Rollback
      }
    });
  };

  return [optimistic, update, isPending] as const;
}

// Debounced value hook
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

### Hook Rules (Enforced, Not Suggested)

- Only call hooks at the top level — never inside conditions, loops, or nested functions
- Only call hooks from React function components or custom hooks
- Custom hooks must start with `use`
- Always include correct dependencies in `useEffect`/`useMemo`/`useCallback`

## State Management

```tsx
// Rule: Use the simplest tool that works
// 1. useState — local state
// 2. useReducer — complex local state with actions
// 3. Context — low-frequency shared state (theme, auth, locale)
// 4. External store (Zustand, Jotai) — high-frequency shared state

// useReducer for complex state machines
type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: User[] }
  | { type: 'FETCH_ERROR'; error: Error };

interface State {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: User[];
  error: Error | null;
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, status: 'loading', error: null };
    case 'FETCH_SUCCESS':
      return { status: 'success', data: action.payload, error: null };
    case 'FETCH_ERROR':
      return { ...state, status: 'error', error: action.error };
  }
};
```

## Performance

```tsx
// React Compiler (React 19+) handles most memoization automatically
// Only manually optimize when profiling shows a bottleneck

// Virtualize large lists
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ overflow: 'auto', height: '500px' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(row => (
          <div key={row.key} style={{
            position: 'absolute',
            top: row.start,
            height: row.size,
          }}>
            <ItemRow item={items[row.index]!} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Boundaries

```tsx
// Every route and major feature section needs an error boundary
'use client';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (error: Error, reset: () => void) => React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () => this.setState({ error: null }));
    }
    return this.props.children;
  }
}
```

## Anti-Patterns

```tsx
// Never: useEffect for derived state
// Bad
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);
// Good
const fullName = `${firstName} ${lastName}`;

// Never: Object/array literals as default props (new reference every render)
// Bad
function List({ items = [] }) { ... }
// Good
const EMPTY: readonly Item[] = [];
function List({ items = EMPTY }: { items?: readonly Item[] }) { ... }

// Never: index as key for dynamic lists
// Bad
{items.map((item, i) => <Item key={i} item={item} />)}
// Good
{items.map(item => <Item key={item.id} item={item} />)}
```
