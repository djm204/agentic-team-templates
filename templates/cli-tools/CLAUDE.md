# CLI Tools Development Guide

Staff-level guidelines for building professional command-line interfaces that are intuitive, robust, and maintainable.

---

## Overview

This guide applies to:

- Command-line applications and utilities
- Developer tools and build systems
- System administration scripts
- Automation and DevOps tooling
- Interactive terminal applications

### Key Principles

1. **Human-First Design** - Intuitive for humans, scriptable for machines
2. **Composability** - Do one thing well, compose with others
3. **Predictability** - Consistent behavior, no surprises
4. **Progressive Disclosure** - Simple things simple, complex things possible

### Technology Stack

| Language | Framework | Config | When to Use |
|----------|-----------|--------|-------------|
| Go | Cobra + Viper | Viper | Cross-platform binaries, performance |
| Node.js | Commander.js | cosmiconfig | npm ecosystem, rapid development |
| Python | Typer/Click | pydantic | Data processing, scripting |
| Rust | Clap | config-rs | Performance-critical, systems tools |

---

## Command Structure

### Root Command Pattern

```go
// Go with Cobra
var rootCmd = &cobra.Command{
    Use:   "mytool",
    Short: "A brief description",
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return initConfig()
    },
}

func init() {
    rootCmd.PersistentFlags().BoolP("verbose", "v", false, "verbose output")
    rootCmd.PersistentFlags().String("config", "", "config file path")
}
```

### Subcommands

```bash
mytool init          # Initialize project
mytool build         # Build project
mytool deploy        # Deploy to environment
mytool config get    # Nested subcommand
```

### Configuration Precedence

1. Command-line flags (highest)
2. Environment variables
3. Local config file
4. Global config file
5. Default values (lowest)

---

## Arguments and Flags

### Standard Flags (Always Support)

| Flag | Purpose |
|------|---------|
| `-h, --help` | Show help |
| `-v, --verbose` | Verbose output |
| `-q, --quiet` | Suppress output |
| `--version` | Show version |
| `--config` | Config file path |
| `--no-color` | Disable colors |
| `--dry-run` | Preview changes |
| `-f, --force` | Skip confirmations |

### Argument Validation

```go
// Go: Custom validation
var runCmd = &cobra.Command{
    Use:  "run <environment>",
    Args: func(cmd *cobra.Command, args []string) error {
        if len(args) != 1 {
            return fmt.Errorf("requires exactly one argument")
        }
        validEnvs := []string{"dev", "staging", "prod"}
        for _, env := range validEnvs {
            if args[0] == env {
                return nil
            }
        }
        return fmt.Errorf("invalid environment %q", args[0])
    },
}
```

---

## User Experience

### Output Streams

- **stdout**: Data output (for piping)
- **stderr**: Progress, status, errors (for humans)

```go
// Correct stream usage
fmt.Fprintln(os.Stderr, "Building...")  // Progress
fmt.Println(result.Path)                 // Data output
```

### Colors

| Color | Use For |
|-------|---------|
| Green | Success |
| Red | Errors |
| Yellow | Warnings |
| Blue | Information |
| Dim | Secondary info |

Always respect `NO_COLOR` environment variable and `--no-color` flag.

### Progress Indicators

```go
// Spinner for unknown duration
spinner.Start()
defer spinner.Stop()

// Progress bar for known progress
bar := progressbar.New(total)
for _, item := range items {
    process(item)
    bar.Add(1)
}
```

### Interactive Prompts

```go
// Confirmation with non-interactive fallback
func confirm(message string, force bool) bool {
    if force || !term.IsTerminal(int(os.Stdin.Fd())) {
        return true
    }
    // Show interactive prompt
}
```

---

## Error Handling

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 130 | Interrupted (Ctrl+C) |

### Error Message Structure

```
Error: cannot read config file

  File: /home/user/.config/mytool/config.yaml
  Cause: permission denied

Try:
  • Check file permissions: ls -la ~/.config/mytool/
  • Fix permissions: chmod 600 ~/.config/mytool/config.yaml
```

### Error Message Guidelines

1. **What happened** - Clear description
2. **Context** - Relevant details (paths, values)
3. **Why** - Root cause if known
4. **How to fix** - Actionable suggestions

---

## Testing

### Test Levels

| Level | What to Test | How |
|-------|--------------|-----|
| Unit | Business logic | Mock dependencies |
| Integration | Full commands | Capture stdout/stderr |
| E2E | User workflows | Run actual binary |

### Mocking I/O

```go
// Capture output
stdout := new(bytes.Buffer)
stderr := new(bytes.Buffer)
cmd.SetOut(stdout)
cmd.SetErr(stderr)

// Mock stdin
r, w, _ := os.Pipe()
go func() {
    w.WriteString("y\n")
    w.Close()
}()
os.Stdin = r
```

### Test Exit Codes

```go
func TestExitCodes(t *testing.T) {
    cmd := exec.Command("./mytool", "invalid")
    err := cmd.Run()
    exitErr := err.(*exec.ExitError)
    assert.Equal(t, 2, exitErr.ExitCode())
}
```

---

## Distribution

### Version Information

```bash
$ mytool version
mytool 1.0.0
  commit: abc123
  built:  2025-01-27
  go:     go1.22
```

### Installation Methods

```bash
# Homebrew
brew install myorg/tap/mytool

# npm
npm install -g mytool

# Go
go install github.com/myorg/mytool@latest

# Direct download
curl -fsSL https://example.com/install.sh | bash
```

### Shell Completions

```bash
# Generate completions
mytool completion bash > /etc/bash_completion.d/mytool
mytool completion zsh > "${fpath[1]}/_mytool"
mytool completion fish > ~/.config/fish/completions/mytool.fish
```

---

## Definition of Done

A CLI tool is ready for release when:

- [ ] All commands have help text and examples
- [ ] Error messages suggest corrective actions
- [ ] Exit codes follow conventions
- [ ] Works in non-interactive environments (CI/CD)
- [ ] Supports stdin/stdout piping
- [ ] Configuration precedence documented
- [ ] Shell completions available
- [ ] Version flag shows useful info
- [ ] Tests cover happy path and errors
- [ ] Installation instructions documented

---

## Common Pitfalls

### 1. Ignoring Non-TTY Environments

```go
// Bad: Always show spinner
spinner.Start()

// Good: Detect TTY
if term.IsTerminal(int(os.Stderr.Fd())) {
    spinner.Start()
} else {
    fmt.Fprintln(os.Stderr, "Processing...")
}
```

### 2. Hardcoded Paths

```go
// Bad
configPath := "/etc/mytool/config.yaml"

// Good
configPath := filepath.Join(xdg.ConfigHome, "mytool", "config.yaml")
```

### 3. Silent Failures

```go
// Bad
result, _ := riskyOperation()

// Good
result, err := riskyOperation()
if err != nil {
    return fmt.Errorf("operation failed: %w", err)
}
```

### 4. Missing Non-Interactive Support

```go
// Bad: Always prompts
answer := prompt("Continue?")

// Good: Respect --force flag
if !force {
    answer := prompt("Continue?")
}
```

---

## Resources

- [Command Line Interface Guidelines](https://clig.dev/)
- [Better CLI](https://better-cli.org/)
- [Cobra Documentation](https://cobra.dev/)
- [Commander.js](https://github.com/tj/commander.js)
- [Click Documentation](https://click.palletsprojects.com/)
- [Clap Documentation](https://docs.rs/clap/)
