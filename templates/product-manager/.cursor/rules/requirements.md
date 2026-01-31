# Requirements Documentation

Standards for PRDs, user stories, and specifications.

## Core Principles

### Living Documents

Requirements documents are not handoffs—they're living artifacts that evolve through collaboration. They should:

- Start as shared understanding, not mandates
- Update as learning occurs
- Include rationale, not just requirements
- Be accessible to all stakeholders

### Right Level of Detail

| Audience | Detail Level | Focus |
|----------|--------------|-------|
| Executives | High-level | Outcomes, timeline, resources |
| Product Trio | Detailed | Problems, solutions, constraints |
| Engineering | Specific | Acceptance criteria, edge cases |

## PRD Structure

### PRD Template

```markdown
# PRD: [Feature Name]

## Metadata
- **Author**: [Name]
- **Status**: Draft | In Review | Approved | In Development | Shipped
- **Created**: [Date]
- **Last Updated**: [Date]
- **Reviewers**: [Names]

---

## Executive Summary
[2-3 sentences: What are we building and why?]

---

## Problem Statement

### The Problem
[Describe the customer problem in their words]

### Evidence
| Source | Finding |
|--------|---------|
| Customer interview | "[Quote]" |
| Analytics | [Data point] |
| Support tickets | [Trend] |

### Impact of Not Solving
- Customer impact: [Description]
- Business impact: [Description]

---

## Goals & Success Metrics

### Objectives
[What outcomes are we trying to achieve?]

### Key Results
| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| Primary KR | X | Y | [How measured] |
| Secondary KR | X | Y | [How measured] |

### Non-Goals
[Explicitly state what this project will NOT address]

---

## User Stories

### Persona: [Name]
**Background**: [Context about this user]

#### Story 1
**As a** [role],
**I want to** [action],
**So that** [benefit].

**Acceptance Criteria**:
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]
- [ ] [Non-functional requirement]

#### Story 2
[Repeat format]

---

## Solution

### Proposed Approach
[High-level description of the solution]

### Key Screens/Flows
[Include wireframes, mockups, or links to designs]

### User Flow
```
[Start] → [Step 1] → [Decision Point] → [Step 2] → [End]
                            ↓
                     [Alternative Path]
```

---

## Scope

### In Scope
- [Feature/capability 1]
- [Feature/capability 2]
- [Feature/capability 3]

### Out of Scope
- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

### Future Considerations
- [Potential follow-up 1]
- [Potential follow-up 2]

---

## Technical Considerations

### Dependencies
| Dependency | Owner | Status | Risk |
|------------|-------|--------|------|
| [API/Service] | [Team] | [Ready/In Progress/Blocked] | [Risk] |

### Technical Approach
[Notes from engineering on implementation approach]

### Performance Requirements
- [Load time requirement]
- [Scalability requirement]

### Security Considerations
- [Security requirement 1]
- [Security requirement 2]

---

## Timeline

| Milestone | Target Date | Owner | Status |
|-----------|-------------|-------|--------|
| PRD Approval | [Date] | PM | [Status] |
| Design Complete | [Date] | Design | [Status] |
| Development Start | [Date] | Engineering | [Status] |
| QA Complete | [Date] | QA | [Status] |
| Launch | [Date] | PM | [Status] |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Action] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Action] |

---

## Open Questions
- [ ] [Question 1] - Owner: [Name]
- [ ] [Question 2] - Owner: [Name]

---

## Appendix
- [Link to research]
- [Link to competitive analysis]
- [Link to technical spike]
```

## User Story Standards

### Format

```gherkin
As a [persona/role],
I want to [action/goal],
So that [benefit/value].
```

### Acceptance Criteria Format

```gherkin
Given [precondition/context],
When [action taken],
Then [expected result].
```

### INVEST Criteria

Good user stories are:

