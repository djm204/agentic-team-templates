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
- **`.cursor/rules/`** - Rule files for Cursor IDE
- **`.github/copilot-instructions.md`** - Instructions for GitHub Copilot

> **Disclaimer:** This project is provided for **educational and experimental purposes only**. The author takes no responsibility for any actions, outputs, or consequences resulting from an LLM or AI assistant following these rules. Use at your own risk. Always review AI-generated code before deploying to production.

## Installation

No installation required. Run directly with `npx`:

```bash
npx agentic-team-templates [template-name]
```

Or install globally:

```bash
npm install -g agentic-team-templates
agentic-team-templates [template-name]
```

## How to Use

### Basic Usage

Navigate to your project directory and run:

```bash
npx agentic-team-templates web-frontend
```

This installs the template rules in your project directory.

### Install Multiple Templates

Combine templates for projects that span multiple domains:

```bash
npx agentic-team-templates web-frontend web-backend
```

### List All Available Templates

```bash
npx agentic-team-templates --list
```

### Preview Before Installing (Dry Run)

See what files will be created without making changes:

```bash
npx agentic-team-templates web-frontend --dry-run
```

### Update to Latest Rules

Re-run with `@latest` to get updated templates:

```bash
npx agentic-team-templates@latest web-frontend
```

### Install for Specific IDE

By default, templates install for all supported IDEs (Cursor, Claude, Copilot). Use `--ide` to target specific tools:

```bash
# Install only for Cursor IDE
npx agentic-team-templates web-frontend --ide=cursor

# Install only for Claude Code
npx agentic-team-templates web-frontend --ide=claude

# Install only for GitHub Copilot
npx agentic-team-templates web-frontend --ide=codex

# Install for multiple IDEs
npx agentic-team-templates web-frontend --ide=cursor --ide=codex
```

### Remove Specific Templates

Remove templates you no longer need while keeping shared rules and other templates:

```bash
# Remove a single template
npx agentic-team-templates --remove web-frontend

# Remove multiple templates
npx agentic-team-templates --remove web-frontend web-backend

# Remove from specific IDE only
npx agentic-team-templates --remove web-frontend --ide=cursor

# Skip confirmation prompt
npx agentic-team-templates --remove web-frontend --yes
```

### Reset (Remove Everything)

Remove all installed content (shared rules, templates, generated files):

```bash
# Reset all installed content
npx agentic-team-templates --reset

# Reset for specific IDE only
npx agentic-team-templates --reset --ide=cursor

# Skip confirmation prompt
npx agentic-team-templates --reset --yes

# Force remove modified files
npx agentic-team-templates --reset --force
```

### CLI Options

| Option | Description |
|--------|-------------|
| `--ide=[name]` | Target IDE: `cursor`, `claude`, or `codex` (can be used multiple times) |
| `--list`, `-l` | List all available templates |
| `--dry-run` | Preview changes without writing files |
| `--force`, `-f` | Overwrite/remove even if files were modified |
| `--remove` | Remove specified templates |
| `--reset` | Remove ALL installed content |
| `--yes`, `-y` | Skip confirmation prompt (for `--remove` and `--reset`) |
| `--help`, `-h` | Show help message |

### Shorthand Aliases

You can use short names instead of full template names for both install and remove (`--remove <alias>`). Run `npx agentic-team-templates --list` to see aliases next to each template.

**Languages**

| Alias | Template |
|-------|----------|
| `js`, `ts`, `javascript`, `typescript` | `javascript-expert` |
| `go`, `golang` | `golang-expert` |
| `py`, `python` | `python-expert` |
| `rs`, `rust` | `rust-expert` |
| `ruby`, `rb` | `ruby-expert` |
| `swift` | `swift-expert` |
| `kotlin`, `kt` | `kotlin-expert` |
| `java` | `java-expert` |
| `cpp` | `cpp-expert` |
| `csharp`, `cs` | `csharp-expert` |

**Engineering**

| Alias | Template |
|-------|----------|
| `frontend`, `fe` | `web-frontend` |
| `backend`, `api` | `web-backend` |
| `devops`, `sre` | `devops-sre` |
| `cli` | `cli-tools` |
| `data`, `dataeng` | `data-engineering` |
| `ml`, `ai` | `ml-ai` |
| `qa` | `qa-engineering` |
| `test` | `testing` |
| `chain`, `web3` | `blockchain` |
| `platform`, `platform-eng` | `platform-engineering` |
| `unity` | `unity-dev-expert` |

**Professional**

