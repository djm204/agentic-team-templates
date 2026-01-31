# Project Structure

```
agentic-team-templates/
├── bin/
│   └── cli.js                          # CLI entry point
├── src/
│   └── index.js                        # Main installer logic + template registry
├── templates/
│   ├── _shared/                        # Shared rules (always installed with any template)
│   │   ├── code-quality.md
│   │   ├── communication.md
│   │   ├── core-principles.md
│   │   ├── git-workflow.md
│   │   └── security-fundamentals.md
│   └── <template-name>/               # One directory per template
│       ├── CLAUDE.md                   # Generated guide for Claude Code / Cursor + Claude
│       └── .cursorrules/              # Rule files for Cursor IDE
│           ├── overview.md            # Required: scope, principles, structure
│           └── <rule-name>.md         # 2-7 additional domain-specific rules
├── .cursorrules/                       # Rules for THIS project (meta)
├── package.json
└── CLAUDE.md                           # Instructions for working on THIS project
```

## Key Conventions

- **Template Naming**: lowercase, hyphenated (e.g., `javascript-expert`, `web-frontend`)
- **Rule Files**: Markdown files in `.cursorrules/`, each covering a single concern
- **Shared Rules**: `templates/_shared/` is always installed — don't duplicate its content in templates
- **Template Registry**: All templates must be registered in `src/index.js` in the `TEMPLATES` object
- **Alphabetical Order**: Templates are listed alphabetically in the `TEMPLATES` object

---

## How to Create a New Template

### Step 1: Study an Existing Template

Read the rule files of a similar template to understand the format, depth, and tone. Good references:
- `templates/web-frontend/` — comprehensive, multi-concern template
- `templates/fullstack/` — balanced scope

### Step 2: Create the Template Directory

```
templates/<template-name>/
├── CLAUDE.md
└── .cursorrules/
    ├── overview.md
    ├── <concern-1>.md
    ├── <concern-2>.md
    └── ...
```

### Step 3: Write the Rule Files

Each `.cursorrules/*.md` file should:
- Have a clear `# Title` header
- Open with a one-line description of its purpose
- Include a `## Scope` or context section
- Provide concrete code examples (good and bad patterns)
- Use the project's language/framework idioms
- Be self-contained — don't reference other rule files

Required file: `overview.md` — defines scope, key principles, project structure, and definition of done.

Additional files (3-7 recommended): cover specific concerns like testing, performance, security, patterns, tooling, etc.

### Step 4: Write CLAUDE.md

The `CLAUDE.md` in the template root is a merged guide that combines content from all rule files into a single document. It should:
- Start with `# <Template Name> Development Guide`
- Include an overview section
- Contain key content from each rule file organized under `---` separators
- End with a Definition of Done checklist

### Step 5: Register the Template

Add an entry to the `TEMPLATES` object in `src/index.js`:

```javascript
'<template-name>': {
  description: 'Short description of what this template covers',
  rules: ['overview.md', 'concern-1.md', 'concern-2.md', ...]
},
```

- Keep templates in **alphabetical order**
- The `rules` array must list every `.md` file in the template's `.cursorrules/` directory
- The `description` should be concise (under 80 chars) and mention key technologies or domains

### Step 6: Verify

- Confirm the `rules` array in `src/index.js` matches the actual files in `templates/<name>/.cursorrules/`
- Confirm `CLAUDE.md` exists in `templates/<name>/`
- Test the installation locally: `node bin/cli.js <template-name>`

### Step 7: Commit and PR

- Use conventional commit: `feat(templates): add <template-name> template`
- Create a PR against `main`
- The release-please workflow handles versioning and npm publishing

---

## Publishing

Publishing is automated via GitHub Actions:
1. Merge PR to `main`
2. `release-please` creates a release PR with version bump
3. Merging the release PR triggers npm publish
4. Package is published as `agentic-team-templates` on npm
