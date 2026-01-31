# Styling Guidelines

Best practices for styling frontend applications.

## Principles

### 1. Consistency
Use a design system or consistent conventions throughout the application.

### 2. Maintainability
Styles should be easy to find, understand, and modify.

### 3. Performance
Minimize CSS bundle size and avoid layout thrashing.

### 4. Responsiveness
Design for all screen sizes from the start.

## CSS Organization

### Component-Scoped Styles

Keep styles close to their components.

```
components/
├── Button/
│   ├── Button.tsx
│   ├── Button.styles.css  # or .module.css
│   └── Button.test.tsx
```

### Naming Conventions

Use clear, consistent naming:

```css
/* BEM-style (Block Element Modifier) */
.card { }
.card__header { }
.card__body { }
.card--featured { }

/* Utility-based */
.flex .items-center .gap-4 .p-2
```

## Responsive Design

### Mobile-First

Start with mobile styles, add complexity for larger screens.

```css
/* Base: Mobile */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
    max-width: 1200px;
  }
}
```

### Flexible Units

Prefer relative units for flexibility.

```css
/* Good: Flexible */
.container {
  max-width: 80rem;      /* 1280px at default font size */
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.5;
}

/* Avoid: Fixed pixels for text/spacing */
.container {
  max-width: 1280px;
  padding: 16px;
  font-size: 16px;
}
```

## Layout

### Modern Layout Tools

Use Flexbox and Grid for layout.

```css
/* Flexbox for 1D layouts */
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Grid for 2D layouts */
.dashboard {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}
```

### Avoid Layout Hacks

❌ Don't use floats for layout
❌ Don't use tables for layout
❌ Avoid excessive negative margins

## Theming

### CSS Custom Properties

Use CSS variables for theming.

```css
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-background: #ffffff;
  --color-text: #1e293b;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}

[data-theme="dark"] {
  --color-background: #0f172a;
  --color-text: #f1f5f9;
}

.button {
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
}
```

## Performance

### Minimize Reflows

Group DOM reads and writes.

```js
// Bad: Causes multiple reflows
element.style.width = '100px';
const height = element.offsetHeight;  // Read forces reflow
element.style.height = height + 'px';

// Good: Batch reads, then writes
const height = element.offsetHeight;
element.style.width = '100px';
element.style.height = height + 'px';
```

### Use Efficient Selectors

```css
/* Good: Specific, efficient */
.nav-item { }
.button-primary { }

/* Avoid: Expensive selectors */
div > ul > li > a { }
*:not(.something) { }
```

### Reduce Bundle Size

- Remove unused CSS (PurgeCSS, etc.)
- Use CSS code splitting
- Avoid importing entire libraries for a few utilities

## Common Patterns

### Visually Hidden (Screen Reader Only)

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Truncate Text

```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Aspect Ratio

```css
.aspect-video {
  aspect-ratio: 16 / 9;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}
```

## Anti-Patterns

### Avoid !important

```css
/* Bad */
.button { color: red !important; }

/* Good: Use specificity correctly */
.button.button-danger { color: red; }
```

### Avoid Inline Styles for Theming

```tsx
// Bad
<div style={{ color: isError ? 'red' : 'green' }}>

// Good: Use classes/data attributes
<div className={isError ? 'text-error' : 'text-success'}>
<div data-state={isError ? 'error' : 'success'}>
```

### Avoid Magic Numbers

```css
/* Bad */
.header { height: 73px; }

/* Good */
.header { height: var(--header-height); }
```
