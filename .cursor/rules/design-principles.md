# Design & UX Principles

## Design Philosophy

- **Functional & Clean**: Minimal, purposeful design
- **Accessibility First**: WCAG 2.1 Level AA compliance is non-negotiable
- **Composition Over Inheritance**: Build complex components from simple primitives
- **Pure Components**: No side effects in render, props in, JSX out
- **Consistent Spacing**: Use Tailwind's spacing scale (4px base unit)

## UX Principles

### 1. User-Centric Design

- Design for the user's goals, not technical constraints
- Every interaction should have clear feedback
- Error states should be helpful, not just informative
- Loading states should indicate progress when possible

### 2. Accessibility as Foundation

- **Keyboard Navigation**: All interactions must work via keyboard
- **Screen Reader Support**: Semantic HTML and ARIA labels where needed
- **Color Contrast**: Minimum 4.5:1 ratio for all text (WCAG AA)
- **Focus Indicators**: Visible focus states on all interactive elements
- **No Mouse-Only Interactions**: Everything must be keyboard accessible

### 3. Progressive Enhancement

- Mobile-first responsive design
- Core functionality works without JavaScript
- Enhance with JavaScript, don't require it
- Graceful degradation for older browsers

### 4. Performance as UX

- Fast page loads (< 2.5s LCP)
- Smooth interactions (< 100ms FID)
- No layout shift (CLS < 0.1)
- Optimistic UI updates where appropriate

### 5. Clear Information Hierarchy

- Use semantic HTML for structure (`<h1>`, `<h2>`, `<nav>`, `<main>`, etc.)
- Visual hierarchy through typography scale
- Consistent spacing creates rhythm
- Group related content visually

## Design System

### Color Palette

#### Primary Colors
- **Blue**: Primary actions and highlights
  - `blue-100`: Light backgrounds (tags, badges)
  - `blue-600`: Primary buttons, links
  - `blue-800`: Text on light backgrounds

#### Semantic Colors
- **Red**: Errors and destructive actions
  - `red-50`: Error background
  - `red-200`: Error borders
  - `red-600`: Error text, danger buttons
  - `red-800`: Error text on light backgrounds

#### Neutral Colors
- **Gray**: Text, borders, backgrounds
  - `gray-50`: Page backgrounds
  - `gray-300`: Borders, dividers
  - `gray-500`: Secondary text
  - `gray-900`: Dark backgrounds (footer)

**Color Contrast Requirement**: All text must meet WCAG 2.1 Level AA (≥ 4.5:1 contrast ratio)

### Typography Scale

- `text-sm`: 14px - Secondary text, labels
- `text-base`: 16px - Body text (default)
- `text-lg`: 18px - Emphasized text, metrics
- `text-xl`: 20px - Card titles, section headings
- `text-2xl+`: Page titles, hero text

### Spacing System

Use Tailwind's spacing scale consistently (4px base unit):
- `p-4`: 16px - Standard padding
- `p-6`: 24px - Card padding
- `gap-2`: 8px - Small gaps (tags, buttons)
- `gap-4`: 16px - Standard gaps (grid items)

## Component UX Patterns

### Buttons

- Clear visual hierarchy (primary vs secondary)
- Loading states with spinners
- Disabled states with reduced opacity
- Focus indicators visible
- Keyboard accessible (Enter/Space)

### Forms

- Labels associated with inputs (`htmlFor`/`id`)
- Error messages clearly associated (`aria-describedby`)
- Required fields indicated with `*`
- Inline validation feedback
- Submit button disabled during submission

### Cards

- Clear visual separation (border, shadow)
- Consistent padding (`p-6`)
- Header, content, footer sections when needed
- Hover states for interactive cards

### Navigation

- Clear current page indicator
- Keyboard accessible (Tab navigation)
- Skip links for main content
- Mobile-friendly (hamburger menu if needed)

### Error States

- Clear error messages in `role="alert"`
- Visual distinction (red border, background)
- Actionable error messages (what went wrong, how to fix)
- Error state persists until resolved

### Loading States

- Spinner with `role="status"` and `aria-label="Loading"`
- Disable interaction during loading
- Skeleton screens for content loading
- Progress indicators for long operations

## Responsive Design

- **Mobile-first**: Design for mobile, enhance for larger screens
- **Breakpoints**: `sm:` (640px+), `md:` (768px+), `lg:` (1024px+), `xl:` (1280px+)
- **Touch Targets**: Minimum 44x44px for interactive elements
- **Content Reflow**: Content should reflow naturally on smaller screens

## Animation & Motion

- Keep animations subtle and purposeful
- Respect `prefers-reduced-motion` (use `motion-reduce:` prefix)
- Use Tailwind's `animate-spin` for loading spinners
- Transitions should enhance, not distract

## Design Checklist

Before marking UI/UX work complete:

- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all focusable elements
- [ ] Color contrast meets WCAG AA (≥ 4.5:1)
- [ ] Semantic HTML used appropriately
- [ ] ARIA labels on icon-only buttons
- [ ] Error states are clear and actionable
- [ ] Loading states provide feedback
- [ ] Mobile-responsive design tested
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] No layout shift on load
- [ ] Touch targets meet minimum size (44x44px)

## Reference

For detailed styling implementation patterns, see `docs/STYLING_GUIDE.md`.
