# agentic-team-templates

[![npm version](https://img.shields.io/npm/v/cursor-templates.svg)](https://www.npmjs.com/package/cursor-templates)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Compatible with:**

![Cursor](https://img.shields.io/badge/Cursor_IDE-black?style=flat&logo=cursor)
![Claude Code](https://img.shields.io/badge/Claude_Code-cc785c?style=flat&logo=anthropic)

AI coding assistant templates for Cursor IDE and Claude Code. Pre-configured rules and guidelines that help AI assistants write better code in your projects.

**Installs:**
- **`CLAUDE.md`** - Development guide for Claude-based assistants (Claude Code, Cursor with Claude)
- **`.cursorrules/`** - Rule files for Cursor IDE

> **Disclaimer:** This project is provided for **educational and experimental purposes only**. The author takes no responsibility for any actions, outputs, or consequences resulting from an LLM or AI assistant following these rules. Use at your own risk. Always review AI-generated code before deploying to production.

## Installation

No installation required. Run directly with `npx`:

```bash
npx cursor-templates <template-name>
```

Or install globally:

```bash
npm install -g cursor-templates
cursor-templates <template-name>
```

## How to Use

### Basic Usage

Navigate to your project directory and run:

```bash
npx cursor-templates web-frontend
```

This installs the template rules in your project directory.

### Install Multiple Templates

Combine templates for projects that span multiple domains:

```bash
npx cursor-templates web-frontend web-backend
```

### List All Available Templates

```bash
npx cursor-templates --list
```

### Preview Before Installing (Dry Run)

See what files will be created without making changes:

```bash
npx cursor-templates web-frontend --dry-run
```

### Update to Latest Rules

Re-run with `@latest` to get updated templates:

```bash
npx cursor-templates@latest web-frontend
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--list`, `-l` | List all available templates |
| `--dry-run`, `-d` | Preview changes without writing files |
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version number |

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

After running `npx cursor-templates web-frontend`:

```
your-project/
├── CLAUDE.md                              # Development guide (Claude Code, Cursor)
└── .cursorrules/                          # Rule files (Cursor IDE)
    ├── core-principles.md                 # Shared
    ├── code-quality.md                    # Shared
    ├── security-fundamentals.md           # Shared
    ├── git-workflow.md                    # Shared
    ├── communication.md                   # Shared
    ├── web-frontend-overview.md           # Template-specific
    ├── web-frontend-accessibility.md      # Template-specific
    ├── web-frontend-component-patterns.md # Template-specific
    ├── web-frontend-performance.md        # Template-specific
    ├── web-frontend-state-management.md   # Template-specific
    ├── web-frontend-styling.md            # Template-specific
    └── web-frontend-testing.md            # Template-specific
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

### New React Project

```bash
mkdir my-react-app && cd my-react-app
npm create vite@latest . -- --template react-ts
npx cursor-templates web-frontend
```

### Full-Stack Next.js Project

```bash
npx create-next-app@latest my-app
cd my-app
npx cursor-templates fullstack
```

### Microservices Backend

```bash
cd my-api-service
npx cursor-templates web-backend devops-sre
```

### ML/AI Project

```bash
cd my-ml-project
npx cursor-templates ml-ai data-engineering
```

## Requirements

- **Node.js**: 18.0.0 or higher
- **Supported IDEs/Tools**:
  - Cursor IDE (any version with `.cursorrules/` support)
  - Claude Code (reads `CLAUDE.md` automatically)

## How to Contribute

We welcome contributions! Here's how to add new templates or improve existing ones.

### Adding a New Template

1. **Create the template directory structure:**

```
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
3. Test locally:
   ```bash
   # From repo root, test installation
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

## License

MIT © [David Mendez](https://github.com/djm204)
