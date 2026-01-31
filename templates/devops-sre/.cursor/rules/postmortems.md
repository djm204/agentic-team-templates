# Postmortems

Comprehensive guidelines for conducting blameless postmortems and learning from incidents.

## Core Principles

1. **Blameless** - Focus on systems, not individuals
2. **Thorough** - Understand root causes, not just symptoms
3. **Actionable** - Create specific, tracked action items
4. **Shared** - Learning benefits the whole organization

## The Blameless Culture

### Why Blameless?

```yaml
blame_culture_problems:
  hiding_information:
    behavior: "Engineers don't report near-misses"
    impact: "Can't learn from close calls"
    
  defensive_responses:
    behavior: "Focus on who, not how"
    impact: "Miss systemic improvements"
    
  fear_of_reporting:
    behavior: "Incidents go unreported"
    impact: "Can't improve what we don't know about"
    
  simplified_narratives:
    behavior: "Blame single cause/person"
    impact: "Miss complex contributing factors"

blameless_principles:
  assume_good_intentions:
    premise: "Engineers make decisions based on available information"
    question: "What did they know at the time?"
    
  systems_thinking:
    premise: "Humans are part of a system"
    question: "What about the system allowed this?"
    
  learning_focus:
    premise: "Goal is improvement, not punishment"
    question: "How do we prevent this class of error?"
```

### Blameless Language

```yaml
language_examples:
  avoid:
    - "Who broke this?"
    - "Why didn't you check?"
    - "You should have known"
    - "This was a mistake by [person]"
    - "Failure to follow procedure"
    
  prefer:
    - "What happened?"
    - "What information was available?"
    - "What made this decision seem reasonable?"
    - "The system allowed this to happen"
    - "The procedure didn't account for this case"

reframing_examples:
  blame: "Developer deployed without testing"
  blameless: "The deployment process allowed deployment without test verification"
  
  blame: "Engineer didn't follow the runbook"
  blameless: "The runbook was unclear about this scenario"
  
  blame: "On-call should have caught this"
  blameless: "The alert didn't fire for this condition"
```

## Postmortem Process

### When to Write a Postmortem

```yaml
always_required:
  - "SEV1 incidents (any duration)"
  - "SEV2 incidents (> 30 minutes)"
  - "Data loss incidents"
  - "Security incidents"
  - "Near-misses that could have been severe"
  
recommended:
  - "SEV3 incidents with learning opportunities"
  - "Recurring issues (3+ occurrences)"
  - "Novel failure modes"
  
optional:
  - "Minor incidents with obvious fixes"
  - "Issues caught before user impact"

timeline:
  draft: "Within 24-48 hours of incident"
  review: "Within 5 business days"
  publication: "Within 7 business days"
  action_items: "Due within 30 days"
```

### Postmortem Meeting

```yaml
meeting_structure:
  duration: "60-90 minutes"
  
  attendees:
    required:
      - "Incident responders"
      - "Service owner"
      - "Postmortem facilitator"
    optional:
      - "Related team representatives"
      - "Management (listening, not judging)"
      
  agenda:
    - "Timeline review (20 min)"
    - "Contributing factors (20 min)"
    - "What went well (10 min)"
    - "What could be improved (15 min)"
    - "Action items (15 min)"
    
facilitator_role:
  - "Keep discussion blameless"
  - "Ensure all voices heard"
  - "Drive toward action items"
  - "Capture decisions and insights"
  - "Redirect blame to systems"
```

## Postmortem Template

