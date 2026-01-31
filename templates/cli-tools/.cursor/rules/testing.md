# CLI Testing

Strategies for testing command-line applications: unit tests, integration tests, and mocking I/O.

## Testing Philosophy

1. **Test behavior, not implementation** - Verify what the CLI does, not how
2. **Test at multiple levels** - Unit, integration, and end-to-end
3. **Test edge cases** - Invalid inputs, missing files, network errors
4. **Test non-interactively** - Support CI/CD environments

## Unit Testing

### Testing Business Logic

Separate business logic from CLI framework for easy testing:

```go
// Go: Testable business logic
// lib/build.go
func Build(config *BuildConfig) (*BuildResult, error) {
    // Pure business logic, no CLI dependencies
    // Easy to test in isolation
}

// cmd/build.go
var buildCmd = &cobra.Command{
    RunE: func(cmd *cobra.Command, args []string) error {
        config := loadBuildConfig(cmd)
        result, err := lib.Build(config)
        if err != nil {
            return err
        }
        printResult(result)
        return nil
    },
}
```

```go
// Go: Unit test
func TestBuild(t *testing.T) {
    config := &BuildConfig{
        Source: "testdata/src",
        Output: t.TempDir(),
    }

    result, err := Build(config)

    require.NoError(t, err)
    assert.Equal(t, 5, result.FilesProcessed)
    assert.FileExists(t, filepath.Join(config.Output, "main.js"))
}
```

```typescript
// TypeScript: Unit test
describe('build', () => {
  it('processes all source files', async () => {
    const config: BuildConfig = {
      source: 'testdata/src',
      output: await mkdtemp('build-test'),
    };

    const result = await build(config);

    expect(result.filesProcessed).toBe(5);
    expect(fs.existsSync(path.join(config.output, 'main.js'))).toBe(true);
  });
});
```

### Testing Argument Parsing

```go
// Go with Cobra: Test argument validation
func TestBuildArgsValidation(t *testing.T) {
    tests := []struct {
        name    string
        args    []string
        wantErr bool
    }{
        {
            name:    "valid single path",
            args:    []string{"./src"},
            wantErr: false,
        },
        {
            name:    "no args uses current dir",
            args:    []string{},
            wantErr: false,
        },
        {
            name:    "too many args",
            args:    []string{"./src", "./lib", "./extra"},
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            cmd := NewBuildCmd()
            cmd.SetArgs(tt.args)
            err := cmd.Execute()

            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

## Integration Testing

### Testing Full Commands

```go
// Go: Integration test with captured output
func TestBuildCommand(t *testing.T) {
    // Setup
    tempDir := t.TempDir()
    setupTestProject(t, tempDir)

    // Capture stdout/stderr
    stdout := new(bytes.Buffer)
    stderr := new(bytes.Buffer)

    // Create and run command
    cmd := NewRootCmd()
    cmd.SetOut(stdout)
    cmd.SetErr(stderr)
    cmd.SetArgs([]string{"build", tempDir, "-o", filepath.Join(tempDir, "dist")})

    // Execute
    err := cmd.Execute()

    // Assert
    require.NoError(t, err)
    assert.Contains(t, stdout.String(), "Build complete")
    assert.DirExists(t, filepath.Join(tempDir, "dist"))
}
```

```typescript
// TypeScript: Integration test
import { execSync } from 'child_process';

describe('build command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp('build-test');
    setupTestProject(tempDir);
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('builds project successfully', () => {
    const result = execSync(`node ./bin/cli.js build ${tempDir}`, {
      encoding: 'utf-8',
    });

    expect(result).toContain('Build complete');
    expect(fs.existsSync(path.join(tempDir, 'dist'))).toBe(true);
  });

  it('returns error for invalid path', () => {
    expect(() => {
      execSync('node ./bin/cli.js build /nonexistent', {
        encoding: 'utf-8',
      });
    }).toThrow();
  });
});
```

### Testing Exit Codes

```go
// Go: Test exit codes
func TestExitCodes(t *testing.T) {
    tests := []struct {
        name     string
        args     []string
        exitCode int
    }{
        {
            name:     "success",
            args:     []string{"build", "testdata/valid"},
            exitCode: 0,
        },
        {
            name:     "invalid args",
            args:     []string{"build", "--invalid-flag"},
            exitCode: 2,
        },
        {
            name:     "file not found",
            args:     []string{"build", "/nonexistent"},
            exitCode: 1,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            cmd := exec.Command("./mytool", tt.args...)
            err := cmd.Run()

            exitErr, ok := err.(*exec.ExitError)
            if tt.exitCode == 0 {
                assert.NoError(t, err)
            } else {
                require.True(t, ok)
                assert.Equal(t, tt.exitCode, exitErr.ExitCode())
            }
        })
    }
}
```

## Mocking I/O

### Mocking stdin

```go
// Go: Mock stdin for testing
func TestInteractivePrompt(t *testing.T) {
    // Create a pipe to simulate stdin
    r, w, _ := os.Pipe()
    oldStdin := os.Stdin
    os.Stdin = r

    // Write test input
    go func() {
        w.WriteString("y\n")
        w.Close()
    }()

    // Run function that reads from stdin
    result := confirmAction("Delete?")

    // Restore stdin
    os.Stdin = oldStdin

    assert.True(t, result)
}
```

```typescript
// TypeScript: Mock stdin with mock-stdin
import mockStdin from 'mock-stdin';

