# Documentation Standards

Guidelines for writing effective technical documentation across all project types.

## Philosophy

> "Say what you mean, simply and directly." — Brian Kernighan

### Core Principles

1. **Minimum Viable Documentation** - A small set of fresh, accurate docs beats a large assembly in various states of disrepair
2. **Write for Humans First** - Code tells computers what to do; documentation tells humans why
3. **Radical Simplicity** - Fewer distractions make for better writing and more productive reading
4. **Better is Better Than Best** - Incremental improvement beats prolonged debate

### The Documentation Spectrum

Documentation exists on a spectrum from terse to detailed:

1. **Meaningful names** - Self-documenting code through good naming
2. **Inline comments** - Why the code exists, not what it does
3. **API documentation** - Method/class contracts (JSDoc, docstrings)
4. **README files** - Orientation for new users
5. **Guides and tutorials** - How to accomplish specific tasks
6. **Architecture Decision Records** - Why we chose this approach

## Scope

This ruleset applies to:

- Code comments and docstrings
- README files
- API documentation
- Architecture Decision Records (ADRs)
- User guides and tutorials
- Runbooks and operational docs

## When to Document

### Always Document

- Public APIs and interfaces
- Non-obvious business logic
- Architectural decisions and tradeoffs
- Setup and installation procedures
- Configuration options
- Breaking changes

### Don't Document

- What the code literally does (the code says that)
- Obvious behavior that types already express
- Temporary workarounds without context
- Implementation details that change frequently

## Documentation as Code

### Same Commit Rule

**Change documentation in the same commit as the code change.** This:
- Keeps docs fresh
- Provides context for reviewers
- Ensures docs and code stay in sync

### Review Checklist

When reviewing code changes, verify:
- [ ] Docstrings updated for changed functions
- [ ] README updated if behavior changes
- [ ] API docs reflect new endpoints/parameters
- [ ] ADR created for significant decisions

## Definition of Done

Documentation is complete when:

- [ ] New public APIs have docstrings
- [ ] README reflects current state
- [ ] Complex logic has explanatory comments
- [ ] Setup instructions are tested and work
- [ ] Links are valid and point to correct resources
- [ ] No outdated information remains
