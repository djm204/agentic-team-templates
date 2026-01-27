# Architecture Decision Records (ADRs)

Guidelines for documenting architectural decisions and their rationale.

## Purpose

ADRs capture **architecturally significant decisions** — choices that affect:
- System structure and organization
- Non-functional characteristics (performance, security, scalability)
- External dependencies and integrations
- Development and deployment approaches
- Standards and conventions

## Why ADRs Matter

- **Future developers** understand why decisions were made
- **Prevents rehashing** the same debates
- **Documents tradeoffs** that aren't obvious from code
- **Creates accountability** for decisions
- **Enables learning** from past choices

## ADR Format (MADR Template)

Use the Markdown Architectural Decision Records (MADR) format:

```markdown
# ADR-001: Use PostgreSQL for Primary Database

## Status

Accepted

## Context

We need to choose a primary database for storing user data, transactions,
and application state. Key requirements:

- ACID compliance for financial transactions
- Support for complex queries and joins
- Horizontal read scaling
- Strong ecosystem and tooling

Currently evaluating:
- PostgreSQL
- MySQL
- MongoDB

## Decision

We will use **PostgreSQL** as our primary database.

## Rationale

### Considered Options

#### PostgreSQL
- **Pros**: ACID compliant, excellent query planner, JSONB for flexible schemas,
  strong extension ecosystem (PostGIS, pg_tron), read replicas
- **Cons**: Vertical scaling limits, more complex than MySQL

#### MySQL
- **Pros**: Widely adopted, good performance, simpler operations
- **Cons**: Weaker JSON support, fewer advanced features

#### MongoDB
- **Pros**: Flexible schema, horizontal scaling, document model
- **Cons**: Not ACID by default, eventual consistency concerns for financial data

### Decision Drivers

1. **ACID compliance is non-negotiable** for financial transactions
2. **JSONB** allows flexible metadata without sacrificing query performance
3. **Team expertise** — 4 of 5 engineers have PostgreSQL experience
4. **Ecosystem** — Better tooling for our stack (Prisma, TypeORM)

## Consequences

### Positive
- Strong consistency guarantees
- Can use advanced features (CTEs, window functions)
- Familiar to most team members

### Negative
- Need to plan for vertical scaling limits
- More operational complexity than managed MongoDB
- Schema migrations required for structural changes

### Neutral
- Will use read replicas for scaling reads
- Need to establish connection pooling strategy

## Related Decisions

- ADR-002: Use Prisma as ORM
- ADR-005: Database connection pooling strategy
```

## Minimal ADR Format

For simpler decisions, use the Nygard format:

```markdown
# ADR-003: Use TypeScript Strict Mode

## Status

Accepted

## Context

We need to decide on TypeScript configuration for the project.
Strict mode catches more errors but requires more explicit typing.

## Decision

Enable TypeScript strict mode for all new code.

## Consequences

- Catches null/undefined errors at compile time
- Requires explicit return types on functions
- May slow initial development slightly
- Significantly reduces runtime errors
```

## Y-Statement Format (Ultra-Minimal)

For quick documentation of smaller decisions:

```markdown
# ADR-004: JWT Token Storage

In the context of **user authentication**,
facing **the need to persist auth tokens across page refreshes**,
we decided for **httpOnly cookies**
to achieve **XSS protection**,
accepting **CSRF token overhead**.
```

## File Organization

### Directory Structure

```
docs/
└── adr/
    ├── README.md           # Index of all ADRs
    ├── adr-001-database.md
    ├── adr-002-orm.md
    ├── adr-003-typescript.md
    └── templates/
        ├── madr.md         # Full template
        └── minimal.md      # Minimal template
```

### Naming Convention

```
adr-NNN-short-title.md

Examples:
- adr-001-use-postgresql.md
- adr-002-authentication-strategy.md
- adr-003-api-versioning.md
```

### Index File

```markdown
# Architecture Decision Records

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](./adr-001-database.md) | Use PostgreSQL | Accepted | 2024-01-15 |
| [002](./adr-002-orm.md) | Use Prisma ORM | Accepted | 2024-01-16 |
| [003](./adr-003-auth.md) | JWT Authentication | Superseded by 007 | 2024-01-20 |
```

## ADR Lifecycle

### Statuses

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion, not yet decided |
| **Accepted** | Decision made, being implemented |
| **Deprecated** | Still valid but no longer preferred |
| **Superseded** | Replaced by a newer ADR |
| **Rejected** | Considered but not accepted |

### Updating ADRs

```markdown
## Status

Superseded by [ADR-007](./adr-007-session-auth.md)

## Supersession Note

Added 2024-03-15: After 2 months in production, JWT refresh token
management proved more complex than anticipated. Moving to
session-based auth. See ADR-007 for details.
```

**Never delete ADRs** — they document the decision history, including mistakes.

## When to Write an ADR

### Write an ADR When

- Choosing between multiple valid approaches
- Making decisions with long-term consequences
- Introducing new patterns or technologies
- Deviating from established conventions
- Multiple team members have different opinions

### Skip the ADR When

- Following established patterns
- Making easily reversible choices
- Standard library/framework usage
- Implementation details (not architecture)

## Decision Criteria to Document

Always capture:

1. **Requirements/Constraints** — What must the solution do?
2. **Options Considered** — What alternatives were evaluated?
3. **Decision Drivers** — What factors influenced the choice?
4. **Tradeoffs** — What are we giving up?
5. **Consequences** — What changes as a result?

## Anti-Patterns

### Documenting After the Fact

```markdown
<!-- Bad: Written 6 months later -->
## Context
We needed a database. We picked PostgreSQL.

<!-- Good: Written during decision -->
## Context
Evaluating databases for user data storage. Requirements:
- ACID for transactions
- JSON support for flexible metadata
- Team has PostgreSQL experience
```

### Missing Alternatives

```markdown
<!-- Bad: No alternatives -->
## Decision
Use React.

<!-- Good: Shows the analysis -->
## Considered Options
1. React — Large ecosystem, team experience
2. Vue — Simpler learning curve
3. Svelte — Better performance, smaller ecosystem
```

### Vague Consequences

```markdown
<!-- Bad: Not actionable -->
## Consequences
This will have some impact on performance.

<!-- Good: Specific and measurable -->
## Consequences
- Initial page load increases ~50KB (React bundle)
- Need to implement code splitting for routes
- Requires React testing library for component tests
```