describe('interactive prompts', () => {
  let stdin: ReturnType<typeof mockStdin.stdin>;

  beforeEach(() => {
    stdin = mockStdin.stdin();
  });

  afterEach(() => {
    stdin.restore();
  });

  it('accepts confirmation', async () => {
    // Schedule input after prompt appears
    setTimeout(() => {
      stdin.send('y\n');
    }, 10);

    const result = await confirmAction('Delete?');

    expect(result).toBe(true);
  });
});
```

### Mocking stdout/stderr

```go
// Go: Capture output
func TestOutputFormatting(t *testing.T) {
    stdout := new(bytes.Buffer)
    stderr := new(bytes.Buffer)

    logger := NewLogger(stdout, stderr, LevelNormal)
    logger.Info("Hello, world!")
    logger.Error("Something went wrong")

    assert.Contains(t, stdout.String(), "Hello, world!")
    assert.Contains(t, stderr.String(), "Something went wrong")
}
```

```typescript
// TypeScript: Mock console
describe('output formatting', () => {
  let consoleOutput: string[] = [];
  let consoleError: string[] = [];

  beforeEach(() => {
    consoleOutput = [];
    consoleError = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => {
      consoleOutput.push(args.join(' '));
    });
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      consoleError.push(args.join(' '));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints info to stdout', () => {
    logger.info('Hello, world!');
    expect(consoleOutput).toContain('Hello, world!');
  });
});
```

### Mocking File System

```go
// Go: Use interfaces for file system
type FileSystem interface {
    ReadFile(path string) ([]byte, error)
    WriteFile(path string, data []byte, perm os.FileMode) error
    Exists(path string) bool
}

// Real implementation
type OSFileSystem struct{}

func (fs *OSFileSystem) ReadFile(path string) ([]byte, error) {
    return os.ReadFile(path)
}

// Mock implementation
type MockFileSystem struct {
    Files map[string][]byte
    Err   error
}

func (fs *MockFileSystem) ReadFile(path string) ([]byte, error) {
    if fs.Err != nil {
        return nil, fs.Err
    }
    data, ok := fs.Files[path]
    if !ok {
        return nil, os.ErrNotExist
    }
    return data, nil
}

// Test
func TestLoadConfig(t *testing.T) {
    mockFS := &MockFileSystem{
        Files: map[string][]byte{
            "/config.yaml": []byte("key: value"),
        },
    }

    loader := NewConfigLoader(mockFS)
    config, err := loader.Load("/config.yaml")

    require.NoError(t, err)
    assert.Equal(t, "value", config.Key)
}
```

### Mocking Network

```go
// Go: Use httptest for API mocking
func TestAPIClient(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        assert.Equal(t, "/api/projects", r.URL.Path)
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode([]Project{{Name: "test"}})
    }))
    defer server.Close()

    client := NewAPIClient(server.URL)
    projects, err := client.ListProjects()

    require.NoError(t, err)
    assert.Len(t, projects, 1)
    assert.Equal(t, "test", projects[0].Name)
}
```

## Snapshot Testing

### Output Snapshots

```go
// Go: Snapshot testing with golden files
func TestHelpOutput(t *testing.T) {
    cmd := NewRootCmd()
    cmd.SetArgs([]string{"--help"})

    output := new(bytes.Buffer)
    cmd.SetOut(output)
    cmd.Execute()

    golden := filepath.Join("testdata", "help.golden")

    if *update {
        // Update golden file
        os.WriteFile(golden, output.Bytes(), 0644)
    }

    expected, err := os.ReadFile(golden)
    require.NoError(t, err)
    assert.Equal(t, string(expected), output.String())
}
```

```typescript
// TypeScript with Jest snapshots
describe('help output', () => {
  it('matches snapshot', () => {
    const output = execSync('node ./bin/cli.js --help', {
      encoding: 'utf-8',
    });

    expect(output).toMatchSnapshot();
  });
});
```

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── config_test.go
│   ├── build_test.go
│   └── output_test.go
├── integration/
│   ├── build_command_test.go
│   ├── deploy_command_test.go
│   └── interactive_test.go
├── e2e/
│   ├── full_workflow_test.go
│   └── ci_environment_test.go
├── fixtures/
│   ├── valid_project/
│   ├── invalid_config/
│   └── large_project/
└── testdata/
    ├── help.golden
    └── version.golden
```

### Test Helpers

```go
// Go: Common test helpers
// testutil/setup.go
func SetupTestProject(t *testing.T) string {
    t.Helper()

    dir := t.TempDir()

    // Create test files
    os.WriteFile(filepath.Join(dir, "main.ts"), []byte("console.log('hi')"), 0644)
    os.WriteFile(filepath.Join(dir, "package.json"), []byte("{}"), 0644)

    return dir
}

func CaptureOutput(t *testing.T, cmd *cobra.Command) (stdout, stderr string) {
    t.Helper()

    outBuf := new(bytes.Buffer)
    errBuf := new(bytes.Buffer)

    cmd.SetOut(outBuf)
    cmd.SetErr(errBuf)

    return outBuf.String(), errBuf.String()
}
```

## CI Considerations

### Environment Detection

```go
// Tests should handle CI environment
func TestProgressBar(t *testing.T) {
    if os.Getenv("CI") != "" {
        t.Skip("Skipping interactive test in CI")
    }

    // Test interactive progress bar
}
```

### Parallelization

```go
// Go: Run tests in parallel
func TestBuild(t *testing.T) {
    t.Parallel()

    // Test uses t.TempDir() which is safe for parallel tests
    dir := t.TempDir()
    // ...
}
```

### Test Timeouts

```go
// Go: Set reasonable timeouts
func TestLongRunningCommand(t *testing.T) {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    cmd := exec.CommandContext(ctx, "./mytool", "slow-command")
    err := cmd.Run()

    if ctx.Err() == context.DeadlineExceeded {
        t.Fatal("Command timed out")
    }
}
```
