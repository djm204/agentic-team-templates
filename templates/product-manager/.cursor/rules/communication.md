# Stakeholder Communication

Guidelines for effective communication across audiences.

## Core Principles

### Know Your Audience

Different stakeholders need different information:

| Audience | Cares About | Avoid |
|----------|-------------|-------|
| Executives | Business impact, risks, resources | Technical details |
| Engineering | Technical feasibility, context | Vague requirements |
| Sales | Competitive advantage, timelines | Uncertainty |
| Customer Success | User impact, training needs | Internal politics |
| Customers | Value, reliability | Internal roadmap details |

### Communication Hierarchy

```text
Why (Strategy)     → Executives, Leadership
What (Features)    → Cross-functional teams
How (Implementation) → Engineering, Design
When (Timelines)   → Everyone (appropriate detail level)
```

## Roadmap Communication

### Roadmap Formats by Audience

**Executive Roadmap (Strategic)**
```text
Q1 2025                    Q2 2025                    Q3 2025
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ THEME: Enterprise       │ THEME: Platform         │ THEME: Growth           │
│ Growth                  │ Expansion               │ Acceleration            │
│                         │                         │                         │
│ • SSO & Security        │ • API v2                │ • Self-serve            │
│ • Team Management       │ • Integrations          │ • Viral Features        │
│                         │                         │                         │
│ Target: 50 Enterprise   │ Target: 100+ Partners   │ Target: 2x User Growth  │
│ Accounts                │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

**Team Roadmap (Tactical)**
```text
January               February              March
Week 1-2: SSO Design  Week 1-2: SSO Dev     Week 1-2: SSO QA/Launch
Week 3-4: SSO Spike   Week 3-4: Team Mgmt   Week 3-4: Team Mgmt Dev
```

**Customer Roadmap (External)**
```text
Coming Soon          In Progress           Recently Shipped
─────────────────────────────────────────────────────────────
• Enterprise SSO     • Team dashboards     • Dark mode
• Advanced export    • Performance         • Mobile app v2
                       improvements
```

### Roadmap Presentation Structure

```markdown
## Roadmap Review: [Quarter/Period]

### 1. Context (5 min)
- Recap of company/product goals
- Key learnings from last period
- Market/competitive changes

### 2. Strategy Alignment (5 min)
- How roadmap connects to company OKRs
- Key themes and rationale

### 3. Roadmap Walkthrough (15 min)
- Major initiatives with expected outcomes
- Dependencies and risks
- What's NOT on the roadmap and why

### 4. Discussion (20 min)
- Questions and concerns
- Trade-off discussions
- Feedback incorporation

### 5. Alignment (5 min)
- Confirm understanding
- Document decisions
- Agree on next steps
```

### Managing Roadmap Expectations

| Situation | Response |
|-----------|----------|
| "Can you commit to this date?" | "Our target is [date], but I'll keep you updated if anything changes. Here are the key risks..." |
| "Why isn't X on the roadmap?" | "Here's how we prioritized: [RICE/other framework]. X scored [N] because [reasons]. We can revisit if [conditions]." |
| "Customer needs this by [date]" | "Let me understand the context. What happens if we deliver by [alternative date]? What's the impact of not having it?" |
| "Can we add one more thing?" | "Yes, but here's what we'd need to deprioritize. Are you comfortable with that trade-off?" |

## Status Updates

### Weekly Update Template

```markdown
## Product Weekly Update: [Date]

### TL;DR
[2-3 bullet summary of the most important items]

### Shipped This Week 🚀
- [Feature 1]: [Brief description and impact]
- [Feature 2]: [Brief description and impact]

### In Progress 🔄
| Initiative | Status | ETA | Notes |
|------------|--------|-----|-------|
| [Project 1] | On Track | [Date] | [Any callouts] |
| [Project 2] | At Risk | [Date] | [Blocker/mitigation] |

### Key Metrics 📊
| Metric | This Week | Change | Target |
|--------|-----------|--------|--------|
| [KPI 1] | X | +Y% | Z |
| [KPI 2] | X | -Y% | Z |

### Decisions Needed 🤔
1. [Decision]: [Context and options]

### Looking Ahead 👀
- Next week: [Focus areas]
- Upcoming: [What to expect]
```

### Executive Summary Format

**One-pager for leadership:**

```markdown
## [Project/Initiative] Status

### Status: 🟢 On Track | 🟡 At Risk | 🔴 Off Track

### Summary
[2-3 sentences: What, Why, Current State]

### Key Metrics
| Metric | Baseline | Current | Target |
|--------|----------|---------|--------|
| [KPI] | X | Y | Z |

### Accomplishments
• [Key milestone 1]
• [Key milestone 2]

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [Impact] | [Action] |

