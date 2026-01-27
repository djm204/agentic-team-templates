# CLI User Experience

Patterns for creating intuitive, informative, and pleasant command-line interfaces.

## Output Formatting

### Structured Output

Support multiple output formats for different use cases:

```go
// Go: Multi-format output
type OutputFormat string

const (
    FormatTable OutputFormat = "table"
    FormatJSON  OutputFormat = "json"
    FormatYAML  OutputFormat = "yaml"
    FormatPlain OutputFormat = "plain"
)

type Project struct {
    Name    string `json:"name" yaml:"name"`
    Status  string `json:"status" yaml:"status"`
    Updated string `json:"updated" yaml:"updated"`
}

func printProjects(projects []Project, format OutputFormat) error {
    switch format {
    case FormatJSON:
        return json.NewEncoder(os.Stdout).Encode(projects)

    case FormatYAML:
        return yaml.NewEncoder(os.Stdout).Encode(projects)

    case FormatTable:
        w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
        fmt.Fprintln(w, "NAME\tSTATUS\tUPDATED")
        for _, p := range projects {
            fmt.Fprintf(w, "%s\t%s\t%s\n", p.Name, p.Status, p.Updated)
        }
        return w.Flush()

    case FormatPlain:
        for _, p := range projects {
            fmt.Println(p.Name)
        }
        return nil

    default:
        return fmt.Errorf("unknown format: %s", format)
    }
}
```

```typescript
// TypeScript: Multi-format output
type OutputFormat = 'table' | 'json' | 'yaml' | 'plain';

function printProjects(projects: Project[], format: OutputFormat): void {
  switch (format) {
    case 'json':
      console.log(JSON.stringify(projects, null, 2));
      break;

    case 'yaml':
      console.log(yaml.dump(projects));
      break;

    case 'table':
      console.table(projects);
      break;

    case 'plain':
      projects.forEach(p => console.log(p.name));
      break;
  }
}
```

### stdout vs stderr

- **stdout**: Data output (for piping)
- **stderr**: Progress, status, errors (for humans)

```go
// Go: Correct stream usage
func runBuild(ctx context.Context) error {
    // Progress goes to stderr
    fmt.Fprintln(os.Stderr, "Building project...")

    result, err := build(ctx)
    if err != nil {
        // Errors go to stderr
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        return err
    }

    // Data output goes to stdout (can be piped)
    fmt.Println(result.OutputPath)
    return nil
}
```

```typescript
// TypeScript: Correct stream usage
// Progress and errors to stderr
console.error('Building project...');

// Data to stdout
console.log(result.outputPath);

// Or use explicit streams
process.stderr.write('Building...\n');
process.stdout.write(JSON.stringify(result));
```

## Colors and Styling

### Color Usage Guidelines

| Color | Use For |
|-------|---------|
| Green | Success, completion |
| Red | Errors, warnings |
| Yellow | Warnings, cautions |
| Blue | Information, highlights |
| Cyan | Commands, paths |
| Dim/Gray | Secondary information |
| Bold | Emphasis, headers |

### Implementing Colors

```go
// Go with fatih/color
import "github.com/fatih/color"

var (
    success = color.New(color.FgGreen).SprintFunc()
    failure = color.New(color.FgRed).SprintFunc()
    warning = color.New(color.FgYellow).SprintFunc()
    info    = color.New(color.FgBlue).SprintFunc()
    dim     = color.New(color.Faint).SprintFunc()
)

func printStatus(name, status string) {
    switch status {
    case "success":
        fmt.Printf("%s %s\n", success("✓"), name)
    case "failure":
        fmt.Printf("%s %s\n", failure("✗"), name)
    case "pending":
        fmt.Printf("%s %s\n", warning("○"), name)
    }
}
```

```typescript
// TypeScript with chalk
import chalk from 'chalk';

function printStatus(name: string, status: string): void {
  switch (status) {
    case 'success':
      console.log(chalk.green('✓'), name);
      break;
    case 'failure':
      console.log(chalk.red('✗'), name);
      break;
    case 'pending':
      console.log(chalk.yellow('○'), name);
      break;
  }
}
```

