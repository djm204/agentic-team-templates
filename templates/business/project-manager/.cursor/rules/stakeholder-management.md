# Stakeholder Management

Guidelines for identifying, engaging, and aligning project stakeholders.

## Core Principles

### Stakeholders Determine Success

A project can meet every technical requirement and still fail if stakeholders are misaligned. Stakeholder management is not optional - it is a core PM discipline.

```markdown
Wrong: "I'll send status reports and hope everyone stays aligned"
Right: "I'll proactively manage expectations, resolve conflicts, and ensure every stakeholder has the information they need to support the project"
```

### Influence Without Authority

PMs rarely have direct authority over stakeholders. Success comes from building trust, demonstrating competence, and creating mutual value.

## Stakeholder Identification

### Stakeholder Register Template

| Name | Role | Organization | Interest | Influence | Disposition | Communication Preference |
|------|------|-------------|----------|-----------|-------------|-------------------------|
| [Name] | Sponsor | Executive | High | High | Supportive | Weekly 1:1 |
| [Name] | Tech Lead | Engineering | High | Medium | Neutral | Daily standup |
| [Name] | End User Rep | Operations | Medium | Low | Resistant | Bi-weekly demo |

### Stakeholder Mapping (Power/Interest Grid)

```text
High Influence │  Keep Satisfied  │  Manage Closely
               │  (Sponsor who    │  (Sponsor, key
               │   delegates)     │   decision-makers)
               │──────────────────┼──────────────────
Low Influence  │  Monitor         │  Keep Informed
               │  (Peripheral     │  (End users,
               │   stakeholders)  │   support teams)
               └──────────────────┴──────────────────
                  Low Interest       High Interest
```

### Stakeholder Categories

| Category | Examples | Engagement Level |
|----------|----------|-----------------|
| **Decision Makers** | Sponsor, steering committee | Active management |
| **Influencers** | Senior engineers, domain experts | Regular consultation |
| **Contributors** | Team members, subject matter experts | Daily coordination |
| **Affected Parties** | End users, support teams | Regular communication |
| **External** | Vendors, regulators, partners | As needed |

## RACI Matrix

### Building a RACI

| Activity | Sponsor | PM | Tech Lead | Designer | QA | Business Owner |
|----------|---------|-----|-----------|----------|-----|----------------|
| Charter Approval | A | R | I | - | - | C |
| Requirements | I | A | C | C | I | R |
| Architecture | I | I | R | - | C | - |
| Design | I | A | C | R | I | C |
| Development | I | A | R | C | I | - |
| Testing | I | A | C | - | R | C |
| Deployment | A | R | R | - | C | I |
| Acceptance | R | A | I | I | I | R |

### RACI Rules

```markdown
Do:
- Exactly one "A" (Accountable) per row
- At least one "R" (Responsible) per row
- Limit "C" (Consulted) to those whose input is truly needed
- Use "I" (Informed) for awareness without requiring response
- Review RACI at project kickoff with all stakeholders

Don't:
- Assign "A" and "R" to the same person habitually (single point of failure)
- Make everyone "C" on everything (decision paralysis)
- Skip RACI review when team membership changes
- Use RACI as a substitute for actual conversations
```

### RACI Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Too many C's | Decisions take forever | Limit consulted roles to true subject matter experts |
| Missing A | Nobody owns the outcome | Assign one accountable person per activity |
| R without capacity | Responsible person is overloaded | Validate workload when assigning responsibilities |
| A without authority | Accountable person cannot make decisions | Ensure A has decision-making power |

## Communication Plan

### Communication Plan Template

| Stakeholder | Information Need | Method | Frequency | Owner | Notes |
|-------------|-----------------|--------|-----------|-------|-------|
| Sponsor | Status, risks, decisions | 1:1 meeting | Weekly | PM | 30 min, focus on escalations |
| Steering Committee | Strategic status | Presentation | Monthly | PM | Formal agenda required |
| Project Team | Tasks, blockers | Standup | Daily | Scrum Master | 15 min max |
| End Users | Progress, training | Newsletter | Bi-weekly | PM + BA | Include demo schedule |
| Vendors | Specs, timelines | Email + call | As needed | PM | Document all decisions |

### Communication Principles

| Principle | Application |
|-----------|-------------|
| Right message, right audience | Executives get summaries; teams get details |
| No surprises | Share bad news early with a proposed response |
| Two-way dialogue | Listen as much as you communicate |
| Written confirmation | Follow up verbal decisions with email summary |
| Consistent cadence | Stakeholders should know when to expect updates |

## Expectation Management

### Setting Expectations

