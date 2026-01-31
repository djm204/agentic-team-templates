# State Management

Guidelines for managing state in frontend applications.

## State Categories

### Local State
State that belongs to a single component.
- Form input values
- UI toggles (open/closed)
- Temporary data

### Shared State
State needed by multiple components.
- User authentication
- Theme/preferences
- Shopping cart

### Server State
Data from external sources.
- API responses
- Cached data
- Real-time updates

## Principles

### 1. Lift State Only When Necessary

Keep state as close to where it's used as possible.

```tsx
// Good: State where it's needed
const SearchBox = () => {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
};

// Only lift when siblings need it
const SearchPage = () => {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchBox query={query} onChange={setQuery} />
      <SearchResults query={query} />
    </>
  );
};
```

### 2. Derive Don't Duplicate

Calculate values from existing state instead of storing duplicates.

```tsx
// Good: Derived state
const Cart = ({ items }: { items: CartItem[] }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const itemCount = items.length;
  // ...
};

// Bad: Duplicate state
const Cart = ({ items }: { items: CartItem[] }) => {
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    setTotal(items.reduce((sum, item) => sum + item.price, 0));
    setItemCount(items.length);
  }, [items]);  // Now you have to keep these in sync
};
```

### 3. Immutable Updates

Never mutate state directly.

```tsx
// Good: Immutable update
setItems(items => [...items, newItem]);
setUser(user => ({ ...user, name: newName }));

// Bad: Mutation
items.push(newItem);
setItems(items);
```

## Local State Patterns

### useState for Simple Values

```tsx
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
```

### useReducer for Complex State

```tsx
type State = { count: number; step: number };
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; step: number };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.step };
  }
};

const Counter = () => {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });
  // ...
};
```

## Shared State Patterns

### Context for Theme/Auth/Global UI

```tsx
const ThemeContext = createContext<Theme>('light');

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);
```

### State Libraries for Complex Apps

Consider dedicated state management libraries when:
- Many components need the same state
- Complex update logic
- Need for devtools/debugging
- Time-travel debugging needed

## Server State Patterns

### Separate Server State from UI State

```tsx
// Good: Dedicated server state handling
const { data: users, isLoading, error } = useQuery('users', fetchUsers);

// Use data in UI state
const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
const selectedUser = users?.find(u => u.id === selectedUserId);
```

### Handle Loading & Error States

```tsx
const UserList = () => {
  const { data, isLoading, error } = useQuery('users', fetchUsers);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  if (!data?.length) return <Empty message="No users found" />;

  return <ul>{data.map(user => <UserItem key={user.id} user={user} />)}</ul>;
};
```

## Anti-Patterns

### Prop Drilling

❌ Passing props through many layers:
```tsx
<App user={user}>
  <Layout user={user}>
    <Sidebar user={user}>
      <UserMenu user={user} />
    </Sidebar>
  </Layout>
</App>
```

✅ Use context or composition:
```tsx
<UserProvider user={user}>
  <App>
    <Layout>
      <Sidebar>
        <UserMenu /> {/* Uses useUser() hook */}
      </Sidebar>
    </Layout>
  </App>
</UserProvider>
```

### Over-Centralization

❌ Putting everything in global state
✅ Keep local state local, only share what's needed

### Stale Closures

❌ Using outdated values in callbacks:
```tsx
const [count, setCount] = useState(0);
const handleClick = () => {
  setTimeout(() => console.log(count), 1000);  // Might be stale
};
```

✅ Use refs or functional updates:
```tsx
const countRef = useRef(count);
countRef.current = count;
const handleClick = () => {
  setTimeout(() => console.log(countRef.current), 1000);
};
```
