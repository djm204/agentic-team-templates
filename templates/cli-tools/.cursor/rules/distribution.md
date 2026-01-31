# CLI Distribution

Patterns for packaging, versioning, and distributing command-line tools.

## Versioning

### Semantic Versioning

Follow SemVer (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to CLI interface
- **MINOR**: New commands, flags, or features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Information

Include comprehensive version output:

```go
// Go: Version command
var (
    version   = "dev"
    commit    = "none"
    date      = "unknown"
    builtBy   = "unknown"
)

var versionCmd = &cobra.Command{
    Use:   "version",
    Short: "Print version information",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Printf("mytool %s\n", version)
        fmt.Printf("  commit:  %s\n", commit)
        fmt.Printf("  built:   %s\n", date)
        fmt.Printf("  by:      %s\n", builtBy)
        fmt.Printf("  go:      %s\n", runtime.Version())
    },
}

// Build with ldflags
// go build -ldflags "-X main.version=1.0.0 -X main.commit=$(git rev-parse HEAD)"
```

```typescript
// TypeScript: Version from package.json
import { readFileSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

program
  .version(pkg.version, '-V, --version', 'output version number')
  .action(() => {
    console.log(`mytool ${pkg.version}`);
    console.log(`  node: ${process.version}`);
  });
```

## Packaging

### Node.js / npm

```json
// package.json
{
  "name": "mytool",
  "version": "1.0.0",
  "description": "A CLI tool",
  "bin": {
    "mytool": "./bin/cli.js"
  },
  "files": [
    "bin",
    "dist",
    "README.md"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

```javascript
// bin/cli.js
#!/usr/bin/env node
import '../dist/index.js';
```

```bash
# Publishing
npm version patch  # Bump version
npm publish
```

### Go

```go
// Build for multiple platforms
// Makefile
BINARY_NAME=mytool
VERSION=$(shell git describe --tags --always --dirty)
LDFLAGS=-ldflags "-X main.version=$(VERSION)"

build:
    go build $(LDFLAGS) -o $(BINARY_NAME) .

build-all:
    GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o dist/$(BINARY_NAME)-linux-amd64 .
    GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o dist/$(BINARY_NAME)-linux-arm64 .
    GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o dist/$(BINARY_NAME)-darwin-amd64 .
    GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o dist/$(BINARY_NAME)-darwin-arm64 .
    GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o dist/$(BINARY_NAME)-windows-amd64.exe .

release: build-all
    # Create checksums
    cd dist && shasum -a 256 * > checksums.txt
```

### Using GoReleaser

```yaml
# .goreleaser.yaml
version: 2

builds:
  - main: ./cmd/mytool
    binary: mytool
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w
      - -X main.version={{.Version}}
      - -X main.commit={{.Commit}}
      - -X main.date={{.Date}}

archives:
  - format: tar.gz
    name_template: "{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}"
    format_overrides:
      - goos: windows
        format: zip

checksum:
  name_template: 'checksums.txt'

changelog:
  sort: asc
  filters:
    exclude:
      - '^docs:'
      - '^test:'

brews:
  - repository:
      owner: myorg
      name: homebrew-tap
    homepage: https://github.com/myorg/mytool
    description: A CLI tool
    license: MIT
    install: |
      bin.install "mytool"
      # Install shell completions
      bash_completion.install "completions/mytool.bash" => "mytool"
      zsh_completion.install "completions/mytool.zsh" => "_mytool"
```

### Python with PyPI

```toml
# pyproject.toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "mytool"
version = "1.0.0"
description = "A CLI tool"
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "click>=8.0",
    "rich>=13.0",
]

