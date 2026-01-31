# Design Handoff

Bridging design and development through clear specifications, shared language, and measurable quality standards.

## Core Principle

**Handoff is not a moment — it is a continuous conversation.** Designers and developers should collaborate from the start, not pass artifacts over a wall.

## Nielsen's 10 Usability Heuristics

The standard evaluation framework for interface usability:

```markdown
1. Visibility of System Status
   - Always keep users informed about what's happening
   - Progress bars, loading states, status indicators

2. Match Between System and Real World
   - Use language and concepts familiar to the user
   - Follow real-world conventions; information appears in natural order

3. User Control and Freedom
   - Support undo and redo
   - Provide clearly marked "emergency exits"

4. Consistency and Standards
   - Follow platform conventions
   - Same words/actions mean the same things everywhere

5. Error Prevention
   - Prevent errors before they occur
   - Confirmation dialogs for destructive actions
   - Constraints that eliminate impossible states

6. Recognition Rather Than Recall
   - Make options visible; minimize memory load
   - Instructions visible or easily retrievable

7. Flexibility and Efficiency of Use
   - Accelerators for expert users (shortcuts, bulk actions)
   - Customizable frequent actions

8. Aesthetic and Minimalist Design
   - No irrelevant or rarely needed information
   - Every element competes for attention — earn its place

9. Help Users Recognize, Diagnose, and Recover From Errors
   - Plain language error messages (no codes)
   - Precisely indicate the problem
   - Suggest a solution

10. Help and Documentation
    - Searchable, task-focused
    - Concrete steps to follow
    - Keep it concise
```

## Specification Standards

What every design handoff must include:

```markdown
Layout:
- Responsive behavior at all breakpoints (mobile, tablet, desktop)
- Spacing values using design tokens (not arbitrary pixel values)
- Grid alignment and column usage
- Max-width and min-width constraints

Typography:
- Font family, weight, size, line-height, letter-spacing (as tokens)
- Heading hierarchy applied correctly
- Truncation behavior for long content

Color:
- All colors referenced as design tokens
- Light and dark mode specifications
- Contrast ratios documented for key combinations

Components:
- All states specified (default, hover, focus, active, disabled, error, loading, empty)
- Interaction behavior described (what happens on click, focus, blur)
- Animation/transition specifications (duration, easing, trigger)
- Responsive adaptations per breakpoint

Content:
- Real content examples (not lorem ipsum for final specs)
- Character limits and truncation rules
- Empty state designs
- Error message copy
```

## Design Annotations

Mark up designs with implementation context:

```markdown
Annotation types:
- Spacing callouts: Token names and values for margins/padding
- Interaction notes: "On hover, show tooltip after 500ms delay"
- Responsive notes: "Stack columns below 768px"
- Accessibility notes: "aria-label='Close dialog'", "Focus trap in modal"
- Animation notes: "Fade in 200ms ease-out on mount"
- Edge cases: "Truncate with ellipsis after 2 lines"
- Conditional logic: "Show only when user has admin role"
```

## Prototyping

```markdown
Fidelity levels:
- Low-fi (paper/wireframe): Validate layout and flow
- Mid-fi (grayscale interactive): Validate interaction patterns
- High-fi (visual + interactive): Validate look, feel, and motion
- Code prototype: Validate feasibility and performance

When to use each:
- Exploring ideas → low-fi (fast, disposable)
- User testing navigation → mid-fi (enough to test, not enough to distract)
- Stakeholder sign-off → high-fi (shows the real vision)
- Complex interactions → code prototype (some things can't be faked)

Tools don't matter — outcomes do. Use whatever gets answers fastest.
```

## Design QA

Review implemented designs against specifications:

```markdown
Checklist:
- [ ] Layout matches spec at all breakpoints
- [ ] Spacing uses correct design tokens
- [ ] Typography matches spec (font, size, weight, line-height)
- [ ] Colors match spec and meet contrast requirements
- [ ] All interaction states implemented (hover, focus, active, disabled, error, loading, empty)
- [ ] Animations match spec (duration, easing, trigger)
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announces elements correctly
- [ ] Focus order matches visual order
- [ ] Error states display correctly with appropriate messages
- [ ] Empty states display correctly
- [ ] Content truncation works as specified
- [ ] Responsive behavior matches spec at all breakpoints
- [ ] Dark mode (if applicable) matches spec

Process:
1. Designer reviews implementation in staging environment
2. File issues with screenshots showing expected vs. actual
3. Prioritize: functional issues > accessibility issues > visual polish
4. Re-review after fixes
```

## UX Metrics

Measure what matters to validate design decisions:

### Task-Level Metrics

```markdown
- Task success rate: % of users who complete the task correctly
  Target: > 90% for critical flows, > 80% for secondary flows

- Time on task: How long it takes to complete a task
  Compare against baseline; aim for continuous reduction

- Error rate: Number of errors per task attempt
  Track by type (slips vs. mistakes) to inform different fixes

- Task abandonment: % of users who start but don't finish
  Identify where in the flow they drop off
```

### Experience Metrics

```markdown
- System Usability Scale (SUS):
  10-question standardized questionnaire
  Score: 0-100. Above 68 = above average. Above 80 = good. Above 90 = excellent.

- Customer Satisfaction (CSAT): Post-interaction rating
  "How satisfied were you with this experience?" (1-5 scale)

- Net Promoter Score (NPS): Loyalty indicator
  "How likely are you to recommend this?" (0-10)
  Promoters (9-10) - Detractors (0-6) = NPS

- Customer Effort Score (CES): Ease of use
  "How easy was it to complete your task?" (1-7)
```

### Behavioral Metrics

```markdown
- Feature adoption rate: % of users who use a feature within first 30 days
- Retention: % of users who return after day 1, 7, 30
- Funnel completion: % conversion through multi-step flows
- Rage clicks: Repeated rapid clicks on the same element (indicates frustration)
- Dead clicks: Clicks on non-interactive elements (indicates confusion)
```

## Usability Testing

```markdown
Moderated testing:
- 5 users per round (catches ~85% of usability issues)
- Think-aloud protocol: users narrate their thought process
- Task-based: give users realistic goals, not instructions
- Observe behavior, not opinions
- Record sessions for team review

Unmoderated testing:
- Larger sample size (20-50 users)
- Task-based with screen recording
- Useful for quantitative validation
- Less nuance than moderated sessions

Testing frequency:
- Minimum: Every sprint or every 2 weeks
- Ideal: Weekly lightweight tests on current work
- Before launch: Full usability test on complete flow
- After launch: Ongoing with analytics + periodic interviews
```

## Collaboration Practices

```markdown
Design-dev sync:
- Weekly design review with developers during design phase
- Pair on complex interactions (designer + developer together)
- Shared language through design tokens and component names
- Developers review prototypes before final spec

Documentation:
- Living design system documentation (not static PDFs)
- Decision log: why design choices were made (not just what)
- Changelog for design system updates
- Migration guides when components change
```

## Anti-Patterns

```markdown
- Wall-of-specs handoff: Dumping a 50-page document without conversation
- Pixel perfection over functionality: Debating 1px while ignoring broken flows
- Designing in isolation: Creating specs without developer input on feasibility
- Missing states: Only designing the happy path, leaving error/empty/loading to developers
- Lorem ipsum in final specs: Real content reveals design issues placeholder text hides
- No design QA: Assuming implementation matches spec without verification
- Vanity metrics: Tracking page views instead of task success
- Testing after launch only: Discovering usability issues when it's expensive to fix them
```
