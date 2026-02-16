# CLAUDE.md - Development Guide

## Development Principles

### 1. Honesty Over Output

- If something doesn't work, say it doesn't work
- If you don't know, say you don't know
- Never hide errors or suppress warnings
- Tests must pass. Green CI or it didn't happen

### 2. Security First

- Zero trust: Every input is hostile until proven otherwise
- Validate all inputs; no secrets in code or logs
- Read `docs/security-requirements.md` for details

### 3. Tests Are Required

- No feature is complete without tests
- Test behavior, not implementation
- Read `docs/testing-strategy.md` for patterns

### 4. Code Quality

- SOLID, DRY, functional programming bias
- Explicit over implicit

---

## Project Overview

**agentic-team-templates** — CLI that installs AI assistant rules (Cursor, Claude, Copilot) into projects. Node.js, Vitest, release-please.

### Key Paths

- `src/index.js` — main installer logic, TEMPLATES registry
- `bin/cli.js` — CLI entry
- `templates/_shared/` — rules always installed
- `templates/<category>/<name>/` — template rules (e.g. `engineering/web-frontend`)

### Quick Commands

```bash
npm test                    # Run tests
npm run validate:rules      # Check template rule sizes (<100 lines)
node bin/cli.js --list      # List templates
node bin/cli.js js --dry-run  # Preview install
```

---

## Rule Files

Rules are in `.cursor/rules/`. Read when relevant; some load automatically.

### Always Loaded

| Rule | Purpose |
|------|---------|
| `core-principles.mdc` | Honesty, security, FP bias, SOLID |
| `code-quality.mdc` | SOLID, DRY, clean code |
| `security-fundamentals.mdc` | Zero trust, validation |
| `communication.mdc` | Direct, objective tone |
| `common-pitfalls.mdc` | Anti-patterns to avoid |
| `rules-creation-best-practices.mdc` | Rule file format, alwaysApply, globs |

### On-Demand (globs or alwaysApply: false)

| Rule | When to read |
|------|--------------|
| `project-overview.mdc` | Project context |
| `project-structure.mdc` | Template layout, creating templates |
| `implement-agent-templates.mdc` | Template expansion plan (templates/**) |
| `testing.mdc` | Writing tests (*.test.*) |
| `documentation-*.mdc` | Docs work (**/*.md, README, ADR, etc.) |
| Others | See globs in each file's front matter |

---

## On-Demand Reference Docs

Read when needed — do not load every message:

| Doc | When to read |
|-----|--------------|
| `docs/tech-stack.md` | Version numbers, tool specifics |
| `docs/development-workflow.md` | Commits, PRs, publishing |
| `docs/testing-strategy.md` | Test patterns |
| `docs/security-requirements.md` | Input validation, no secrets |
| `docs/definition-of-done.md` | Completion checklist |

---

## Customization

- Add `.mdc` files to `.cursor/rules/` for project-specific rules
- Use `description`, `alwaysApply`, `globs` in front matter
- Keep always-apply rules under ~200 lines; on-demand can be longer