```markdown
## Expectation Setting Checklist

At Project Kickoff:
- [ ] Review and confirm project scope with stakeholders
- [ ] Align on success criteria and how they will be measured
- [ ] Agree on communication cadence and format
- [ ] Clarify decision-making authority (RACI)
- [ ] Discuss known risks and constraints openly
- [ ] Set realistic timeline expectations with documented assumptions

Ongoing:
- [ ] Flag deviations from plan immediately
- [ ] Re-confirm priorities when trade-offs arise
- [ ] Validate that stakeholder needs have not shifted
- [ ] Celebrate milestones to maintain confidence
```

### Managing Difficult Stakeholders

| Behavior | Response Strategy |
|----------|-------------------|
| **Disengaged sponsor** | Schedule brief, focused updates; escalate only critical items; make it easy to stay involved |
| **Scope expander** | Redirect to change control process; show impact on schedule/budget; offer trade-offs |
| **Micromanager** | Provide detailed status proactively; build trust through transparency; agree on escalation triggers |
| **Resistant to change** | Understand their concerns; involve them in decision-making; show evidence and data |
| **Conflicting priorities** | Facilitate alignment meeting; escalate to shared manager if needed; document agreed priorities |

### Expectation Reset Conversation

```markdown
## Framework for Resetting Expectations

1. **Acknowledge the original expectation**
   "We originally planned to deliver [X] by [date]."

2. **Explain what changed**
   "Since then, [specific change] has impacted our timeline/scope/budget."

3. **Present the current reality**
   "Based on current progress, we now expect [revised projection]."

4. **Offer options**
   "Option A: Reduce scope to meet the original date."
   "Option B: Extend the timeline by [X] to deliver full scope."
   "Option C: Add [resources] to accelerate delivery."

5. **Recommend and ask for decision**
   "I recommend Option [X] because [rationale]. Can we align on this?"
```

## Conflict Resolution

### Conflict Resolution Framework

```text
Level 1: Direct Resolution
├── Discuss privately with the parties involved
├── Focus on interests, not positions
├── Seek mutual understanding
└── Agree on a path forward

Level 2: Facilitated Resolution
├── Bring in a neutral facilitator
├── Structure the conversation around shared objectives
├── Document agreed resolution
└── Follow up to ensure resolution holds

Level 3: Escalation
├── Summarize the conflict objectively for the decision-maker
├── Present each perspective fairly
├── Provide a recommendation
└── Accept and support the decision
```

### Conflict Resolution Best Practices

```markdown
Do:
- Address conflict early before it escalates
- Focus on the issue, not the person
- Seek to understand before seeking to be understood
- Look for win-win solutions
- Document the resolution and follow up

Don't:
- Avoid or ignore conflict (it festers)
- Take sides prematurely
- Resolve conflict via email (use face-to-face or video)
- Let conflict become personal
- Re-litigate resolved decisions without new information
```

### Common Conflict Sources in Projects

| Source | Example | Prevention |
|--------|---------|------------|
| Resource competition | Two projects need the same developer | Coordinate with resource manager; escalate early |
| Scope disagreement | Stakeholder expects feature not in scope | Reference scope statement; use change control |
| Priority conflicts | Stakeholder wants their feature first | Use objective prioritization framework |
| Technical disagreement | Team disagrees on architecture | Facilitate decision with criteria; PM breaks ties if needed |
| Role confusion | Two people think they own the same decision | Reference RACI; clarify in team meeting |

## Stakeholder Engagement Metrics

### Measuring Engagement Health

| Metric | Healthy | Warning | Action Needed |
|--------|---------|---------|---------------|
| Meeting attendance | > 80% | 50-80% | < 50% |
| Decision turnaround | < 3 days | 3-7 days | > 7 days |
| Feedback response | Within 2 days | 2-5 days | > 5 days |
| Escalation frequency | Rare | Monthly | Weekly |
| Scope change requests | Occasional | Frequent | Constant |

### Engagement Recovery Actions

| Signal | Action |
|--------|--------|
| Sponsor missing meetings | Schedule shorter, more focused sessions; send advance summary |
| Slow decision-making | Reduce options to 2-3; provide clear recommendation; set deadline |
| Increasing resistance | Schedule 1:1 to understand concerns; involve them in solution design |
| Communication breakdown | Reset communication plan; increase frequency temporarily |

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Ignoring silent stakeholders | Last-minute objections | Proactively engage all identified stakeholders |
| Treating all stakeholders the same | Over-communicating to some, under-communicating to others | Use power/interest grid to tailor engagement |
| RACI created but not used | Role confusion persists | Reference RACI when conflicts arise; review quarterly |
| No communication plan | Ad hoc, inconsistent updates | Create and follow a formal communication plan |
| Avoiding difficult conversations | Problems escalate unnecessarily | Address issues early; use structured frameworks |
| Forgetting external stakeholders | Vendor or partner surprises | Include vendors and partners in stakeholder register |
