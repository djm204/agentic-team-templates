---
description: Styling Guidelines
alwaysApply: false
---

# Styling Guidelines

Best practices for styling frontend applications.

## Principles

- **Consistency**: Design system or conventions throughout
- **Maintainability**: Component-scoped styles, easy to find and modify
- **Performance**: Minimize CSS bundle, avoid layout thrashing
- **Responsiveness**: Mobile-first, all screen sizes

## Responsive Design (Mobile-First)

```css
.container { padding: 1rem; }
@media (min-width: 768px) { .container { padding: 2rem; } }
@media (min-width: 1024px) { .container { padding: 3rem; max-width: 1200px; } }
```

Use relative units (`rem`, `%`) over fixed pixels for text and spacing.

## Layout

- **Flexbox**: 1D layouts (nav bars, card rows)
- **Grid**: 2D layouts (dashboards, page structures)
- Avoid floats, tables-for-layout, and excessive negative margins

## Theming with CSS Custom Properties

```css
:root {
  --color-primary: #3b82f6;
  --color-text: #1e293b;
  --spacing-md: 1rem;
  --radius-md: 0.5rem;
}
[data-theme="dark"] { --color-text: #f1f5f9; }
```

## Performance

- Batch DOM reads then writes to avoid reflows
- Use specific selectors (`.nav-item`) not deep chains (`div > ul > li > a`)
- Remove unused CSS (PurgeCSS), use code splitting

## Common Patterns

```css
/* Screen-reader only */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0,0,0,0);
}
/* Truncate text */
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

## Anti-Patterns

**`!important` overuse**: Fix specificity instead. Use `.button.button-danger`.

**Inline styles for theming**: Use classes or data attributes for state-based styling.

**Magic numbers**: `height: 73px`. Use CSS variables: `height: var(--header-height)`.
