# Curriculum Design

Frameworks for designing coherent, well-sequenced curricula that build deep understanding over time.

## Curriculum Mapping

### Scope and Sequence

```
Scope: WHAT content and skills are taught
Sequence: WHEN and in WHAT ORDER they are taught

Together: A complete map of the learning journey
```

### Curriculum Map Template

```markdown
| Unit | Duration | Standards | Essential Questions | Key Knowledge | Key Skills | Assessment |
|------|----------|-----------|--------------------| --------------|------------|------------|
| Unit 1 | 3 weeks | [Standard IDs] | "Why does X matter?" | [Concepts] | [Skills] | [Assessment type] |
| Unit 2 | 2 weeks | [Standard IDs] | "How does Y work?" | [Concepts] | [Skills] | [Assessment type] |
| Unit 3 | 4 weeks | [Standard IDs] | "What if Z changed?" | [Concepts] | [Skills] | [Assessment type] |
```

### Vertical Alignment

```
Grade/Level N-1: Foundational concepts (prerequisites)
    ↓
Grade/Level N: Current course (builds on N-1)
    ↓
Grade/Level N+1: Next course (builds on N)

Each level should:
- Know what came before (don't re-teach from scratch)
- Know what comes after (prepare learners for the next stage)
- Explicitly build on prior knowledge and skills
```

## Spiral Curriculum (Bruner)

### Principle

Revisit key concepts at increasing levels of complexity throughout the curriculum.

```
Complexity
    ▲
    │           ╭─── Topic A (advanced application)
    │      ╭────╯
    │ ╭────╯        ╭─── Topic A (analysis & evaluation)
    │ │         ╭───╯
    │ │    ╭────╯        ╭─── Topic A (application)
    │ │    │        ╭────╯
    │ │    │   ╭────╯        ╭─── Topic A (introduction)
    │ │    │   │        ╭────╯
    ├─┴────┴───┴────────┴──────────────────►
    0   Unit 1  Unit 3   Unit 6   Unit 10     Time
```

### Spiral Design Principles

1. **Each revisit adds depth** — not just repetition, but new complexity
2. **Prior knowledge is activated** — explicitly connect to previous encounters
3. **Spacing is built in** — revisits are naturally spaced over time
4. **Multiple representations** — each revisit offers a different angle
5. **Assessment reflects growth** — later assessments expect higher Bloom's levels

### Spiral Curriculum Example

```markdown
Topic: Statistical Reasoning

Unit 2 (Remember/Understand):
  → Define mean, median, mode
  → Calculate measures of central tendency from a dataset

Unit 5 (Apply):
  → Choose the appropriate measure for different data distributions
  → Identify when mean is misleading (skewed data)

Unit 8 (Analyze):
  → Compare distributions using statistical measures
  → Analyze how sample size affects reliability

Unit 12 (Evaluate/Create):
  → Critique statistical claims in media reports
  → Design a study with appropriate statistical methods
```

## Prerequisite Mapping

### Dependency Graphs

```
                    [Advanced Topic D]
                     ↑            ↑
              [Topic B]      [Topic C]
                 ↑    ↑        ↑
          [Topic A]   [Topic A] [Topic A]
              ↑
      [Prerequisite Knowledge]
```

### Creating Prerequisite Maps

```markdown
For each learning objective, ask:
1. What must the learner already KNOW to access this?
2. What must the learner already be able to DO?
3. What MISCONCEPTIONS might interfere?

Then:
1. Order objectives so prerequisites come first
2. Verify prerequisite skills with diagnostic assessment
3. Provide remediation paths for missing prerequisites
4. Make dependencies explicit to learners
```

### Prerequisite Verification

| Method | When | Purpose |
|--------|------|---------|
| Diagnostic pre-test | Start of unit/course | Identify missing prerequisites |
| Knowledge check | Start of each lesson | Verify yesterday's learning |
| Skills inventory | Start of course | Map individual readiness |
| Concept inventory | Start of unit | Identify misconceptions |

## Sequencing Principles

### Ordering Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Simple → Complex | Start with basic concepts, build toward complex ones | Skill-building, mathematics |
| Concrete → Abstract | Start with tangible examples, move to general principles | Conceptual understanding |
| Known → Unknown | Start with familiar context, extend to new territory | Connecting to prior knowledge |
| Chronological | Follow the historical or process timeline | History, procedures, narratives |
| Whole → Part → Whole | Overview first, then details, then synthesis | Systems thinking, complex topics |
| Problem-centered | Start with a problem, learn what's needed to solve it | Professional training, PBL |