| Alias | Template |
|-------|----------|
| `docs` | `documentation` |
| `grants` | `grant-writer` |
| `exec`, `ea` | `executive-assistant` |
| `knowledge` | `knowledge-synthesis` |
| `wellness` | `wellness-orchestrator` |
| `life`, `logistics` | `life-logistics` |
| `research`, `researcher` | `research-assistant` |

**Business**

| Alias | Template |
|-------|----------|
| `product` | `product-manager` |
| `project` | `project-manager` |
| `compliance`, `regulatory` | `regulatory-sentinel` |
| `allocator`, `resources` | `resource-allocator` |
| `market-intel` | `market-intelligence` |
| `supplychain` | `supply-chain` |
| `harmonizer` | `supply-chain-harmonizer` |
| `negotiator` | `strategic-negotiator` |
| `predictive` | `predictive-maintenance` |
| `marketing` | `marketing-expert` |

**Creative**

| Alias | Template |
|-------|----------|
| `ux`, `uxd`, `design`, `designer` | `ux-designer` |
| `brand` | `brand-guardian` |
| `social-media` | `social-media-expert` |
| `content-creation` | `content-creation-expert` |
| `narrative`, `story` | `narrative-architect` |
| `trends` | `trend-forecaster` |

**Education & agents**

| Alias | Template |
|-------|----------|
| `teach`, `teacher` | `educator` |
| `agent`, `utility` | `utility-agent` |

## Available Templates (42)

### Engineering (13)

