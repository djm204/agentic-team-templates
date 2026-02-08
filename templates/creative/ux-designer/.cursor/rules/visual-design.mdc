---
description: Visual Design
alwaysApply: false
---

# Visual Design

Principles and systems for visual communication, design systems, and consistent UI expression.

## Core Principle

**Visual design is communication, not decoration.** Every pixel serves a purpose: hierarchy, grouping, attention, or meaning.

## Gestalt Principles

- **Proximity**: Elements close together perceived as related — group related fields, separate with whitespace
- **Similarity**: Consistent styling for same-type elements
- **Continuity**: Align elements to create visual flow via grids
- **Closure**: Progress bars, partially visible cards indicate more content
- **Figure-Ground**: Modals dim background; selected items highlight
- **Common Region**: Cards and bordered sections group content

## Atomic Design (Frost)

Atoms (button, input, icon) → Molecules (search bar) → Organisms (header) → Templates → Pages. Design smallest first; every component self-contained, reusable, documented.

## Design Tokens

Single source of truth for all design decisions:
- **Color**: primary, secondary, neutral, error, warning, success, info
- **Typography**: font families, sizes, weights, line heights
- **Spacing**: base-8 scale (4, 8, 16, 24, 32, 48px)
- **Border/Shadow/Motion**: radius, width, durations, easing

Never use raw values — always reference tokens. Semantic tokens alias primitives. Support theming via token swap.

## Typography

- Max 2 font families; body minimum 16px
- Line height: 1.4-1.6 body, 1.1-1.3 headings; line length 45-75 chars
- Contrast: 4.5:1 body text, 3:1 large text (WCAG AA)

## Color System

- Never use color as sole indicator — add icons, text, patterns
- Test with color blindness simulators
- Dark mode is redesigned, not inverted; limit to 5-8 functional colors + neutrals

## Spacing and Layout

- Base-8 spacing scale; 12-column grid (web), 4-column (mobile)
- Content max-width 1200-1440px; responsive breakpoints: 640, 768, 1024, 1280px
- More whitespace = more perceived quality and readability

## Responsive Design

Mobile-first, scale up. Touch targets 44x44px minimum. No horizontal scrolling. Images fluid. Typography scales with viewport (clamp()). Test on real devices.

## Iconography

- Single icon set; icons accompanied by text labels (except universal: close, search, menu)
- Minimum touch target 44x44px; aria-label for meaningful icons; aria-hidden for decorative

## Anti-Patterns

- **Snowflake components**: One-off designs outside the system
- **Token bypass**: Hard-coding values instead of referencing tokens
- **Font overload**: More than 2 families or 4+ weights