### Chunking and Pacing

```markdown
Guidelines:
- 3-5 new concepts per session maximum (cognitive load)
- 15-20 minutes of new input before active processing
- Each chunk builds on the previous one
- Provide "landing points" where learners consolidate

Pacing Signals to Watch:
- Formative check shows < 60% comprehension → slow down, re-teach
- Formative check shows > 90% comprehension → accelerate or extend
- Mixed results → differentiate (some need support, some need extension)
```

## Continuous Improvement

### Data-Driven Curriculum Revision

```
Teach → Assess → Analyze → Adjust → Re-teach
  ↑                                      │
  └──────────────────────────────────────┘
```

### Curriculum Review Cycle

| Frequency | Activity | Data Source |
|-----------|----------|-------------|
| Daily | Adjust lesson pacing | Formative assessment results |
| Weekly | Identify struggling objectives | Quiz/exit ticket analysis |
| Per Unit | Evaluate unit effectiveness | Summative assessment data |
| Semester | Review scope and sequence | Cumulative performance data |
| Annually | Major curriculum revision | Year-end data + student/teacher feedback |

### Questions for Curriculum Evaluation

```markdown
Effectiveness:
- Are learners meeting stated objectives? (assessment data)
- Which objectives have the lowest mastery rates? (identify gaps)
- Are there persistent misconceptions? (error analysis)

Alignment:
- Does each assessment measure its stated objective? (backward design check)
- Does each activity build toward an assessed objective? (activity audit)
- Are objectives appropriately sequenced? (prerequisite check)

Engagement:
- Where do learners disengage? (attendance, participation data)
- Which activities produce the deepest engagement? (observation, surveys)
- Are learners finding relevance? (student feedback)

Equity:
- Are achievement gaps present across groups? (disaggregated data)
- Are materials and examples inclusive? (content audit)
- Are all learners accessing support? (intervention data)
```

### Curriculum Documentation

```markdown
# Course: [Name]

## Course-Level Outcomes
By the end of this course, learners will be able to:
1. [Outcome aligned to program goals]
2. [Outcome aligned to program goals]
3. [Outcome aligned to program goals]

## Unit Map

### Unit 1: [Title] (Weeks 1-3)
- Objectives: [List]
- Prerequisites: [List or "None"]
- Key Vocabulary: [List]
- Assessments: Formative: [List], Summative: [Description]
- Spiral Connections: "Revisited in Unit 5 at Analyze level"

### Unit 2: [Title] (Weeks 4-5)
- Objectives: [List]
- Prerequisites: [Unit 1 objectives X and Y]
- ...

## Assessment Calendar
| Week | Formative | Summative |
|------|-----------|-----------|
| 1 | Daily exit tickets | — |
| 2 | Quiz 1 (Units 1a-1b) | — |
| 3 | Peer review | Unit 1 Project |
| ... | ... | ... |

## Revision Log
| Date | Change | Rationale | Evidence |
|------|--------|-----------|----------|
| [Date] | Moved Topic X before Topic Y | Students lacked prerequisite skills | Unit 2 pre-test data: 40% below threshold |
| [Date] | Added scaffolding to Unit 3 | High failure rate on summative | 35% of students scored below proficiency |
```

## Common Curriculum Pitfalls

### 1. Coverage Over Depth

```markdown
❌ "We need to cover 15 chapters this semester"
✅ "We need students to deeply understand 8 essential concepts"

Research (Schwartz et al.): Depth produces better transfer than breadth.
```

### 2. Activity-Driven Planning

```markdown
❌ "I found a great activity—let me build a lesson around it"
✅ "What's the objective? What assessment shows mastery? Now, what activity supports that?"

Activities serve objectives, not the other way around.
```

### 3. Teaching Topics Instead of Skills

```markdown
❌ "Week 4: World War II" (topic, not learning)
✅ "Week 4: Analyze how economic factors contributed to the rise of
    authoritarian regimes in the 1930s" (skill + content)
```

### 4. Ignoring Prerequisite Gaps

```markdown
❌ Start unit → students fail → blame students
✅ Start unit → diagnostic pre-test → address gaps → proceed

You cannot build on a foundation that doesn't exist.
```

### 5. No Revision Process

```markdown
❌ Same curriculum year after year without data review
✅ Annual review cycle with student data driving changes

"The curriculum is a living document, not a monument."
```
