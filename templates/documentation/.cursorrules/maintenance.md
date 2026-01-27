# Documentation Maintenance

Guidelines for keeping documentation fresh, accurate, and useful.

## Core Principle

> Dead docs are bad. They misinform, they slow down, they incite despair in
> engineers and laziness in team leads. — Google Documentation Guide

## The Same-Commit Rule

**Documentation changes belong in the same commit as code changes.**

```bash
# Good: Docs updated with code
git commit -m "feat: add payment retry logic

- Add exponential backoff for failed payments
- Update API docs with new retry behavior
- Add example to README"

# Bad: Docs updated separately (or never)
git commit -m "feat: add payment retry logic"
# ... 3 weeks later ...
git commit -m "docs: update payment docs"  # If remembered at all
```

## Delete Dead Documentation

### Signs of Dead Docs

- References to removed features
- Code examples that don't compile
- Broken links
- Outdated screenshots
- Instructions that don't work
- "TODO: update this" comments

### Deletion Strategy

1. **Default to delete** when uncertain
2. **Archive important history** in ADRs if needed
3. **Don't preserve for nostalgia** — that's what git history is for

```markdown
<!-- Bad: Leaving dead docs -->
## Legacy Authentication (Deprecated)

> Note: This section is outdated. See new auth docs below.

The old auth system used...

<!-- Good: Delete and move on -->
## Authentication

Current auth system uses JWT tokens...
```

## Regular Maintenance

### Quarterly Review Checklist

- [ ] All README quick-start instructions work
- [ ] Code examples compile and run
- [ ] Links resolve (use `npx linkinator`)
- [ ] Screenshots match current UI
- [ ] API docs match implementation
- [ ] No TODO/FIXME comments older than 90 days

### Automated Checks

```yaml
# .github/workflows/docs.yml
name: Documentation Health

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  push:
    paths:
      - 'docs/**'
      - '*.md'

jobs:
  check-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx linkinator . --recurse --skip "^(?!http)"
      
  check-markdown:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx markdownlint '**/*.md'
      
  test-code-examples:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:docs  # Test code examples compile
```

## Documentation Ownership

### Every Doc Has an Owner

```markdown
---
owner: @payments-team
last-reviewed: 2024-01-15
---

# Payment Processing Guide
```

### Review Triggers

Docs should be reviewed when:
- Related code changes
- User reports confusion
- New team member struggles
- 90 days since last review

## Preventing Documentation Decay

### Link to Source of Truth

```markdown
<!-- Bad: Duplicates information that will drift -->
## Supported Node Versions
- Node 18
- Node 20
- Node 22

<!-- Good: Links to canonical source -->
## Requirements
See `engines` field in [package.json](./package.json) for supported versions.
```

### Generate When Possible

```typescript
// Generate CLI help from code
const commands = {
  build: {
    description: 'Build the project',
    options: [
      { name: '--watch', description: 'Watch for changes' },
    ],
  },
};

// README generated from this object
```

### Use Versioned References

```markdown
<!-- Bad: Will break on next release -->
See the [API docs](https://docs.example.com/api)

<!-- Good: Pinned to version -->
See the [API docs for v2.x](https://docs.example.com/v2/api)
```

## Handling Outdated Docs

### Triage Process

```
┌─────────────────────┐
│ Is it still needed? │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
   Yes          No
    │           │
    ▼           ▼
┌───────────┐ ┌────────┐
│ Update it │ │ Delete │
└───────────┘ └────────┘
```

### Update vs. Rewrite

**Update when:**
- Core information is correct
- Structure is sound
- Just needs minor corrections

**Rewrite when:**
- Fundamental approach changed
- More than 50% needs changes
- Structure doesn't fit current reality

## Team Documentation Habits

### Code Review Checklist

Reviewers should check:
- [ ] Docstrings added/updated for changed functions
- [ ] README reflects new features
- [ ] API docs updated for endpoint changes
- [ ] No commented-out documentation
- [ ] Examples are tested

### PR Template

```markdown
## Documentation

- [ ] README updated (if applicable)
- [ ] API docs updated (if applicable)
- [ ] Code comments updated
- [ ] No documentation needed (explain why)
```

### Definition of Done

A feature is not complete until:
- Public APIs are documented
- README reflects the change (if user-facing)
- Relevant code comments updated
- Examples work correctly

## Anti-Patterns

### "We'll Document It Later"

```
Later === Never
```

Document as you code. If it's too complex to document, it's too complex.

### Documentation-Only PRs

Large documentation PRs are a smell. They indicate docs weren't updated with code.

```markdown
<!-- Bad: 6 months of accumulated debt -->
PR: "Update all documentation"
Files changed: 47

<!-- Good: Incremental updates -->
PR: "feat: add payment retry logic"
Files changed: 3 (including docs)
```

### Separate Doc Repos

Keeping docs in a separate repository:
- Creates sync issues
- Removes accountability
- Makes "update docs with code" impossible

Docs belong with code unless there's a compelling reason otherwise.
