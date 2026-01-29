# agentic-team-templates

[![npm version](https://img.shields.io/npm/v/agentic-team-templates.svg)](https://www.npmjs.com/package/agentic-team-templates)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Compatible with:**

![Cursor](https://img.shields.io/badge/Cursor_IDE-black?style=flat&logo=cursor)
![Claude Code](https://img.shields.io/badge/Claude_Code-cc785c?style=flat&logo=anthropic)
![GitHub Copilot](https://img.shields.io/badge/GitHub_Copilot-000?style=flat&logo=githubcopilot)

AI coding assistant templates for Cursor IDE, Claude Code, and GitHub Copilot. Pre-configured rules and guidelines that help AI assistants write better code in your projects.

**Installs (configurable via `--ide`):**

- **`CLAUDE.md`** - Development guide for Claude-based assistants (Claude Code, Cursor with Claude)
- **`.cursorrules/`** - Rule files for Cursor IDE
- **`.github/copilot-instructions.md`** - Instructions for GitHub Copilot

> **Disclaimer:** This project is provided for **educational and experimental purposes only**. The author takes no responsibility for any actions, outputs, or consequences resulting from an LLM or AI assistant following these rules. Use at your own risk. Always review AI-generated code before deploying to production.

## Installation

Pick the install method for your environment:

| Ecosystem | Install |
|-----------|---------|
| **Node (CLI)** | `npx agentic-team-templates [template-name]` — or `npm install -g agentic-team-templates` then `agentic-team-templates [template-name]` |
| **Go** | `go get github.com/djm204/agentic-team-templates@latest` |
| **Python** | `pip install git+https://github.com/djm204/agentic-team-templates.git` |
| **Rust** | `cargo add agentic-team-templates --git https://github.com/djm204/agentic-team-templates` |
| **Swift** | In `Package.swift`: `.package(url: "https://github.com/djm204/agentic-team-templates", from: "0.9.1")` |
| **Any** | Download [Source code (zip)](https://github.com/djm204/agentic-team-templates/releases) and unpack the `templates/` directory |

Pin to a version with `@vX.Y.Z` (Go, pip) or `from: "X.Y.Z"` (Swift); see [Releases](https://github.com/djm204/agentic-team-templates/releases).

## How to Use

You can use the templates in two ways:

1. **CLI (Node)** — Run the tool to install rules into your project (writes `CLAUDE.md`, `.cursorrules/`, `.github/copilot-instructions.md`).
2. **From your language** — Use the package to get the template path or embedded files, then copy or read the markdown you need.

### Option 1: CLI (Node)

If you installed via Node, run the CLI from your project directory:

```bash
# Install one template
npx agentic-team-templates web-frontend

# Multiple templates
npx agentic-team-templates web-frontend web-backend

# List available templates
npx agentic-team-templates --list

# Preview without writing (dry run)
npx agentic-team-templates web-frontend --dry-run

# Target specific IDE (cursor, claude, codex)
npx agentic-team-templates web-frontend --ide=cursor

# Remove or reset
npx agentic-team-templates --remove web-frontend
npx agentic-team-templates --reset
```

**CLI options:** `--ide`, `--list` / `-l`, `--dry-run`, `--force` / `-f`, `--remove`, `--reset`, `--yes` / `-y`, `--help` / `-h`.

### Option 2: Use templates from your language

If you installed via Go, Python, Rust, Swift, or a source archive, use the templates in code:

**Go** — Embedded `FS`; paths under `templates/` (e.g. `templates/web-frontend/CLAUDE.md`):

```go
import (
    "io/fs"
    "github.com/djm204/agentic-team-templates"
)
data, _ := fs.ReadFile(templates.FS, "templates/web-frontend/CLAUDE.md")
```

**Python** — Path to the bundled `templates/` directory:

```python
from pathlib import Path
from agentic_team_templates import get_templates_dir

templates_dir = get_templates_dir()
claude_md = (templates_dir / "web-frontend" / "CLAUDE.md").read_text()
```

**Rust** — Embedded `Dir`; paths like `web-frontend/CLAUDE.md`:

```rust
use agentic_team_templates::TEMPLATES;

let file = TEMPLATES.get_file("web-frontend/CLAUDE.md").unwrap();
let contents = file.contents_utf8().unwrap();
```

**Swift** — Resources in the module bundle:

```swift
import AgenticTeamTemplates
// Use Bundle.module to locate resources under "templates/"
```

**Files on disk** — If you unpacked the release zip, copy from the `templates/<name>/` and `templates/_shared/` directories into your project.

## Available Templates

| Template | Description |
|----------|-------------|
| `web-frontend` | SPAs, SSR, static sites, PWAs |
| `web-backend` | REST, GraphQL, microservices |
| `fullstack` | Full-stack apps (Next.js, Nuxt, etc.) |
| `mobile` | React Native, Flutter, native iOS/Android |
| `cli-tools` | Command-line applications and developer tools |
| `blockchain` | Smart contracts, DeFi, Web3 applications |
| `ml-ai` | Machine learning systems, model development |
| `data-engineering` | Data pipelines, ETL, warehousing |
| `platform-engineering` | Infrastructure as code, Kubernetes, CI/CD |
| `devops-sre` | Incident management, SLOs, observability |
| `product-manager` | Product strategy, discovery, OKRs, PRDs |
| `qa-engineering` | Test strategy, automation, quality gates |
| `utility-agent` | AI agent utilities, context management |
| `documentation` | Technical writing, API docs, ADRs |

## What Gets Installed

### Shared Rules (Always Included)

Every template installation includes these foundational rules:

| File | Description |
|------|-------------|
| `core-principles.md` | Honesty, simplicity, testing requirements |
| `code-quality.md` | SOLID, DRY, clean code patterns |
| `security-fundamentals.md` | Zero trust, input validation, secrets management |
| `git-workflow.md` | Commits, branches, PRs, safety protocols |
| `communication.md` | Direct, objective, professional communication |

### Template-Specific Rules

Each template adds domain-specific rules. For example, `web-frontend` includes:

- `accessibility.md` - WCAG compliance, ARIA patterns
- `component-patterns.md` - React/Vue/Svelte best practices
- `performance.md` - Core Web Vitals, optimization
- `state-management.md` - State patterns, data flow
- `styling.md` - CSS architecture, design systems
- `testing.md` - Unit, integration, E2E testing

## File Structure

After installing the **web-frontend** template (via CLI or by copying from your language’s package), your project gets:

```text
your-project/
├── CLAUDE.md                              # Development guide (Claude Code, Cursor)
├── .cursorrules/                          # Rule files (Cursor IDE)
│   ├── core-principles.md                 # Shared
│   ├── code-quality.md                    # Shared
│   ├── security-fundamentals.md           # Shared
│   ├── git-workflow.md                    # Shared
│   ├── communication.md                   # Shared
│   ├── web-frontend-overview.md           # Template-specific
│   ├── web-frontend-accessibility.md      # Template-specific
│   ├── web-frontend-component-patterns.md # Template-specific
│   ├── web-frontend-performance.md        # Template-specific
│   ├── web-frontend-state-management.md   # Template-specific
│   ├── web-frontend-styling.md            # Template-specific
│   └── web-frontend-testing.md            # Template-specific
└── .github/
    └── copilot-instructions.md            # Instructions (GitHub Copilot)
```

## Customization

### Add Project-Specific Rules

Create new `.md` files in `.cursorrules/`:

```markdown
# my-project-conventions.md

## API Endpoints

All API calls go through `/lib/api.ts`...
```

### Modify Existing Rules

Edit any file in `.cursorrules/` or `CLAUDE.md` directly. Changes take effect immediately.

### Combine with Existing Rules

Templates merge with your existing `.cursorrules/` directory. Existing files are preserved unless they have the same name.

## Examples

Install the templates you need for your stack. Use the CLI (Node) or your language’s API to copy/read the same files.

| Project type | Templates | CLI (Node) | From your language |
|--------------|-----------|------------|--------------------|
| **React / SPA** | `web-frontend` | `npx agentic-team-templates web-frontend` | Copy from `templates/web-frontend/` and `templates/_shared/` |
| **Full-stack (Next.js, etc.)** | `fullstack` | `npx agentic-team-templates fullstack` | Same; use `fullstack` instead of `web-frontend` |
| **Backend / microservices** | `web-backend`, `devops-sre` | `npx agentic-team-templates web-backend devops-sre` | Copy from both template dirs + `_shared` |
| **ML / data** | `ml-ai`, `data-engineering` | `npx agentic-team-templates ml-ai data-engineering` | Same; use `get_templates_dir()` / `TEMPLATES` / `FS` and copy |

**CLI example (Node):**

```bash
cd my-project
npx agentic-team-templates web-frontend
```

**Library example (any language):** Use your package’s API (see [Option 2: Use templates from your language](#option-2-use-templates-from-your-language)) to read or copy files from `templates/<name>/` and `templates/_shared/` into your project.

## Requirements

- **CLI (Node):** Node.js 18.0.0 or higher.
- **Library / files:** None; use the package from Go, Python, Rust, Swift, or the unpacked `templates/` directory.
- **Supported IDEs/Tools:** Cursor IDE (`.cursorrules/`), Claude Code (`CLAUDE.md`), GitHub Copilot (`.github/copilot-instructions.md`).

## Troubleshooting (CLI / Node)

These apply only if you use the Node CLI (`npx agentic-team-templates` or a global install).

### "Unknown option" or missing features

You may be on a cached old version. Use the latest:

```bash
npx agentic-team-templates@latest [command]
```

Or clear caches: `npx clear-npx-cache` or `npm cache clean --force`.

### Check CLI version

```bash
npx agentic-team-templates --version
```

Use `--help` or `npx agentic-team-templates@latest --help` to see options and get update hints.

### Update global install

```bash
npm update -g agentic-team-templates
```

## How to Contribute

We welcome contributions! Here's how to add new templates or improve existing ones.

### Adding a New Template

1. **Create the template directory structure:**

```text
templates/your-template/
├── CLAUDE.md                 # Main development guide (required)
└── .cursorrules/
    ├── overview.md           # Scope and core principles (required)
    ├── topic-one.md          # Domain-specific rules
    ├── topic-two.md
    └── ...
```

2. **Follow the existing patterns:**
   - Look at `templates/web-frontend/` or `templates/platform-engineering/` for reference
   - Each rule file should be focused on a single topic
   - Include code examples, not just guidelines
   - Add "Common Pitfalls" and "Definition of Done" sections

3. **Required files:**
   - `CLAUDE.md` - Comprehensive guide with overview, tech stack, patterns, and examples
   - `.cursorrules/overview.md` - Scope, core principles, and project structure

### Template Guidelines

**CLAUDE.md should include:**

- Overview and scope
- Key principles (3-5 bullet points)
- Technology stack table
- Code patterns with examples
- Definition of done checklist
- Common pitfalls with good/bad examples

**Rule files should:**

- Focus on one topic (e.g., testing, security, performance)
- Be actionable with concrete code examples
- Include both "do" and "don't" examples
- Stay under ~500 lines for readability

### Improving Existing Templates

1. Fork the repository
2. Make your changes
3. Test locally (Node CLI from repo root):

   ```bash
   node bin/cli.js your-template --dry-run
   ```

4. Submit a PR with:
   - Clear description of changes
   - Rationale for additions/modifications
   - Any new dependencies or requirements

### Shared Rules

The `templates/_shared/` directory contains rules included with every template:

- `core-principles.md` - Universal development principles
- `code-quality.md` - Clean code patterns
- `security-fundamentals.md` - Security basics
- `git-workflow.md` - Git conventions
- `communication.md` - AI communication style

Changes to shared rules affect all templates, so be thoughtful with modifications.

### Code Style

- Use Markdown for all documentation
- Code examples should be copy-pasteable
- Prefer concrete examples over abstract guidelines
- Keep formatting consistent with existing templates

## Buy me a beer?

If this project helped you, you can tip:

| Network | Address |
|---------|---------|
| **BTC** | `bc1qq65ywtyfmwg0l6xgchp8284tnls23mla76w4ww` |
| **ETH** | `0xFc486346e43eFE2a4ABe71E81d786c0ccbc5A778` |
| **SOL** | `tcgbwbFaQjsZG5qVsqkqKnNc68H3Mh4TpxA7qEfe82N` |
| **Base** | `0xFc486346e43eFE2a4ABe71E81d786c0ccbc5A778` |

## License

MIT © [David Mendez](https://github.com/djm204)
