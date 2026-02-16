# Tech Stack

Reference for agentic-team-templates development. Read when needing version or tool specifics.

## Core

| Tool | Version / Notes |
|------|-----------------|
| Node.js | 18.0.0+ (see `engines` in package.json) |
| Package manager | npm |

## Testing

- **Vitest** — unit tests
- Run: `npm test` or `npm run test:watch`
- Coverage: `npm run test:coverage`

## Code Quality

- **ESLint** — via commitlint (conventional commits)
- **Husky** — pre-commit hooks
- **Commitlint** — enforces conventional commit format

## Validation

- **scripts/validate-rule-sizes.js** — ensures template .mdc files stay under 100 lines
- Run: `npm run validate:rules`

## Publishing

- **release-please** — automated version bumps and changelog
- Merge to main → release-please creates release PR → merge triggers npm publish
