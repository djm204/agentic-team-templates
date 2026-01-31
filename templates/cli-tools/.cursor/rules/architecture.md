# CLI Architecture

Patterns for structuring maintainable, testable command-line applications.

## Command Structure

### Root Command Pattern

Every CLI has a root command that sets up global configuration:

```go
// Go with Cobra
var rootCmd = &cobra.Command{
    Use:   "mytool",
    Short: "A brief description of your tool",
    Long:  `A longer description that spans multiple lines
and provides more context about the tool.`,
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return initConfig()
    },
}

func init() {
    // Global flags (available to all subcommands)
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file")
    rootCmd.PersistentFlags().BoolP("verbose", "v", false, "verbose output")
    rootCmd.PersistentFlags().Bool("no-color", false, "disable colored output")
}
```

```typescript
// TypeScript with Commander
import { Command } from 'commander';

const program = new Command();

program
  .name('mytool')
  .description('A brief description of your tool')
  .version('1.0.0')
  .option('-v, --verbose', 'verbose output')
  .option('--no-color', 'disable colored output')
  .option('-c, --config <path>', 'config file path');

// Add subcommands
program.addCommand(initCommand);
program.addCommand(buildCommand);

program.parse();
```

### Subcommand Pattern

Organize related functionality into subcommands:

```
mytool init          # Initialize a new project
mytool build         # Build the project
mytool deploy        # Deploy to production
mytool config get    # Nested subcommand
mytool config set
```

```go
// Go subcommand
var buildCmd = &cobra.Command{
    Use:   "build [flags] [path]",
    Short: "Build the project",
    Long:  `Build compiles the project and outputs artifacts.`,
    Args:  cobra.MaximumNArgs(1),
    RunE: func(cmd *cobra.Command, args []string) error {
        path := "."
        if len(args) > 0 {
            path = args[0]
        }
        return runBuild(cmd.Context(), path)
    },
}

func init() {
    // Local flags (only for this command)
    buildCmd.Flags().StringP("output", "o", "dist", "output directory")
    buildCmd.Flags().Bool("minify", false, "minify output")

    rootCmd.AddCommand(buildCmd)
}
```

## Configuration Management

### Configuration Precedence

Always follow this hierarchy (highest to lowest priority):

1. **Command-line flags** - Explicit user intent
2. **Environment variables** - Deployment/CI configuration
3. **Local config file** - Project-specific settings
4. **Global config file** - User preferences
5. **Default values** - Sensible fallbacks

```go
// Go with Viper
func initConfig() error {
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        // Look for config in standard locations
        viper.SetConfigName(".mytool")
        viper.SetConfigType("yaml")
        viper.AddConfigPath(".")           // Current directory
        viper.AddConfigPath("$HOME")       // Home directory
    }

    // Environment variables
    viper.SetEnvPrefix("MYTOOL")
    viper.AutomaticEnv()
    viper.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))

    // Bind flags to viper
    viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))

    // Read config file (optional)
    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return err
        }
    }

    return nil
}
```

```typescript
// TypeScript with cosmiconfig
import { cosmiconfig } from 'cosmiconfig';

interface Config {
  verbose: boolean;
  output: string;
  plugins: string[];
}

async function loadConfig(): Promise<Config> {
  const explorer = cosmiconfig('mytool');
  const result = await explorer.search();

  const fileConfig = result?.config ?? {};

  // Merge with precedence: flags > env > file > defaults
  return {
    verbose: process.env.MYTOOL_VERBOSE === 'true' || fileConfig.verbose || false,
    output: process.env.MYTOOL_OUTPUT || fileConfig.output || 'dist',
    plugins: fileConfig.plugins || [],
  };
}
```

### Config File Formats

Support common formats:

```yaml
# .mytool.yaml
verbose: true
output: dist
plugins:
  - typescript
  - minify
```

```json
// .mytoolrc.json
{
  "verbose": true,
  "output": "dist",
  "plugins": ["typescript", "minify"]
}
```

```toml
# mytool.toml
verbose = true
output = "dist"
plugins = ["typescript", "minify"]
```

## Dependency Injection

### Service Pattern

Inject dependencies for testability:

