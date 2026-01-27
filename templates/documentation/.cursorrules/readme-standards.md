# README Standards

Guidelines for writing effective README files that orient users and provide essential information.

## Purpose

A README is the front door to your project. It should:
- Orient new users immediately
- Provide essential "getting started" information
- Link to more detailed documentation
- Be scannable in under 2 minutes

## File Naming

- **Always name it `README.md`** (case-sensitive)
- Place in the repository root
- Each major directory can have its own README

## Required Sections

### Minimum Viable README

Every README must contain:

1. **Project name and one-line description**
2. **Quick start** (how to install/run)
3. **Basic usage example**

### Complete README Template

```markdown
# Project Name

One-line description of what this project does.

## Quick Start

\`\`\`bash
npm install project-name
\`\`\`

\`\`\`typescript
import { something } from 'project-name';
something.doThing();
\`\`\`

## Features

- Feature one
- Feature two
- Feature three

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/org/project.git
cd project

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run migrations
npm run db:migrate

# Start development server
npm run dev
\`\`\`

## Usage

### Basic Example

\`\`\`typescript
// Show the most common use case first
\`\`\`

### Advanced Example

\`\`\`typescript
// Show more complex usage
\`\`\`

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |

## API Reference

See [API Documentation](./docs/api.md) for full details.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](./LICENSE)
```

## Section Guidelines

### Project Name and Description

```markdown
# PaymentGateway

A lightweight payment processing library supporting Stripe, PayPal, and Square.
```

- Use the actual project name
- One sentence describing what it does
- Avoid buzzwords and marketing speak

### Quick Start

Show the fastest path to "hello world":

```markdown
## Quick Start

\`\`\`bash
npx create-my-app my-project
cd my-project
npm start
\`\`\`
```

- Maximum 3-5 commands
- Copy-pasteable commands
- Should work on first try

### Installation

Be specific about:

```markdown
## Installation

### Prerequisites

- Node.js 18+ (check with `node --version`)
- Docker and Docker Compose
- A Stripe account with API keys

### Steps

1. Clone the repository
2. Install dependencies
3. Configure environment
4. Run setup commands
```

### Usage Examples

```markdown
## Usage

### Simple Case

Always show the simplest use case first:

\`\`\`typescript
const client = new Client();
await client.send('Hello');
\`\`\`

### With Options

Then progressively more complex:

\`\`\`typescript
const client = new Client({
  timeout: 5000,
  retries: 3,
});
\`\`\`
```

### Configuration

Use tables for configuration options:

```markdown
## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `30000` | Request timeout in ms |
| `retries` | `number` | `0` | Number of retry attempts |
| `debug` | `boolean` | `false` | Enable debug logging |
```

## Directory READMEs

For READMEs inside project directories:

```markdown
# /src/components/

React components for the application UI.

## Structure

- `ui/` - Primitive components (Button, Input, Card)
- `features/` - Feature-specific components
- `layouts/` - Page layout components

## Conventions

- One component per file
- Use TypeScript for all components
- Include tests in `__tests__/` subdirectory

## Key Files

- `index.ts` - Public exports
- `theme.ts` - Design tokens
```

## Anti-Patterns

### Stale Information

```markdown
<!-- Bad: Will become outdated -->
## Supported Node Versions
- Node 14
- Node 16

<!-- Good: Link to source of truth -->
## Requirements
See `engines` field in [package.json](./package.json)
```

### Wall of Text

```markdown
<!-- Bad: No one will read this -->
This project was started in 2019 when we realized that the existing
solutions for payment processing were inadequate for our needs. After
extensive research and development spanning several months...

<!-- Good: Get to the point -->
Payment processing library supporting Stripe, PayPal, and Square.
```

### Missing Examples

```markdown
<!-- Bad: No examples -->
## Installation
Install with npm.

<!-- Good: Copy-pasteable -->
## Installation
\`\`\`bash
npm install payment-gateway
\`\`\`
```

### Broken Links

```markdown
<!-- Bad: Links rot -->
See our [wiki](http://internal-wiki.company.com/project) for details.

<!-- Good: Link to files in repo -->
See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for details.
```

## Badges (Optional)

If using badges, keep them meaningful:

```markdown
[![CI](https://github.com/org/repo/actions/workflows/ci.yml/badge.svg)](...)
[![npm version](https://badge.fury.io/js/package.svg)](...)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](...)
```

- CI status - Shows project health
- Version - Shows current release
- License - Shows usage rights
- Avoid decorative/vanity badges

## Maintenance

- Update README when behavior changes
- Test all code examples periodically
- Verify links work
- Remove outdated sections
