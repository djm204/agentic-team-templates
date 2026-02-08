---
description: Interaction Design
alwaysApply: false
---

# Interaction Design

Designing how users interact with interfaces — controls, feedback, transitions, and behavior.

## Core Principle

**Every interaction should feel inevitable.** The response should be exactly what users expected.

## Don Norman's 6 Principles

- **Visibility**: Can users see available actions? Primary actions visible, not hidden in menus
- **Feedback**: System responds to every action — button state changes, loading spinners appear immediately
- **Constraints**: Prevent errors (date picker prevents impossible dates)
- **Mapping**: Controls relate naturally to effects (volume slider left-to-right)
- **Consistency**: Same behavior everywhere ("Delete" always confirms)
- **Affordance**: Elements suggest how to interact (buttons look clickable)

## Fitts's Law

Time to target ∝ distance / target size. Make primary targets large (44x44px touch, 24x24px cursor). Place frequent actions close to focus. Submit button directly below last form field.

## Hick's Law

Decision time increases with choices. Limit to 5-7 options, use smart defaults, progressive disclosure, recommend best option clearly.

## Jakob's Law

Users expect your site to work like others. Follow platform conventions; only break when testing proves measurably better and learning cost is low.

## Forms

- One column; labels above fields (not placeholders as labels)
- Mark optional fields, not required; inline validation on blur
- Smart defaults; autofocus first field; tab order follows visual order
- Errors: inline next to field, plain language, preserve input, scroll to first error

## Buttons and CTAs

- Primary (one per section, filled) > Secondary (outlined) > Tertiary (text) > Destructive (red, requires confirmation)
- Labels use verbs: "Save Changes", "Send Invite" — specific over generic

## Interaction States

Every interactive element defines: Default, Hover, Focus, Active/Pressed, Disabled (explain why), Loading, Error, Success, Empty.

## Microinteractions (Saffer)

Trigger → Rules → Feedback → Loops/Modes. Keep fast (< 300ms), skippable, gracefully degrading.

## Animation and Motion

- Purpose: feedback, relationships, attention, state change — never purely decorative
- Duration: 100-300ms micro, 300-500ms macro; ease-out entrances, ease-in exits
- Respect `prefers-reduced-motion` (mandatory)

## Anti-Patterns

- **Modal abuse**: Content that should be a page
- **Hover-dependent UI**: Fails on touch devices
- **Disabled without explanation**: Grayed-out with no tooltip
- **Auto-advancing carousels**: Users can't read at carousel speed
