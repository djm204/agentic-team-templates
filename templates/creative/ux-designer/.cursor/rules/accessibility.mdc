---
description: Accessibility
alwaysApply: false
---

# Accessibility

Designing inclusive experiences that work for all users regardless of ability, device, or context.

## Core Principle

**Accessibility is not a feature — it is a requirement.** Design for the most constrained user and everyone benefits.

## WCAG 2.2 AA — POUR Framework

### Perceivable
- Alt text for non-text content; captions/transcripts for audio/video
- 4.5:1 contrast for text, 3:1 for large text and UI components
- No information by color alone; text resizable to 200%; reflow at 320px width

### Operable
- All functionality via keyboard; no keyboard traps
- Skip navigation link as first focusable element; visible focus indicators
- No time limits (or extend/disable); no flashing > 3 times/sec
- Focus order follows logical sequence; link purpose clear from text alone; touch targets 24x24px min (44x44px recommended)

### Understandable
- Language declared in HTML lang; consistent navigation and component identification
- Error identification with clear description; labels for all inputs
- No unexpected context change on focus or input

### Robust
- Valid semantic HTML; name, role, value programmatically determinable
- Status messages via ARIA live regions; compatible with screen readers, voice control, switch devices

## Keyboard Navigation

- Tab/Shift+Tab to move; Enter/Space to activate; Arrows within components; Escape to close
- Focus into modal on open, returns to trigger on close; never lost or stuck
- Custom focus: 2px+ outline, 3:1 contrast; tabindex="0" for custom elements, "-1" for programmatic only; never > 0

## Screen Readers

- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`
- Headings: logical outline (h1→h2→h3, no skipping); lists use `<ul>`/`<ol>`; forms use `<label>`
- ARIA: supplement to HTML, not replacement; aria-label, aria-describedby, aria-live, aria-expanded, aria-hidden
- Follow WAI-ARIA APG patterns for complex widgets (accordion, dialog, tabs, combobox, menu)
- Test with VoiceOver, NVDA/JAWS, TalkBack

## Inclusive Design

Disability spectrum: Permanent → Temporary → Situational. Solve for one, extend to many (curb cuts help wheelchairs, strollers, bikes).

## Cognitive Accessibility

Plain language (8th-grade level), short scannable chunks, consistent patterns, clear error messages with recovery, undo for destructive actions, minimize required memory, progress indicators.

## Testing

- **Automated** (~30%): axe-core/Lighthouse, contrast checker, HTML validation
- **Manual** (~70%): Keyboard-only navigation, screen reader walkthrough, 200% zoom reflow, color blindness simulation, reduced motion, touch targets, focus order, form errors
- **User testing**: Include users with disabilities; test with actual assistive technologies

## Anti-Patterns

- **Overlay widgets**: Don't work and create new problems
- **Placeholder-only labels**: Disappear on focus
- **Focus suppression**: `outline: none` without replacement
- **Mouse-only interactions**: Drag-and-drop without keyboard alternative