[project.scripts]
mytool = "mytool.cli:main"

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "black",
    "mypy",
]
```

```bash
# Publishing
python -m build
python -m twine upload dist/*
```

## Installation Methods

### Direct Download

```bash
# Installation script
#!/bin/bash
set -e

VERSION="1.0.0"
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case $ARCH in
    x86_64) ARCH="amd64" ;;
    aarch64) ARCH="arm64" ;;
esac

URL="https://github.com/myorg/mytool/releases/download/v${VERSION}/mytool_${VERSION}_${OS}_${ARCH}.tar.gz"

echo "Downloading mytool v${VERSION}..."
curl -sL "$URL" | tar xz -C /tmp

echo "Installing to /usr/local/bin..."
sudo mv /tmp/mytool /usr/local/bin/

echo "Done! Run 'mytool --version' to verify."
```

### Package Managers

```bash
# Homebrew (macOS/Linux)
brew install myorg/tap/mytool

# npm (Node.js)
npm install -g mytool

# pip (Python)
pip install mytool

# Cargo (Rust)
cargo install mytool

# Go
go install github.com/myorg/mytool@latest
```

### Docker

```dockerfile
# Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o mytool .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /app/mytool /usr/local/bin/
ENTRYPOINT ["mytool"]
```

```bash
# Usage
docker run --rm -v $(pwd):/workspace myorg/mytool build /workspace
```

## Update Mechanisms

### Self-Update Command

```go
// Go: Self-update using GitHub releases
var updateCmd = &cobra.Command{
    Use:   "update",
    Short: "Update to the latest version",
    RunE: func(cmd *cobra.Command, args []string) error {
        // Check current version
        current := version

        // Fetch latest release
        latest, err := getLatestRelease("myorg", "mytool")
        if err != nil {
            return fmt.Errorf("check for updates: %w", err)
        }

        if latest.Version == current {
            fmt.Println("Already up to date!")
            return nil
        }

        fmt.Printf("Updating from %s to %s...\n", current, latest.Version)

        // Download and replace binary
        if err := downloadAndInstall(latest); err != nil {
            return fmt.Errorf("update: %w", err)
        }

        fmt.Println("Update complete!")
        return nil
    },
}
```

### Update Check on Startup

```go
// Go: Check for updates (non-blocking)
func checkForUpdatesAsync() {
    go func() {
        latest, err := getLatestRelease("myorg", "mytool")
        if err != nil {
            return  // Silently fail
        }

        if semver.Compare(latest.Version, version) > 0 {
            fmt.Fprintf(os.Stderr,
                "\nA new version of mytool is available: %s (current: %s)\n"+
                "Run 'mytool update' to upgrade.\n\n",
                latest.Version, version)
        }
    }()
}

func main() {
    // Only check for updates in TTY and not too frequently
    if shouldCheckUpdates() {
        checkForUpdatesAsync()
    }
    rootCmd.Execute()
}
```

## Shell Completions Distribution

### Generate During Build

```bash
# Makefile
completions:
    mkdir -p completions
    ./mytool completion bash > completions/mytool.bash
    ./mytool completion zsh > completions/_mytool
    ./mytool completion fish > completions/mytool.fish
```

### Installation Instructions

```markdown
# Shell Completions

## Bash

Add to your `~/.bashrc`:

```bash
source <(mytool completion bash)
```

Or install system-wide:

```bash
mytool completion bash > /etc/bash_completion.d/mytool
```

## Zsh

Add to your `~/.zshrc`:

```zsh
source <(mytool completion zsh)
```

Or install to fpath:

```zsh
mytool completion zsh > "${fpath[1]}/_mytool"
```

## Fish

```fish
mytool completion fish > ~/.config/fish/completions/mytool.fish
```
```

## Documentation

### Man Pages

```go
// Go with Cobra: Generate man pages
import "github.com/spf13/cobra/doc"

func generateManPages() error {
    header := &doc.GenManHeader{
        Title:   "MYTOOL",
        Section: "1",
    }
    return doc.GenManTree(rootCmd, header, "./man")
}
```

### README Structure

```markdown
# mytool

Brief description of what the tool does.

## Installation

```bash
# macOS
brew install myorg/tap/mytool

# Linux
curl -fsSL https://example.com/install.sh | bash

# npm
npm install -g mytool
```

## Quick Start

```bash
# Initialize a new project
mytool init my-project

# Build the project
mytool build

# Deploy to production
mytool deploy --env prod
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize a new project |
| `build` | Build the project |
| `deploy` | Deploy to environment |
| `config` | Manage configuration |

## Configuration

Create a `.mytool.yaml` file:

```yaml
output: dist
verbose: false
plugins:
  - typescript
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYTOOL_OUTPUT` | Output directory | `dist` |
| `MYTOOL_VERBOSE` | Enable verbose output | `false` |

## License

MIT
```

## CI/CD for Releases

### GitHub Actions

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### npm Publishing

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
