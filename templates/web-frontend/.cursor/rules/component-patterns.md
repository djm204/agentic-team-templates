# Component Patterns

Best practices for building frontend components.

## Composition Over Inheritance

Build complex UIs by composing small components, not extending base classes.

```tsx
// Good: Composition
const UserCard = ({ user }: { user: User }) => (
  <Card>
    <Avatar src={user.avatar} />
    <CardContent>
      <UserName name={user.name} />
      <UserBio bio={user.bio} />
    </CardContent>
  </Card>
);

// Bad: Inheritance
class UserCard extends BaseCard {
  renderContent() { ... }
}
```

## Pure Components

Components should be predictable: same props = same output.

```tsx
// Good: Pure component
const Greeting = ({ name }: { name: string }) => (
  <h1>Hello, {name}!</h1>
);

// Bad: Side effects in render
const Greeting = ({ name }: { name: string }) => {
  document.title = name;  // Side effect!
  return <h1>Hello, {name}!</h1>;
};
```

## Single Responsibility

Each component should do one thing well.

```tsx
// Good: Focused components
const UserAvatar = ({ src, alt }: AvatarProps) => (
  <img src={src} alt={alt} className="avatar" />
);

const UserName = ({ name }: { name: string }) => (
  <span className="user-name">{name}</span>
);

// Bad: Component doing too much
const UserDisplay = ({ user }: { user: User }) => {
  // Fetching, formatting, displaying, handling clicks...
  // This should be split up
};
```

## Props Interface

Define clear, typed interfaces for component props.

```tsx
// Good: Explicit props interface
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const Button = ({ variant, size = 'md', disabled, onClick, children }: ButtonProps) => (
  // ...
);

// Bad: Implicit or any props
const Button = (props: any) => ( ... );
```

## Controlled vs Uncontrolled

Prefer controlled components for form inputs.

```tsx
// Good: Controlled input
const SearchInput = ({ value, onChange }: SearchInputProps) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);

// Acceptable for simple cases: Uncontrolled with ref
const FileInput = ({ onFile }: FileInputProps) => {
  const ref = useRef<HTMLInputElement>(null);
  return <input type="file" ref={ref} onChange={...} />;
};
```

## Conditional Rendering

Use clear patterns for conditional UI.

```tsx
// Good: Early return for guards
const UserProfile = ({ user }: { user: User | null }) => {
  if (!user) return <NotLoggedIn />;
  return <Profile user={user} />;
};

// Good: Ternary for simple conditions
const Status = ({ isActive }: { isActive: boolean }) => (
  <span>{isActive ? 'Active' : 'Inactive'}</span>
);

// Good: && for optional rendering
const Notification = ({ message }: { message?: string }) => (
  <div>
    {message && <Alert>{message}</Alert>}
  </div>
);
```

## Handling Events

Keep event handlers clean and focused.

```tsx
// Good: Handler defined separately
const Form = () => {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Submit logic
  };

  return <form onSubmit={handleSubmit}>...</form>;
};

// Avoid: Complex inline handlers
const Form = () => (
  <form onSubmit={(e) => {
    e.preventDefault();
    // Lots of logic here...
  }}>
    ...
  </form>
);
```

## Children Patterns

Use children effectively for composition.

```tsx
// Good: Children for content injection
const Card = ({ title, children }: CardProps) => (
  <div className="card">
    <h2>{title}</h2>
    <div className="card-content">{children}</div>
  </div>
);

// Usage
<Card title="Settings">
  <SettingsForm />
</Card>
```

## Render Props & Compound Components

For complex reusable patterns.

```tsx
// Compound components pattern
const Tabs = ({ children }: TabsProps) => {
  const [active, setActive] = useState(0);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      {children}
    </TabsContext.Provider>
  );
};

Tabs.List = TabsList;
Tabs.Panel = TabsPanel;

// Usage
<Tabs>
  <Tabs.List>
    <Tabs.Tab>One</Tabs.Tab>
    <Tabs.Tab>Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel>Content One</Tabs.Panel>
  <Tabs.Panel>Content Two</Tabs.Panel>
</Tabs>
```
