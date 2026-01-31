# Error Handling

Patterns for handling errors gracefully and providing helpful feedback to users.

## Exit Codes

### Standard Conventions

| Code | Meaning | When to Use |
|------|---------|-------------|
| 0 | Success | Command completed successfully |
| 1 | General error | Catch-all for failures |
| 2 | Misuse | Invalid arguments, bad syntax |
| 64-78 | BSD sysexits | Specific error categories |
| 126 | Cannot execute | Permission denied |
| 127 | Not found | Command/file not found |
| 128+N | Signal N | Terminated by signal (e.g., 130 = SIGINT) |

### Implementing Exit Codes

```go
// Go: Define exit codes
const (
    ExitSuccess         = 0
    ExitGeneralError    = 1
    ExitUsageError      = 2
    ExitConfigError     = 64
    ExitInputError      = 65
    ExitNoPermission    = 77
    ExitInterrupted     = 130
)

func main() {
    if err := run(); err != nil {
        var exitCode int

        switch {
        case errors.Is(err, ErrInvalidArgs):
            exitCode = ExitUsageError
        case errors.Is(err, ErrConfigNotFound):
            exitCode = ExitConfigError
        case errors.Is(err, context.Canceled):
            exitCode = ExitInterrupted
        default:
            exitCode = ExitGeneralError
        }

        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(exitCode)
    }
}
```

```typescript
// TypeScript: Exit codes
const EXIT_SUCCESS = 0;
const EXIT_ERROR = 1;
const EXIT_USAGE = 2;
const EXIT_CONFIG = 64;

function main(): void {
  try {
    run();
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(`Usage error: ${error.message}`);
      process.exit(EXIT_USAGE);
    }

    if (error instanceof ConfigError) {
      console.error(`Config error: ${error.message}`);
      process.exit(EXIT_CONFIG);
    }

    console.error(`Error: ${error.message}`);
    process.exit(EXIT_ERROR);
  }
}
```

## Error Messages

### Anatomy of a Good Error Message

```
Error: cannot read config file

  File: /home/user/.config/mytool/config.yaml
  Cause: permission denied

Try:
  • Check file permissions: ls -la ~/.config/mytool/
  • Create with correct permissions: chmod 600 ~/.config/mytool/config.yaml
```

### Error Message Guidelines

1. **What happened** - Clear description of the failure
2. **Context** - Relevant details (file path, input value)
3. **Why** - Root cause if known
4. **How to fix** - Actionable suggestions

```go
// Go: Structured error with suggestions
type CLIError struct {
    Message     string
    Details     string
    Suggestions []string
    Cause       error
}

func (e *CLIError) Error() string {
    return e.Message
}

func (e *CLIError) Format() string {
    var b strings.Builder

    b.WriteString(color.RedString("Error: "))
    b.WriteString(e.Message)
    b.WriteString("\n")

    if e.Details != "" {
        b.WriteString("\n")
        b.WriteString(color.DimString(e.Details))
        b.WriteString("\n")
    }

    if e.Cause != nil {
        b.WriteString("\n")
        b.WriteString(color.DimString(fmt.Sprintf("Cause: %v", e.Cause)))
        b.WriteString("\n")
    }

    if len(e.Suggestions) > 0 {
        b.WriteString("\n")
        b.WriteString(color.YellowString("Try:\n"))
        for _, s := range e.Suggestions {
            b.WriteString(fmt.Sprintf("  • %s\n", s))
        }
    }

    return b.String()
}

// Usage
func loadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        if os.IsNotExist(err) {
            return nil, &CLIError{
                Message: "config file not found",
                Details: fmt.Sprintf("Path: %s", path),
                Suggestions: []string{
                    fmt.Sprintf("Create a config file: %s init", os.Args[0]),
                    "Copy from example: cp config.example.yaml " + path,
                },
            }
        }
        if os.IsPermission(err) {
            return nil, &CLIError{
                Message: "cannot read config file",
                Details: fmt.Sprintf("Path: %s", path),
                Cause:   err,
                Suggestions: []string{
                    "Check file permissions: ls -la " + path,
                    "Fix permissions: chmod 600 " + path,
                },
            }
        }
        return nil, &CLIError{
            Message: "failed to read config file",
            Cause:   err,
        }
    }
    // ...
}
```

### Common Error Patterns

```go
// File not found
&CLIError{
    Message: fmt.Sprintf("file not found: %s", path),
    Suggestions: []string{
        "Check if the file exists",
        "Verify the path is correct",
        fmt.Sprintf("Create the file: touch %s", path),
    },
}

// Invalid argument
&CLIError{
    Message: fmt.Sprintf("invalid value for --port: %q", value),
    Details: "Port must be a number between 1 and 65535",
    Suggestions: []string{
        "Use a valid port number: --port 8080",
        "Check available ports: netstat -tlnp",
    },
}

// Network error
&CLIError{
    Message: "failed to connect to API",
    Details: fmt.Sprintf("URL: %s", url),
    Cause:   err,
    Suggestions: []string{
        "Check your internet connection",
        "Verify the API URL is correct",
        "Try again later if the service is down",
    },
}

// Authentication error
&CLIError{
    Message: "authentication failed",
    Suggestions: []string{
        fmt.Sprintf("Login first: %s login", os.Args[0]),
        "Check if your token has expired",
        "Verify your credentials are correct",
    },
}
```

