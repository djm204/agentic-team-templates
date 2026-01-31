# Product Discovery

Guidelines for continuous customer discovery and research.

## Core Principles

### Continuous Discovery Habits

Discovery is not a phase—it's an ongoing practice. Product teams should:

- **Interview customers weekly** - Minimum one conversation per week
- **Synthesize learnings regularly** - Update opportunity trees weekly
- **Test assumptions constantly** - Validate before building

### The Product Trio

Discovery is a team sport. The product trio (PM, Designer, Engineer) should:

- Attend customer interviews together
- Co-create opportunity solution trees
- Share ownership of discovery outcomes

## Opportunity Solution Trees

### Structure

```text
                [Desired Business Outcome]
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
   [Opportunity 1]  [Opportunity 2]  [Opportunity 3]
   (Customer Need)  (Customer Need)  (Customer Need)
         │                │                │
    ┌────┼────┐      ┌────┼────┐      ┌────┼────┐
    ▼    ▼    ▼      ▼    ▼    ▼      ▼    ▼    ▼
  [Sol] [Sol] [Sol] [Sol] [Sol] [Sol] [Sol] [Sol] [Sol]
    │
    ▼
[Assumption Tests]
```

### Building the Tree

1. **Start with outcome**: What business metric are we trying to move?
2. **Map opportunities**: What customer needs, if addressed, would drive the outcome?
3. **Generate solutions**: What are multiple ways to address each opportunity?
4. **Test assumptions**: What must be true for each solution to work?

### Opportunity Evaluation

| Criteria | Questions |
|----------|-----------|
| Frequency | How often does this problem occur? |
| Intensity | How painful is this problem? |
| Reach | How many customers experience this? |
| Strategic Fit | Does this align with our strategy? |

## Customer Interviews

### Interview Types

| Type | Purpose | When to Use |
|------|---------|-------------|
| Exploratory | Understand problem space | Early discovery |
| Problem | Validate specific problems | Opportunity assessment |
| Solution | Test solution concepts | Before building |
| Usability | Evaluate existing solutions | During/after building |

### Interview Structure

```markdown
## Interview Guide

### Opening (2 min)
- Thank participant for their time
- Explain purpose: "We're trying to learn, not sell"
- Get consent for recording
- Clarify there are no wrong answers

### Context Setting (5 min)
- Tell me about your role
- Walk me through a typical day/week
- What are your main responsibilities?

### Problem Exploration (15 min)
- Tell me about the last time you [relevant behavior]
- What happened? Walk me through it step by step
- What was frustrating about that experience?
- How did you work around it?
- How often does this happen?
- What have you tried to solve this?

### Impact Assessment (5 min)
- What does this problem cost you?
  - Time: How much time do you spend on this?
  - Money: What's the financial impact?
  - Emotion: How does it make you feel?
- If this were solved tomorrow, what would change?

### Closing (3 min)
- Is there anything else I should have asked?
- Who else should I talk to about this?
- Can we follow up if we have more questions?
```

### Interview Anti-Patterns

| Anti-Pattern | Problem | Better Approach |
|--------------|---------|-----------------|
| Leading questions | Biases responses | Ask open-ended questions |
| Pitching solutions | Skews feedback | Focus on problems first |
| Asking about future behavior | Unreliable | Ask about past behavior |
| Long interviews | Participant fatigue | Keep to 30 minutes |
| Only talking to happy customers | Selection bias | Include churned/frustrated users |

### The Mom Test

Questions your mom could answer honestly:

```markdown
❌ Bad: "Would you use a product that does X?"
   (Everyone says yes to hypotheticals)

✅ Good: "Tell me about the last time you dealt with X"
   (Past behavior reveals truth)

❌ Bad: "Do you think this is a good idea?"
   (Opinions are cheap)

✅ Good: "What have you tried to solve this?"
   (Actions reveal priorities)

❌ Bad: "Would you pay $50/month for this?"
   (Commitment is easy when hypothetical)

✅ Good: "What are you currently paying to solve this?"
   (Actual spend reveals value)
```

## Research Methods

### Qualitative Methods

| Method | Best For | Sample Size |
|--------|----------|-------------|
| User Interviews | Deep understanding | 5-15 |
| Contextual Inquiry | Workflow observation | 3-8 |
| Diary Studies | Longitudinal behavior | 10-20 |
| Focus Groups | Exploring reactions | 6-10 per group |

### Quantitative Methods

| Method | Best For | Sample Size |
|--------|----------|-------------|
| Surveys | Broad validation | 100+ |
| A/B Tests | Feature validation | Statistical significance |
| Analytics | Usage patterns | Full user base |
| Card Sorting | Information architecture | 15-30 |

### When to Use Each

```text
Discovery Stage          Method
───────────────────────────────────────
Early exploration    →   Interviews, observation
Problem validation   →   Surveys, analytics
Solution ideation    →   Interviews, workshops
Concept testing      →   Prototype tests, surveys
Launch validation    →   A/B tests, analytics
```

## Assumption Testing

### Assumption Types

| Type | Definition | Example |
|------|------------|---------|
| Desirability | Will customers want this? | "Users want to track habits daily" |
| Viability | Will this work for the business? | "Users will pay $10/month" |
| Feasibility | Can we build this? | "We can integrate with their calendar" |
| Usability | Can users figure it out? | "Users can complete setup in < 5 min" |

### Testing Framework

```markdown
## Assumption Test

**Assumption**: [Statement we believe to be true]

**Type**: Desirability | Viability | Feasibility | Usability

**Risk Level**: High | Medium | Low

**Test Method**: [How we'll test this]

**Success Criteria**: [What would validate/invalidate]

**Timeline**: [How long to get signal]

**Results**: [Outcome once tested]

**Decision**: [What we'll do based on results]
```

### Test Methods by Risk

| Risk Level | Investment | Methods |
|------------|------------|---------|
| High | Low | Fake door tests, landing pages, interviews |
| Medium | Medium | Prototypes, wizard of oz, concierge |
| Low | High | MVPs, betas, full builds |

## Synthesis and Documentation

### Interview Notes Template

```markdown
## Interview: [Participant ID/Name]
**Date**: [Date]
**Interviewer**: [Name]
**Duration**: [Time]

### Participant Background
- Role: 
- Company size:
- Experience level:

### Key Quotes
> "[Verbatim quote 1]"
> "[Verbatim quote 2]"

### Pain Points Mentioned
1. [Pain point 1]
2. [Pain point 2]

### Current Solutions/Workarounds
- [Solution 1]
- [Solution 2]

### Opportunities Identified
- [Opportunity 1]
- [Opportunity 2]

### Surprises/Insights
- [Unexpected finding 1]

### Follow-up Needed
- [ ] [Action item 1]
```

### Weekly Synthesis Ritual

1. Review all interviews from the week
2. Identify patterns across conversations
3. Update opportunity solution tree
4. Update/invalidate assumptions
5. Share key learnings with team
