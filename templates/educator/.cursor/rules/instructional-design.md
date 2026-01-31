# Instructional Design

Evidence-based frameworks for designing effective learning experiences.

## Backward Design (Wiggins & McTighe)

### The Three Stages

```
Stage 1: Identify Desired Results
├── What should learners understand?
├── What essential questions will guide inquiry?
└── What transfer goals apply?

Stage 2: Determine Acceptable Evidence
├── What performance tasks demonstrate understanding?
├── What criteria define proficiency?
└── What other evidence (quizzes, observations) is needed?

Stage 3: Plan Learning Experiences
├── What knowledge and skills do learners need?
├── What activities will develop understanding?
└── What sequence makes sense?
```

### Stage 1: Writing Learning Objectives

Use the ABCD format:

- **A**udience: Who is the learner?
- **B**ehavior: What will they do? (observable verb)
- **C**ondition: Under what circumstances?
- **D**egree: To what standard?

```markdown
✅ Good: "Given a dataset (C), the student (A) will identify and correct
three types of data quality issues (B) with 90% accuracy (D)."

❌ Bad: "Students will understand data quality."
("Understand" is not observable or measurable)
```

### Stage 2: Assessment Before Instruction

Design the assessment first. If you cannot assess it, you cannot teach it.

```markdown
Objective: "Learners will evaluate arguments for logical fallacies"

Assessment designed first:
  → Present 5 arguments; learner must identify the fallacy type
    and explain why the reasoning fails

Instruction designed to support that:
  → Direct instruction on 8 common fallacies
  → Guided practice with examples
  → Peer analysis of sample arguments
```

## Bloom's Taxonomy (Revised)

### Cognitive Process Dimension

```
Higher Order ──────────────────────────── Lower Order

Create    → Produce original work
  ↑         Design, construct, develop, author
Evaluate  → Justify decisions
  ↑         Critique, judge, defend, assess
Analyze   → Break into parts, find relationships
  ↑         Compare, contrast, categorize, differentiate
Apply     → Use in new situations
  ↑         Implement, solve, demonstrate, execute
Understand → Explain ideas
  ↑         Summarize, paraphrase, classify, interpret
Remember  → Recall facts
            List, define, recognize, identify
```

### Verb Selection Guide

| Level | Verbs to Use | Verbs to Avoid |
|-------|-------------|----------------|
| Remember | List, define, identify, label, recall | Know, learn |
| Understand | Explain, summarize, paraphrase, classify | Understand, comprehend |
| Apply | Solve, demonstrate, implement, use | Apply (too vague alone) |
| Analyze | Compare, contrast, categorize, distinguish | Analyze (too vague alone) |
| Evaluate | Justify, critique, defend, assess | Evaluate (too vague alone) |
| Create | Design, construct, develop, produce | Create (too vague alone) |

### Aligning Objectives to Assessment Types

| Bloom's Level | Assessment Type |
|---------------|----------------|
| Remember | Multiple choice, matching, fill-in-the-blank |
| Understand | Short answer, concept maps, explain-in-own-words |
| Apply | Problem sets, case studies, simulations |
| Analyze | Compare/contrast essays, data analysis, categorization |
| Evaluate | Critiques, peer review, debate, position papers |
| Create | Projects, portfolios, research papers, design challenges |

## Scaffolding and the Zone of Proximal Development

### Vygotsky's ZPD

```
┌─────────────────────────────────────────┐
│         Cannot do (even with help)       │
│  ┌───────────────────────────────────┐   │
│  │    Zone of Proximal Development   │   │
│  │    (can do WITH support)          │   │
│  │  ┌─────────────────────────────┐  │   │
│  │  │   Can do independently      │  │   │
│  │  │   (current competence)      │  │   │
│  │  └─────────────────────────────┘  │   │
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Target instruction in the ZPD**: Tasks should be challenging but achievable with guidance.

### Scaffolding Strategies

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| Modeling | Demonstrate the process step by step | Introducing new skills |
| Worked Examples | Show complete solutions with reasoning | Early skill development |
| Partially Worked | Provide partial solutions to complete | Transitioning to independence |
| Prompts/Cues | Hints that guide without giving answers | During practice |
| Think-Alouds | Verbalize thought process | Complex problem-solving |
| Graphic Organizers | Visual frameworks for thinking | Organizing complex information |
| Checklists | Step-by-step procedural guides | Multi-step processes |

### Fading Schedule

```
Lesson 1: Full modeling (I do)
Lesson 2: Guided practice (We do)
Lesson 3: Collaborative practice (You do together)
Lesson 4: Independent practice (You do alone)
Lesson 5: Transfer to new context (You do differently)
```

## Cognitive Load Theory (Sweller)

### Three Types of Cognitive Load

| Type | Description | Goal |
|------|-------------|------|
| **Intrinsic** | Inherent complexity of the material | Manage via sequencing and chunking |
| **Extraneous** | Poor instructional design adding unnecessary load | Eliminate |
| **Germane** | Effort devoted to building mental schemas | Maximize |

### Reducing Extraneous Load

```markdown
❌ Split Attention: Text explanation on one page, diagram on another
✅ Integrated: Labels placed directly on the diagram

❌ Redundancy: Identical information in text AND narration simultaneously
✅ Complementary: Narration explains diagram (not duplicating on-screen text)

❌ Transient Information: Complex steps explained only verbally
✅ Persistent Reference: Steps available as a written reference during practice
```

### Managing Intrinsic Load

- **Chunk content**: Break complex topics into 3-5 manageable pieces
- **Sequence carefully**: Simple → complex, concrete → abstract, known → unknown
- **Pre-train components**: Teach prerequisite concepts before combining them
- **Use worked examples**: Reduce problem-solving load for novices

### The Expertise Reversal Effect

What helps novices can hinder experts:

```markdown
Novices: Worked examples > Problem-solving (reduces cognitive load)
Experts: Problem-solving > Worked examples (worked examples become redundant)

→ Adapt scaffolding to learner expertise level
→ Fade supports as competence grows
```

## Lesson Planning Template

```markdown
# Lesson: [Title]

## Learning Objectives
By the end of this lesson, learners will be able to:
1. [Bloom's verb] + [specific content] + [condition] + [criterion]
2. [Bloom's verb] + [specific content] + [condition] + [criterion]

## Prerequisites
- [What learners must already know/do]

## Materials
- [Resources, tools, handouts]

## Lesson Sequence (Total: __ minutes)

### Opening (5 min)
- Hook/connection to prior knowledge
- State objectives and relevance

### Direct Instruction (10 min)
- Key concept 1 with examples
- Key concept 2 with examples
- Check for understanding: [specific question/activity]

### Guided Practice (15 min)
- Activity: [description]
- Scaffolding: [what support is provided]
- Monitoring: [how to check progress]

### Independent Practice (15 min)
- Task: [description]
- Success criteria: [what proficiency looks like]

### Closing (5 min)
- Retrieval practice: [specific prompt]
- Preview next lesson
- Assign spaced practice

## Assessment
- Formative: [during-lesson checks]
- Summative: [end-of-unit assessment connection]

## Differentiation
- Support: [for struggling learners]
- Extension: [for advanced learners]
```
