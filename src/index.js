import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Cursor rules directory paths
const CURSOR_RULES_DIR = '.cursor/rules';          // New path (Cursor IDE)
const LEGACY_CURSORRULES_DIR = '.cursorrules';      // Deprecated path

// Read package.json for version info
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const PACKAGE_NAME = packageJson.name;
const CURRENT_VERSION = packageJson.version;
const REPO_URL = 'https://github.com/djm204/agentic-team-templates';
const CHANGELOG_URL = `${REPO_URL}/releases/tag/${PACKAGE_NAME}-v${CURRENT_VERSION}`;

// Available templates
const TEMPLATES = {
  'blockchain': {
    description: 'Smart contracts, DeFi protocols, and Web3 applications (Solidity, Foundry, Viem)',
    rules: ['defi-patterns.md', 'gas-optimization.md', 'overview.md', 'security.md', 'smart-contracts.md', 'testing.md', 'web3-integration.md']
  },
  'cpp-expert': {
    description: 'Principal-level C++ engineering (modern C++, RAII, concurrency, templates, performance)',
    rules: ['concurrency.md', 'error-handling.md', 'memory-and-ownership.md', 'modern-cpp.md', 'overview.md', 'performance.md', 'testing.md', 'tooling.md']
  },
  'csharp-expert': {
    description: 'Principal-level C# engineering (async, DI, EF Core, ASP.NET Core, testing)',
    rules: ['aspnet-core.md', 'async-patterns.md', 'dependency-injection.md', 'error-handling.md', 'language-features.md', 'overview.md', 'performance.md', 'testing.md', 'tooling.md']
  },
  'cli-tools': {
    description: 'Command-line applications and developer tools (Cobra, Commander, Click)',
    rules: ['architecture.md', 'arguments.md', 'distribution.md', 'error-handling.md', 'overview.md', 'testing.md', 'user-experience.md']
  },
  'data-engineering': {
    description: 'Data platforms and pipelines (ETL, data modeling, data quality)',
    rules: ['data-modeling.md', 'data-quality.md', 'overview.md', 'performance.md', 'pipeline-design.md', 'security.md', 'testing.md']
  },
  'devops-sre': {
    description: 'DevOps and SRE practices (incident management, observability, SLOs, chaos engineering)',
    rules: ['capacity-planning.md', 'change-management.md', 'chaos-engineering.md', 'disaster-recovery.md', 'incident-management.md', 'observability.md', 'overview.md', 'postmortems.md', 'runbooks.md', 'slo-sli.md', 'toil-reduction.md']
  },
  'documentation': {
    description: 'Technical documentation standards (READMEs, API docs, ADRs, code comments)',
    rules: ['adr.md', 'api-documentation.md', 'code-comments.md', 'maintenance.md', 'overview.md', 'readme-standards.md']
  },
  'educator': {
    description: 'World-class pedagogy with evidence-based teaching, learning retention, gamification, and assessment design',
    rules: ['accessibility.md', 'assessment.md', 'curriculum.md', 'engagement.md', 'instructional-design.md', 'overview.md', 'retention.md']
  },
  'fullstack': {
    description: 'Full-stack web applications (Next.js, Nuxt, SvelteKit, Remix)',
    rules: ['api-contracts.md', 'architecture.md', 'overview.md', 'shared-types.md', 'testing.md']
  },
  'golang-expert': {
    description: 'Principal-level Go engineering (concurrency, stdlib, production patterns, testing)',
    rules: ['concurrency.md', 'error-handling.md', 'interfaces-and-types.md', 'overview.md', 'performance.md', 'production-patterns.md', 'stdlib-and-tooling.md', 'testing.md']
  },
  'java-expert': {
    description: 'Principal-level Java engineering (JVM, Spring Boot, concurrency, JPA, testing)',
    rules: ['concurrency.md', 'error-handling.md', 'modern-java.md', 'overview.md', 'performance.md', 'persistence.md', 'spring-boot.md', 'testing.md', 'tooling.md']
  },
  'javascript-expert': {
    description: 'Principal-level JavaScript & TypeScript engineering (Node.js, React, type system, testing)',
    rules: ['language-deep-dive.md', 'node-patterns.md', 'overview.md', 'performance.md', 'react-patterns.md', 'testing.md', 'tooling.md', 'typescript-deep-dive.md']
  },
  'kotlin-expert': {
    description: 'Principal-level Kotlin engineering (coroutines, multiplatform, Ktor, Spring Boot, testing)',
    rules: ['coroutines.md', 'error-handling.md', 'frameworks.md', 'language-features.md', 'overview.md', 'performance.md', 'testing.md', 'tooling.md']
  },
  'ml-ai': {
    description: 'Machine learning and AI systems (model development, deployment, monitoring)',
    rules: ['data-engineering.md', 'deployment.md', 'model-development.md', 'monitoring.md', 'overview.md', 'security.md', 'testing.md']
  },
  'mobile': {
    description: 'Mobile applications (React Native, Flutter, native iOS/Android)',
    rules: ['navigation.md', 'offline-first.md', 'overview.md', 'performance.md', 'testing.md']
  },
  'platform-engineering': {
    description: 'Internal developer platforms, infrastructure automation, and reliability engineering',
    rules: ['ci-cd.md', 'developer-experience.md', 'infrastructure-as-code.md', 'kubernetes.md', 'observability.md', 'overview.md', 'security.md', 'testing.md']
  },
  'product-manager': {
    description: 'Product management with customer-centric discovery, prioritization, and execution',
    rules: ['communication.md', 'discovery.md', 'metrics.md', 'overview.md', 'prioritization.md', 'requirements.md']
  },
  'python-expert': {
    description: 'Principal-level Python engineering (type system, async, testing, FastAPI, Django)',
    rules: ['async-python.md', 'overview.md', 'patterns-and-idioms.md', 'performance.md', 'testing.md', 'tooling.md', 'type-system.md', 'web-and-apis.md']
  },
  'qa-engineering': {
    description: 'Quality assurance programs for confident, rapid software delivery',
    rules: ['automation.md', 'metrics.md', 'overview.md', 'quality-gates.md', 'test-design.md', 'test-strategy.md']
  },
  'rust-expert': {
    description: 'Principal-level Rust engineering (ownership, concurrency, unsafe, traits, async)',
    rules: ['concurrency.md', 'ecosystem-and-tooling.md', 'error-handling.md', 'overview.md', 'ownership-and-borrowing.md', 'performance-and-unsafe.md', 'testing.md', 'traits-and-generics.md']
  },
  'swift-expert': {
    description: 'Principal-level Swift engineering (concurrency, SwiftUI, protocols, testing, Apple platforms)',
    rules: ['concurrency.md', 'error-handling.md', 'language-features.md', 'overview.md', 'performance.md', 'swiftui.md', 'testing.md', 'tooling.md']
  },
  'testing': {
    description: 'Comprehensive testing practices (TDD, test design, CI/CD integration, performance testing)',
    rules: ['advanced-techniques.md', 'ci-cd-integration.md', 'overview.md', 'performance-testing.md', 'quality-metrics.md', 'reliability.md', 'tdd-methodology.md', 'test-data.md', 'test-design.md', 'test-types.md']
  },
  'utility-agent': {
    description: 'AI agent utilities with context management and hallucination prevention',
    rules: ['action-control.md', 'context-management.md', 'hallucination-prevention.md', 'overview.md', 'token-optimization.md']
  },
  'ux-designer': {
    description: 'Principal-level UX design with user research, interaction design, design systems, accessibility, and emotional design',
    rules: ['accessibility.md', 'emotional-design.md', 'handoff.md', 'information-architecture.md', 'interaction-design.md', 'overview.md', 'research.md', 'visual-design.md']
  },
  'web-backend': {
    description: 'Backend APIs and services (REST, GraphQL, microservices)',
    rules: ['api-design.md', 'authentication.md', 'database-patterns.md', 'error-handling.md', 'overview.md', 'security.md', 'testing.md']
  },
  'web-frontend': {
    description: 'Frontend web applications (SPAs, SSR, static sites, PWAs)',
    rules: ['accessibility.md', 'component-patterns.md', 'overview.md', 'performance.md', 'state-management.md', 'styling.md', 'testing.md']
  }
};