### Respecting No-Color

Always support disabling colors:

```go
// Go: Check NO_COLOR and --no-color flag
func init() {
    if os.Getenv("NO_COLOR") != "" || noColorFlag {
        color.NoColor = true
    }

    // Also disable colors when not a TTY
    if !term.IsTerminal(int(os.Stdout.Fd())) {
        color.NoColor = true
    }
}
```

```typescript
// TypeScript: Check environment and flag
import chalk from 'chalk';

if (process.env.NO_COLOR || options.noColor || !process.stdout.isTTY) {
  chalk.level = 0;
}
```

## Progress Indicators

### Spinners

For operations with unknown duration:

```go
// Go with briandowns/spinner
import "github.com/briandowns/spinner"

func deploy(ctx context.Context) error {
    s := spinner.New(spinner.CharSets[14], 100*time.Millisecond)
    s.Suffix = " Deploying..."
    s.Start()
    defer s.Stop()

    if err := runDeploy(ctx); err != nil {
        s.FinalMSG = "✗ Deployment failed\n"
        return err
    }

    s.FinalMSG = "✓ Deployment complete\n"
    return nil
}
```

```typescript
// TypeScript with ora
import ora from 'ora';

async function deploy(): Promise<void> {
  const spinner = ora('Deploying...').start();

  try {
    await runDeploy();
    spinner.succeed('Deployment complete');
  } catch (error) {
    spinner.fail('Deployment failed');
    throw error;
  }
}
```

### Progress Bars

For operations with known progress:

```go
// Go with schollz/progressbar
import "github.com/schollz/progressbar/v3"

func processFiles(files []string) error {
    bar := progressbar.NewOptions(len(files),
        progressbar.OptionSetDescription("Processing"),
        progressbar.OptionShowCount(),
        progressbar.OptionSetWidth(40),
    )

    for _, file := range files {
        if err := processFile(file); err != nil {
            return err
        }
        bar.Add(1)
    }

    return nil
}
```

```typescript
// TypeScript with cli-progress
import { SingleBar, Presets } from 'cli-progress';

async function processFiles(files: string[]): Promise<void> {
  const bar = new SingleBar({
    format: 'Processing |{bar}| {percentage}% | {value}/{total}',
  }, Presets.shades_classic);

  bar.start(files.length, 0);

  for (const file of files) {
    await processFile(file);
    bar.increment();
  }

  bar.stop();
}
```

### Progress for Non-Interactive Environments

Detect TTY and adapt:

```go
func processFiles(files []string) error {
    if term.IsTerminal(int(os.Stderr.Fd())) {
        // Interactive: Use progress bar
        return processWithProgressBar(files)
    } else {
        // Non-interactive (CI): Use periodic updates
        return processWithPeriodicLog(files)
    }
}

func processWithPeriodicLog(files []string) error {
    total := len(files)
    for i, file := range files {
        if err := processFile(file); err != nil {
            return err
        }
        // Log every 10% or every 100 files
        if i%100 == 0 || i == total-1 {
            fmt.Fprintf(os.Stderr, "Processed %d/%d files\n", i+1, total)
        }
    }
    return nil
}
```

## Interactive Prompts

### Confirmation Prompts

```go
// Go with AlecAivazis/survey
import "github.com/AlecAivazis/survey/v2"

func confirmDelete(name string) (bool, error) {
    var confirm bool
    prompt := &survey.Confirm{
        Message: fmt.Sprintf("Delete %q?", name),
        Default: false,
    }
    err := survey.AskOne(prompt, &confirm)
    return confirm, err
}
```