```markdown
# Postmortem: [Incident Title]

## Metadata

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **Authors** | @name, @name |
| **Reviewers** | @name, @name |
| **Status** | Draft / In Review / Final |
| **Severity** | SEV1 / SEV2 / SEV3 |
| **Incident ID** | INC-XXXX |

---

## Executive Summary

**One-paragraph summary**: What happened, how long it lasted, what was the impact, and what we're doing to prevent recurrence.

---

## Impact

### User Impact
- **Duration**: X hours Y minutes
- **Users affected**: X% of users / Y total users
- **Functionality affected**: [List of affected features]

### Business Impact
- **Revenue impact**: $X (if applicable)
- **Customer complaints**: X tickets filed
- **SLA breach**: Yes/No

### SLO Impact
- **Error budget consumed**: X%
- **Monthly budget remaining**: Y%

---

## Timeline

All times in UTC.

| Time | Event |
|------|-------|
| 14:00 | [First sign of issue - what monitoring showed] |
| 14:05 | [Alert fired - which alert, who received] |
| 14:07 | [On-call acknowledged - initial actions] |
| 14:15 | [Escalation - who was paged, why] |
| 14:20 | [Root cause identified - how it was found] |
| 14:25 | [Mitigation started - what action was taken] |
| 14:30 | [Service restored - verification steps] |
| 14:45 | [Incident closed - final verification] |

---

## Root Cause Analysis

### What Happened

Detailed technical explanation of what went wrong. Include:
- The immediate cause
- The sequence of events
- Technical details relevant to understanding

### Why It Happened

Use the "5 Whys" technique to get to root cause:

1. **Why** did the service return errors?
   - Because the database connection pool was exhausted.

2. **Why** was the connection pool exhausted?
   - Because a slow query was holding connections for 30+ seconds.

3. **Why** was the query slow?
   - Because a missing index caused a full table scan.

4. **Why** was the index missing?
   - Because the migration to add it was never run in production.

5. **Why** wasn't the migration run?
   - Because our deployment process doesn't verify pending migrations.

**Root Cause**: Deployment process lacks verification of pending database migrations.

---

## Contributing Factors

Factors that made the incident possible or worse:

| Factor | Description | Type |
|--------|-------------|------|
| Missing migration check | Deployment doesn't verify migrations | Process |
| No query timeout | Long queries hold connections indefinitely | Configuration |
| Insufficient connection pool monitoring | Didn't alert until pool was 100% exhausted | Monitoring |
| Runbook outdated | Steps didn't match current architecture | Documentation |

---

## What Went Well

- **Detection**: Alert fired within 5 minutes of issue starting
- **Response**: On-call acknowledged within 2 minutes
- **Communication**: Status page updated promptly
- **Teamwork**: Cross-team collaboration was smooth
- **Rollback**: Quick rollback reduced impact duration

---

## What Went Poorly

- **Detection**: Alert threshold too high, should have fired earlier
- **Diagnosis**: Initially went down wrong path investigating network
- **Documentation**: Runbook didn't cover this scenario
- **Communication**: Internal Slack updates were sporadic
- **Recovery**: Rollback took longer than expected due to manual steps

---

## Where We Got Lucky

Things that could have made this worse but didn't:

- Issue happened during business hours with full team available
- Recent backup was only 15 minutes old
- The slow query only affected one service

---

## Action Items

| ID | Action | Type | Priority | Owner | Due Date | Status |
|----|--------|------|----------|-------|----------|--------|
| 1 | Add migration check to deployment pipeline | Prevent | P1 | @engineer | 2025-02-01 | TODO |
| 2 | Configure query timeout at 5 seconds | Prevent | P1 | @dba | 2025-01-25 | TODO |
| 3 | Add connection pool utilization alert at 70% | Detect | P2 | @sre | 2025-02-01 | TODO |
| 4 | Update runbook with DB troubleshooting steps | Document | P2 | @engineer | 2025-01-30 | TODO |
| 5 | Automate rollback procedure | Mitigate | P3 | @sre | 2025-02-15 | TODO |

### Action Item Types
- **Prevent**: Stop this class of incident from happening
- **Detect**: Find this faster next time
- **Mitigate**: Reduce impact when it happens
- **Document**: Improve understanding/procedures

---

## Lessons Learned

### Key Takeaways

1. **Database migrations need verification**: Our deployment process should verify that all migrations are applied before proceeding.

2. **Defense in depth for connection pools**: Multiple safeguards (query timeout, pool limits, alerting) would have limited impact.

3. **Runbooks need regular review**: This scenario wasn't covered, suggesting we need periodic runbook audits.

### Recommendations for Broader Organization

- Consider adding migration checks to the standard deployment template
- Review other services for similar query timeout gaps
- Schedule quarterly runbook review process

---

## Supporting Information

### Relevant Logs

```
2025-01-15 14:05:23 ERROR Database connection timeout after 30s
2025-01-15 14:05:24 ERROR Connection pool exhausted: 50/50 active
2025-01-15 14:05:24 ERROR Request failed: unable to acquire connection
```

### Relevant Metrics

![Error Rate Graph](link-to-screenshot)
![Connection Pool Graph](link-to-screenshot)

### Related Incidents

- [INC-1234](link) - Similar connection pool issue in 2024-06
- [INC-2345](link) - Related slow query incident

---

## Appendix

### Glossary

- **Connection Pool**: Set of reusable database connections
- **Migration**: Database schema change script

### References

- [Service Architecture Doc](link)
- [Database Runbook](link)
- [Deployment Pipeline](link)
```

## Root Cause Analysis Techniques

### 5 Whys

```yaml
five_whys:
  description: "Ask 'why' repeatedly to find root cause"
  
  process:
    - "Start with the problem"
    - "Ask 'why did this happen?'"
    - "For each answer, ask 'why?' again"
    - "Continue until you reach a systemic issue"
    - "Usually 5 iterations, but can be more or fewer"
    
  example:
    problem: "Service returned 500 errors"
    why_1:
      q: "Why did the service return 500 errors?"
      a: "The database was unreachable"
    why_2:
      q: "Why was the database unreachable?"
      a: "The database ran out of disk space"
    why_3:
      q: "Why did it run out of disk space?"
      a: "Logs were not being rotated"
    why_4:
      q: "Why were logs not being rotated?"
      a: "Log rotation was configured but not enabled"
    why_5:
      q: "Why was it not enabled?"
      a: "The infrastructure template didn't include it"
    root_cause: "Infrastructure templates missing log rotation config"
    
  tips:
    - "Multiple branches are OK (parallel why chains)"
    - "Stop when you reach something you can fix"
    - "Focus on process/system, not people"
```