// Shorthand aliases for language expert templates
const TEMPLATE_ALIASES = {
  'js': 'javascript-expert',
  'javascript': 'javascript-expert',
  'ts': 'javascript-expert',
  'typescript': 'javascript-expert',
  'go': 'golang-expert',
  'golang': 'golang-expert',
  'py': 'python-expert',
  'python': 'python-expert',
  'rs': 'rust-expert',
  'rust': 'rust-expert',
  'swift': 'swift-expert',
  'kotlin': 'kotlin-expert',
  'kt': 'kotlin-expert',
  'java': 'java-expert',
  'cpp': 'cpp-expert',
  'csharp': 'csharp-expert',
  'cs': 'csharp-expert',
  'teach': 'educator',
  'teacher': 'educator',
  'ux': 'ux-designer',
  'uxd': 'ux-designer',
  'design': 'ux-designer',
  'designer': 'ux-designer',
};

/**
 * Resolve a template alias to its canonical name
 * @param {string} name - Template name or alias
 * @returns {string} Canonical template name
 */
function resolveTemplateAlias(name) {
  return TEMPLATE_ALIASES[name] || name;
}

const SHARED_RULES = [
  'code-quality.md',
  'communication.md', 
  'core-principles.md',
  'git-workflow.md',
  'security-fundamentals.md'
];

// Supported IDEs/tools
const SUPPORTED_IDES = ['cursor', 'claude', 'codex'];
const DEFAULT_IDES = ['cursor', 'claude', 'codex']; // Default: install for all IDEs

// Colors
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

/**
 * Compare two semver version strings
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * Check npm for the latest version and notify if update available
 * Fails silently on network errors
 */
async function checkForUpdates() {
  try {
    const { stdout } = await execAsync(`npm view ${PACKAGE_NAME} version`, {
      timeout: 5000, // 5 second timeout
    });
    const latestVersion = stdout.trim();
    
    if (compareVersions(CURRENT_VERSION, latestVersion) < 0) {
      console.log(colors.cyan(`
┌────────────────────────────────────────────────────────────┐
│  Update available: ${CURRENT_VERSION} → ${latestVersion}                              │
│  Run: npx ${PACKAGE_NAME}@latest                │
└────────────────────────────────────────────────────────────┘
`));
    }
  } catch {
    // Silently ignore network errors or timeouts
  }
}

function printBanner() {
  console.log(colors.blue(`
╔═══════════════════════════════════════════════════════════╗
║           Agentic Team Templates Installer                ║
╚═══════════════════════════════════════════════════════════╝
`));
}

function printHelp() {
  console.log(`${colors.yellow('Usage:')}
  npx cursor-templates <templates...> [options]
  npx cursor-templates --remove <templates...> [options]
  npx cursor-templates --reset [options]

${colors.yellow('Options:')}
  --ide=<name>   Install for specific IDE (cursor, claude, codex)
                 Can be specified multiple times: --ide=cursor --ide=claude
                 Default: all (cursor, claude, codex)
  --list, -l     List available templates
  --help, -h     Show this help message
  --version, -v  Show version number
  --dry-run      Show what would be changed
  --force, -f    Overwrite/remove even if files were modified
  --yes, -y      Skip confirmation prompt (for --remove and --reset)

${colors.yellow('Removal Options:')}
  --remove       Remove specified templates (keeps shared rules and other templates)
  --reset        Remove ALL installed content (shared rules, templates, generated files)

${colors.yellow('IDE Targets:')}
  cursor         .cursor/rules/ directory (Cursor IDE)
  claude         CLAUDE.md file (Claude Code, Cursor with Claude)
  codex          .github/copilot-instructions.md (GitHub Copilot)

${colors.yellow('Shorthand Aliases:')}
  js, ts, javascript, typescript → javascript-expert
  go, golang                     → golang-expert
  py, python                     → python-expert
  rs, rust                       → rust-expert
  swift                          → swift-expert
  kotlin, kt                     → kotlin-expert
  java                           → java-expert
  cpp                            → cpp-expert
  csharp, cs                     → csharp-expert
  teach, teacher                 → educator
  ux, uxd, design, designer      → ux-designer

${colors.yellow('Examples:')}
  npx cursor-templates js
  npx cursor-templates web-frontend
  npx cursor-templates web-frontend --ide=cursor
  npx cursor-templates web-frontend --ide=claude --ide=codex
  npx cursor-templates fullstack --ide=codex
  npx cursor-templates web-backend --force

${colors.yellow('Removal Examples:')}
  npx cursor-templates --remove web-frontend
  npx cursor-templates --remove web-frontend web-backend
  npx cursor-templates --remove web-frontend --ide=cursor
  npx cursor-templates --reset
  npx cursor-templates --reset --ide=cursor
  npx cursor-templates --reset --yes

${colors.dim('Shared rules (code-quality, security, git-workflow, etc.) are always included.')}
${colors.dim('Identical files are skipped. Modified files are preserved; ours saved as *-1.md.')}
${colors.dim('CLAUDE.md: missing sections are intelligently merged (not overwritten).')}
`);
}

function printTemplates() {
  // Build reverse map: canonical name -> list of aliases
  const aliasesByTemplate = {};
  for (const [alias, canonical] of Object.entries(TEMPLATE_ALIASES)) {
    if (!aliasesByTemplate[canonical]) {
      aliasesByTemplate[canonical] = [];
    }
    aliasesByTemplate[canonical].push(alias);
  }

  console.log(colors.yellow('Available Templates:\n'));

  for (const [name, info] of Object.entries(TEMPLATES)) {
    const aliases = aliasesByTemplate[name];
    const aliasSuffix = aliases ? ` ${colors.dim(`(aliases: ${aliases.join(', ')})`)}` : '';
    console.log(`  ${colors.green(name)}${aliasSuffix}`);
    console.log(`    ${info.description}\n`);
  }

  console.log(colors.blue('Shared rules (always included):'));
  for (const rule of SHARED_RULES) {
    console.log(`  - ${rule.replace('.md', '')}`);
  }
  console.log();
}

/**
 * Check if two files have identical content
 */
function filesMatch(file1, file2) {
  try {
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');
    return content1 === content2;
  } catch {
    return false;
  }
}

/**
 * Parse markdown content into sections by ## headings
 * @param {string} content - Markdown content
 * @returns {Array<{heading: string, content: string, signature: string}>}
 */
function parseMarkdownSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let preamble = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentSection.lines.join('\n');
        currentSection.signature = generateSectionSignature(currentSection.heading, currentSection.lines);
        delete currentSection.lines;
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        heading: line.slice(3).trim(),
        lines: []
      };
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else {
      // Content before first ## heading (preamble)
      preamble.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = currentSection.lines.join('\n');
    currentSection.signature = generateSectionSignature(currentSection.heading, currentSection.lines);
    delete currentSection.lines;
    sections.push(currentSection);
  }

  return { preamble: preamble.join('\n'), sections };
}

