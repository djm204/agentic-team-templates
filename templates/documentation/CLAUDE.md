# Documentation Development Guide

Guidelines for writing and maintaining technical documentation.

## Philosophy

> "Say what you mean, simply and directly." — Brian Kernighan

Documentation exists to help humans understand code. Write for the busy engineer who just wants to get back to coding.

## Core Principles

### 1. Minimum Viable Documentation

A small set of fresh, accurate docs is better than a large assembly in various states of disrepair. Write only what's needed, keep it current, delete the rest.

### 2. Write for Humans First

Code tells computers what to do. Documentation tells humans *why*.

### 3. Same-Commit Rule

Documentation changes belong in the same commit as code changes. This keeps docs fresh and ensures they never drift from reality.

### 4. Delete Dead Docs

Stale documentation is worse than no documentation. It misinforms, slows down, and erodes trust. When in doubt, delete.

## The Documentation Hierarchy

From least to most formal:

1. **Self-documenting code** — Good naming eliminates most comments
2. **Inline comments** — Explain *why*, not *what*
3. **API documentation** — Function/class contracts (JSDoc, docstrings)
4. **README files** — Project orientation
5. **Guides and tutorials** — How to accomplish tasks
6. **ADRs** — Why we made architectural decisions

## Quick Reference

### When to Document

**Always document:**
- Public APIs and interfaces
- Non-obvious business logic
- Architectural decisions (ADRs)
- Setup and installation
- Configuration options

**Skip documentation for:**
- What the code literally does
- Obvious behavior types express
- Implementation details that change often

### Comment Guidelines

```typescript
// Good: Explains WHY
// Retry with backoff because payment API is flaky during peak hours
await retryWithBackoff(processPayment, 3);

// Bad: Explains WHAT (code already shows this)
// Increment counter by 1
counter++;
```

### README Essentials

Every README needs:
1. Project name + one-line description
2. Quick start (install + basic usage)
3. Example code

### ADR Format

```markdown
# ADR-001: [Title]

## Status
Accepted | Proposed | Deprecated | Superseded

## Context
What's the situation? What problem are we solving?

## Decision
What did we decide?

## Consequences
What happens as a result? (Good, bad, neutral)
```

## Definition of Done

Documentation is complete when:

- [ ] New public APIs have docstrings
- [ ] README reflects current state
- [ ] Complex logic has explanatory comments
- [ ] Setup instructions tested and working
- [ ] No outdated information remains
- [ ] All links are valid

## Anti-Patterns to Avoid

- **"We'll document it later"** — Later means never
- **Commented-out code** — Use version control
- **Comments that lie** — Update or delete
- **Noise comments** — `// increment counter` adds nothing
- **Separate doc repos** — Keep docs with code

## Review Checklist

When reviewing code:

- [ ] Docstrings added/updated for changed functions?
- [ ] README updated if behavior changes?
- [ ] API docs reflect endpoint changes?
- [ ] Code examples still work?
- [ ] No dead documentation created?