### Resources Needed
[Any asks from leadership]

### Next Milestones
| Milestone | Target Date |
|-----------|-------------|
| [Next step] | [Date] |
```

## Meeting Facilitation

### Meeting Types and Cadence

| Meeting | Frequency | Duration | Attendees |
|---------|-----------|----------|-----------|
| Daily Standup | Daily | 15 min | Product trio + team |
| Sprint Planning | Bi-weekly | 2 hours | Product trio + team |
| Backlog Grooming | Weekly | 1 hour | Product trio |
| Stakeholder Sync | Weekly | 30 min | Cross-functional leads |
| Roadmap Review | Monthly | 1 hour | All stakeholders |
| Strategy Review | Quarterly | 2 hours | Leadership |

### Meeting Best Practices

**Before:**
- [ ] Clear agenda shared in advance
- [ ] Required pre-reading identified
- [ ] Right attendees invited
- [ ] Decision-makers identified

**During:**
- [ ] Start on time
- [ ] State meeting goal upfront
- [ ] Keep discussion focused
- [ ] Capture decisions and action items
- [ ] End on time

**After:**
- [ ] Share notes within 24 hours
- [ ] Action items have owners and dates
- [ ] Follow up on blockers

### Decision-Making Frameworks

**RAPID:**
| Role | Responsibility |
|------|----------------|
| **R**ecommend | Proposes the decision |
| **A**gree | Must agree for decision to proceed |
| **P**erform | Implements the decision |
| **I**nput | Provides input to inform decision |
| **D**ecide | Has final authority |

**Disagree and Commit:**
1. Everyone voices concerns
2. Decision-maker decides
3. Everyone commits to execution
4. Revisit only with new information

## Written Communication

### Email Best Practices

```markdown
Subject: [Action Required] [Topic] - [Deadline if applicable]

Hi [Name],

**TL;DR**: [One sentence summary]

**Context**: [2-3 sentences of background]

**Ask**: [Specific request with deadline]

**Options** (if applicable):
1. Option A: [Description] - [Pros/Cons]
2. Option B: [Description] - [Pros/Cons]

**Recommendation**: [Your recommendation and why]

**Next Steps**:
- [ ] [Action] - [Owner] - [Date]

Thanks,
[Your name]
```

### Slack/Chat Guidelines

| Use For | Avoid |
|---------|-------|
| Quick questions | Complex discussions |
| Time-sensitive updates | Decisions that need documentation |
| Informal check-ins | Anything needing a paper trail |
| FYIs | Long-form explanations |

### Documentation Standards

| Document Type | Purpose | Update Frequency |
|---------------|---------|------------------|
| PRD | Feature requirements | As needed during development |
| Roadmap | Strategic direction | Monthly |
| Release Notes | Customer communication | Per release |
| Decision Log | Track key decisions | Per decision |
| Meeting Notes | Capture discussions | Per meeting |

## Conflict Resolution

### Handling Disagreements

```markdown
## Framework for Resolving Conflicts

1. **Seek Understanding**
   - "Help me understand your perspective..."
   - "What would need to be true for your position to be wrong?"

2. **Find Common Ground**
   - "We both agree that [shared goal]..."
   - "Where we differ is [specific point]..."

3. **Focus on Data**
   - "What data would help us decide?"
   - "Can we run an experiment to test both hypotheses?"

4. **Escalate Constructively**
   - Define the decision clearly
   - Present both perspectives fairly
   - Recommend a path forward
   - Accept the decision and commit
```

### Escalation Path

```text
1. Direct conversation between parties
2. Facilitated discussion with shared manager
3. Decision escalation to leadership
4. Document decision and rationale
```

## Release Communication

### Internal Release Notes

```markdown
## Release: [Version/Name] - [Date]

### What's New
- **[Feature 1]**: [Description and user benefit]
- **[Feature 2]**: [Description and user benefit]

### Bug Fixes
- Fixed [issue] that caused [problem]

### Known Issues
- [Issue]: [Workaround if applicable]

### Metrics to Watch
- [Metric 1]: Expecting [change]
- [Metric 2]: Expecting [change]

### Rollout Plan
- [Date/Time]: [Percentage] of users
- [Date/Time]: [Percentage] of users

### Rollback Criteria
If [metric] drops by more than [threshold], roll back.
```

### Customer Release Notes

```markdown
## What's New in [Product] - [Month Year]

### [Feature Name] ✨
[Customer-friendly description of the benefit]

**How to use it:**
1. [Step 1]
2. [Step 2]

### Improvements
- [Improvement 1]: [Benefit]
- [Improvement 2]: [Benefit]

### What's Coming Next
We're working on [preview of upcoming features]. Stay tuned!

### Questions?
[Contact information or link to support]
```