```typescript
// TypeScript with inquirer
import inquirer from 'inquirer';

async function confirmDelete(name: string): Promise<boolean> {
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Delete "${name}"?`,
    default: false,
  }]);
  return confirm;
}
```

### Selection Prompts

```go
// Go: Select from list
func selectEnvironment() (string, error) {
    var env string
    prompt := &survey.Select{
        Message: "Select environment:",
        Options: []string{"dev", "staging", "prod"},
    }
    err := survey.AskOne(prompt, &env)
    return env, err
}
```

### Text Input

```go
// Go: Get text input
func askProjectName() (string, error) {
    var name string
    prompt := &survey.Input{
        Message: "Project name:",
        Default: "my-project",
    }
    err := survey.AskOne(prompt, &name, survey.WithValidator(survey.Required))
    return name, err
}
```

### Non-Interactive Mode

Always support skipping prompts:

```go
func confirmDelete(name string, force bool) (bool, error) {
    // Skip prompt if --force flag or non-interactive
    if force || !term.IsTerminal(int(os.Stdin.Fd())) {
        return true, nil
    }

    var confirm bool
    prompt := &survey.Confirm{
        Message: fmt.Sprintf("Delete %q?", name),
    }
    err := survey.AskOne(prompt, &confirm)
    return confirm, err
}
```

## Status and Logging

### Log Levels

```go
type LogLevel int

const (
    LevelQuiet LogLevel = iota
    LevelNormal
    LevelVerbose
    LevelDebug
)

type Logger struct {
    level  LogLevel
    writer io.Writer
}

func (l *Logger) Debug(msg string, args ...any) {
    if l.level >= LevelDebug {
        fmt.Fprintf(l.writer, "[DEBUG] "+msg+"\n", args...)
    }
}

func (l *Logger) Info(msg string, args ...any) {
    if l.level >= LevelNormal {
        fmt.Fprintf(l.writer, msg+"\n", args...)
    }
}

func (l *Logger) Success(msg string, args ...any) {
    if l.level >= LevelNormal {
        fmt.Fprintf(l.writer, "✓ "+msg+"\n", args...)
    }
}

func (l *Logger) Error(msg string, args ...any) {
    // Errors always print
    fmt.Fprintf(l.writer, "✗ "+msg+"\n", args...)
}
```

### Structured Status Output

```
$ mytool deploy

Deploying to production...

  ✓ Building application
  ✓ Running tests
  ✓ Uploading artifacts
  ○ Starting services
    ├─ api-server ... starting
    ├─ worker ... starting
    └─ scheduler ... starting
  ○ Running health checks

Deployment in progress...
```

```go
func printDeployStatus(services []Service) {
    fmt.Println("  ○ Starting services")
    for i, svc := range services {
        prefix := "├─"
        if i == len(services)-1 {
            prefix = "└─"
        }
        status := dim("starting")
        if svc.Running {
            status = success("running")
        }
        fmt.Printf("    %s %s ... %s\n", prefix, svc.Name, status)
    }
}
```

## Responsive Design

### Terminal Width

Adapt output to terminal size:

```go
import "golang.org/x/term"

func getTerminalWidth() int {
    width, _, err := term.GetSize(int(os.Stdout.Fd()))
    if err != nil {
        return 80  // Default fallback
    }
    return width
}

func truncate(s string, maxLen int) string {
    if len(s) <= maxLen {
        return s
    }
    return s[:maxLen-3] + "..."
}

func printTable(rows [][]string) {
    width := getTerminalWidth()
    colWidth := width / len(rows[0])

    for _, row := range rows {
        for _, col := range row {
            fmt.Printf("%-*s", colWidth, truncate(col, colWidth-1))
        }
        fmt.Println()
    }
}
```

### Paging Long Output

```go
// Go: Pipe to pager for long output
func showLongOutput(content string) error {
    if !term.IsTerminal(int(os.Stdout.Fd())) {
        fmt.Print(content)
        return nil
    }

    pager := os.Getenv("PAGER")
    if pager == "" {
        pager = "less"
    }

    cmd := exec.Command(pager)
    cmd.Stdin = strings.NewReader(content)
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr

    return cmd.Run()
}
```
