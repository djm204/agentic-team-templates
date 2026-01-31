# Command-Line Arguments

Patterns for parsing, validating, and documenting CLI arguments.

## Argument Types

### Positional Arguments

Arguments identified by position, not name:

```bash
# cp SOURCE DEST
cp file.txt backup/

# git checkout BRANCH
git checkout main
```

```go
// Go with Cobra
var copyCmd = &cobra.Command{
    Use:   "copy <source> <dest>",
    Short: "Copy a file",
    Args:  cobra.ExactArgs(2),
    RunE: func(cmd *cobra.Command, args []string) error {
        source := args[0]
        dest := args[1]
        return copyFile(source, dest)
    },
}
```

```typescript
// TypeScript with Commander
program
  .command('copy <source> <dest>')
  .description('Copy a file')
  .action((source: string, dest: string) => {
    copyFile(source, dest);
  });
```

### Optional Positional Arguments

```go
// Go: Optional with default
var buildCmd = &cobra.Command{
    Use:   "build [path]",
    Short: "Build the project",
    Args:  cobra.MaximumNArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        path := "."  // Default
        if len(args) > 0 {
            path = args[0]
        }
        return runBuild(path)
    },
}
```

```typescript
// TypeScript: Optional argument
program
  .command('build [path]')
  .description('Build the project')
  .action((path: string = '.') => {
    runBuild(path);
  });
```

### Variadic Arguments

Accept multiple values:

```bash
# rm file1.txt file2.txt file3.txt
rm *.txt
```

```go
// Go: One or more arguments
var deleteCmd = &cobra.Command{
    Use:   "delete <file>...",
    Short: "Delete files",
    Args:  cobra.MinimumNArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        for _, file := range args {
            if err := deleteFile(file); err != nil {
                return err
            }
        }
        return nil
    },
}
```

## Flags and Options

### Boolean Flags

```go
// Go
cmd.Flags().BoolP("verbose", "v", false, "enable verbose output")
cmd.Flags().Bool("dry-run", false, "show what would be done")
cmd.Flags().Bool("force", false, "skip confirmation prompts")
```

```typescript
// TypeScript
program
  .option('-v, --verbose', 'enable verbose output')
  .option('--dry-run', 'show what would be done')
  .option('-f, --force', 'skip confirmation prompts');
```

### Value Flags

```go
// Go
cmd.Flags().StringP("output", "o", "dist", "output directory")
cmd.Flags().IntP("port", "p", 8080, "server port")
cmd.Flags().StringSlice("tags", []string{}, "tags to apply")
cmd.Flags().StringToString("env", map[string]string{}, "environment variables")
```

```typescript
// TypeScript
program
  .option('-o, --output <dir>', 'output directory', 'dist')
  .option('-p, --port <number>', 'server port', '8080')
  .option('--tags <tags...>', 'tags to apply')
  .option('--env <key=value...>', 'environment variables');
```

### Required Flags

```go
// Go
cmd.Flags().String("api-key", "", "API key (required)")
cmd.MarkFlagRequired("api-key")
```

```typescript
// TypeScript with Commander
program
  .requiredOption('--api-key <key>', 'API key');
```

### Mutually Exclusive Flags

```go
// Go with Cobra
cmd.Flags().String("file", "", "read from file")
cmd.Flags().Bool("stdin", false, "read from stdin")
cmd.MarkFlagsMutuallyExclusive("file", "stdin")
```

### Flag Groups

```go
// Go: At least one required
cmd.Flags().String("name", "", "resource name")
cmd.Flags().String("id", "", "resource ID")
cmd.MarkFlagsOneRequired("name", "id")

// Go: All or none
cmd.Flags().String("username", "", "username")
cmd.Flags().String("password", "", "password")
cmd.MarkFlagsRequiredTogether("username", "password")
```

## Argument Validation

### Built-in Validators

```go
// Go Cobra validators
cobra.NoArgs           // No positional arguments allowed
cobra.ExactArgs(n)     // Exactly n arguments
cobra.MinimumNArgs(n)  // At least n arguments
cobra.MaximumNArgs(n)  // At most n arguments
cobra.RangeArgs(min, max)  // Between min and max
cobra.OnlyValidArgs    // Only args from ValidArgs list
```

### Custom Validation

```go
// Go: Custom argument validator
var runCmd = &cobra.Command{
    Use:   "run <environment>",
    Short: "Run in specified environment",
    Args: func(cmd *cobra.Command, args []string) error {
        if len(args) != 1 {
            return fmt.Errorf("requires exactly one argument: environment")
        }

        validEnvs := []string{"dev", "staging", "prod"}
        env := args[0]

        for _, valid := range validEnvs {
            if env == valid {
                return nil
            }
        }

        return fmt.Errorf("invalid environment %q, must be one of: %v", env, validEnvs)
    },
    RunE: func(cmd *cobra.Command, args []string) error {
        return runInEnvironment(args[0])
    },
}
```

