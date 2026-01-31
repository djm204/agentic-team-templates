# Interaction Design

Designing how users interact with interfaces — controls, feedback, transitions, and behavior.

## Core Principle

**Every interaction should feel inevitable.** When a user taps, clicks, or swipes, the response should be exactly what they expected. Surprise is the enemy of usability.

## Don Norman's Design Principles

Six fundamental principles from *The Design of Everyday Things*:

```markdown
1. Visibility — Can users see what actions are available?
2. Feedback — Does the system respond to every user action?
3. Constraints — Does the design prevent errors?
4. Mapping — Do controls relate naturally to their effects?
5. Consistency — Do similar things work the same way?
6. Affordance — Does the element suggest how to interact with it?
```

### Application

```markdown
Visibility:
  ✅ Primary actions are visible buttons, not hidden in menus
  ❌ Key features accessible only through right-click or gestures

Feedback:
  ✅ Button changes state on press; loading spinner appears immediately
  ❌ User clicks "Save" and nothing visibly happens for 3 seconds

Constraints:
  ✅ Date picker prevents selecting impossible dates
  ❌ Free text field for dates with no validation until submission

Mapping:
  ✅ Volume slider moves left-to-right for quieter-to-louder
  ❌ Toggle labeled "Enable" that turns things off when activated

Consistency:
  ✅ "Delete" always requires confirmation, everywhere
  ❌ Delete confirms in Settings but is instant in the dashboard

Affordance:
  ✅ Buttons look clickable (raised, colored, labeled)
  ❌ Flat text that is secretly a link with no visual indicator
```

## Fitts's Law

The time to reach a target is proportional to the distance and inversely proportional to the target size.

```markdown
Application:
- Make primary action targets large (minimum 44x44px touch, 24x24px cursor)
- Place frequently-used actions close to the user's current focus
- Corners and edges of the screen are effectively infinite in size (use them)
- Reduce the distance between related sequential actions

Examples:
  ✅ Submit button directly below the last form field
  ❌ Submit button at the top of the page, far from the form
  ✅ "Confirm" dialog button near the action that triggered it
  ❌ Confirmation modal that appears at the center regardless of trigger location
```

## Hick's Law

Decision time increases logarithmically with the number of choices.

```markdown
Application:
- Limit choices to 5-7 options per decision
- Use smart defaults to eliminate unnecessary decisions
- Group and categorize when many options are unavoidable
- Progressive disclosure: show essentials first, details on demand
- Recommend the best option clearly

Examples:
  ✅ Pricing page with 3 plans, one highlighted as "Most Popular"
  ❌ Pricing page with 12 plans and a comparison matrix
  ✅ Smart default selected in a dropdown
  ❌ Empty dropdown requiring the user to scroll through 100 options
```

## Jakob's Law

Users spend most of their time on other sites/apps. They expect yours to work the same way.

```markdown
Application:
- Follow platform conventions (iOS, Android, Web)
- Use standard interaction patterns (pull-to-refresh, swipe-to-delete)
- Place navigation where users expect it
- Don't reinvent standard components for novelty's sake

When to break convention:
- Only when user testing proves the new pattern is measurably better
- AND the learning cost is low enough to justify the improvement
```

## Interaction Patterns

### Forms

```markdown
Rules:
- One column layout (users read forms top-to-bottom)
- Labels above fields (not inline placeholders as labels)
- Mark optional fields, not required (most fields should be required)
- Inline validation on blur, not on keystroke
- Group related fields with clear section headings
- Smart defaults reduce effort
- Autofocus the first field
- Tab order follows visual order

Error handling:
- Show errors inline next to the offending field
- Use plain language: "Enter a valid email" not "Error 422"
- Preserve user input on error (never clear the form)
- Scroll to first error and focus it
```

### Buttons and CTAs

```markdown
Hierarchy:
- Primary: One per screen/section. High contrast, filled.
- Secondary: Supporting actions. Outlined or lower contrast.
- Tertiary: Minimal actions. Text-only or links.
- Destructive: Red or distinct treatment. Always requires confirmation.

Labels:
- Use verbs: "Save Changes", "Send Invite", "Delete Account"
- Be specific: "Create Project" > "Submit" > "OK"
- Match the action to the outcome: "Place Order" not "Continue"
```

### States

Every interactive element must define all possible states:

```markdown
States:
- Default — Resting state
- Hover — Cursor over (desktop only)
- Focus — Keyboard navigation highlight (mandatory for accessibility)
- Active/Pressed — During interaction
- Disabled — Cannot interact (must explain why)
- Loading — Waiting for response
- Error — Something went wrong
- Success — Action completed
- Empty — No content to display
```

### Microinteractions (Dan Saffer)

Small, contained product moments that accomplish a single task.

```markdown
Structure:
1. Trigger — What initiates the interaction (user action or system event)
2. Rules — What happens when triggered
3. Feedback — How the user knows what happened
4. Loops & Modes — What changes over time or repeated use

Examples:
- Pull-to-refresh: Trigger → animation → content update → settle
- Like button: Tap → heart animation → count increment → color change
- Form submission: Click → button loading state → success message → redirect

Rules:
- Keep them fast (< 300ms for direct manipulation)
- Make them skippable (animation shouldn't block workflow)
- Degrade gracefully (functionality works even if animation fails)
```

### Animation and Motion

```markdown
Purpose of motion:
- Provide feedback (button pressed, item added)
- Show relationships (element came from here, goes to there)
- Direct attention (notification appeared)
- Communicate state change (loading → loaded)

Principles:
- Motion should have purpose — never purely decorative
- Duration: 100-300ms for micro, 300-500ms for macro transitions
- Easing: ease-out for entrances, ease-in for exits, ease-in-out for movement
- Respect prefers-reduced-motion media query (mandatory)
- Stagger animations for groups (40-80ms offset per item)
```

## Navigation Interactions

```markdown
Page transitions:
- Forward navigation: slide left / fade in
- Backward navigation: slide right / fade in
- Modal opening: scale up from trigger or fade in
- Modal closing: reverse of opening

Tab/section switching:
- Instant swap (no transition) or quick crossfade (150ms)
- Never animate content the user is trying to read
```

## Anti-Patterns

```markdown
- Modal abuse: Using modals for content that should be a page
- Double-click traps: Actions that fire twice on double-click
- Invisible scrolling: Content below the fold with no scroll indicator
- Disabled without explanation: Grayed-out buttons with no tooltip or message
- Hover-dependent UI: Features only accessible on hover (fails on touch)
- Infinite scroll without position: No way to return to a specific item
- Auto-advancing carousels: Users can't read at carousel speed
- Dark patterns: Trick questions, hidden costs, forced continuity, misdirection
```
