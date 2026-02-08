---
description: State Management
alwaysApply: false
---

# State Management

Guidelines for managing state in frontend applications.

## State Categories

- **Local**: Single component (form inputs, UI toggles) — `useState`, `useReducer`
- **Shared**: Multiple components (auth, theme, cart) — Context, state libraries
- **Server**: External data (API responses, cache) — React Query, SWR

## Principles

- **Lift state only when necessary**: Keep state close to where it's used
- **Derive don't duplicate**: Calculate from existing state, don't sync copies
- **Immutable updates**: Never mutate state directly

```tsx
// Good: Derived
const total = items.reduce((sum, i) => sum + i.price, 0);
// Bad: Duplicate state synced via useEffect
const [total, setTotal] = useState(0);
useEffect(() => setTotal(/*...*/), [items]);
```

## Local State

- `useState` for simple values (count, isOpen)
- `useReducer` for complex state with multiple related transitions

## Shared State

```tsx
const ThemeContext = createContext<Theme>('light');
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

Consider dedicated state libraries when many components share complex state with devtools needs.

## Server State

- Separate server state from UI state
- Handle loading, error, and empty states explicitly
- Use cache invalidation, not manual refetching

## Immutable Updates

```tsx
setItems(prev => [...prev, newItem]);
setUser(prev => ({ ...prev, name: newName }));
// Never: items.push(newItem); setItems(items);
```

## Anti-Patterns

**Prop drilling**: Passing props through many layers. Use context or composition.

**Over-centralization**: Putting everything in global state. Keep local state local.

**Stale closures**: Using outdated values in callbacks. Use refs or functional updates.
