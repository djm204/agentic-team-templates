# Refactor: Template rules to MDC format

## Summary

Convert installed template rule files from `.md` to `.mdc` with proper Cursor frontmatter so rules are applied reliably (descriptions, `alwaysApply`, and correct format).

## Why

- **Cursor rule effectiveness**: Rules without MDC frontmatter are treated as plain Markdown and can be ignored or under-prioritized.
- **Best practice**: Use `.mdc` with `description:`, `alwaysApply:`, and (where useful) `globs:` so the AI can decide when to apply each rule.
- **Single source of truth**: Template sources are now `.mdc`; the installer copies them as `.mdc` into the user’s `.cursor/rules/`.

## Changes

### 1. Template rule files → `.mdc` with frontmatter

- **Shared rules** (`templates/_shared/`): `core-principles`, `code-quality`, `security-fundamentals`, `communication`, `git-workflow` — all have `description` and `alwaysApply: true`.
- **Template-specific rules** (`templates/**/.cursor/rules/`): 317 files converted to `.mdc` with `description` (from first `#` heading) and `alwaysApply: false`.
- **Scope**: Only **template** rules (what gets installed). The repo’s own `.cursor/rules/` (meta rules for this project) remain `.md` and are unchanged.

### 2. Installer and registry

- `SHARED_RULES` and every `TEMPLATES[].rules` entry use the `.mdc` extension.
- Alternate filenames when preserving user changes use `-1.mdc` (e.g. `code-quality-1.mdc`).
- Generated `CLAUDE.md` and help text reference `.mdc` rule names.
- `CLAUDE.md` and `.github/copilot-instructions.md` (generated guides) stay `.md`.

### 3. Tests

- Expectations updated for `.mdc`: rule lists, installed paths, shared rules, `getAlternateFilename`.
- All 112 tests pass.

### 4. Cleanup

- One-off conversion script removed after migration.

## Commits

1. `refactor(templates): convert template rule files from .md to .mdc`
2. `refactor(installer): use .mdc for template rules in registry and install output`
3. `chore: remove one-off template MDC conversion script`

## Impact

- **New installs**: Users get `.mdc` rules in `.cursor/rules/` with frontmatter.
- **Existing installs**: Users who already have template rules will keep their current `.md` files until they re-run the installer (e.g. `npx agentic-team-templates <template>`) or remove and re-add templates; then they’ll receive `.mdc` copies.
- **No breaking API change**: CLI usage and template names are unchanged.

## Checklist

- [x] All template rule files converted to `.mdc` with frontmatter
- [x] Installer and registry use `.mdc`
- [x] Tests updated and passing
- [x] One-off script removed