/**
 * Generate a signature for a section based on heading + first meaningful lines
 * Used for matching sections even if heading text differs slightly
 * @param {string} heading
 * @param {string[]} lines
 * @returns {string}
 */
function generateSectionSignature(heading, lines) {
  // Normalize heading: lowercase, remove special chars, collapse whitespace
  const normalizedHeading = heading.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Get first 3 non-empty, non-heading lines for content signature
  const meaningfulLines = lines
    .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('-'))
    .slice(0, 3)
    .map(l => l.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim())
    .join(' ');

  return `${normalizedHeading}::${meaningfulLines.slice(0, 100)}`;
}

/**
 * Find sections from template that are missing in existing content
 * @param {string} existingContent
 * @param {string} templateContent
 * @returns {{missing: Array<{heading: string, content: string}>, matchedCount: number}}
 */
function findMissingSections(existingContent, templateContent) {
  const existing = parseMarkdownSections(existingContent);
  const template = parseMarkdownSections(templateContent);

  const existingSignatures = new Set(existing.sections.map(s => s.signature));
  const existingHeadings = new Set(existing.sections.map(s => s.heading.toLowerCase()));

  const missing = [];
  let matchedCount = 0;

  for (const section of template.sections) {
    // Check by signature first (heading + content), then by heading alone
    const signatureMatch = existingSignatures.has(section.signature);
    const headingMatch = existingHeadings.has(section.heading.toLowerCase());

    if (signatureMatch || headingMatch) {
      matchedCount++;
    } else {
      missing.push(section);
    }
  }

  return { missing, matchedCount };
}

/**
 * Merge template sections into existing content, inserting missing sections in template order
 * @param {string} existingContent
 * @param {string} templateContent
 * @returns {{merged: string, addedSections: string[]}}
 */
function mergeClaudeContent(existingContent, templateContent) {
  const existing = parseMarkdownSections(existingContent);
  const template = parseMarkdownSections(templateContent);
  const { missing } = findMissingSections(existingContent, templateContent);

  if (missing.length === 0) {
    return { merged: existingContent, addedSections: [] };
  }

  // Build a map of existing sections by normalized heading for insertion point lookup
  const existingByHeading = new Map();
  existing.sections.forEach((s, i) => {
    existingByHeading.set(s.heading.toLowerCase(), i);
  });

  // Find template section order and determine where to insert missing sections
  const templateOrder = template.sections.map(s => s.heading.toLowerCase());
  
  // For each missing section, find the best insertion point based on template order
  const insertions = []; // { afterIndex: number, section: section }
  
  for (const missingSection of missing) {
    const missingIndex = templateOrder.indexOf(missingSection.heading.toLowerCase());
    
    // Find the closest preceding section that exists in the existing content
    let insertAfterIndex = -1; // -1 means insert at beginning (after preamble)
    
    for (let i = missingIndex - 1; i >= 0; i--) {
      const precedingHeading = templateOrder[i];
      if (existingByHeading.has(precedingHeading)) {
        insertAfterIndex = existingByHeading.get(precedingHeading);
        break;
      }
    }
    
    insertions.push({ afterIndex: insertAfterIndex, section: missingSection });
  }

  // Sort insertions by afterIndex (descending) so we insert from bottom to top
  // This preserves indices as we insert
  insertions.sort((a, b) => b.afterIndex - a.afterIndex);

  // Build the merged content
  const mergedSections = [...existing.sections];
  const addedSections = [];

  for (const { afterIndex, section } of insertions) {
    const insertAt = afterIndex + 1;
    mergedSections.splice(insertAt, 0, section);
    addedSections.push(section.heading);
  }

  // Reconstruct the markdown
  let merged = existing.preamble;
  if (merged && !merged.endsWith('\n\n')) {
    merged = merged.trimEnd() + '\n\n';
  }

  for (const section of mergedSections) {
    merged += `## ${section.heading}\n${section.content}\n`;
  }

  // addedSections is in reverse order due to sorting, reverse it back
  addedSections.reverse();

  return { merged: merged.trimEnd() + '\n', addedSections };
}

/**
 * Get alternate filename with -1 suffix (e.g., code-quality.md -> code-quality-1.md)
 */
function getAlternateFilename(filepath) {
  const dir = path.dirname(filepath);
  const ext = path.extname(filepath);
  const base = path.basename(filepath, ext);
  return path.join(dir, `${base}-1${ext}`);
}

/**
 * Copy file, handling existing files intelligently
 * @returns {{ status: string, destFile: string }}
 *   status: 'copied' | 'skipped' | 'renamed' | 'updated'
 *   destFile: actual destination path (may differ if renamed)
 */
function copyFile(src, dest, force = false) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const exists = fs.existsSync(dest);
  
  if (!exists) {
    // File doesn't exist - copy normally
    fs.copyFileSync(src, dest);
    return { status: 'copied', destFile: dest };
  }
  
  if (force) {
    // Force mode - overwrite
    fs.copyFileSync(src, dest);
    return { status: 'updated', destFile: dest };
  }
  
  // File exists - check if it matches our template
  if (filesMatch(src, dest)) {
    // Same content - skip
    return { status: 'skipped', destFile: dest };
  }
  
  // Different content - save ours alongside with -1 suffix
  const altDest = getAlternateFilename(dest);
  fs.copyFileSync(src, altDest);
  return { status: 'renamed', destFile: altDest };
}

function generateClaudeMdContent(installedTemplates) {
  const templateList = installedTemplates
    .map(t => `- **${t}**: ${TEMPLATES[t].description}`)
    .join('\n');

  const templateRuleTables = installedTemplates.map(template => {
    const rules = TEMPLATES[template].rules
      .map(rule => `| \`${template}-${rule}\` | ${rule.replace('.md', '').replace(/-/g, ' ')} guidelines |`)
      .join('\n');
    
    return `
#### ${template.charAt(0).toUpperCase() + template.slice(1)} Rules

| Rule | Purpose |
|------|---------|
${rules}`;
  }).join('\n');

  return `# CLAUDE.md - Development Guide

This project uses AI-assisted development with Cursor. The rules in \`.cursor/rules/\` provide domain-specific guidance for the AI assistant.

---

## Quick Reference

### Installed Templates

- **Shared** (always included): Core principles, code quality, security, git workflow, communication
${templateList}

### Rule Files

All rules are in \`.cursor/rules/\`. The AI assistant automatically reads these when working on your project.

#### Shared Rules (Apply to All Code)

| Rule | Purpose |
|------|---------|
| \`core-principles.md\` | Honesty, simplicity, testing requirements |
| \`code-quality.md\` | SOLID, DRY, clean code patterns |
| \`security-fundamentals.md\` | Zero trust, input validation, secrets |
| \`git-workflow.md\` | Commits, branches, PRs, safety |
| \`communication.md\` | Direct, objective, professional |
${templateRuleTables}

---

## Development Principles

### 1. Honesty Over Output

- If something doesn't work, say it doesn't work
- If you don't know, say you don't know
- Never hide errors or suppress warnings
- Admit mistakes early

### 2. Security First

- Zero trust: Every input is hostile until proven otherwise
- Validate and sanitize all inputs
- No secrets in code or logs
- Least privilege principle

### 3. Tests Are Required

- No feature is complete without tests
- Green CI or it didn't happen
- Test behavior, not implementation

### 4. Code Quality

- SOLID principles
- DRY (Don't Repeat Yourself)
- Functional programming bias
- Explicit over implicit

---

## Definition of Done

A feature is complete when:

- [ ] Code written and reviewed
- [ ] Tests written and passing
- [ ] No linting errors
- [ ] Security reviewed
- [ ] Documentation updated
- [ ] Committed with conventional commit message

---

## Customization

### Adding Project-Specific Rules

1. Create new \`.md\` files in \`.cursor/rules/\`
2. Follow the existing naming convention
3. Include clear examples and anti-patterns

### Modifying Existing Rules

Edit files directly in \`.cursor/rules/\`. Changes take effect immediately.

### Updating Templates

Re-run the installer to update (will overwrite existing rules):

\`\`\`bash
npx cursor-templates ${installedTemplates.join(' ')}
\`\`\`

---

## Resources

- [Cursor Documentation](https://cursor.sh/docs)
`;
}

