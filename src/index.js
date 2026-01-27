import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Available templates
const TEMPLATES = {
  'blockchain': {
    description: 'Smart contracts, DeFi protocols, and Web3 applications (Solidity, Foundry, Viem)',
    rules: ['defi-patterns.md', 'gas-optimization.md', 'overview.md', 'security.md', 'smart-contracts.md', 'testing.md', 'web3-integration.md']
  },
  'cli-tools': {
    description: 'Command-line applications and developer tools (Cobra, Commander, Click)',
    rules: ['architecture.md', 'arguments.md', 'distribution.md', 'error-handling.md', 'overview.md', 'testing.md', 'user-experience.md']
  },
  'documentation': {
    description: 'Technical documentation standards (READMEs, API docs, ADRs, code comments)',
    rules: ['adr.md', 'api-documentation.md', 'code-comments.md', 'maintenance.md', 'overview.md', 'readme-standards.md']
  },
  'fullstack': {
    description: 'Full-stack web applications (Next.js, Nuxt, SvelteKit, Remix)',
    rules: ['api-contracts.md', 'architecture.md', 'overview.md', 'shared-types.md', 'testing.md']
  },
  'mobile': {
    description: 'Mobile applications (React Native, Flutter, native iOS/Android)',
    rules: ['navigation.md', 'offline-first.md', 'overview.md', 'performance.md', 'testing.md']
  },
  'utility-agent': {
    description: 'AI agent utilities with context management and hallucination prevention',
    rules: ['action-control.md', 'context-management.md', 'hallucination-prevention.md', 'overview.md', 'token-optimization.md']
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

const SHARED_RULES = [
  'code-quality.md',
  'communication.md', 
  'core-principles.md',
  'git-workflow.md',
  'security-fundamentals.md'
];

// Colors
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function printBanner() {
  console.log(colors.blue(`
╔═══════════════════════════════════════════════════════════╗
║              Cursor Templates Installer                   ║
╚═══════════════════════════════════════════════════════════╝
`));
}

function printHelp() {
  console.log(`${colors.yellow('Usage:')}
  npx cursor-templates <templates...>

${colors.yellow('Options:')}
  --list, -l     List available templates
  --help, -h     Show this help message
  --dry-run      Show what would be installed
  --force, -f    Overwrite existing files (default: skip)

${colors.yellow('Examples:')}
  npx cursor-templates web-frontend
  npx cursor-templates web-frontend web-backend
  npx cursor-templates fullstack
  npx cursor-templates mobile utility-agent
  npx cursor-templates web-backend --force

${colors.dim('Shared rules (code-quality, security, git-workflow, etc.) are always included.')}
${colors.dim('Identical files are skipped. Modified files are preserved; ours saved as *-1.md.')}
${colors.dim('CLAUDE.md: missing sections are intelligently merged (not overwritten).')}
`);
}

function printTemplates() {
  console.log(colors.yellow('Available Templates:\n'));
  
  for (const [name, info] of Object.entries(TEMPLATES)) {
    console.log(`  ${colors.green(name)}`);
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

This project uses AI-assisted development with Cursor. The rules in \`.cursorrules/\` provide domain-specific guidance for the AI assistant.

---

## Quick Reference

### Installed Templates

- **Shared** (always included): Core principles, code quality, security, git workflow, communication
${templateList}

### Rule Files

All rules are in \`.cursorrules/\`. The AI assistant automatically reads these when working on your project.

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

1. Create new \`.md\` files in \`.cursorrules/\`
2. Follow the existing naming convention
3. Include clear examples and anti-patterns

### Modifying Existing Rules

Edit files directly in \`.cursorrules/\`. Changes take effect immediately.

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

function install(targetDir, templates, dryRun = false, force = false) {
  const cursorrules = path.join(targetDir, '.cursorrules');
  
  if (!dryRun && !fs.existsSync(cursorrules)) {
    fs.mkdirSync(cursorrules, { recursive: true });
  }

  console.log(`${colors.blue('Installing to:')} ${targetDir}`);
  if (!force) {
    console.log(colors.dim('(identical files skipped, modified files preserved with ours saved as *-1.md)'));
    console.log(colors.dim('(CLAUDE.md: missing sections merged intelligently)'));
  }
  console.log();

  const stats = { copied: 0, skipped: 0, updated: 0, renamed: 0 };
  const renamedFiles = [];

  // 1. Install shared rules
  console.log(colors.green('► Installing shared rules...'));
  for (const rule of SHARED_RULES) {
    const src = path.join(TEMPLATES_DIR, '_shared', rule);
    const dest = path.join(cursorrules, rule);
    
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

  // 2. Install template-specific rules
  for (const template of templates) {
    console.log(colors.green(`► Installing ${template} template...`));
    
    for (const rule of TEMPLATES[template].rules) {
      const src = path.join(TEMPLATES_DIR, template, '.cursorrules', rule);
      const dest = path.join(cursorrules, `${template}-${rule}`);
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

  // 3. Generate CLAUDE.md
  const claudePath = path.join(targetDir, 'CLAUDE.md');
  const claudeExists = fs.existsSync(claudePath);
  const templateContent = generateClaudeMdContent(templates);
  
  console.log(colors.green('► Generating CLAUDE.md...'));
  if (dryRun) {
    if (!claudeExists) {
      console.log(`  ${colors.dim('[copy]')} CLAUDE.md`);
    } else if (force) {
      console.log(`  ${colors.dim('[update]')} CLAUDE.md`);
    } else {
      // Check what would be merged
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
    // Intelligent merge: append only missing sections
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
  
  console.log(colors.yellow('Templates installed:'));
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
  console.log('  1. Review CLAUDE.md for any customization');
  console.log('  2. Commit the new files to your repository');
  console.log();
}

export function run(args) {
  const templates = [];
  let dryRun = false;
  let force = false;

  // Parse arguments
  for (const arg of args) {
    switch (arg) {
      case '--list':
      case '-l':
        printBanner();
        printTemplates();
        process.exit(0);
        break;
      case '--help':
      case '-h':
        printBanner();
        printHelp();
        process.exit(0);
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--force':
      case '-f':
        force = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(colors.red(`Error: Unknown option '${arg}'`));
          printHelp();
          process.exit(1);
        }
        templates.push(arg);
    }
  }

  printBanner();

  // Validate
  if (templates.length === 0) {
    console.error(colors.red('Error: No templates specified\n'));
    printHelp();
    process.exit(1);
  }

  for (const template of templates) {
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
  install(process.cwd(), templates, dryRun, force);
}