| Criteria | Description |
|----------|-------------|
| **I**ndependent | Can be developed separately |
| **N**egotiable | Details can be discussed |
| **V**aluable | Delivers value to user or business |
| **E**stimable | Can be sized by the team |
| **S**mall | Completable in one sprint |
| **T**estable | Has clear pass/fail criteria |

### Story Examples

**Good Story:**
```gherkin
As a sales manager,
I want to see my team's pipeline in a single dashboard,
So that I can identify deals at risk without checking each rep individually.

Acceptance Criteria:
- Given I am logged in as a sales manager
- When I navigate to the team dashboard
- Then I see all active deals for my team sorted by close date

- Given a deal has not been updated in 7+ days
- When I view the dashboard
- Then that deal is flagged with a warning indicator

- Given I click on a deal
- When the detail panel opens
- Then I see the full deal history without leaving the dashboard
```

**Bad Story:**
```gherkin
As a user,
I want a dashboard,
So that I can see things.

Acceptance Criteria:
- Dashboard works
- Shows data
```

### Story Sizing

| Size | Points | Characteristics |
|------|--------|-----------------|
| XS | 1 | Well-understood, < 1 day |
| S | 2 | Minimal unknowns, 1-2 days |
| M | 3 | Some complexity, 3-5 days |
| L | 5 | Multiple components, 1 week |
| XL | 8+ | Too large—split into smaller stories |

### Splitting Large Stories

| Original Story | Split Stories |
|----------------|---------------|
| "As a user, I want to filter and sort the table" | 1. "Filter by status" 2. "Filter by date" 3. "Sort columns" |
| "As a user, I want to export reports" | 1. "Export to CSV" 2. "Export to PDF" 3. "Schedule exports" |

## Edge Cases & Error States

### Edge Case Documentation

```markdown
## Edge Cases: [Feature]

### Empty States
- No data exists: [Behavior]
- Data loading: [Behavior]
- Filter returns no results: [Behavior]

### Error States
- Network failure: [Behavior]
- Permission denied: [Behavior]
- Invalid input: [Behavior]
- Rate limited: [Behavior]

### Boundary Conditions
- Maximum items: [Limit and behavior]
- Minimum values: [Behavior]
- Character limits: [Limits and validation]

### Concurrent Access
- Multiple users editing: [Behavior]
- Stale data: [Behavior]
```

### Error Message Standards

| Element | Guideline |
|---------|-----------|
| Tone | Helpful, not blaming |
| Content | What happened + What to do |
| Action | Clear next step |

```markdown
❌ Bad: "Error 500"
✅ Good: "We couldn't save your changes. Please try again, or contact support if this continues."

❌ Bad: "Invalid input"
✅ Good: "Email addresses must be in the format name@example.com"
```

## Requirements Review

### Review Checklist

- [ ] Problem clearly stated with evidence
- [ ] Success metrics defined and measurable
- [ ] User stories meet INVEST criteria
- [ ] Acceptance criteria are testable
- [ ] Edge cases documented
- [ ] Dependencies identified
- [ ] Risks assessed with mitigations
- [ ] Timeline realistic with owner buy-in
- [ ] Open questions have owners
- [ ] Stakeholders have reviewed

### Review Meeting Structure

```markdown
## PRD Review Agenda (60 min)

1. **Context** (5 min)
   - Problem recap
   - Why now?

2. **Walkthrough** (20 min)
   - Solution overview
   - Key user flows
   - Technical approach

3. **Discussion** (25 min)
   - Open questions
   - Concerns and risks
   - Trade-off decisions

4. **Alignment** (10 min)
   - Confirm scope
   - Agree on timeline
   - Assign action items
```

## Version Control for Requirements

### When to Create New Version

- Major scope change
- Significant timeline shift
- New stakeholder requirements

### Version History

```markdown
## Changelog

### v2.0 (2025-01-28)
- Added export functionality based on user feedback
- Removed scheduled reports (moved to Phase 2)
- Updated timeline to account for dependency delay

### v1.0 (2025-01-15)
- Initial PRD
```
