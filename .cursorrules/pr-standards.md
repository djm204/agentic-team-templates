# Pull Request Standards

High standards for PR quality, review process, and semantic versioning adherence.

## PR Quality Standards

### Mandatory Pre-Submission Checklist

Before creating a PR, **all** of the following must be true:

- [ ] **Tests**: All tests pass locally (`npm test` or equivalent)
- [ ] **Type Safety**: No TypeScript errors (`npm run type-check` or `tsc --noEmit`)
- [ ] **Linting**: No linting errors (`npm run lint`)
- [ ] **Formatting**: Code is formatted (`npm run format`)
- [ ] **Coverage**: Test coverage maintained or improved (minimum 80%)
- [ ] **E2E Tests**: E2E tests pass for affected user flows
- [ ] **Documentation**: All public APIs documented
- [ ] **Breaking Changes**: Breaking changes clearly documented and versioned
- [ ] **Self-Review**: Code reviewed by author before submission
- [ ] **Semver Compliance**: Version bump determined and documented

### PR Description Requirements

Every PR must include:

```markdown
## Summary
Clear, concise one-sentence description of what this PR does.

## Type
- [ ] Feature (non-breaking)
- [ ] Bug Fix (non-breaking)
- [ ] Breaking Change
- [ ] Documentation
- [ ] Refactor (non-breaking)
- [ ] Performance Improvement

## Changes
- Specific bullet points of what changed
- Focus on *what* and *why*, not *how*

## Testing
- How was this tested?
- What test cases were added/updated?
- Manual testing steps (if applicable)

## Semver Impact
- [ ] **PATCH** (0.0.1): Bug fix, non-breaking change
- [ ] **MINOR** (0.1.0): New feature, non-breaking change
- [ ] **MAJOR** (1.0.0): Breaking change

## Breaking Changes
If this is a breaking change, document:
- What breaks?
- Migration path for users
- Deprecation timeline (if applicable)

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped (if applicable)
- [ ] CI passes
```

## Code Review Standards

### Reviewer Responsibilities

1. **Security First**: Verify all inputs validated, auth checks present, no secrets exposed
2. **Test Quality**: Ensure tests actually test behavior, not implementation
3. **Type Safety**: No `any` types, proper TypeScript usage
4. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
5. **Performance**: No unnecessary re-renders, expensive operations, or memory leaks
6. **DRY**: No repeated code that should be abstracted
7. **SOLID**: Single responsibility, proper abstractions
8. **Semver**: Verify version bump matches change type

### Review Response Time

- **Urgent (security, critical bugs)**: Within 4 hours
- **Normal (features, fixes)**: Within 24 hours
- **Non-urgent (docs, refactors)**: Within 48 hours

### Approval Requirements

- **Minimum**: 1 approval from code owner or maintainer
- **Breaking Changes**: 2 approvals required
- **Security Changes**: Security team approval required
- **No Self-Approval**: Authors cannot approve their own PRs

## Semantic Versioning (Semver) Compliance

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
  - Removed public APIs
  - Changed function signatures
  - Removed configuration options
  - Changed default behavior
  - Removed dependencies

- **MINOR** (1.0.0 → 1.1.0): New features, non-breaking
  - New public APIs
  - New features
  - New configuration options
  - Deprecations (with migration path)

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, non-breaking
  - Bug fixes
  - Performance improvements
  - Documentation updates
  - Internal refactoring

### Determining Version Bump

```typescript
// PATCH: Bug fix
function calculateTotal(items: Item[]): number {
  // Fix: Was returning 0, now correctly sums items
  return items.reduce((sum, item) => sum + item.price, 0);
}

// MINOR: New feature (non-breaking)
function calculateTotal(
  items: Item[],
  options?: { discount?: number } // New optional parameter
): number {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return options?.discount ? total * (1 - options.discount) : total;
}

// MAJOR: Breaking change
function calculateTotal(items: Item[]): number {
  // Breaking: Changed return type from number to Result<number, Error>
  if (items.length === 0) {
    return { ok: false, error: new Error('No items') };
  }
  return { ok: true, value: items.reduce((sum, item) => sum + item.price, 0) };
}
```

