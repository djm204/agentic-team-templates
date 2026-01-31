# Web Frontend Development

Guidelines for building modern web frontend applications.

## Scope

This ruleset applies to:
- Single-page applications (SPAs)
- Server-rendered web applications
- Static sites with dynamic components
- Progressive web applications (PWAs)

## Core Technologies

Frontend development typically involves:
- JavaScript/TypeScript
- Component frameworks (React, Vue, Angular, Svelte, etc.)
- CSS/Styling solutions (CSS Modules, Tailwind, Styled Components, etc.)
- Build tools (Vite, webpack, esbuild, etc.)
- Testing frameworks (Jest, Vitest, Testing Library, Playwright, etc.)

## Key Principles

### 1. User Experience First
- Fast initial load
- Responsive to user input
- Works across devices and browsers
- Accessible to all users

### 2. Component-Based Architecture
- Small, focused components
- Reusable and composable
- Clear data flow
- Separation of concerns

### 3. Type Safety
- Use TypeScript for all new code
- Define explicit types for props and state
- Avoid `any` type
- Let types document your code

### 4. Progressive Enhancement
- Core functionality works without JavaScript where possible
- Enhanced experience with JavaScript
- Graceful degradation for older browsers

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ui/           # Primitive components (Button, Input, Card)
│   └── features/     # Feature-specific components
├── pages/            # Page/route components
├── hooks/            # Custom React hooks (or equivalent)
├── lib/              # Business logic, utilities
├── types/            # TypeScript type definitions
├── styles/           # Global styles, theme
└── assets/           # Static assets (images, fonts)
```

## Definition of Done

A frontend feature is complete when:
- [ ] Component renders correctly
- [ ] Responsive across breakpoints
- [ ] Keyboard navigable
- [ ] Screen reader accessible
- [ ] Loading and error states handled
- [ ] Tests written and passing
- [ ] No TypeScript errors
- [ ] Meets performance budgets
