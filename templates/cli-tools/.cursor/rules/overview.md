# CLI Tools Development Overview

Staff-level guidelines for building professional command-line interfaces that are intuitive, robust, and maintainable.

## Scope

This template applies to:

- Command-line applications and utilities
- Developer tools and build systems
- System administration scripts
- Automation and DevOps tooling
- Interactive terminal applications

## Core Principles

### 1. Human-First Design

CLIs should be intuitive for humans while remaining scriptable.

- Provide helpful error messages that suggest fixes
- Use sensible defaults that work for common cases
- Support both interactive and non-interactive modes
- Follow platform conventions (POSIX, Windows)

### 2. Composability

Unix philosophy: do one thing well, compose with others.

- Accept input from stdin, produce output to stdout
- Use stderr for diagnostics, stdout for data
- Support piping and redirection
- Return meaningful exit codes

### 3. Predictability

Behavior should be consistent and unsurprising.

- Same inputs → same outputs (deterministic)
- Respect environment variables and config files
- Document all side effects
- Never silently fail

### 4. Progressive Disclosure

Simple things simple, complex things possible.

- Common operations require minimal arguments
- Advanced features available but not required
- Help text at multiple levels of detail
- Examples for every command

## Project Structure

### Node.js / TypeScript

```
cli/
├── src/
│   ├── index.ts           # Entry point
│   ├── cli.ts             # Command definitions
│   ├── commands/          # Command implementations
│   │   ├── init.ts
│   │   ├── build.ts
│   │   └── deploy.ts
│   ├── lib/               # Business logic
│   ├── utils/             # Utilities (output, prompts)
│   └── types.ts           # Type definitions
├── bin/
│   └── cli.js             # Executable entry
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json
└── tsconfig.json
```

### Go

```
cli/
├── cmd/
│   ├── root.go            # Root command
│   ├── init.go            # Subcommands
│   ├── build.go
│   └── deploy.go
├── internal/
│   ├── config/            # Configuration
│   ├── output/            # Output formatting
│   └── core/              # Business logic
├── pkg/                   # Public packages
├── main.go
├── go.mod
└── Makefile
```

### Python

```
cli/
├── src/
│   └── mycli/
│       ├── __init__.py
│       ├── __main__.py    # Entry point
│       ├── cli.py         # Click/Typer definitions
│       ├── commands/
│       └── utils/
├── tests/
├── pyproject.toml
└── setup.py
```

## Technology Recommendations

| Language | Framework | Config | Why |
|----------|-----------|--------|-----|
| Node.js | Commander.js | cosmiconfig | Zero deps, TypeScript support |
| Go | Cobra + Viper | Viper | Industry standard, powerful |
| Python | Typer or Click | pydantic | Type hints, auto-docs |
| Rust | Clap | config-rs | Derive macros, excellent help |

## Definition of Done

A CLI tool is ready for release when:

- [ ] All commands have help text and examples
- [ ] Error messages suggest corrective actions
- [ ] Exit codes follow conventions (0=success, 1=error)
- [ ] Works in non-interactive environments (CI/CD)
- [ ] Supports both stdin/stdout piping and file arguments
- [ ] Configuration precedence documented (flags > env > file)
- [ ] Shell completions available (bash, zsh, fish)
- [ ] Version flag shows useful info (`--version`)
- [ ] Tests cover happy path and error cases
- [ ] Documentation includes installation and quickstart