| Template | Description |
|----------|-------------|
| `blockchain` | Smart contracts, DeFi protocols, and Web3 applications (Solidity, Foundry, Viem) |
| `cli-tools` | Command-line applications and developer tools (Cobra, Commander, Click) |
| `data-engineering` | Data platforms and pipelines (ETL, data modeling, data quality) |
| `devops-sre` | DevOps and SRE practices (incident management, observability, SLOs, chaos engineering) |
| `fullstack` | Full-stack web applications (Next.js, Nuxt, SvelteKit, Remix) |
| `ml-ai` | Machine learning and AI systems (model development, deployment, monitoring) |
| `mobile` | Mobile applications (React Native, Flutter, native iOS/Android) |
| `platform-engineering` | Internal developer platforms, infrastructure automation, reliability engineering |
| `qa-engineering` | Quality assurance programs for confident, rapid software delivery |
| `testing` | Comprehensive testing practices (TDD, test design, CI/CD integration, performance testing) |
| `unity-dev-expert` | Unity game development (C#, ECS/DOTS, physics, UI systems, multiplayer, performance) |
| `web-backend` | Backend APIs and services (REST, GraphQL, microservices) |
| `web-frontend` | Frontend web applications (SPAs, SSR, static sites, PWAs) |

### Languages (10)

| Template | Description |
|----------|-------------|
| `cpp-expert` | Principal-level C++ engineering (modern C++, RAII, concurrency, templates, performance) |
| `csharp-expert` | Principal-level C# engineering (async, DI, EF Core, ASP.NET Core, testing) |
| `golang-expert` | Principal-level Go engineering (concurrency, stdlib, production patterns, testing) |
| `java-expert` | Principal-level Java engineering (JVM, Spring Boot, concurrency, JPA, testing) |
| `javascript-expert` | Principal-level JavaScript & TypeScript engineering (Node.js, React, type system, testing) |
| `kotlin-expert` | Principal-level Kotlin engineering (coroutines, multiplatform, Ktor, Spring Boot, testing) |
| `python-expert` | Principal-level Python engineering (type system, async, testing, FastAPI, Django) |
| `ruby-expert` | Principal-level Ruby engineering (idioms, concurrency, Rails, performance, testing) |
| `rust-expert` | Principal-level Rust engineering (ownership, concurrency, unsafe, traits, async) |
| `swift-expert` | Principal-level Swift engineering (concurrency, SwiftUI, protocols, testing, Apple platforms) |

### Business (8)

| Template | Description |
|----------|-------------|
| `market-intelligence` | Data source aggregation, sentiment analysis, trend detection, and risk signal monitoring |
| `marketing-expert` | Brand positioning, campaign planning, market analysis, analytics, and growth frameworks |
| `predictive-maintenance` | Industrial sensor monitoring, failure prediction, maintenance scheduling, and asset lifecycle |
| `product-manager` | Customer-centric discovery, prioritization, and cross-functional execution |
| `regulatory-sentinel` | Compliance tracking, impact assessment, monitoring, and risk classification |
| `resource-allocator` | Demand prediction, scheduling optimization, crisis management, and capacity modeling |
| `strategic-negotiator` | Game theory, deal structuring, scenario modeling, and contract analysis |
| `supply-chain-harmonizer` | Disruption response, rerouting, inventory rebalancing, and scenario simulation |

### Creative (6)

| Template | Description |
|----------|-------------|
| `brand-guardian` | Brand voice enforcement, visual identity compliance, and content review workflows |
| `content-creation-expert` | Content strategy, copywriting, SEO content, multimedia production, and editorial ops |
| `narrative-architect` | World-building, continuity tracking, timeline management, and story bible creation |
| `social-media-expert` | Platform strategy, content planning, audience growth, community management, and analytics |
| `trend-forecaster` | Signal detection, cultural analysis, trend lifecycle modeling, and forecasting methods |
| `ux-designer` | User research, interaction design, design systems, accessibility, and emotional design |

### Professional (4)

| Template | Description |
|----------|-------------|
| `documentation` | Technical documentation standards (READMEs, API docs, ADRs, code comments) |
| `knowledge-synthesis` | Document ingestion, knowledge graphs, search/retrieval, summarization, and research workflows |
| `life-logistics` | Scheduling optimization, bill negotiation, insurance comparison, and vendor research |
| `wellness-orchestrator` | Unified wellness planning across fitness, nutrition, sleep, and mental wellness |

### Education (1)

| Template | Description |
|----------|-------------|
| `educator` | Evidence-based teaching, learning retention, gamification, and assessment design |

### Agents (1)

| Template | Description |
|----------|-------------|
| `utility-agent` | AI agent utilities with context management and hallucination prevention |

## What Gets Installed

### Shared Rules (Always Included)

Every template installation includes these foundational rules:

| File | Description |
|------|-------------|
| `core-principles.mdc` | Honesty, simplicity, testing requirements |
| `code-quality.mdc` | SOLID, DRY, clean code patterns |
| `security-fundamentals.mdc` | Zero trust, input validation, secrets management |
| `git-workflow.mdc` | Commits, branches, PRs, safety protocols |
| `communication.mdc` | Direct, objective, professional communication |

### Template-Specific Rules

Each template adds domain-specific rules. For example, `web-frontend` includes:

- `accessibility.mdc` - WCAG compliance, ARIA patterns
- `component-patterns.mdc` - React/Vue/Svelte best practices
- `performance.mdc` - Core Web Vitals, optimization
- `state-management.mdc` - State patterns, data flow
- `styling.mdc` - CSS architecture, design systems
- `testing.mdc` - Unit, integration, E2E testing

### Rule file format (.mdc)

All rule files use the **`.mdc`** extension (Cursor MDC format). Templates were migrated from `.md` to `.mdc` for better IDE integration and consistent behavior.

- **Front matter** — Every `.mdc` file has YAML front matter at the top with:
  - `description`: Short summary of the rule (used by the IDE).
  - `alwaysApply`: `true` for shared rules (always loaded); `false` for template-specific rules (loaded when relevant).
- **Short and focused** — Each file covers one topic, with concise sections and clear headings. This keeps rules scannable and gives the AI clear, focused context.

## File Structure

After running `npx agentic-team-templates web-frontend`:

```text
your-project/
├── CLAUDE.md                              # Development guide (Claude Code, Cursor)
├── .cursor/
│   └── rules/                             # Rule files (Cursor IDE)
│       ├── core-principles.mdc                 # Shared
│       ├── code-quality.mdc                    # Shared
│       ├── security-fundamentals.mdc           # Shared
│       ├── git-workflow.mdc                    # Shared
│       ├── communication.mdc                   # Shared
│       ├── web-frontend-overview.mdc           # Template-specific
│       ├── web-frontend-accessibility.mdc      # Template-specific
│       ├── web-frontend-component-patterns.mdc # Template-specific
│       ├── web-frontend-performance.mdc        # Template-specific
│       ├── web-frontend-state-management.mdc   # Template-specific
│       ├── web-frontend-styling.mdc            # Template-specific
│       └── web-frontend-testing.mdc            # Template-specific
└── .github/
    └── copilot-instructions.md            # Instructions (GitHub Copilot)
```

## Customization

### Add Project-Specific Rules

Create new `.mdc` files in `.cursor/rules/`. Include front matter and keep each file focused on one topic:

```markdown
---
description: My project API conventions
alwaysApply: false
---

# My Project Conventions

## API Endpoints

All API calls go through `/lib/api.ts`...
```

### Modify Existing Rules

Edit any file in `.cursor/rules/` or `CLAUDE.md` directly. Changes take effect immediately.

### Combine with Existing Rules

Templates merge with your existing `.cursor/rules/` directory. Rule files are installed as `.mdc` with YAML front matter (`description`, `alwaysApply`) and short, focused content (one topic per file). Existing files are preserved unless they have the same name.

### Migrating from `.cursorrules/`

If your project uses the older `.cursorrules/` directory, the installer will detect it and offer to clean it up automatically. Cursor now uses `.cursor/rules/` for rule files. Support for `.cursorrules/` will be removed in a future version.

## Examples

### New React Project

```bash
mkdir my-react-app && cd my-react-app
npm create vite@latest . -- --template react-ts
npx agentic-team-templates web-frontend
# or use shorthand:
npx agentic-team-templates frontend
```

### Full-Stack Next.js Project

```bash
npx create-next-app@latest my-app
cd my-app
npx agentic-team-templates fullstack
```

### Microservices Backend

```bash
cd my-api-service
npx agentic-team-templates web-backend devops-sre
# or use shorthands:
npx agentic-team-templates backend devops
```

### ML/AI Project

```bash
cd my-ml-project
npx agentic-team-templates ml-ai data-engineering
# or use shorthands:
npx agentic-team-templates ml data
```

### Unity Game Project

```bash
cd my-unity-game
npx agentic-team-templates unity
```

### Marketing Team

```bash
cd marketing-workspace
npx agentic-team-templates marketing social-media content-creation
```

### Docs and research

```bash
npx agentic-team-templates docs research
```

## Requirements

- **Node.js**: 18.0.0 or higher
- **Supported IDEs/Tools**:
  - Cursor IDE (any version with `.cursor/rules/` support)
  - Claude Code (reads `CLAUDE.md` automatically)
  - GitHub Copilot (reads `.github/copilot-instructions.md`)

## Troubleshooting

### "Unknown option" or Missing Features

If you're getting errors for options that should exist (like `--reset`), you may have a cached old version:

```bash
# Force latest version (recommended)
npx agentic-team-templates@latest [command]

# Clear npx cache
npx clear-npx-cache

# Or manually clear npm cache
npm cache clean --force
```

### Verify Your Version

Check which version you're running:

```bash
npx agentic-team-templates --version
```

Output:

```text
agentic-team-templates v0.7.0
Changelog: https://github.com/djm204/agentic-team-templates/releases/tag/agentic-team-templates-v0.7.0
```

Or use `--help` which also checks for updates:

```bash
npx agentic-team-templates@latest --help
```

The CLI will notify you if a newer version is available.

### Update Global Installation

If installed globally:

```bash
npm update -g agentic-team-templates
```

## How to Contribute

We welcome contributions! Here's how to add new templates or improve existing ones.

### Adding a New Template

1. **Create the template in the appropriate category directory:**

```text
templates/<category>/your-template/
└── .cursor/
    └── rules/
        ├── overview.mdc          # Scope and core principles (required)
        ├── topic-one.mdc         # Domain-specific rules
        ├── topic-two.mdc
        └── ...
```

Categories: `engineering`, `languages`, `creative`, `business`, `professional`, `education`, `agents`

2. **Follow the existing patterns:**
   - Look at `templates/engineering/web-frontend/` or `templates/languages/python-expert/` for reference
   - Use `.mdc` for all rule files, with YAML front matter (`description`, `alwaysApply`)
   - Keep each file short and focused on a single topic
   - Include code examples, not just guidelines
   - Add "Common Pitfalls" and "Definition of Done" sections where appropriate

3. **Required files:**
   - `.cursor/rules/overview.mdc` - Scope, core principles, and project structure (with front matter)
   - Add a `category` field to the template entry in `src/index.js`

### Template Guidelines

**CLAUDE.md should include:**

- Overview and scope
- Key principles (3-5 bullet points)
- Technology stack table
- Code patterns with examples
- Definition of done checklist
- Common pitfalls with good/bad examples

**Rule files (.mdc) should:**

- Use the `.mdc` extension with YAML front matter: `description` (short summary) and `alwaysApply` (`true` for shared, `false` for template-specific)
- Focus on one topic (e.g., testing, security, performance)—short and focused
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

- `core-principles.mdc` - Universal development principles
- `code-quality.mdc` - Clean code patterns
- `security-fundamentals.mdc` - Security basics
- `git-workflow.mdc` - Git conventions
- `communication.mdc` - AI communication style

Changes to shared rules affect all templates, so be thoughtful with modifications.

### Code Style

- Use `.mdc` for all rule files (with YAML front matter); use Markdown for README and CLAUDE.md
- Code examples should be copy-pasteable
- Prefer concrete examples over abstract guidelines
- Keep formatting consistent with existing templates; keep rule files short and focused

## License

MIT © [David Mendez](https://github.com/djm204)
