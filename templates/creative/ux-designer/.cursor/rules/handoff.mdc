---
description: Design Handoff
alwaysApply: false
---

# Design Handoff

Bridging design and development through clear specifications, shared language, and measurable quality standards.

## Core Principle

**Handoff is not a moment — it is a continuous conversation.** Collaborate from the start, not over a wall.

## Specification Standards

Every handoff includes:

- **Layout**: Responsive behavior at all breakpoints, spacing via tokens, grid alignment, min/max-width
- **Typography**: Font, weight, size, line-height as tokens; truncation behavior
- **Color**: All colors as tokens; light/dark mode specs; contrast ratios documented
- **Components**: All states (default, hover, focus, active, disabled, error, loading, empty), interaction behavior, animation specs, responsive adaptations
- **Content**: Real examples (not lorem ipsum), character limits, empty states, error copy

## Design Annotations

- Spacing callouts with token names
- Interaction notes ("On hover, show tooltip after 500ms")
- Responsive notes ("Stack below 768px")
- Accessibility notes ("aria-label='Close dialog'", "Focus trap in modal")
- Edge cases ("Truncate with ellipsis after 2 lines")
- Conditional logic ("Show only when admin role")

## Prototyping

- **Low-fi**: Validate layout and flow (fast, disposable)
- **Mid-fi**: Validate interaction patterns (enough to test, not distract)
- **High-fi**: Stakeholder sign-off (shows real vision)
- **Code prototype**: Complex interactions that can't be faked

## Design QA

Review implementation against spec:
- Layout, spacing, typography, colors match at all breakpoints
- All interaction states implemented; animations match spec
- Keyboard nav works; screen reader announces correctly; focus order matches visual order
- Error and empty states display correctly; responsive behavior verified

Process: designer reviews staging → files issues (expected vs. actual) → prioritize functional > accessibility > polish → re-review.

## UX Metrics

- **Task success rate**: > 90% critical, > 80% secondary
- **Time on task**: Compare against baseline, aim for reduction
- **Error rate**: Track by type (slips vs. mistakes)
- **SUS score**: > 68 above average, > 80 good, > 90 excellent

## Usability Testing

- 5 users per round; think-aloud, task-based; observe behavior not opinions
- Minimum every 2 weeks; weekly is ideal; full test before launch
- Unmoderated (20-50 users) for quantitative validation

## Collaboration Practices

- Weekly design review with developers during design phase
- Pair on complex interactions; shared language through tokens and component names
- Living design system documentation with decision log and changelog

## Anti-Patterns

- **Wall-of-specs handoff**: Dumping documents without conversation
- **Missing states**: Only designing happy path, leaving errors to developers
- **No design QA**: Assuming implementation matches spec without verification
