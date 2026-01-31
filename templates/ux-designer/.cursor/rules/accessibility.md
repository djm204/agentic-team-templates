# Accessibility

Designing inclusive experiences that work for all users regardless of ability, device, or context.

## Core Principle

**Accessibility is not a feature — it is a requirement.** An inaccessible product is a broken product. Design for the most constrained user and everyone benefits.

## WCAG 2.2 AA — POUR Framework

The Web Content Accessibility Guidelines organize requirements into four principles:

### Perceivable

Users must be able to perceive all information and UI components.

```markdown
Requirements:
- Text alternatives for non-text content (alt text, aria-labels)
- Captions and transcripts for audio/video content
- Content adaptable to different presentations (screen reader, zoom, reflow)
- Sufficient color contrast (4.5:1 for text, 3:1 for large text and UI components)
- No information conveyed by color alone (add icons, text, patterns)
- Text resizable up to 200% without loss of content or function
- Content reflows at 320px width without horizontal scrolling
```

### Operable

Users must be able to operate all UI components and navigation.

```markdown
Requirements:
- All functionality available via keyboard
- No keyboard traps (users can always Tab/Escape out)
- Skip navigation link as first focusable element
- Visible focus indicators on all interactive elements
- No time limits (or provide extend/disable options)
- No content that flashes more than 3 times per second
- Page titles describe topic or purpose
- Focus order follows logical reading sequence
- Link purpose clear from link text alone (no "click here")
- Multiple ways to find pages (navigation, search, sitemap)
- Touch targets minimum 24x24px (44x44px recommended)
```

### Understandable

Users must be able to understand the information and UI operation.

```markdown
Requirements:
- Language of page declared in HTML lang attribute
- Consistent navigation across pages
- Consistent identification of UI components
- Error identification with clear description
- Labels or instructions for user input
- Error prevention for legal/financial/data submissions (review before submit)
- Context does not change unexpectedly on focus or input
```

### Robust

Content must work with current and future assistive technologies.

```markdown
Requirements:
- Valid HTML with proper semantic structure
- Name, role, value programmatically determinable for all UI components
- Status messages communicated via ARIA live regions without focus change
- Compatible with screen readers, voice control, switch devices, and magnification
```

## Keyboard Navigation

```markdown
Requirements:
- Tab: Move forward through focusable elements
- Shift+Tab: Move backward
- Enter/Space: Activate buttons and links
- Arrow keys: Navigate within components (tabs, menus, radio groups)
- Escape: Close modals, dropdowns, popovers
- Home/End: Jump to first/last item in a list or slider

Focus management:
- Focus moves into modal when opened, returns to trigger when closed
- Focus never gets lost or stuck
- Focus indicators visible in all themes (light and dark)
- Custom focus styles: minimum 2px solid outline with offset, 3:1 contrast ratio

Tab order:
- Follows visual layout (left-to-right, top-to-bottom in LTR languages)
- Skip hidden/inactive elements
- tabindex="0" for custom interactive elements
- tabindex="-1" for programmatic focus (not in tab order)
- Never use tabindex > 0 (breaks natural order)
```

## Screen Readers

```markdown
Semantic HTML:
- Use <nav>, <main>, <header>, <footer>, <aside>, <section>, <article>
- Headings form a logical outline (h1 → h2 → h3, no skipping levels)
- Lists use <ul>/<ol>/<dl>, not styled divs
- Tables use <th>, <caption>, and scope attributes
- Forms use <label> associated with inputs via for/id

ARIA (Accessible Rich Internet Applications):
- Use native HTML elements first; ARIA is a supplement, not a replacement
- aria-label: Name an element when visible text is insufficient
- aria-describedby: Associate additional descriptions
- aria-live="polite": Announce dynamic content changes (toasts, status updates)
- aria-live="assertive": Interrupt for urgent messages (errors)
- aria-expanded: Communicate open/closed state of collapsibles
- aria-hidden="true": Hide decorative content from assistive tech
- role attributes: Only when native HTML semantics are insufficient

Testing:
- Test with VoiceOver (macOS/iOS), NVDA or JAWS (Windows), TalkBack (Android)
- Navigate the entire flow using only the screen reader
- Verify all actions can be completed without visual reference
```

## ARIA Authoring Practices Guide (APG)

Follow the WAI-ARIA APG patterns for complex components:

```markdown
Common patterns:
- Accordion: aria-expanded, aria-controls, Enter/Space to toggle
- Dialog (Modal): aria-modal, focus trap, Escape to close
- Tabs: role="tablist"/"tab"/"tabpanel", Arrow keys to switch
- Combobox: role="combobox", aria-autocomplete, list association
- Menu: role="menu"/"menuitem", Arrow keys, Enter to select
- Tooltip: role="tooltip", aria-describedby, Escape to dismiss
- Disclosure: aria-expanded, controls relationship

Rules:
- Follow the APG keyboard interaction patterns exactly
- Test with assistive technology, not just keyboard
- Complex widgets need comprehensive ARIA markup
```

## Inclusive Design (Microsoft)

Design for the full range of human diversity.

```markdown
Disability spectrum:
  Permanent → Temporary → Situational
  One arm    → Arm injury  → Carrying a baby
  Blind      → Eye surgery → Driving
  Deaf       → Ear infection → Loud environment
  Non-verbal → Laryngitis  → Non-native speaker

Principles:
1. Recognize exclusion (who can't use this?)
2. Learn from diversity (edge cases reveal design flaws)
3. Solve for one, extend to many (curb cuts help wheelchairs, strollers, bikes)
```

## Cognitive Accessibility

```markdown
Guidelines:
- Use plain language (aim for 8th-grade reading level)
- Break content into short, scannable chunks
- Use consistent and predictable patterns
- Provide clear error messages with recovery instructions
- Avoid time pressure (allow extended time or remove limits)
- Support undo for destructive actions
- Minimize required memory (show context, don't require recall)
- Use familiar icons and established UI patterns
- Progress indicators for multi-step processes
- No unexpected changes in context
```

## Testing Checklist

```markdown
Automated (catch ~30% of issues):
- axe-core or Lighthouse accessibility audit
- Color contrast checker
- HTML validation

Manual (catch ~70% of issues):
- Keyboard-only navigation (can you complete every task?)
- Screen reader walkthrough (does every element announce correctly?)
- Zoom to 200% (does content reflow without horizontal scroll?)
- Color blindness simulation (is meaning preserved?)
- Reduced motion test (does prefers-reduced-motion work?)
- Touch target size verification (44x44px minimum)
- Focus order verification (logical and predictable?)
- Form error experience (clear, specific, recoverable?)

User testing:
- Include users with disabilities in research participants
- Test with the assistive technologies your users actually use
- Observe real behavior, don't rely on automated reports alone
```

## Anti-Patterns

```markdown
- Accessibility overlay widgets: Third-party "fix-it" overlays don't work and create new problems
- Missing alt text: Images without alternatives are invisible to screen readers
- Placeholder-only labels: Placeholders disappear on focus, leaving users without context
- Focus suppression: outline: none without a replacement focus style
- Mouse-only interactions: Drag-and-drop, hover reveals, or swipe without keyboard alternatives
- CAPTCHAs without alternatives: Audio CAPTCHA or bypass for authenticated users
- Auto-playing media: Audio or video that plays without user initiation
- "Accessibility is done": It's never done — it requires ongoing testing and maintenance
```