```typescript
// TypeScript: Custom validation
program
  .command('run <environment>')
  .description('Run in specified environment')
  .action((environment: string) => {
    const validEnvs = ['dev', 'staging', 'prod'];
    if (!validEnvs.includes(environment)) {
      console.error(`Invalid environment "${environment}"`);
      console.error(`Must be one of: ${validEnvs.join(', ')}`);
      process.exit(1);
    }
    runInEnvironment(environment);
  });
```

### Flag Value Validation

```go
// Go: Validate flag values
func validatePort(cmd *cobra.Command, args []string) error {
    port, _ := cmd.Flags().GetInt("port")
    if port < 1 || port > 65535 {
        return fmt.Errorf("port must be between 1 and 65535, got %d", port)
    }
    return nil
}

cmd.PreRunE = validatePort
```

## Help Text

### Command Documentation

```go
var buildCmd = &cobra.Command{
    Use:   "build [flags] [path]",
    Short: "Build the project",                           // One line
    Long: `Build compiles the project and outputs artifacts.

The build command processes all source files in the specified
directory (or current directory if not specified) and outputs
compiled artifacts to the output directory.`,
    Example: `  # Build current directory
  mytool build

  # Build specific directory with output
  mytool build ./src -o ./dist

  # Build with minification
  mytool build --minify`,
}
```

### Flag Documentation

```go
// Include default values and allowed values
cmd.Flags().StringP("format", "f", "json", "output format (json, yaml, table)")
cmd.Flags().IntP("timeout", "t", 30, "timeout in seconds (1-300)")
```

### Auto-Generated Help

```
$ mytool build --help

Build compiles the project and outputs artifacts.

The build command processes all source files in the specified
directory (or current directory if not specified) and outputs
compiled artifacts to the output directory.

Usage:
  mytool build [flags] [path]

Examples:
  # Build current directory
  mytool build

  # Build specific directory with output
  mytool build ./src -o ./dist

  # Build with minification
  mytool build --minify

Flags:
  -f, --format string   output format (json, yaml, table) (default "json")
  -h, --help            help for build
      --minify          minify output
  -o, --output string   output directory (default "dist")

Global Flags:
  -v, --verbose         verbose output
      --config string   config file path
```

## Shell Completion

### Generating Completions

```go
// Go with Cobra - built-in completion command
rootCmd.AddCommand(&cobra.Command{
    Use:   "completion [bash|zsh|fish|powershell]",
    Short: "Generate shell completion scripts",
    Args:  cobra.ExactArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        switch args[0] {
        case "bash":
            return rootCmd.GenBashCompletion(os.Stdout)
        case "zsh":
            return rootCmd.GenZshCompletion(os.Stdout)
        case "fish":
            return rootCmd.GenFishCompletion(os.Stdout, true)
        case "powershell":
            return rootCmd.GenPowerShellCompletion(os.Stdout)
        default:
            return fmt.Errorf("unknown shell: %s", args[0])
        }
    },
})
```

### Custom Completions

```go
// Go: Dynamic completions
var deployCmd = &cobra.Command{
    Use:   "deploy <environment>",
    Short: "Deploy to environment",
    ValidArgsFunction: func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
        if len(args) != 0 {
            return nil, cobra.ShellCompDirectiveNoFileComp
        }

        // Return available environments
        envs := []string{"dev", "staging", "prod"}
        return envs, cobra.ShellCompDirectiveNoFileComp
    },
}

// Flag value completion
cmd.RegisterFlagCompletionFunc("format", func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
    return []string{"json", "yaml", "table"}, cobra.ShellCompDirectiveNoFileComp
})
```

## Common Conventions

### Standard Flags

Always support these:

| Flag | Purpose |
|------|---------|
| `-h, --help` | Show help (usually automatic) |
| `-v, --verbose` | Increase output verbosity |
| `-q, --quiet` | Suppress non-essential output |
| `--version` | Show version information |
| `--config` | Specify config file path |
| `--no-color` | Disable colored output |
| `--dry-run` | Show what would happen |
| `-f, --force` | Skip confirmations |
| `-o, --output` | Output file/directory |

### Environment Variable Naming

```bash
# Convention: PREFIX_FLAG_NAME
MYTOOL_VERBOSE=true
MYTOOL_OUTPUT_DIR=/tmp/build
MYTOOL_API_KEY=secret

# In code
viper.SetEnvPrefix("MYTOOL")
viper.AutomaticEnv()
```

### Flag Naming

```bash
# Use kebab-case for multi-word flags
--output-dir    # Good
--outputDir     # Bad (hard to type)
--output_dir    # Bad (inconsistent)

# Short flags are single characters
-o              # Good
-od             # Bad (ambiguous)
```