function generateClaudeMd(targetDir, installedTemplates) {
  const content = generateClaudeMdContent(installedTemplates);
  fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), content);
}

function generateClaudeMdToPath(targetDir, installedTemplates, destPath) {
  const content = generateClaudeMdContent(installedTemplates);
  fs.writeFileSync(destPath, content);
}

/**
 * Generate content for GitHub Copilot instructions file
 */
function generateCopilotInstructionsContent(installedTemplates) {
  const templateList = installedTemplates
    .map(t => `- ${t}: ${TEMPLATES[t].description}`)
    .join('\n');

  // Read and concatenate all shared rules
  const sharedRulesContent = SHARED_RULES.map(rule => {
    const rulePath = path.join(TEMPLATES_DIR, '_shared', rule);
    try {
      return fs.readFileSync(rulePath, 'utf8');
    } catch {
      return '';
    }
  }).filter(Boolean).join('\n\n---\n\n');

  // Read and concatenate template-specific rules
  const templateRulesContent = installedTemplates.map(template => {
    return TEMPLATES[template].rules.map(rule => {
      const rulePath = path.join(TEMPLATES_DIR, template, '.cursor', 'rules', rule);
      try {
        return fs.readFileSync(rulePath, 'utf8');
      } catch {
        return '';
      }
    }).filter(Boolean).join('\n\n');
  }).join('\n\n---\n\n');

  return `# Copilot Instructions

This file provides coding guidelines for GitHub Copilot in this project.

## Project Configuration

**Installed Templates:** ${installedTemplates.join(', ')}

${templateList}

---

## Core Principles

### Honesty Over Output
- If something doesn't work, say it doesn't work
- If you don't know, say you don't know
- Never hide errors or suppress warnings

### Security First
- Zero trust: Every input is hostile until proven otherwise
- Validate and sanitize all inputs
- No secrets in code or logs

### Tests Are Required
- No feature is complete without tests
- Test behavior, not implementation

### Code Quality
- SOLID principles
- DRY (Don't Repeat Yourself)
- Explicit over implicit

---

## Shared Guidelines

${sharedRulesContent}

---

## Template-Specific Guidelines

${templateRulesContent}

---

## Definition of Done

A feature is complete when:
- [ ] Code written and reviewed
- [ ] Tests written and passing
- [ ] No linting errors
- [ ] Security reviewed
- [ ] Documentation updated
`;
}

