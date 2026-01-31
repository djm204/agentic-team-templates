# Prioritization

Frameworks and best practices for evidence-based prioritization.

## Core Principle

**Prioritization is about making trade-offs explicit.** Every "yes" is an implicit "no" to something else. Use frameworks to make these trade-offs visible and defensible.

## RICE Framework

### Formula

```text
RICE Score = (Reach × Impact × Confidence) / Effort
```

### Components

| Factor | Description | Measurement |
|--------|-------------|-------------|
| **Reach** | Users affected in time period | Number (per quarter) |
| **Impact** | Effect on each user | Scale: 0.25 - 3 |
| **Confidence** | Certainty in estimates | Percentage: 50% - 100% |
| **Effort** | Resources required | Person-months |

### Impact Scale

| Score | Label | Criteria |
|-------|-------|----------|
| 3 | Massive | Core workflow, high frequency, users would churn without it |
| 2 | High | Important workflow, meaningful improvement |
| 1 | Medium | Nice improvement, noticeable but not critical |
| 0.5 | Low | Minor improvement, some users benefit |
| 0.25 | Minimal | Edge case, rarely noticed |

### Confidence Scoring

| Score | Label | Criteria |
|-------|-------|----------|
| 100% | High | Validated with data, multiple sources confirm |
| 80% | Good | Strong signals from research, some data |
| 60% | Medium | Reasonable assumptions, limited validation |
| 50% | Low | Gut feel, minimal evidence |

### RICE Scoring Template

```markdown
## Feature: [Name]

### Reach
- Time period: [Quarter]
- Users affected: [Number]
- Source: [Analytics/Research/Estimate]

### Impact
- Score: [0.25/0.5/1/2/3]
- Rationale: [Why this score]

### Confidence
- Score: [50%/60%/80%/100%]
- Evidence: [What supports our estimates]
- Gaps: [What we don't know]

### Effort
- Estimate: [Person-months]
- Breakdown: [Engineering X, Design Y, QA Z]

### RICE Score
[Reach] × [Impact] × [Confidence] / [Effort] = [Score]
```

### Example RICE Comparison

| Feature | Reach | Impact | Confidence | Effort | RICE |
|---------|-------|--------|------------|--------|------|
| Search improvements | 50,000 | 2 | 80% | 3 | 26,667 |
| New dashboard | 10,000 | 2 | 60% | 4 | 3,000 |
| Export to CSV | 5,000 | 1 | 100% | 0.5 | 10,000 |
| Dark mode | 30,000 | 0.5 | 80% | 2 | 6,000 |

**Priority order: Search → Export → Dark Mode → Dashboard**

## Alternative Frameworks

### Value vs. Effort Matrix

```text
High Value │ Quick Wins    │  Big Bets
           │ (Do First)    │  (Plan Carefully)
           │───────────────┼──────────────────
           │ Fill-Ins      │  Time Sinks
Low Value  │ (Maybe Later) │  (Avoid)
           └───────────────┴──────────────────
              Low Effort      High Effort
```

### Kano Model

| Category | Definition | Priority |
|----------|------------|----------|
| Must-Have | Expected, causes dissatisfaction if missing | High |
| Performance | More is better, linear satisfaction | Medium-High |
| Delighters | Unexpected, creates positive surprise | Strategic |
| Indifferent | Users don't care either way | Low |
| Reverse | Causes dissatisfaction if present | Remove |

### MoSCoW Method

| Priority | Description | Commitment |
|----------|-------------|------------|
| **Must** | Non-negotiable for release | 100% |
| **Should** | Important but not critical | High effort |
| **Could** | Nice to have | If time permits |
| **Won't** | Not this time | Explicitly excluded |

### ICE Scoring

```text
ICE Score = Impact × Confidence × Ease
```

Simpler than RICE, good for quick prioritization:
- **Impact**: 1-10 scale
- **Confidence**: 1-10 scale
- **Ease**: 1-10 scale (inverse of effort)

## Stakeholder Management

### Handling Prioritization Requests

```markdown
## Request Triage Framework

1. **Acknowledge**: "I understand this is important. Let me make sure I understand the problem."

2. **Understand**: 
   - What problem does this solve?
   - Who is affected?
   - What's the impact of not doing this?
   - What's the urgency?

3. **Evaluate**:
   - Score against current prioritization framework
   - Compare to existing roadmap items
   - Identify trade-offs

4. **Respond**:
   - If high priority: "This scores well. Here's how it compares to current work..."
   - If low priority: "I understand the need. Here's why other items currently rank higher..."
   - If unclear: "I need more information to evaluate this properly..."

5. **Document**: Record request, evaluation, and decision
```

### Saying No Constructively

```markdown
## Framework for Declining Requests

"I appreciate you bringing this to me. Here's my perspective:

**Acknowledge the need**: I understand that [stakeholder's concern] is important because [reason].

**Explain current priorities**: Right now, we're focused on [current priorities] because [business rationale]. These are expected to deliver [expected outcomes].

**Show the trade-off**: If we were to prioritize [their request], we would need to delay [current work], which would impact [consequences].

**Offer alternatives**:
- Option A: We could address a smaller version of this in [timeframe]
- Option B: Here's a workaround that might help in the meantime
- Option C: Let's revisit this in [timeframe] when [conditions]

**Stay open**: I'm happy to discuss further or reconsider if new information emerges."
```

### Prioritization Governance

| Decision Type | Who Decides | Input From |
|---------------|-------------|------------|
| Quarterly themes | Product Leadership + Executives | All stakeholders |
| Monthly priorities | Product Manager | Engineering, Design, Stakeholders |
| Sprint items | Product Trio | Engineering Team |
| Day-to-day tasks | Engineering Team | Product Manager |

## Special Cases

### When to Override Scores

| Scenario | Action |
|----------|--------|
| Security vulnerability | Immediate priority regardless of score |
| Regulatory compliance | Non-negotiable timeline |
| Technical debt blocking features | Elevate priority |
| Strategic partnership requirement | Weigh relationship value |
| Quick win during downtime | Opportunistic execution |

### Technical Debt Prioritization

Allocate 15-20% of capacity to technical debt. Prioritize by:

1. **Blocking**: Prevents new features
2. **Slowing**: Significantly increases development time
3. **Risk**: Security or stability concerns
4. **Maintainability**: Code that's hard to understand/modify

### Bug Prioritization

| Severity | Criteria | Response |
|----------|----------|----------|
| P0 | System down, data loss, security breach | Drop everything |
| P1 | Major feature broken, many users affected | Fix this sprint |
| P2 | Feature impaired, workaround exists | Plan for near term |
| P3 | Minor issue, few users affected | Backlog |
| P4 | Cosmetic, edge case | If time permits |

## Maintaining Prioritization Health

### Weekly Review

- [ ] Review new requests against backlog
- [ ] Re-score items with new information
- [ ] Archive completed/obsolete items
- [ ] Communicate any changes to stakeholders

### Quarterly Review

- [ ] Reassess all backlog items
- [ ] Update confidence scores with new data
- [ ] Align with new company/product OKRs
- [ ] Archive items that no longer fit strategy

### Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Recency bias | Latest request always wins | Use consistent scoring |
| HiPPO | Exec requests skip the queue | Score all requests equally |
| Analysis paralysis | Nothing gets prioritized | Set decision deadlines |
| Stale backlog | Old items never reviewed | Regular backlog grooming |
| Inconsistent scoring | Different people score differently | Calibration sessions |
