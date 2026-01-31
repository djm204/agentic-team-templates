# Visual Design

Principles and systems for visual communication, design systems, and consistent UI expression.

## Core Principle

**Visual design is communication, not decoration.** Every pixel should serve a purpose: establish hierarchy, group related elements, guide attention, or reinforce meaning.

## Gestalt Principles of Visual Perception

How humans naturally perceive and group visual elements:

```markdown
Proximity — Elements close together are perceived as related
  → Group related form fields; separate unrelated sections with whitespace

Similarity — Elements that look alike are perceived as related
  → Use consistent styling for same-type elements (all links blue, all tags pills)

Continuity — The eye follows lines, curves, and sequences
  → Align elements to create visual flow; use grids and alignment

Closure — The mind completes incomplete shapes
  → Progress bars, partially visible cards (indicating scrollable content)

Figure-Ground — Users distinguish foreground from background
  → Modals dim the background; selected items highlight against the list

Common Region — Elements within a boundary are perceived as grouped
  → Cards, bordered sections, background color changes for groupings
```

## Atomic Design (Brad Frost)

Scalable methodology for building design systems from smallest to largest:

```markdown
1. Atoms — Smallest UI elements (button, input, label, icon, color, font)
2. Molecules — Simple groups of atoms (search bar = input + button)
3. Organisms — Complex components (header = logo + nav + search + avatar)
4. Templates — Page-level layouts with placeholder content
5. Pages — Templates populated with real content

Rules:
- Design atoms before molecules, molecules before organisms
- Every component should be self-contained and reusable
- Document every component with usage guidelines and examples
- Name components by what they are, not where they appear
```

## Design Tokens (W3C Community Group)

The single source of truth for design decisions, expressed as platform-agnostic values.

```markdown
Token categories:
- Color: color.primary, color.error, color.surface, color.text.primary
- Typography: font.family.body, font.size.lg, font.weight.bold, line-height.tight
- Spacing: space.xs (4px), space.sm (8px), space.md (16px), space.lg (24px), space.xl (32px)
- Border: border.radius.sm, border.width.default, border.color.subtle
- Shadow: shadow.sm, shadow.md, shadow.lg
- Motion: duration.fast (100ms), duration.normal (200ms), easing.standard
- Breakpoints: breakpoint.sm (640px), breakpoint.md (768px), breakpoint.lg (1024px)

Rules:
- Tokens are the API of the design system
- Never use raw values in components — always reference tokens
- Semantic tokens (color.error) alias primitive tokens (red.500)
- Support theming through token swapping (light/dark mode)
```

## Typography

```markdown
Hierarchy:
- Display: Hero headings, landing pages (32-72px)
- H1: Page titles (28-36px)
- H2: Section headings (22-28px)
- H3: Subsection headings (18-22px)
- Body: Paragraph text (16px baseline)
- Small: Captions, metadata (12-14px)

Rules:
- Maximum 2 font families (one for headings, one for body — or the same)
- Body text minimum 16px (anything smaller causes readability issues)
- Line height: 1.4-1.6 for body text, 1.1-1.3 for headings
- Line length: 45-75 characters per line (optimal ~66)
- Paragraph spacing: 1em minimum between paragraphs
- Contrast ratio: 4.5:1 minimum for body text, 3:1 for large text (WCAG AA)
```

## Color

```markdown
System:
- Primary: Brand color, used for CTAs and key interactive elements
- Secondary: Supporting color for less prominent interactive elements
- Neutral: Grays for text, borders, backgrounds, dividers
- Error: Red/warm for error states and destructive actions
- Warning: Amber/yellow for caution and non-blocking alerts
- Success: Green for confirmation and positive feedback
- Info: Blue for informational messages

Rules:
- Never use color as the only indicator (add icons, text, patterns)
- Test with color blindness simulators (protanopia, deuteranopia, tritanopia)
- Dark mode is not inverted light mode — redesign contrast and emphasis
- Limit palette to 5-8 functional colors plus neutrals
- Ensure all color combinations meet WCAG 2.2 AA contrast ratios
```

## Spacing and Layout

```markdown
Spacing scale (base-8 system):
  4px  — Tight: between related inline elements
  8px  — Small: between related stacked elements
  16px — Medium: between components within a section
  24px — Large: between sections
  32px — Extra-large: major section breaks
  48px — 2XL: page-level breathing room

Grid:
- Use a consistent column grid (12-column for web, 4-column for mobile)
- Gutters match the spacing scale (16px or 24px)
- Content maxwidth: 1200-1440px for readability
- Responsive breakpoints: 640, 768, 1024, 1280px

Whitespace:
- Whitespace is not wasted space — it creates hierarchy and breathing room
- More whitespace = more perceived quality and readability
- Group related elements with less whitespace; separate unrelated with more
```

## Iconography

```markdown
Rules:
- Use a single icon set for consistency (don't mix icon libraries)
- Icons must be accompanied by text labels (except universally recognized: close, search, menu)
- Minimum touch target: 44x44px even if the icon is smaller
- Support both outlined and filled variants for state changes
- Ensure icons work at small sizes (16px minimum)
- Provide alt text or aria-label for meaningful icons
- Use aria-hidden="true" for decorative icons
```

## Responsive Design

```markdown
Approach: Mobile-first, scale up

Breakpoints:
  < 640px   — Mobile (single column, stacked layout)
  640-768px  — Large mobile / small tablet
  768-1024px — Tablet (2-column where appropriate)
  1024-1280px — Desktop
  > 1280px   — Wide desktop (max-width container, don't stretch)

Rules:
- Design mobile first, then adapt for larger screens
- Touch targets: 44x44px minimum on mobile
- No horizontal scrolling on any breakpoint
- Images are fluid (max-width: 100%)
- Typography scales with viewport (clamp() for fluid type)
- Test on real devices, not just browser resize
```

## Design System Governance

```markdown
Rules:
- Every component needs documentation: usage, props, do/don't examples
- Changes to tokens or components require design review
- Deprecate before removing — provide migration path
- Version the design system alongside code releases
- Audit for consistency quarterly
- Component library is the single source of truth (not a Figma file that diverges)
```

## Anti-Patterns

```markdown
- Snowflake components: One-off designs that don't use the design system
- Token bypass: Hard-coding values instead of referencing tokens
- Decoration-driven design: Visual flourishes that add no meaning
- Inconsistent spacing: Mixing arbitrary pixel values instead of a scale
- Font overload: More than 2 font families or 4+ weights
- Color soup: Too many colors with no systematic rationale
- Pixel-perfect obsession: Spending hours on 1px alignment instead of testing usability
```