async function install(targetDir, templates, dryRun = false, force = false, ides = DEFAULT_IDES, skipConfirm = false) {
  const stats = { copied: 0, skipped: 0, updated: 0, renamed: 0 };
  const renamedFiles = [];
  const installedFor = [];

  console.log(`${colors.blue('Installing to:')} ${targetDir}`);
  console.log(`${colors.blue('Target IDEs:')} ${ides.join(', ')}`);
  if (!force) {
    console.log(colors.dim('(identical files skipped, modified files preserved with ours saved as *-1.md)'));
  }
  console.log();

  // 1. Install .cursor/rules/ for Cursor IDE
  if (ides.includes('cursor')) {
    installedFor.push('cursor');
    const cursorRulesDir = path.join(targetDir, CURSOR_RULES_DIR);

    if (!dryRun && !fs.existsSync(cursorRulesDir)) {
      fs.mkdirSync(cursorRulesDir, { recursive: true });
    }

    // Install shared rules
    console.log(colors.green(`► Installing shared rules (${CURSOR_RULES_DIR}/)...`));
    for (const rule of SHARED_RULES) {
      const src = path.join(TEMPLATES_DIR, '_shared', rule);
      const dest = path.join(cursorRulesDir, rule);
      
      if (dryRun) {
        const exists = fs.existsSync(dest);
        if (!exists) {
          console.log(`  ${colors.dim('[copy]')} ${rule}`);
        } else if (force) {
          console.log(`  ${colors.dim('[update]')} ${rule}`);
        } else if (filesMatch(src, dest)) {
          console.log(`  ${colors.yellow('[skip]')} ${rule} (identical)`);
        } else {
          const altName = path.basename(getAlternateFilename(dest));
          console.log(`  ${colors.blue('[rename]')} ${rule} → ${altName}`);
        }
      } else {
        const result = copyFile(src, dest, force);
        stats[result.status]++;
        if (result.status === 'skipped') {
          console.log(`  ${colors.yellow('[skip]')} ${rule} (identical)`);
        } else if (result.status === 'renamed') {
          const altName = path.basename(result.destFile);
          renamedFiles.push({ original: rule, renamed: altName });
          console.log(`  ${colors.blue('[rename]')} ${rule} → ${altName}`);
        } else {
          console.log(`  ${colors.dim(`[${result.status}]`)} ${rule}`);
        }
      }
    }
    console.log();

    // Install template-specific rules
    for (const template of templates) {
      console.log(colors.green(`► Installing ${template} template (${CURSOR_RULES_DIR}/)...`));

      for (const rule of TEMPLATES[template].rules) {
        const src = path.join(TEMPLATES_DIR, template, '.cursor', 'rules', rule);
        const dest = path.join(cursorRulesDir, `${template}-${rule}`);
        const destName = `${template}-${rule}`;
        
        if (dryRun) {
          const exists = fs.existsSync(dest);
          if (!exists) {
            console.log(`  ${colors.dim('[copy]')} ${destName}`);
          } else if (force) {
            console.log(`  ${colors.dim('[update]')} ${destName}`);
          } else if (filesMatch(src, dest)) {
            console.log(`  ${colors.yellow('[skip]')} ${destName} (identical)`);
          } else {
            const altName = path.basename(getAlternateFilename(dest));
            console.log(`  ${colors.blue('[rename]')} ${destName} → ${altName}`);
          }
        } else {
          const result = copyFile(src, dest, force);
          stats[result.status]++;
          if (result.status === 'skipped') {
            console.log(`  ${colors.yellow('[skip]')} ${destName} (identical)`);
          } else if (result.status === 'renamed') {
            const altName = path.basename(result.destFile);
            renamedFiles.push({ original: destName, renamed: altName });
            console.log(`  ${colors.blue('[rename]')} ${destName} → ${altName}`);
          } else {
            console.log(`  ${colors.dim(`[${result.status}]`)} ${destName}`);
          }
        }
      }
      console.log();
    }

    // Legacy .cursorrules/ detection and cleanup
    const legacyDir = path.join(targetDir, LEGACY_CURSORRULES_DIR);
    if (fs.existsSync(legacyDir)) {
      console.log(colors.yellow(`⚠  Deprecated ${LEGACY_CURSORRULES_DIR}/ directory detected.`));
      console.log(colors.yellow(`   Cursor now uses ${CURSOR_RULES_DIR}/ for rule files.`));
      console.log(colors.yellow(`   New rules have been installed to ${CURSOR_RULES_DIR}/.`));
      console.log();
      console.log(colors.yellow(`   Your existing ${LEGACY_CURSORRULES_DIR}/ files are still present.`));
      console.log(colors.yellow(`   Support for ${LEGACY_CURSORRULES_DIR}/ will be removed in a future version.`));
      console.log();

      if (!dryRun) {
        const shouldCleanup = skipConfirm || await confirm(
          colors.yellow(`? Would you like to remove the deprecated ${LEGACY_CURSORRULES_DIR}/ directory?`)
        );

        if (shouldCleanup) {
          // Copy legacy rule files to .cursor/rules/ before removing (don't overwrite existing)
          const legacyEntries = fs.readdirSync(legacyDir, { withFileTypes: true });
          let copiedCount = 0;
          for (const entry of legacyEntries) {
            if (!entry.isFile()) continue;
            const name = entry.name;
            const legacyPath = path.join(legacyDir, name);
            const destPath = path.join(cursorRulesDir, name);
            if (!fs.existsSync(destPath)) {
              fs.copyFileSync(legacyPath, destPath);
              console.log(colors.dim(`  ${colors.green('[migrated]')} ${name} → ${CURSOR_RULES_DIR}/`));
              copiedCount++;
            }
          }
          if (copiedCount > 0) {
            console.log(colors.green(`  ✓ Migrated ${copiedCount} file(s) from ${LEGACY_CURSORRULES_DIR}/ to ${CURSOR_RULES_DIR}/.`));
          }
          fs.rmSync(legacyDir, { recursive: true });
          console.log(colors.green(`  ✓ Removed deprecated ${LEGACY_CURSORRULES_DIR}/ directory.`));
        } else {
          // Create reference file so Cursor AI knows about legacy rules
          const noticePath = path.join(cursorRulesDir, 'legacy-cursorrules-notice.md');
          const noticeContent = `# Legacy Rules Notice

This project contains additional rule files in the deprecated \`.cursorrules/\` directory
at the project root. Those rules are still active and should be consulted alongside the
rules in this directory.

The \`.cursorrules/\` directory will be removed in a future version.
To clean up manually, move any custom rules to \`.cursor/rules/\` and delete \`.cursorrules/\`.
`;
          fs.writeFileSync(noticePath, noticeContent);
          console.log(colors.dim(`  Created ${CURSOR_RULES_DIR}/legacy-cursorrules-notice.md as a reference.`));
        }
      } else {
        console.log(colors.dim('  (dry-run: skipping cleanup prompt)'));
      }
      console.log();
    }
  }

  // 2. Generate CLAUDE.md for Claude Code
  if (ides.includes('claude')) {
    installedFor.push('claude');
    const claudePath = path.join(targetDir, 'CLAUDE.md');
    const claudeExists = fs.existsSync(claudePath);
    const templateContent = generateClaudeMdContent(templates);
    
    console.log(colors.green('► Generating CLAUDE.md (Claude Code)...'));
    if (dryRun) {
      if (!claudeExists) {
        console.log(`  ${colors.dim('[copy]')} CLAUDE.md`);
      } else if (force) {
        console.log(`  ${colors.dim('[update]')} CLAUDE.md`);
      } else {
        const existingContent = fs.readFileSync(claudePath, 'utf8');
        const { missing } = findMissingSections(existingContent, templateContent);
        if (missing.length === 0) {
          console.log(`  ${colors.yellow('[skip]')} CLAUDE.md (all sections present)`);
        } else {
          console.log(`  ${colors.blue('[merge]')} CLAUDE.md (would add ${missing.length} section(s))`);
          for (const section of missing) {
            console.log(`    ${colors.dim('+')} ${section.heading}`);
          }
        }
      }
    } else if (!claudeExists) {
      fs.writeFileSync(claudePath, templateContent);
      console.log(`  ${colors.dim('[copied]')} CLAUDE.md`);
      stats.copied++;
    } else if (force) {
      fs.writeFileSync(claudePath, templateContent);
      console.log(`  ${colors.dim('[updated]')} CLAUDE.md`);
      stats.updated++;
    } else {
      const existingContent = fs.readFileSync(claudePath, 'utf8');
      const { merged, addedSections } = mergeClaudeContent(existingContent, templateContent);
      
      if (addedSections.length === 0) {
        console.log(`  ${colors.yellow('[skip]')} CLAUDE.md (all sections present)`);
        stats.skipped++;
      } else {
        fs.writeFileSync(claudePath, merged);
        console.log(`  ${colors.blue('[merged]')} CLAUDE.md`);
        console.log(`    ${colors.green('Added sections:')}`);
        for (const heading of addedSections) {
          console.log(`      ${colors.dim('+')} ${heading}`);
        }
        stats.updated++;
      }
    }
    console.log();
  }

  // 3. Generate .github/copilot-instructions.md for GitHub Copilot (Codex)
  if (ides.includes('codex')) {
    installedFor.push('codex');
    const githubDir = path.join(targetDir, '.github');
    const copilotPath = path.join(githubDir, 'copilot-instructions.md');
    const copilotExists = fs.existsSync(copilotPath);
    const copilotContent = generateCopilotInstructionsContent(templates);
    
    if (!dryRun && !fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }
    
    console.log(colors.green('► Generating .github/copilot-instructions.md (GitHub Copilot)...'));
    if (dryRun) {
      if (!copilotExists) {
        console.log(`  ${colors.dim('[copy]')} .github/copilot-instructions.md`);
      } else if (force) {
        console.log(`  ${colors.dim('[update]')} .github/copilot-instructions.md`);
      } else {
        const existingContent = fs.readFileSync(copilotPath, 'utf8');
        const { missing } = findMissingSections(existingContent, copilotContent);
        if (missing.length === 0) {
          console.log(`  ${colors.yellow('[skip]')} .github/copilot-instructions.md (all sections present)`);
        } else {
          console.log(`  ${colors.blue('[merge]')} .github/copilot-instructions.md (would add ${missing.length} section(s))`);
        }
      }
    } else if (!copilotExists) {
      fs.writeFileSync(copilotPath, copilotContent);
      console.log(`  ${colors.dim('[copied]')} .github/copilot-instructions.md`);
      stats.copied++;
    } else if (force) {
      fs.writeFileSync(copilotPath, copilotContent);
      console.log(`  ${colors.dim('[updated]')} .github/copilot-instructions.md`);
      stats.updated++;
    } else {
      const existingContent = fs.readFileSync(copilotPath, 'utf8');
      const { merged, addedSections } = mergeClaudeContent(existingContent, copilotContent);
      
      if (addedSections.length === 0) {
        console.log(`  ${colors.yellow('[skip]')} .github/copilot-instructions.md (all sections present)`);
        stats.skipped++;
      } else {
        fs.writeFileSync(copilotPath, merged);
        console.log(`  ${colors.blue('[merged]')} .github/copilot-instructions.md`);
        stats.updated++;
      }
    }
    console.log();
  }

  // Summary
  console.log(colors.green('════════════════════════════════════════════════════════════'));
  console.log(colors.green('✓ Installation complete!\n'));
  
  console.log(colors.yellow('Summary:'));
  console.log(`  - ${stats.copied} files created`);
  if (stats.updated > 0) {
    console.log(`  - ${stats.updated} files updated`);
  }
  if (stats.skipped > 0) {
    console.log(`  - ${stats.skipped} files skipped (identical to template)`);
  }
  if (stats.renamed > 0) {
    console.log(`  - ${colors.blue(`${stats.renamed} files saved as *-1.md`)} (yours preserved)`);
  }
  console.log();
  
  console.log(colors.yellow('Installed for:'));
  for (const ide of installedFor) {
    const ideInfo = {
      cursor: '.cursor/rules/ (Cursor IDE)',
      claude: 'CLAUDE.md (Claude Code)',
      codex: '.github/copilot-instructions.md (GitHub Copilot)'
    };
    console.log(`  - ${ideInfo[ide]}`);
  }
  console.log();
  
  console.log(colors.yellow('Templates:'));
  console.log('  - _shared (always included)');
  for (const template of templates) {
    console.log(`  - ${template}`);
  }
  console.log();
  
  if (renamedFiles.length > 0) {
    console.log(colors.blue('Files saved alongside existing (your files preserved):'));
    for (const { original, renamed } of renamedFiles) {
      console.log(`  - ${original} → ${renamed}`);
    }
    console.log(colors.dim('\nReview the -1 files and merge changes as needed.'));
    console.log(colors.dim('Use --force to overwrite existing files instead.'));
    console.log();
  }
  
  console.log(colors.blue('Next steps:'));
  if (installedFor.includes('claude')) {
    console.log('  1. Review CLAUDE.md for any customization');
  }
  if (installedFor.includes('codex')) {
    console.log('  2. Review .github/copilot-instructions.md');
  }
  console.log('  3. Commit the new files to your repository');
  console.log();
}