```go
// Define interfaces
type Logger interface {
    Info(msg string, fields ...any)
    Error(msg string, fields ...any)
}

type FileSystem interface {
    ReadFile(path string) ([]byte, error)
    WriteFile(path string, data []byte) error
    Exists(path string) bool
}

// Service with dependencies
type Builder struct {
    logger Logger
    fs     FileSystem
    config *BuildConfig
}

func NewBuilder(logger Logger, fs FileSystem, config *BuildConfig) *Builder {
    return &Builder{
        logger: logger,
        fs:     fs,
        config: config,
    }
}

func (b *Builder) Build(ctx context.Context, path string) error {
    b.logger.Info("Starting build", "path", path)
    // Use b.fs instead of direct file operations
    // This allows mocking in tests
}
```

```typescript
// TypeScript with dependency injection
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
}

class Builder {
  constructor(
    private logger: Logger,
    private fs: FileSystem,
    private config: BuildConfig
  ) {}

  async build(path: string): Promise<void> {
    this.logger.info('Starting build', { path });
    // Use this.fs instead of direct fs operations
  }
}

// In production
const builder = new Builder(consoleLogger, nodeFs, config);

// In tests
const builder = new Builder(mockLogger, mockFs, testConfig);
```

## Context and Cancellation

### Handling Interrupts

Gracefully handle Ctrl+C and other signals:

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())

    // Handle interrupt
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

    go func() {
        <-sigChan
        fmt.Fprintln(os.Stderr, "\nInterrupted, cleaning up...")
        cancel()
    }()

    if err := rootCmd.ExecuteContext(ctx); err != nil {
        os.Exit(1)
    }
}

// In command implementation
func runBuild(ctx context.Context, path string) error {
    for _, file := range files {
        // Check for cancellation
        select {
        case <-ctx.Done():
            return ctx.Err()
        default:
        }

        if err := processFile(ctx, file); err != nil {
            return err
        }
    }
    return nil
}
```

```typescript
// Node.js signal handling
process.on('SIGINT', () => {
  console.error('\nInterrupted, cleaning up...');
  cleanup();
  process.exit(130); // 128 + signal number
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

// Using AbortController
const controller = new AbortController();

process.on('SIGINT', () => controller.abort());

async function build(signal: AbortSignal) {
  for (const file of files) {
    if (signal.aborted) {
      throw new Error('Build cancelled');
    }
    await processFile(file);
  }
}
```

## Plugin Architecture

For extensible CLIs:

```typescript
// Plugin interface
interface Plugin {
  name: string;
  version: string;
  setup(context: PluginContext): void | Promise<void>;
}

interface PluginContext {
  config: Config;
  logger: Logger;
  registerCommand(command: Command): void;
  registerHook(event: string, handler: HookHandler): void;
}

// Plugin loader
async function loadPlugins(config: Config): Promise<Plugin[]> {
  const plugins: Plugin[] = [];

  for (const pluginName of config.plugins) {
    try {
      const plugin = await import(pluginName);
      plugins.push(plugin.default);
    } catch (error) {
      throw new Error(`Failed to load plugin: ${pluginName}`);
    }
  }

  return plugins;
}
```

## Anti-Patterns to Avoid

### Global State

```go
// Bad: Global mutable state
var config Config

func doSomething() {
    // Uses global config - hard to test
    if config.Verbose { ... }
}

// Good: Pass dependencies
func doSomething(config *Config) {
    if config.Verbose { ... }
}
```

### God Commands

```go
// Bad: One command does everything
var doEverythingCmd = &cobra.Command{
    Use: "do",
    Run: func(cmd *cobra.Command, args []string) {
        // 500 lines of code doing init, build, deploy, etc.
    },
}

// Good: Separate concerns
var initCmd = &cobra.Command{ ... }
var buildCmd = &cobra.Command{ ... }
var deployCmd = &cobra.Command{ ... }
```

### Hardcoded Paths

```go
// Bad: Hardcoded paths
configPath := "/etc/mytool/config.yaml"

// Good: Respect XDG/platform conventions
configPath := filepath.Join(xdg.ConfigHome, "mytool", "config.yaml")
```
