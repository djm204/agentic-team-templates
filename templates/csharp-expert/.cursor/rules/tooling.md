# C# Tooling and Ecosystem

The .NET toolchain, project configuration, and CI/CD patterns.

## Essential CLI Commands

```bash
# Project management
dotnet new webapi -n MyApp.Api        # Create new project
dotnet new sln -n MyApp               # Create solution
dotnet sln add src/MyApp.Api          # Add project to solution
dotnet add reference ../MyApp.Domain  # Add project reference
dotnet add package Serilog            # Add NuGet package

# Build and run
dotnet build --warnaserror            # Build with warnings as errors
dotnet run --project src/MyApp.Api    # Run specific project
dotnet watch --project src/MyApp.Api  # Hot reload

# Testing
dotnet test                           # Run all tests
dotnet test --filter "Category=Unit"  # Filter tests
dotnet test --collect:"XPlat Code Coverage"  # With coverage
dotnet test --logger "console;verbosity=detailed"

# Analysis
dotnet format                         # Apply code style
dotnet format --verify-no-changes     # CI check
```

## Project Configuration

### Directory.Build.props

Shared settings across all projects in the solution:

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
    <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
    <AnalysisLevel>latest-recommended</AnalysisLevel>
  </PropertyGroup>

  <!-- Central package management -->
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
</Project>
```

### Directory.Packages.props

Central package version management (single source of truth):

```xml
<Project>
  <ItemGroup>
    <!-- Core -->
    <PackageVersion Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    <PackageVersion Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="9.0.0" />

    <!-- Testing -->
    <PackageVersion Include="xunit" Version="2.9.0" />
    <PackageVersion Include="FluentAssertions" Version="7.0.0" />
    <PackageVersion Include="NSubstitute" Version="5.3.0" />
    <PackageVersion Include="Testcontainers.PostgreSql" Version="4.0.0" />

    <!-- Analysis -->
    <PackageVersion Include="SonarAnalyzer.CSharp" Version="10.0.0" />
    <PackageVersion Include="Roslynator.Analyzers" Version="4.12.0" />
  </ItemGroup>
</Project>
```

## .editorconfig

```ini
root = true

[*.cs]
# Naming conventions
dotnet_naming_rule.private_fields_should_be_camel_case.severity = error
dotnet_naming_rule.private_fields_should_be_camel_case.symbols = private_fields
dotnet_naming_rule.private_fields_should_be_camel_case.style = underscore_camel_case

dotnet_naming_symbols.private_fields.applicable_kinds = field
dotnet_naming_symbols.private_fields.applicable_accessibilities = private

dotnet_naming_style.underscore_camel_case.required_prefix = _
dotnet_naming_style.underscore_camel_case.capitalization = camel_case

# Code style
csharp_style_var_for_built_in_types = false:warning
csharp_style_var_when_type_is_apparent = true:suggestion
csharp_style_var_elsewhere = false:suggestion

csharp_prefer_simple_using_statement = true:warning
csharp_style_namespace_declarations = file_scoped:warning
csharp_style_prefer_primary_constructors = true:suggestion

# Formatting
dotnet_sort_system_directives_first = true
csharp_new_line_before_open_brace = all
```

## Analyzers

```xml
<!-- In .csproj or Directory.Build.props -->
<ItemGroup>
  <!-- Roslyn analyzers -->
  <PackageReference Include="SonarAnalyzer.CSharp" PrivateAssets="all" />
  <PackageReference Include="Roslynator.Analyzers" PrivateAssets="all" />
  <PackageReference Include="Microsoft.CodeAnalysis.NetAnalyzers" PrivateAssets="all" />

  <!-- Security analyzers -->
  <PackageReference Include="SecurityCodeScan.VS2019" PrivateAssets="all" />
</ItemGroup>
```

## Docker

```dockerfile
# Multi-stage build for minimal image
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY Directory.Build.props Directory.Packages.props ./
COPY **/*.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish src/MyApp.Api -c Release -o /app --no-restore

# Runtime image — minimal, non-root
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS runtime
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "MyApp.Api.dll"]
```

## CI/CD (GitHub Actions)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --warnaserror

      - name: Format check
        run: dotnet format --verify-no-changes --no-restore

      - name: Test
        run: dotnet test --no-build --collect:"XPlat Code Coverage" --logger trx
        env:
          ConnectionStrings__TestDb: "Host=localhost;Database=testdb;Username=postgres;Password=test"

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## NuGet Package Publishing

```xml
<!-- For library projects -->
<PropertyGroup>
  <PackageId>MyCompany.MyLibrary</PackageId>
  <Version>1.0.0</Version>
  <Description>A useful library</Description>
  <Authors>Your Name</Authors>
  <PackageLicenseExpression>MIT</PackageLicenseExpression>
  <PackageReadmeFile>README.md</PackageReadmeFile>
  <GenerateDocumentationFile>true</GenerateDocumentationFile>
  <PublishRepositoryUrl>true</PublishRepositoryUrl>
  <EmbedUntrackedSources>true</EmbedUntrackedSources>
  <IncludeSymbols>true</IncludeSymbols>
  <SymbolPackageFormat>snupkg</SymbolPackageFormat>
</PropertyGroup>
```

```bash
dotnet pack -c Release
dotnet nuget push bin/Release/*.nupkg --source https://api.nuget.org/v3/index.json --api-key $NUGET_KEY
```

## Logging with Serilog

```csharp
// Program.cs
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithEnvironmentName()
        .WriteTo.Console(new CompactJsonFormatter())
        .WriteTo.Seq(context.Configuration["Seq:Url"]!));

// Structured logging — always use templates, never interpolation
logger.LogInformation("Processing order {OrderId} for {CustomerId}", order.Id, order.CustomerId);
// NOT: logger.LogInformation($"Processing order {order.Id}"); // Defeats structured logging
```

## Anti-Patterns

```csharp
// Never: hardcoded connection strings
var conn = "Host=localhost;Database=mydb;Password=secret";
// Use configuration and user-secrets for development

// Never: version conflicts across projects
// Use Directory.Packages.props for central version management

// Never: shipping debug builds
// Always build Release for production: dotnet publish -c Release

// Never: skipping dotnet format in CI
// Code style drift makes reviews harder and diffs noisier
```
