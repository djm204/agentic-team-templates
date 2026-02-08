---
description: Component Patterns
alwaysApply: false
---

# Component Patterns

Best practices for building frontend components.

## Core Principles

- **Composition over inheritance**: Build complex UIs from small composed components
- **Pure components**: Same props = same output, no side effects in render
- **Single responsibility**: Each component does one thing well
- **Typed props**: Explicit interfaces with constrained unions, not `any`

## Props and Inputs

- Define explicit typed interfaces with constrained unions for all props
- Prefer controlled components (value + onChange) for form inputs
- Uncontrolled with ref acceptable for file inputs

## Conditional Rendering

```tsx
// Early return for guards
if (!user) return <NotLoggedIn />;
// Ternary for simple toggles
<span>{isActive ? 'Active' : 'Inactive'}</span>
// && for optional
{message && <Alert>{message}</Alert>}
```

## Event Handlers

Define handlers separately, not inline with complex logic:

```tsx
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  // submit logic
};
return <form onSubmit={handleSubmit}>...</form>;
```

## Children and Composition

```tsx
const Card = ({ title, children }: CardProps) => (
  <div className="card">
    <h2>{title}</h2>
    <div className="card-content">{children}</div>
  </div>
);
```

## Compound Components

Use context to share state across related sub-components:

```tsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab>One</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel>Content</Tabs.Panel>
</Tabs>
```

## Anti-Patterns

**Side effects in render**: Setting `document.title` during render. Use `useEffect`.

**Implicit/any props**: `(props: any) => ...`. Always define typed interfaces.

**God components**: Fetching, formatting, displaying, handling clicks in one component. Split by concern.
