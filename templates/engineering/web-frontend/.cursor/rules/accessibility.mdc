---
description: Accessibility (a11y)
alwaysApply: false
---

# Accessibility (a11y)

Guidelines for building accessible web applications (WCAG 2.1 AA).

## Core Principles

- **Perceivable**: Info presentable in ways users can perceive
- **Operable**: All UI operable by keyboard and assistive tech
- **Understandable**: Clear, predictable UI behaviour
- **Robust**: Works with assistive technologies

## Semantic HTML

Use the right element: `<nav>`, `<main>`, `<article>`, `<button>`, `<a>`. Never use `<div onclick>` for interactive elements.

## Keyboard Navigation

- All interactive elements keyboard accessible
- Visible focus indicators (never `outline: none` globally)
- Skip-to-main-content link
- Focus trapping for modals

```css
*:focus { outline: 2px solid var(--focus-color); outline-offset: 2px; }
*:focus:not(:focus-visible) { outline: none; }
```

## ARIA

Use only when native HTML is insufficient. Native HTML is always preferred.

```tsx
<button aria-expanded={isOpen} aria-controls="menu">Menu</button>
<input aria-invalid={hasError} aria-describedby="error-msg" />
<div aria-live="polite">{statusMessage}</div>
```

## Forms

- Every input needs a visible `<label>` with matching `htmlFor`/`id`
- Link errors to inputs via `aria-describedby` and `aria-invalid`
- Provide hint text for complex fields

## Images

- Informative: descriptive `alt` text
- Decorative: `alt=""`
- Complex: use `<figcaption>` for longer descriptions

## Color and Contrast

- Normal text: 4.5:1 ratio minimum
- Large text (18px+): 3:1 ratio
- Never rely on color alone — use icons + text

## Testing Checklist

- [ ] Navigate with keyboard only
- [ ] Test with screen reader
- [ ] Check color contrast ratios
- [ ] Verify focus indicators visible
- [ ] Test at 200% zoom

## Anti-Patterns

**Removing focus outlines**: Replace with visible custom styles, don't remove.

**Click-only handlers on divs**: Use `<button>` for interactive elements.

**Missing alt text**: Every `<img>` needs an `alt` attribute.