## Error Wrapping

### Adding Context

```go
// Go: Wrap errors with context
func deployToEnvironment(env string) error {
    config, err := loadConfig(env)
    if err != nil {
        return fmt.Errorf("deploy to %s: %w", env, err)
    }

    if err := validateConfig(config); err != nil {
        return fmt.Errorf("deploy to %s: invalid config: %w", env, err)
    }

    if err := runDeploy(config); err != nil {
        return fmt.Errorf("deploy to %s: %w", env, err)
    }

    return nil
}

// Result: "deploy to prod: invalid config: missing required field 'api_key'"
```

```typescript
// TypeScript: Error wrapping
class WrappedError extends Error {
  constructor(message: string, public cause: Error) {
    super(`${message}: ${cause.message}`);
    this.name = 'WrappedError';
  }
}

async function deployToEnvironment(env: string): Promise<void> {
  let config: Config;

  try {
    config = await loadConfig(env);
  } catch (error) {
    throw new WrappedError(`deploy to ${env}`, error);
  }

  try {
    await runDeploy(config);
  } catch (error) {
    throw new WrappedError(`deploy to ${env}`, error);
  }
}
```

### Unwrapping for Specific Handling

```go
// Go: Check for specific errors
func handleError(err error) {
    var cliErr *CLIError
    if errors.As(err, &cliErr) {
        fmt.Fprint(os.Stderr, cliErr.Format())
        os.Exit(1)
    }

    if errors.Is(err, context.Canceled) {
        fmt.Fprintln(os.Stderr, "Operation cancelled")
        os.Exit(130)
    }

    // Unknown error
    fmt.Fprintf(os.Stderr, "Error: %v\n", err)
    os.Exit(1)
}
```

## Graceful Degradation

### Partial Failures

```go
// Go: Continue on partial failures
func processFiles(files []string) error {
    var errs []error

    for _, file := range files {
        if err := processFile(file); err != nil {
            // Log error but continue
            fmt.Fprintf(os.Stderr, "Warning: failed to process %s: %v\n", file, err)
            errs = append(errs, err)
        }
    }

    if len(errs) > 0 {
        return fmt.Errorf("failed to process %d/%d files", len(errs), len(files))
    }
    return nil
}
```

### Fallbacks

```go
// Go: Try alternatives
func getAPIEndpoint() string {
    // Try environment variable first
    if endpoint := os.Getenv("API_ENDPOINT"); endpoint != "" {
        return endpoint
    }

    // Try config file
    if config, err := loadConfig(); err == nil && config.APIEndpoint != "" {
        return config.APIEndpoint
    }

    // Fall back to default
    return "https://api.example.com"
}
```

## Debugging Support

### Verbose Error Output

```go
// Go: Show stack trace in debug mode
func handleError(err error) {
    if debugMode {
        fmt.Fprintf(os.Stderr, "Error: %+v\n", err)  // With stack trace
    } else {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
    }
}
```

### Error Context in Verbose Mode

```go
func processFile(path string) error {
    logger.Debug("Processing file", "path", path)

    data, err := os.ReadFile(path)
    if err != nil {
        logger.Debug("Failed to read file", "path", path, "error", err)
        return fmt.Errorf("read %s: %w", path, err)
    }

    logger.Debug("Read file successfully", "path", path, "size", len(data))
    // ...
}
```

## Anti-Patterns

### Silent Failures

```go
// Bad: Error is swallowed
func maybeDoSomething() {
    result, _ := riskyOperation()  // Error ignored!
    use(result)
}

// Good: Handle or propagate
func maybeDoSomething() error {
    result, err := riskyOperation()
    if err != nil {
        return fmt.Errorf("risky operation: %w", err)
    }
    use(result)
    return nil
}
```

### Generic Error Messages

```go
// Bad: Not helpful
return errors.New("operation failed")

// Good: Specific and actionable
return &CLIError{
    Message: "failed to connect to database",
    Details: fmt.Sprintf("Host: %s, Port: %d", host, port),
    Cause:   err,
    Suggestions: []string{
        "Verify the database is running",
        "Check your connection settings",
    },
}
```

### Panic Instead of Error

```go
// Bad: Panic for recoverable errors
func loadConfig(path string) *Config {
    data, err := os.ReadFile(path)
    if err != nil {
        panic(err)  // Don't do this!
    }
    // ...
}

// Good: Return errors
func loadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("load config: %w", err)
    }
    // ...
}
```

### Error Strings as Control Flow

```go
// Bad: String matching for error handling
if err.Error() == "file not found" {
    // ...
}

// Good: Use sentinel errors or types
if errors.Is(err, os.ErrNotExist) {
    // ...
}

var ErrConfigNotFound = errors.New("config not found")
if errors.Is(err, ErrConfigNotFound) {
    // ...
}
```
