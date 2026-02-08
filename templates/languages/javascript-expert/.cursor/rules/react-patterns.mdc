---
description: React Patterns
alwaysApply: false
---

# React Patterns

Expert-level React patterns for production UI applications.

## Server Components First (React 19+)

```tsx
// Default: Server Component — no 'use client', zero client bundle cost
async function ProjectList() {
  const projects = await db.projects.findMany();
  return <ul>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</ul>;
}

// Only add 'use client' for: useState, useEffect, browser APIs, event handlers
'use client';
function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

## Composition

```tsx
// Compound components for related UI
function Tabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  return <TabsContext.Provider value={{ active, setActive }}>{children}</TabsContext.Provider>;
}
Tabs.List = function TabList({ children }: { children: React.ReactNode }) { /* ... */ };
Tabs.Panel = function TabPanel({ children, index }: { children: React.ReactNode; index: number }) { /* ... */ };
```

## Hooks

- Only call hooks at top level — never inside conditions, loops, or nested functions
- Custom hooks must start with `use`; always include correct dependency arrays
- React Compiler (React 19+) handles most memoization — only manually optimize after profiling

## State Management Hierarchy

1. `useState` — local state
2. `useReducer` — complex local state with actions
3. Context — low-frequency shared state (theme, auth, locale)
4. External store (Zustand, Jotai) — high-frequency shared state

## Error Boundaries

- Every route and major feature section needs an error boundary
- Use `getDerivedStateFromError` + reset callback pattern
- Client components only (`'use client'`)

## Anti-Patterns

```tsx
// Never: useEffect for derived state
const fullName = `${firstName} ${lastName}`; // Just compute it

// Never: Object/array literals as default props (new ref every render)
const EMPTY: readonly Item[] = [];
function List({ items = EMPTY }: { items?: readonly Item[] }) { /* ... */ }

// Never: index as key for dynamic lists
{items.map(item => <Item key={item.id} item={item} />)}
```