### Fishbone Diagram (Ishikawa)

```yaml
fishbone_analysis:
  description: "Categorize contributing factors"
  
  categories:
    people:
      - "Training gaps"
      - "Cognitive load"
      - "Communication issues"
      
    process:
      - "Missing procedures"
      - "Unclear ownership"
      - "Inadequate review"
      
    technology:
      - "Software bugs"
      - "Infrastructure issues"
      - "Tool limitations"
      
    environment:
      - "Time pressure"
      - "Resource constraints"
      - "External dependencies"
      
  visualization: |
    People          Process
        \              /
         \            /
          \          /
           \        /
            [PROBLEM]
           /        \
          /          \
         /            \
        /              \
    Technology     Environment
```

### Timeline Analysis

```yaml
timeline_analysis:
  purpose: "Understand sequence of events"
  
  elements:
    - "Timestamp (in UTC)"
    - "Event description"
    - "Actor (human or system)"
    - "Evidence (logs, alerts, messages)"
    
  tips:
    - "Be precise with times"
    - "Include non-events (what didn't happen)"
    - "Note decision points"
    - "Highlight delays"
    
  questions:
    - "When did the issue actually start?"
    - "When was it first detectable?"
    - "What triggered detection?"
    - "What caused delays in response?"
```

## Action Item Management

### Writing Good Action Items

```yaml
good_action_item:
  specific: "Clear what needs to be done"
  measurable: "Know when it's complete"
  assigned: "Single owner (not a team)"
  relevant: "Actually addresses the problem"
  time_bound: "Has a due date"
  
examples:
  bad:
    - "Improve monitoring" # Vague
    - "Don't do this again" # Not actionable
    - "Team should fix" # No owner
    
  good:
    - "Add alert for connection pool > 80% (@sre, due 2025-02-01)"
    - "Update deployment pipeline to check pending migrations (@engineer, due 2025-01-25)"
    - "Document database failover procedure in runbook (@dba, due 2025-02-01)"
```

### Tracking Action Items

```yaml
tracking_process:
  documentation:
    - "Action items in postmortem document"
    - "Tickets created in issue tracker"
    - "Link tickets back to postmortem"
    
  review:
    - "Weekly review of open action items"
    - "Escalate overdue items"
    - "Close completed items with verification"
    
  metrics:
    - "Action item completion rate"
    - "Average time to complete"
    - "Overdue action items"
    
  escalation:
    - "7 days overdue: Remind owner"
    - "14 days overdue: Escalate to manager"
    - "30 days overdue: Review in leadership meeting"
```

## Sharing Learnings

### Postmortem Review Meeting

```yaml
review_meeting:
  frequency: "Weekly or bi-weekly"
  duration: "30-60 minutes"
  
  attendees:
    - "All engineering teams (optional attendance)"
    - "On-call engineers (recommended)"
    - "New team members (learning)"
    
  format:
    - "Author presents summary (5 min)"
    - "Q&A and discussion (15 min)"
    - "Lessons for broader application (10 min)"
    
  goals:
    - "Share knowledge across teams"
    - "Identify patterns"
    - "Celebrate learning culture"
```

### Postmortem Database

```yaml
postmortem_repository:
  storage: "Wiki, Git, or dedicated tool"
  
  searchable_by:
    - "Service affected"
    - "Root cause category"
    - "Date range"
    - "Severity"
    - "Tags/keywords"
    
  analytics:
    - "Common root causes"
    - "Recurring issues"
    - "Action item completion rates"
    - "MTTR trends"
    
  review:
    - "Quarterly analysis of patterns"
    - "Identify systemic issues"
    - "Prioritize cross-cutting improvements"
```

## Common Pitfalls

```yaml
pitfall_blame_creep:
  problem: "Discussion devolves into blame"
  signs:
    - "Focus on 'who' not 'how'"
    - "Defensive responses"
    - "Finger pointing"
  solution: "Facilitator redirects to systems"

pitfall_shallow_analysis:
  problem: "Stop at immediate cause"
  signs:
    - "Single 'why' answer"
    - "Fix only the symptom"
    - "Similar incidents recur"
  solution: "Keep asking why until systemic issue"

pitfall_action_item_graveyard:
  problem: "Action items never completed"
  signs:
    - "Growing backlog"
    - "Same issues recur"
    - "No tracking"
  solution: "Track, review, escalate"

pitfall_postmortem_theater:
  problem: "Go through motions without learning"
  signs:
    - "Copy-paste templates"
    - "No discussion"
    - "No one reads them"
  solution: "Regular review meetings, leadership engagement"

pitfall_excessive_action_items:
  problem: "Too many action items from one incident"
  signs:
    - "10+ action items"
    - "Low priority items"
    - "Boil the ocean"
  solution: "Focus on 3-5 highest impact items"
```
