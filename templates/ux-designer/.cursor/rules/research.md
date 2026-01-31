# User Research

Evidence-based methods for understanding users, validating assumptions, and making informed design decisions.

## Core Principle

**Talk to users early, often, and honestly.** Research is not a phase; it is a continuous practice embedded in every stage of design.

## Research Methods

### User Interviews

Structured conversations to uncover user needs, behaviors, and pain points.

```markdown
Planning:
- Define research questions (what you want to learn, not what you'll ask)
- Recruit 5-8 participants per segment (saturation point per Nielsen)
- Prepare a discussion guide with open-ended questions

During:
- Ask about past behavior, not hypothetical futures
- "Tell me about the last time you..." > "Would you ever..."
- Follow the energy: when they lean in, dig deeper
- Silence is a tool; let them fill the gaps

After:
- Synthesize within 24 hours while memory is fresh
- Tag quotes and observations by theme
- Share raw findings before interpreting them
```

### The Mom Test (Rob Fitzpatrick)

Rules for asking questions that even your mom can't lie to you about:

```markdown
1. Talk about their life, not your idea
2. Ask about specifics in the past, not generics about the future
3. Talk less, listen more

Bad: "Would you use an app that does X?"
Good: "How do you currently handle X? Walk me through the last time."

Bad: "Do you think this is a good idea?"
Good: "What solutions have you tried? What worked and what didn't?"
```

### Jobs-to-be-Done (Clayton Christensen)

Understand the progress users are trying to make in a given circumstance.

```markdown
Framework:
"When I [situation], I want to [motivation], so I can [expected outcome]."

Example:
"When I'm onboarding a new team member, I want to share access quickly,
 so I can get them productive on day one."

Key insight: Users don't buy products; they hire them to do a job.
Competing products are rarely in the same category.
```

### Empathy Mapping

Collaborative visualization of what users say, think, do, and feel.

```markdown
Quadrants:
┌─────────────────┬─────────────────┐
│     SAYS         │     THINKS       │
│ (Direct quotes)  │ (Inferred from   │
│                  │  behavior)        │
├─────────────────┼─────────────────┤
│     DOES         │     FEELS        │
│ (Observed        │ (Emotional       │
│  actions)        │  state)          │
└─────────────────┴─────────────────┘

Use after interviews to align the team on user perspective.
```

## Personas

Archetypes representing user segments, grounded in research data.

```markdown
Structure:
- Name, photo, demographic snapshot
- Goals (what they want to achieve)
- Frustrations (what blocks them today)
- Behaviors (how they currently work)
- Context (devices, environment, constraints)
- Quote (real or composite from interviews)

Rules:
- Derived from research, never invented
- 3-5 personas maximum (more dilutes focus)
- Include an "edge case" persona (accessibility, low-tech, etc.)
- Revisit and update quarterly
```

## Journey Mapping

Visualize the end-to-end user experience across touchpoints.

```markdown
Columns: Stages of the journey (Awareness → Consideration → Action → Retention)
Rows:
- Actions (what the user does)
- Touchpoints (where they interact)
- Thoughts (what they're thinking)
- Emotions (how they feel — map on a curve)
- Pain points (friction moments)
- Opportunities (design intervention points)

Rules:
- Map current state before designing future state
- Base on observed behavior, not ideal paths
- Identify the "moments of truth" — where experience breaks or bonds
```

## Continuous Discovery (Teresa Torres)

Research is not a project; it is a weekly habit.

```markdown
Principles:
1. Talk to users every week (minimum 1 interview/week)
2. Map the opportunity space, not the solution space
3. Use opportunity solution trees to connect outcomes → opportunities → solutions
4. Run small experiments before building features
5. Separate discovery (what to build) from delivery (how to build it)

Opportunity Solution Tree:
  Desired Outcome
      ├── Opportunity A
      │   ├── Solution 1 → Experiment
      │   └── Solution 2 → Experiment
      └── Opportunity B
          ├── Solution 3 → Experiment
          └── Solution 4 → Experiment
```

## Survey Design

Quantitative validation of qualitative findings.

```markdown
Rules:
- Use surveys to measure, not to discover (interviews first)
- Limit to 5-10 questions (completion rate drops after 10)
- Avoid leading questions and double-barreled items
- Include a mix of Likert scale, multiple choice, and one open-ended
- Report confidence intervals, not just percentages
- Minimum viable sample: 30 for directional, 100+ for statistical significance
```

## Research Ethics

```markdown
Non-negotiable:
- Informed consent before every session
- Anonymize data before sharing
- Participants can stop at any time without consequence
- Compensate participants fairly for their time
- Never manipulate or deceive during research
- Store recordings securely; delete when analysis is complete
```

## Anti-Patterns

```markdown
- Confirmation bias: Only talking to users who validate your hypothesis
- Leading questions: "Don't you think this is easier?"
- Proxy research: Asking stakeholders what users want instead of asking users
- Research theater: Conducting research with no intention to act on findings
- Big-bang research: Doing all research upfront and none after launch
- Persona fiction: Creating personas from assumptions instead of data
```
