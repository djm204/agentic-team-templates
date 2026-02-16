# Testing Strategy

Reference for testing in agentic-team-templates. Read when writing or modifying tests.

## Framework

- **Vitest** — unit tests
- Run: `npm test` or `npm run test:watch`
- Coverage: `npm run test:coverage`

## What to Test

- Template resolution (aliases → canonical names)
- Install logic (copy, merge, skip behavior)
- Remove and reset logic
- Path handling for categorized templates
- CLAUDE.md and copilot-instructions merge behavior

## Conventions

- Test behavior, not implementation
- One logical assertion focus per test where practical
- Use `--dry-run` in tests to avoid filesystem side effects where possible

## Test Location

- `src/index.test.js` — tests for `src/index.js`