/**
 * Prompt user for confirmation
 * @param {string} message - The prompt message
 * @returns {Promise<boolean>}
 */
async function confirm(message) {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Check if a file was created by our installer (matches template content)
 * @param {string} filePath - Path to the file
 * @param {string} templatePath - Path to the template file
 * @returns {boolean}
 */
function isOurFile(filePath, templatePath) {
  if (!fs.existsSync(filePath)) return false;
  if (!fs.existsSync(templatePath)) return true; // No template to compare, assume ours
  return filesMatch(filePath, templatePath);
}

/**
 * Remove specific templates from the installation
 */
async function remove(targetDir, templates, dryRun = false, force = false, skipConfirm = false, ides = DEFAULT_IDES) {
  const stats = { removed: 0, skipped: 0, notFound: 0 };
  const filesToRemove = [];
  const modifiedFiles = [];

  console.log(`${colors.blue('Removing from:')} ${targetDir}`);
  console.log(`${colors.blue('Target IDEs:')} ${ides.join(', ')}`);
  console.log(`${colors.blue('Templates:')} ${templates.join(', ')}`);
  console.log();

  // 1. Collect files to remove from .cursor/rules/ (and legacy .cursorrules/)
  if (ides.includes('cursor')) {
    const cursorRulesDir = path.join(targetDir, CURSOR_RULES_DIR);
    const legacyDir = path.join(targetDir, LEGACY_CURSORRULES_DIR);
    const dirsToScan = [];

    if (fs.existsSync(cursorRulesDir)) dirsToScan.push({ dir: cursorRulesDir, label: CURSOR_RULES_DIR });
    if (fs.existsSync(legacyDir)) dirsToScan.push({ dir: legacyDir, label: LEGACY_CURSORRULES_DIR });

    if (dirsToScan.length > 0) {
      for (const template of templates) {
        console.log(colors.yellow(`► Scanning ${template} template files...`));

        for (const { dir, label } of dirsToScan) {
          for (const rule of TEMPLATES[template].rules) {
            const destName = `${template}-${rule}`;
            const destPath = path.join(dir, destName);
            const srcPath = path.join(TEMPLATES_DIR, template, '.cursor', 'rules', rule);

            if (!fs.existsSync(destPath)) {
              continue;
            }

            const isUnmodified = isOurFile(destPath, srcPath);
            const displayName = `${destName} (${label}/)`;

            if (!isUnmodified && !force) {
              console.log(`  ${colors.yellow('[modified]')} ${displayName} (use --force to remove)`);
              modifiedFiles.push(displayName);
              stats.skipped++;
            } else {
              console.log(`  ${colors.red('[remove]')} ${displayName}${!isUnmodified ? ' (modified, --force)' : ''}`);
              filesToRemove.push({ path: destPath, name: displayName });
            }
          }

          // Also check for -1 variant files
          for (const rule of TEMPLATES[template].rules) {
            const altName = `${template}-${rule.replace('.md', '-1.md')}`;
            const altPath = path.join(dir, altName);

            if (fs.existsSync(altPath)) {
              console.log(`  ${colors.red('[remove]')} ${altName} (${label}/, alternate file)`);
              filesToRemove.push({ path: altPath, name: altName });
            }
          }
        }

        // Check for legacy-cursorrules-notice.md in new dir
        const noticePath = path.join(cursorRulesDir, 'legacy-cursorrules-notice.md');
        if (fs.existsSync(noticePath)) {
          console.log(`  ${colors.red('[remove]')} legacy-cursorrules-notice.md`);
          filesToRemove.push({ path: noticePath, name: 'legacy-cursorrules-notice.md' });
        }

        // Log not-found for templates that weren't in either dir
        for (const rule of TEMPLATES[template].rules) {
          const destName = `${template}-${rule}`;
          const inNew = fs.existsSync(path.join(cursorRulesDir, destName));
          const inLegacy = fs.existsSync(path.join(legacyDir, destName));
          if (!inNew && !inLegacy) {
            console.log(`  ${colors.dim('[not found]')} ${destName}`);
            stats.notFound++;
          }
        }

        console.log();
      }
    } else {
      console.log(colors.dim(`No ${CURSOR_RULES_DIR}/ or ${LEGACY_CURSORRULES_DIR}/ directory found.\n`));
    }
  }

  // 2. Note about CLAUDE.md and copilot-instructions.md
  // These are regenerated, not patched, so we can't easily remove just one template's content
  // We'll warn the user about this
  if (ides.includes('claude') || ides.includes('codex')) {
    console.log(colors.yellow('Note: CLAUDE.md and copilot-instructions.md contain merged content.'));
    console.log(colors.dim('To update these files, re-run the installer with the remaining templates.\n'));
  }

  if (filesToRemove.length === 0) {
    console.log(colors.yellow('Nothing to remove.\n'));
    return;
  }

  // Confirmation
  if (!dryRun && !skipConfirm) {
    console.log(colors.yellow(`\nAbout to remove ${filesToRemove.length} file(s).`));
    const confirmed = await confirm(colors.red('Proceed with removal?'));
    if (!confirmed) {
      console.log(colors.dim('\nAborted.\n'));
      return;
    }
    console.log();
  }

  // Execute removal
  if (dryRun) {
    console.log(colors.yellow('DRY RUN - No files were removed.\n'));
  } else {
    for (const file of filesToRemove) {
      try {
        fs.unlinkSync(file.path);
        stats.removed++;
      } catch (err) {
        console.error(colors.red(`Failed to remove ${file.name}: ${err.message}`));
      }
    }
  }

  // Summary
  console.log(colors.green('════════════════════════════════════════════════════════════'));
  console.log(colors.green(`✓ Removal complete!\n`));
  
  console.log(colors.yellow('Summary:'));
  console.log(`  - ${stats.removed} files removed`);
  if (stats.skipped > 0) {
    console.log(`  - ${stats.skipped} files skipped (modified, use --force)`);
  }
  if (stats.notFound > 0) {
    console.log(`  - ${stats.notFound} files not found`);
  }
  console.log();

  if (modifiedFiles.length > 0) {
    console.log(colors.yellow('Modified files preserved:'));
    for (const file of modifiedFiles) {
      console.log(`  - ${file}`);
    }
    console.log(colors.dim('\nUse --force to remove modified files.\n'));
  }
}

/**
 * Reset - remove all installed content
 */
async function reset(targetDir, dryRun = false, force = false, skipConfirm = false, ides = DEFAULT_IDES) {
  const stats = { removed: 0, skipped: 0 };
  const filesToRemove = [];
  const modifiedFiles = [];
  const dirsToRemove = [];

  console.log(`${colors.blue('Resetting:')} ${targetDir}`);
  console.log(`${colors.blue('Target IDEs:')} ${ides.join(', ')}`);
  console.log();

  // 1. Remove .cursor/rules/ and legacy .cursorrules/ contents for Cursor
  if (ides.includes('cursor')) {
    const cursorRulesDir = path.join(targetDir, CURSOR_RULES_DIR);
    const legacyDir = path.join(targetDir, LEGACY_CURSORRULES_DIR);
    const dirsToScan = [];

    if (fs.existsSync(cursorRulesDir)) dirsToScan.push({ dir: cursorRulesDir, label: CURSOR_RULES_DIR });
    if (fs.existsSync(legacyDir)) dirsToScan.push({ dir: legacyDir, label: LEGACY_CURSORRULES_DIR });

    if (dirsToScan.length > 0) {
      for (const { dir, label } of dirsToScan) {
        console.log(colors.yellow(`► Scanning ${label}/ directory...`));

        // Check shared rules
        for (const rule of SHARED_RULES) {
          const destPath = path.join(dir, rule);
          const srcPath = path.join(TEMPLATES_DIR, '_shared', rule);

          if (!fs.existsSync(destPath)) continue;

          const isUnmodified = isOurFile(destPath, srcPath);

          if (!isUnmodified && !force) {
            console.log(`  ${colors.yellow('[modified]')} ${rule} (use --force to remove)`);
            modifiedFiles.push(`${rule} (${label}/)`);
            stats.skipped++;
          } else {
            console.log(`  ${colors.red('[remove]')} ${rule}${!isUnmodified ? ' (modified, --force)' : ''}`);
            filesToRemove.push({ path: destPath, name: `${rule} (${label}/)` });
          }

          // Check for -1 variant
          const altPath = path.join(dir, rule.replace('.md', '-1.md'));
          if (fs.existsSync(altPath)) {
            console.log(`  ${colors.red('[remove]')} ${rule.replace('.md', '-1.md')} (alternate file)`);
            filesToRemove.push({ path: altPath, name: rule.replace('.md', '-1.md') });
          }
        }

        // Check template-specific rules
        for (const [templateName, templateInfo] of Object.entries(TEMPLATES)) {
          for (const rule of templateInfo.rules) {
            const destName = `${templateName}-${rule}`;
            const destPath = path.join(dir, destName);
            const srcPath = path.join(TEMPLATES_DIR, templateName, '.cursor', 'rules', rule);

            if (!fs.existsSync(destPath)) continue;

            const isUnmodified = isOurFile(destPath, srcPath);

            if (!isUnmodified && !force) {
              console.log(`  ${colors.yellow('[modified]')} ${destName} (use --force to remove)`);
              modifiedFiles.push(`${destName} (${label}/)`);
              stats.skipped++;
            } else {
              console.log(`  ${colors.red('[remove]')} ${destName}${!isUnmodified ? ' (modified, --force)' : ''}`);
              filesToRemove.push({ path: destPath, name: `${destName} (${label}/)` });
            }

            // Check for -1 variant
            const altName = destName.replace('.md', '-1.md');
            const altPath = path.join(dir, altName);
            if (fs.existsSync(altPath)) {
              console.log(`  ${colors.red('[remove]')} ${altName} (alternate file)`);
              filesToRemove.push({ path: altPath, name: altName });
            }
          }
        }

        // Check for legacy-cursorrules-notice.md
        const noticePath = path.join(dir, 'legacy-cursorrules-notice.md');
        if (fs.existsSync(noticePath)) {
          console.log(`  ${colors.red('[remove]')} legacy-cursorrules-notice.md`);
          filesToRemove.push({ path: noticePath, name: 'legacy-cursorrules-notice.md' });
        }

        // Check if we should remove the directory itself (only if it would be empty)
        const remainingFiles = fs.readdirSync(dir).filter(f => {
          const fullPath = path.join(dir, f);
          const willBeRemoved = filesToRemove.some(fr => fr.path === fullPath);
          return !willBeRemoved;
        });

        if (remainingFiles.length === 0 || force) {
          console.log(`  ${colors.red('[remove]')} ${label}/ directory`);
          dirsToRemove.push(dir);
          // If removing .cursor/rules/, also check if .cursor/ would be empty
          if (label === CURSOR_RULES_DIR) {
            const cursorDir = path.join(targetDir, '.cursor');
            dirsToRemove.push(cursorDir);
          }
        } else if (remainingFiles.length > 0) {
          console.log(colors.dim(`  ${label}/ will be kept (${remainingFiles.length} non-template file(s) remain)`));
        }

        console.log();
      }
    } else {
      console.log(colors.dim(`No ${CURSOR_RULES_DIR}/ or ${LEGACY_CURSORRULES_DIR}/ directory found.\n`));
    }
  }

  // 2. Remove CLAUDE.md for Claude
  if (ides.includes('claude')) {
    const claudePath = path.join(targetDir, 'CLAUDE.md');
    
    if (fs.existsSync(claudePath)) {
      console.log(colors.yellow('► Checking CLAUDE.md...'));
      
      // Check if it contains our signature content
      const content = fs.readFileSync(claudePath, 'utf8');
      const isOurs = content.includes('# CLAUDE.md - Development Guide') &&
                     (content.includes('.cursor/rules/') || content.includes('.cursorrules/'));
      
      if (!isOurs && !force) {
        console.log(`  ${colors.yellow('[modified]')} CLAUDE.md (doesn't match template, use --force)`);
        modifiedFiles.push('CLAUDE.md');
        stats.skipped++;
      } else {
        console.log(`  ${colors.red('[remove]')} CLAUDE.md${!isOurs ? ' (modified, --force)' : ''}`);
        filesToRemove.push({ path: claudePath, name: 'CLAUDE.md' });
      }
      console.log();
    }
  }

  // 3. Remove .github/copilot-instructions.md for Codex
  if (ides.includes('codex')) {
    const copilotPath = path.join(targetDir, '.github', 'copilot-instructions.md');
    
    if (fs.existsSync(copilotPath)) {
      console.log(colors.yellow('► Checking .github/copilot-instructions.md...'));
      
      // Check if it contains our signature content
      const content = fs.readFileSync(copilotPath, 'utf8');
      const isOurs = content.includes('# Copilot Instructions') && 
                     content.includes('Installed Templates:');
      
      if (!isOurs && !force) {
        console.log(`  ${colors.yellow('[modified]')} .github/copilot-instructions.md (doesn't match template, use --force)`);
        modifiedFiles.push('.github/copilot-instructions.md');
        stats.skipped++;
      } else {
        console.log(`  ${colors.red('[remove]')} .github/copilot-instructions.md${!isOurs ? ' (modified, --force)' : ''}`);
        filesToRemove.push({ path: copilotPath, name: '.github/copilot-instructions.md' });
      }
      console.log();
    }
  }

  if (filesToRemove.length === 0 && dirsToRemove.length === 0) {
    console.log(colors.yellow('Nothing to remove.\n'));
    return;
  }

  // Confirmation
  if (!dryRun && !skipConfirm) {
    const totalItems = filesToRemove.length + dirsToRemove.length;
    console.log(colors.yellow(`\nAbout to remove ${totalItems} item(s).`));
    const confirmed = await confirm(colors.red('Proceed with reset?'));
    if (!confirmed) {
      console.log(colors.dim('\nAborted.\n'));
      return;
    }
    console.log();
  }

  // Execute removal
  if (dryRun) {
    console.log(colors.yellow('DRY RUN - No files were removed.\n'));
  } else {
    // Remove files first
    for (const file of filesToRemove) {
      try {
        fs.unlinkSync(file.path);
        stats.removed++;
      } catch (err) {
        console.error(colors.red(`Failed to remove ${file.name}: ${err.message}`));
      }
    }
    
    // Then remove directories
    for (const dir of dirsToRemove) {
      try {
        // Check if directory is now empty
        const remaining = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
        if (remaining.length === 0) {
          fs.rmdirSync(dir);
          stats.removed++;
        } else if (force) {
          fs.rmSync(dir, { recursive: true });
          stats.removed++;
        }
      } catch (err) {
        console.error(colors.red(`Failed to remove directory: ${err.message}`));
      }
    }
  }

  // Summary
  console.log(colors.green('════════════════════════════════════════════════════════════'));
  console.log(colors.green(`✓ Reset complete!\n`));
  
  console.log(colors.yellow('Summary:'));
  console.log(`  - ${stats.removed} items removed`);
  if (stats.skipped > 0) {
    console.log(`  - ${stats.skipped} files skipped (modified, use --force)`);
  }
  console.log();

  if (modifiedFiles.length > 0) {
    console.log(colors.yellow('Modified files preserved:'));
    for (const file of modifiedFiles) {
      console.log(`  - ${file}`);
    }
    console.log(colors.dim('\nUse --force to remove modified files.\n'));
  }
}

export async function run(args) {
  const templates = [];
  const ides = [];
  let dryRun = false;
  let force = false;
  let skipConfirm = false;
  let removeMode = false;
  let resetMode = false;

  // Parse arguments
  for (const arg of args) {
    if (arg === '--list' || arg === '-l') {
      printBanner();
      printTemplates();
      process.exit(0);
    } else if (arg === '--help' || arg === '-h') {
      printBanner();
      printHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log(`${PACKAGE_NAME} v${CURRENT_VERSION}`);
      console.log(`${colors.dim('Changelog:')} ${CHANGELOG_URL}`);
      process.exit(0);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--yes' || arg === '-y') {
      skipConfirm = true;
    } else if (arg === '--remove') {
      removeMode = true;
    } else if (arg === '--reset') {
      resetMode = true;
    } else if (arg.startsWith('--ide=')) {
      const ide = arg.slice(6).toLowerCase();
      if (!SUPPORTED_IDES.includes(ide)) {
        console.error(colors.red(`Error: Unknown IDE '${ide}'`));
        console.error(colors.dim(`Supported: ${SUPPORTED_IDES.join(', ')}`));
        process.exit(1);
      }
      if (!ides.includes(ide)) {
        ides.push(ide);
      }
    } else if (arg.startsWith('-')) {
      console.error(colors.red(`Error: Unknown option '${arg}'`));
      printHelp();
      process.exit(1);
    } else {
      templates.push(arg);
    }
  }

  printBanner();

  // Check for updates (non-blocking, fails silently)
  await checkForUpdates();

  // Resolve template aliases to canonical names
  const resolvedTemplates = templates.map(resolveTemplateAlias);

  // Use default IDEs if none specified
  const targetIdes = ides.length > 0 ? ides : DEFAULT_IDES;

  // Handle reset mode
  if (resetMode) {
    if (removeMode) {
      console.error(colors.red('Error: Cannot use --remove and --reset together\n'));
      process.exit(1);
    }
    if (resolvedTemplates.length > 0) {
      console.error(colors.red('Error: --reset does not accept template arguments\n'));
      console.error(colors.dim('Use --remove <templates...> to remove specific templates.\n'));
      process.exit(1);
    }

    if (dryRun) {
      console.log(colors.yellow('DRY RUN - No changes will be made\n'));
    }
    if (force) {
      console.log(colors.yellow('FORCE MODE - Modified files will be removed\n'));
    }

    await reset(process.cwd(), dryRun, force, skipConfirm, targetIdes);
    return;
  }

  // Handle remove mode
  if (removeMode) {
    if (resolvedTemplates.length === 0) {
      console.error(colors.red('Error: No templates specified for removal\n'));
      console.error(colors.dim('Usage: npx cursor-templates --remove <templates...>\n'));
      printTemplates();
      process.exit(1);
    }

    for (const template of resolvedTemplates) {
      if (!TEMPLATES[template]) {
        console.error(colors.red(`Error: Unknown template '${template}'\n`));
        printTemplates();
        process.exit(1);
      }
    }

    if (dryRun) {
      console.log(colors.yellow('DRY RUN - No changes will be made\n'));
    }
    if (force) {
      console.log(colors.yellow('FORCE MODE - Modified files will be removed\n'));
    }

    await remove(process.cwd(), resolvedTemplates, dryRun, force, skipConfirm, targetIdes);
    return;
  }

  // Install mode (default)
  if (resolvedTemplates.length === 0) {
    console.error(colors.red('Error: No templates specified\n'));
    printHelp();
    process.exit(1);
  }

  for (const template of resolvedTemplates) {
    if (!TEMPLATES[template]) {
      console.error(colors.red(`Error: Unknown template '${template}'\n`));
      printTemplates();
      process.exit(1);
    }
  }

  if (dryRun) {
    console.log(colors.yellow('DRY RUN - No changes will be made\n'));
  }

  if (force) {
    console.log(colors.yellow('FORCE MODE - Existing files will be overwritten\n'));
  }

  // Install to current directory
  await install(process.cwd(), resolvedTemplates, dryRun, force, targetIdes, skipConfirm);
}

// Export internals for testing
export const _internals = {
  PACKAGE_NAME,
  CURRENT_VERSION,
  REPO_URL,
  CHANGELOG_URL,
  CURSOR_RULES_DIR,
  LEGACY_CURSORRULES_DIR,
  TEMPLATES,
  TEMPLATE_ALIASES,
  SHARED_RULES,
  SUPPORTED_IDES,
  DEFAULT_IDES,
  compareVersions,
  checkForUpdates,
  resolveTemplateAlias,
  filesMatch,
  parseMarkdownSections,
  generateSectionSignature,
  findMissingSections,
  mergeClaudeContent,
  getAlternateFilename,
  copyFile,
  generateClaudeMdContent,
  generateCopilotInstructionsContent,
  isOurFile,
  install,
  remove,
  reset,
};
