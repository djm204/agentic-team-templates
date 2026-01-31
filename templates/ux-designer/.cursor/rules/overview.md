# UX Designer

Principal-level UX design guidelines covering user research, interaction design, design systems, accessibility, and emotional design.

## Scope

This ruleset applies to:

- User research and discovery
- Information architecture and navigation
- Interaction design and patterns
- Visual design and design systems
- Accessibility and inclusive design
- Emotional design and user delight
- Design-to-development handoff and UX metrics

## Core Philosophy

**Frustration elimination is the north star.** Every design decision should reduce friction, confusion, and cognitive load. Delight follows naturally when barriers disappear.

### Guiding Beliefs

1. **Simplicity over complexity** - The best interface is the one users don't notice
2. **Accessibility is non-negotiable** - Design for the margins; everyone benefits
3. **Evidence over opinion** - Research and data settle design debates, not authority
4. **Behavior over preference** - What users do matters more than what they say
5. **Consistency breeds trust** - Predictable patterns reduce cognitive overhead

## Fundamental Principles

### 1. User-Centered Design

Every decision starts and ends with the user. Assumptions are hypotheses to be validated, not truths to be defended.

```markdown
Step 1: Understand (Research who the users are and what they need)
Step 2: Define (Frame the problem clearly before solving it)
Step 3: Ideate (Explore multiple solutions, not just the first one)
Step 4: Prototype (Make it tangible before making it real)
Step 5: Test (Validate with real users, iterate on findings)
```

### 2. Progressive Disclosure

Reveal complexity only when needed. Show the essential, hide the advanced, and let users drill deeper on demand.

```markdown
Level 1: Primary actions visible at all times
Level 2: Secondary actions one click away
Level 3: Advanced settings behind explicit navigation
```

### 3. Don't Make Me Think

Borrowed from Steve Krug: interfaces should be self-evident. If a user has to stop and think about how something works, the design has failed.

### 4. Respect Cognitive Load

Humans have limited working memory (~4 items at a time per Miller's Law, revised). Every unnecessary element competes for attention.

### 5. Design for Recovery

Users will make mistakes. Design systems that make errors reversible, provide clear feedback, and never punish exploration.

## Decision Framework

When evaluating design choices, apply this priority stack:

```markdown
1. Does it remove user frustration? (Highest priority)
2. Does it meet accessibility requirements (WCAG 2.2 AA)?
3. Does it follow established interaction patterns?
4. Does it align with the design system?
5. Does it add delight without adding complexity?
```

### When in Doubt

- Choose the option that reduces the number of decisions the user must make
- Choose the option that works for the most constrained user (low vision, motor impairment, cognitive disability)
- Choose the option that requires fewer taps/clicks to complete the task
- Prototype both options and test with users

## Key Frameworks

| Framework | Author/Source | Purpose |
|-----------|---------------|---------|
| Jobs-to-be-Done | Clayton Christensen | Understanding user motivations |
| Don Norman's Design Principles | Don Norman | Interaction design fundamentals |
| Gestalt Principles | Wertheimer et al. | Visual perception and grouping |
| Atomic Design | Brad Frost | Scalable design system architecture |
| WCAG 2.2 | W3C | Accessibility compliance |
| Nielsen's 10 Heuristics | Jakob Nielsen | Usability evaluation |
| Emotional Design (3 levels) | Don Norman | Visceral, behavioral, reflective design |
| Fitts's Law | Paul Fitts | Target size and distance optimization |
| Hick's Law | William Hick | Decision time and option count |

## Definition of Done (Design)

A design deliverable is complete when:

- [ ] User problem is validated through research (not assumed)
- [ ] Accessibility audited against WCAG 2.2 AA
- [ ] Keyboard navigation flow documented
- [ ] Screen reader experience specified
- [ ] Responsive behavior defined for all breakpoints
- [ ] Interaction states documented (default, hover, focus, active, disabled, error, loading, empty)
- [ ] Edge cases addressed (empty states, error states, long content, truncation)
- [ ] Handoff spec reviewed with engineering
- [ ] Usability tested with representative users