### Version Bump Process

1. **Determine Change Type**: Review all changes in PR
2. **Check Dependencies**: If dependencies updated, may affect version
3. **Document Breaking Changes**: If MAJOR, document migration path
4. **Update Version**: Bump version in `package.json`, `Cargo.toml`, etc.
5. **Update Changelog**: Add entry to CHANGELOG.md
6. **Tag Release**: After merge, create git tag with version

### Changelog Format

```markdown
## [1.2.0] - 2025-01-24

### Added
- New `calculateTotal` function with discount option
- Support for custom validation rules

### Changed
- Improved error messages for invalid input

### Fixed
- Fixed calculation bug when items array is empty

### Deprecated
- `oldCalculateTotal` will be removed in v2.0.0

## [1.1.1] - 2025-01-20

### Fixed
- Memory leak in event handler cleanup
```

## PR Size Guidelines

### Recommended PR Sizes

- **Small** (< 200 lines): Ideal, easy to review
- **Medium** (200-500 lines): Acceptable, may need multiple reviews
- **Large** (500-1000 lines): Should be split if possible
- **Very Large** (> 1000 lines): **Must be split** into smaller PRs

### When to Split PRs

- Multiple unrelated features
- Large refactoring + new features
- Different areas of codebase
- Different test suites

## Merge Strategy

### Merge Methods

1. **Squash and Merge** (preferred for feature branches)
   - Creates single commit on main
   - Clean history
   - PR description becomes commit body

2. **Merge Commit** (for long-lived branches)
   - Preserves branch history
   - Shows merge point

3. **Rebase and Merge** (for linear history)
   - Clean linear history
   - Requires force push (use with caution)

### After Merge

- [ ] Delete feature branch
- [ ] Verify CI passes on main
- [ ] Create release tag (if version bumped)
- [ ] Update documentation site (if applicable)
- [ ] Notify stakeholders (if breaking change)

## PR Rejection Criteria

A PR will be rejected if:

- Fails CI checks
- Introduces security vulnerabilities
- Breaks existing functionality without migration path
- Lacks tests for new functionality
- Contains `console.log`, `debugger`, or commented code
- Uses `any` type without justification
- Violates accessibility standards
- Incorrect semver version bump
- Missing documentation for public APIs

## Communication Standards

### PR Comments

- **Be Respectful**: Critique code, not people
- **Be Specific**: Point to exact lines, suggest fixes
- **Be Constructive**: Explain why, not just what
- **Be Timely**: Respond to comments within 24 hours

### Request Changes

When requesting changes:

1. Explain the issue clearly
2. Provide specific examples
3. Reference relevant standards/rules
4. Suggest concrete fixes

### Approve with Suggestions

Use "Approve with suggestions" for:
- Minor style issues
- Optional improvements
- Future considerations

## Examples

### Good PR Description

```markdown
## Summary
Adds user authentication with OAuth2 support.

## Type
- [x] Feature (non-breaking)

## Changes
- Implement OAuth2 flow with Google provider
- Add session management with secure cookies
- Add user profile endpoint

## Testing
- Unit tests for OAuth flow (95% coverage)
- Integration tests for session management
- E2E test for complete auth flow

## Semver Impact
- [x] **MINOR** (0.1.0): New feature, non-breaking

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] Changelog updated
- [x] Version bumped to 0.1.0
- [x] CI passes
```

### Bad PR Description

```markdown
Added auth stuff
```

## Enforcement

- **Pre-commit Hooks**: Run tests, linting, formatting
- **CI/CD**: All checks must pass before merge
- **Branch Protection**: Require approvals, status checks
- **Automated Tools**: Dependabot, semantic-release (if applicable)
