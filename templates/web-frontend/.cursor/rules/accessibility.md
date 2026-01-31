# Accessibility (a11y)

Guidelines for building accessible web applications that work for everyone.

## Core Principles

### 1. Perceivable
Information must be presentable in ways users can perceive.

### 2. Operable
UI components must be operable by all users.

### 3. Understandable
Information and UI operation must be understandable.

### 4. Robust
Content must be robust enough for assistive technologies.

## Semantic HTML

Use the right element for the job.

```html
<!-- Good: Semantic -->
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Content...</p>
  </article>
</main>

<button onClick={handleClick}>Submit</button>

<!-- Bad: Div soup -->
<div class="nav">
  <div class="nav-item" onclick="...">Home</div>
</div>

<div class="content">
  <div class="title">Article Title</div>
</div>

<div class="button" onclick="...">Submit</div>
```

## Keyboard Navigation

### All Interactive Elements Must Be Keyboard Accessible

```tsx
// Good: Native button is keyboard accessible
<button onClick={handleClick}>Click me</button>

// If you must use a div (avoid if possible):
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

### Focus Management

```tsx
// Visible focus indicators
button:focus {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

// Focus trap for modals
const Modal = ({ isOpen, onClose, children }) => {
  const firstFocusableRef = useRef();

  useEffect(() => {
    if (isOpen) {
      firstFocusableRef.current?.focus();
    }
  }, [isOpen]);

  // ... trap focus within modal
};
```

### Skip Links

```html
<a href="#main-content" class="sr-only focus:not-sr-only">
  Skip to main content
</a>

<main id="main-content">
  ...
</main>
```

## ARIA

### Use ARIA Only When Necessary

Native HTML is always preferred. ARIA supplements, not replaces.

```html
<!-- Good: Native HTML -->
<button>Submit</button>
<nav>...</nav>
<main>...</main>

<!-- ARIA when custom components are unavoidable -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1">Content 1</div>
```

### Common ARIA Patterns

```tsx
// Loading state
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</button>

// Expanded/collapsed
<button aria-expanded={isOpen} aria-controls="menu">
  Menu
</button>
<ul id="menu" hidden={!isOpen}>...</ul>

// Live regions for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Form errors
<input
  aria-invalid={hasError}
  aria-describedby={hasError ? 'email-error' : undefined}
/>
{hasError && <span id="email-error">Please enter a valid email</span>}
```

## Forms

### Labels

Every form input needs a label.

```tsx
// Good: Explicit label
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Good: Implicit label
<label>
  Email
  <input type="email" />
</label>

// Bad: No label
<input type="email" placeholder="Email" />
```

### Error Messages

```tsx
<div>
  <label htmlFor="password">Password</label>
  <input
    id="password"
    type="password"
    aria-invalid={!!error}
    aria-describedby={error ? 'password-error' : 'password-hint'}
  />
  <span id="password-hint">Must be at least 8 characters</span>
  {error && (
    <span id="password-error" role="alert">
      {error}
    </span>
  )}
</div>
```

## Images

### Alt Text

```html
<!-- Informative image: Describe the content -->
<img src="chart.png" alt="Sales increased 25% from Q1 to Q2" />

<!-- Decorative image: Empty alt -->
<img src="decorative-border.png" alt="" />

<!-- Complex image: Longer description -->
<figure>
  <img src="diagram.png" alt="System architecture diagram" />
  <figcaption>
    The system consists of three layers: presentation, business logic, and data.
  </figcaption>
</figure>
```

## Color and Contrast

### Minimum Contrast Ratios

- Normal text: 4.5:1
- Large text (18px+ or 14px+ bold): 3:1
- UI components and graphics: 3:1

### Don't Rely on Color Alone

```tsx
// Bad: Color only
<span style={{ color: 'red' }}>Error</span>

// Good: Color + icon + text
<span className="error">
  <ErrorIcon aria-hidden="true" />
  Error: Please fix the following issues
</span>
```

## Testing

### Automated Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component has no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Checklist

- [ ] Navigate entire page with keyboard only
- [ ] Test with screen reader (NVDA, VoiceOver, JAWS)
- [ ] Check color contrast ratios
- [ ] Verify focus indicators are visible
- [ ] Test at 200% zoom
- [ ] Check with reduced motion preference

## Common Anti-Patterns

### Removing Focus Outlines

```css
/* Never do this */
*:focus { outline: none; }

/* Do this instead */
*:focus { outline: 2px solid var(--focus-color); }
*:focus:not(:focus-visible) { outline: none; }
```

### Click-Only Handlers on Non-Interactive Elements

```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

### Missing Alternative Text

```tsx
// Bad
<img src="logo.png" />

// Good
<img src="logo.png" alt="Company Name" />
```
