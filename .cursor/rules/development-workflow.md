# Development Workflow

## Overview

This document provides a high-level overview of the development workflow. For detailed standards, see:

- **[Commit Standards](commit-standards.md)**: Comprehensive commit message format, semver alignment, and commit best practices
- **[PR Standards](pr-standards.md)**: Detailed PR requirements, review process, and semantic versioning compliance

## Commit Strategy

### Small, Meaningful Commits

Commits should be atomic and focused:

- One logical change per commit
- Each commit should compile and pass tests
- Separate refactoring from feature changes
- Separate tests from implementation

### Good Commit Examples

- `feat(auth): add login button component`
- `test(auth): add login button tests`
- `fix(api): handle rate limit errors`
- `refactor(utils): extract date formatting`

### Bad Commit Examples

- `WIP` or `fix stuff`
- `add feature and fix bugs and update tests`
- Giant commits with 50+ file changes

**For detailed commit standards, see [commit-standards.md](commit-standards.md)**

## Feature Branch Strategy

```bash
# Create feature branch
git checkout -b feat/project-cards

# Work in small commits
git add src/components/features/ProjectCard.tsx
git commit -m "feat: add ProjectCard component"

git add src/components/features/ProjectCard.test.tsx
git commit -m "test: add ProjectCard tests"

# Push and create PR
git push origin feat/project-cards
```

## Commit Message Format (Conventional Commits)

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**For complete commit standards including semver alignment, see [commit-standards.md](commit-standards.md)**

## PR Requirements

Before submitting a PR, ensure:

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Coverage maintained or improved
- [ ] E2E tests pass for affected flows
- [ ] Documentation updated
- [ ] Semver version bump determined and documented

**For comprehensive PR standards including semver compliance, see [pr-standards.md](pr-standards.md)**

## Code Review Checklist

- [ ] Security: All inputs validated and sanitized?
- [ ] Tests: Meaningful tests that actually verify behavior?
- [ ] Types: Proper TypeScript usage with no `any`?
- [ ] Accessibility: Semantic HTML and ARIA labels?
- [ ] Performance: No unnecessary re-renders or expensive operations?
- [ ] DRY: No repeated code that could be abstracted?
- [ ] SOLID: Each function/component has single responsibility?
- [ ] Semver: Version bump matches change type?