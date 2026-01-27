# Commit Standards

High standards for commit messages, structure, and semantic versioning alignment.

## Commit Message Format

### Conventional Commits Specification

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (Required)

The type must be one of the following:

- **`feat`**: A new feature (triggers MINOR version bump)
- **`fix`**: A bug fix (triggers PATCH version bump)
- **`docs`**: Documentation only changes
- **`style`**: Code style changes (formatting, semicolons, etc.) that don't affect code meaning
- **`refactor`**: Code refactoring that neither fixes a bug nor adds a feature
- **`perf`**: Performance improvements (triggers PATCH version bump)
- **`test`**: Adding or updating tests
- **`chore`**: Changes to build process, dependencies, or auxiliary tools
- **`ci`**: Changes to CI configuration files and scripts
- **`build`**: Changes to build system or dependencies
- **`revert`**: Reverts a previous commit

### Scope (Optional)

The scope should be the area of the codebase affected:

- `auth`: Authentication-related
- `api`: API endpoints
- `ui`: User interface components
- `db`: Database changes
- `config`: Configuration changes
- `deps`: Dependency updates
- `docs`: Documentation
- `test`: Tests

### Subject (Required)

- Use imperative, present tense: "add" not "added" or "adds"
- Don't capitalize first letter
- No period (.) at the end
- Maximum 72 characters
- Be clear and concise

### Body (Optional)

- Explain **what** and **why** vs. **how**
- Wrap at 72 characters
- Can include multiple paragraphs
- Use bullet points for lists

### Footer (Optional)

- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: <description>`
- Co-authors: `Co-authored-by: Name <email>`

## Commit Examples

### Good Commits

```bash
# Feature (MINOR bump)
feat(auth): add OAuth2 Google provider

Implement OAuth2 authentication flow with Google as provider.
Adds secure session management with HTTP-only cookies.

Closes #123

# Bug Fix (PATCH bump)
fix(api): handle null response in user endpoint

Previously, null responses from database would cause 500 errors.
Now returns 404 with proper error message.

Fixes #456

# Breaking Change (MAJOR bump)
feat(api)!: change user endpoint response format

BREAKING CHANGE: User endpoint now returns `{ data: User }` instead of `User` directly.
Migration: Update clients to access `response.data` instead of `response`.

# Performance (PATCH bump)
perf(db): optimize user query with index

Add database index on email field, reducing query time from 200ms to 5ms.

# Documentation
docs(api): add authentication examples

Add code examples for OAuth2 flow in API documentation.

# Refactoring (no version bump)
refactor(auth): extract token validation logic

Move token validation to separate utility function for reusability.
No functional changes.

# Test
test(auth): add OAuth2 flow integration tests

Coverage increased from 60% to 85% for authentication module.
```

### Bad Commits

```bash
# Too vague
fix: stuff

# Wrong tense
feat: added login button

# Too long subject
feat: add comprehensive user authentication system with OAuth2 support and session management

# Missing type
add login button

# Wrong type (this is a feature, not a fix)
fix: add new user registration endpoint

# No explanation for breaking change
feat(api)!: change response format
```

## Commit Structure Standards

### Atomic Commits

Each commit should represent **one logical change**:

- ✅ **Good**: One feature, one commit
- ✅ **Good**: One bug fix, one commit
- ✅ **Good**: Tests in separate commit from implementation
- ❌ **Bad**: Multiple unrelated changes
- ❌ **Bad**: Feature + bug fix + refactor in one commit

### Commit Size

- **Small** (< 50 lines): Ideal
- **Medium** (50-200 lines): Acceptable
- **Large** (200-500 lines): Should be split if possible
- **Very Large** (> 500 lines): **Must be split** into logical commits

### Commit Frequency

- Commit early and often
- Commit after each logical unit of work
- Don't wait until feature is "complete"
- Use meaningful commit messages even for WIP

## Semver Alignment

### Commit Types → Version Bumps

| Commit Type | Semver Bump | Example |
|------------|-------------|---------|
| `feat` | MINOR (0.1.0) | New feature |
| `feat!` | MAJOR (1.0.0) | Breaking change |
| `fix` | PATCH (0.0.1) | Bug fix |
| `perf` | PATCH (0.0.1) | Performance improvement |
| `refactor` | None | Code refactoring |
| `docs` | None | Documentation |
| `test` | None | Tests |
| `chore` | None | Maintenance |

### Breaking Changes

Breaking changes must be marked with `!` after the type:

```bash
feat(api)!: remove deprecated endpoint
fix(api)!: change error response format
```

Or in the footer:

```bash
feat(api): update response format

