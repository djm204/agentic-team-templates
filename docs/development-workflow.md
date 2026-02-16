# Development Workflow

Reference for commit conventions, branching, and PR process. Read when creating commits or PRs.

## Commit Format (Conventional Commits)

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`

Examples:
- `feat(templates): add rust-expert template`
- `fix(install): handle missing cursor rules dir`
- `docs: add tech-stack reference`

## Branch Strategy

- Feature branches: `feat/<name>`
- Fix branches: `fix/<name>`
- Chore branches: `chore/<name>`

## PR Requirements

- [ ] All tests pass (`npm test`)
- [ ] `npm run validate:rules` passes
- [ ] Conventional commit messages

## Publishing Flow

1. Merge PR to `main`
2. release-please creates release PR
3. Merge release PR → npm publish