BREAKING CHANGE: Response format changed from array to object.
Update clients to use `response.items` instead of `response`.
```

## Commit Best Practices

### Before Committing

1. **Review Changes**: `git diff --staged`
2. **Run Tests**: Ensure tests pass
3. **Check Linting**: Fix linting errors
4. **Verify Build**: Code compiles
5. **Check Scope**: Only related changes

### Commit Message Quality

- **Clear**: Anyone can understand what changed
- **Concise**: Get to the point quickly
- **Complete**: Explain why, not just what
- **Consistent**: Follow the same format

### What NOT to Commit

- ❌ Secrets, API keys, credentials
- ❌ Large binary files
- ❌ Generated files (unless necessary)
- ❌ Temporary files, logs
- ❌ IDE-specific files
- ❌ `console.log`, `debugger` statements
- ❌ Commented-out code

## Commit Workflow

### Feature Development

```bash
# Start feature
git checkout -b feat/user-authentication

# Make changes
# ... edit files ...

# Stage and commit
git add src/auth/login.ts
git commit -m "feat(auth): add login component"

# Add tests
git add tests/auth/login.test.ts
git commit -m "test(auth): add login component tests"

# Continue development...
git add src/auth/session.ts
git commit -m "feat(auth): add session management"

# Final commit
git add docs/auth.md
git commit -m "docs(auth): add authentication documentation"
```

### Bug Fixes

```bash
git checkout -b fix/api-null-handling

# Fix the bug
git add src/api/user.ts
git commit -m "fix(api): handle null response in user endpoint"

# Add regression test
git add tests/api/user.test.ts
git commit -m "test(api): add null response handling test"
```

### Refactoring

```bash
git checkout -b refactor/auth-utilities

# Refactor
git add src/auth/utils.ts
git commit -m "refactor(auth): extract token validation to utility"

# Update tests if needed
git add tests/auth/utils.test.ts
git commit -m "test(auth): update tests for extracted utilities"
```

## Amending Commits

### When to Amend

- ✅ Fix typo in commit message
- ✅ Add forgotten file to last commit
- ✅ Fix small issue in last commit
- ❌ Never amend pushed commits (unless working alone)

### How to Amend

```bash
# Fix commit message
git commit --amend -m "feat(auth): add OAuth2 Google provider"

# Add forgotten file
git add forgotten-file.ts
git commit --amend --no-edit

# Interactive edit
git commit --amend
```

## Commit History Quality

### Clean History

- Linear history when possible
- Logical grouping of changes
- Easy to understand progression
- Easy to revert specific changes

### Interactive Rebase

Use `git rebase -i` to clean up commits before pushing:

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Options:
# pick: use commit as-is
# reword: change commit message
# edit: modify commit
# squash: combine with previous commit
# fixup: like squash, but discard message
# drop: remove commit
```

## Enforcement

### Pre-commit Hooks

Use tools like:
- **commitlint**: Validate commit message format
- **husky**: Git hooks
- **lint-staged**: Run linters on staged files

### Example `.commitlintrc.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build',
        'revert',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case']],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72],
  },
};
```

## Summary

- ✅ Use Conventional Commits format
- ✅ One logical change per commit
- ✅ Clear, concise, imperative messages
- ✅ Align commit types with semver
- ✅ Mark breaking changes with `!`
- ✅ Commit early and often
- ✅ Review before committing
- ✅ Keep history clean
