import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { run, _internals } from './index.js';

const {
  PACKAGE_NAME,
  CURRENT_VERSION,
  CURSOR_RULES_DIR,
  LEGACY_CURSORRULES_DIR,
  TEMPLATES,
  TEMPLATE_ALIASES,
  SHARED_RULES,
  SUPPORTED_IDES,
  DEFAULT_IDES,
  compareVersions,
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
} = _internals;

// ============================================================================
// Constants & Configuration Tests
// ============================================================================

describe('Package Info', () => {
  it('should have a valid package name', () => {
    expect(PACKAGE_NAME).toBe('agentic-team-templates');
  });

  it('should have a valid semver version', () => {
    expect(CURRENT_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('Version Comparison', () => {
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0);
    });

    it('should return -1 when first version is lower', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('0.6.1', '0.7.0')).toBe(-1);
    });

    it('should return 1 when first version is higher', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(compareVersions('0.7.0', '0.6.1')).toBe(1);
    });

    it('should handle missing patch versions', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0.0', '1.0')).toBe(0);
    });
  });
});

describe('Constants', () => {
  describe('TEMPLATES', () => {
    it('should have all expected templates', () => {
      const expectedTemplates = [
        'blockchain',
        'cpp-expert',
        'csharp-expert',
        'cli-tools',
        'data-engineering',
        'devops-sre',
        'documentation',
        'educator',
        'fullstack',
        'golang-expert',
        'java-expert',
        'javascript-expert',
        'kotlin-expert',
        'ml-ai',
        'mobile',
        'platform-engineering',
        'product-manager',
        'python-expert',
        'qa-engineering',
        'rust-expert',
        'swift-expert',
        'testing',
        'utility-agent',
        'ux-designer',
        'web-backend',
        'web-frontend',
      ];
      
      expect(Object.keys(TEMPLATES).sort()).toEqual(expectedTemplates.sort());
    });

    it('each template should have description and rules array', () => {
      for (const [name, template] of Object.entries(TEMPLATES)) {
        expect(template).toHaveProperty('description');
        expect(typeof template.description).toBe('string');
        expect(template.description.length).toBeGreaterThan(0);
        
        expect(template).toHaveProperty('rules');
        expect(Array.isArray(template.rules)).toBe(true);
        expect(template.rules.length).toBeGreaterThan(0);
      }
    });

    it('each template should have overview.md in rules', () => {
      for (const [name, template] of Object.entries(TEMPLATES)) {
        expect(template.rules).toContain('overview.md');
      }
    });
  });

  describe('SHARED_RULES', () => {
    it('should have expected shared rules', () => {
      expect(SHARED_RULES).toContain('code-quality.md');
      expect(SHARED_RULES).toContain('communication.md');
      expect(SHARED_RULES).toContain('core-principles.md');
      expect(SHARED_RULES).toContain('git-workflow.md');
      expect(SHARED_RULES).toContain('security-fundamentals.md');
    });

    it('all rules should end with .md', () => {
      for (const rule of SHARED_RULES) {
        expect(rule).toMatch(/\.md$/);
      }
    });
  });

  describe('SUPPORTED_IDES', () => {
    it('should contain cursor, claude, and codex', () => {
      expect(SUPPORTED_IDES).toContain('cursor');
      expect(SUPPORTED_IDES).toContain('claude');
      expect(SUPPORTED_IDES).toContain('codex');
    });
  });

  describe('DEFAULT_IDES', () => {
    it('should default to all supported IDEs', () => {
      expect(DEFAULT_IDES).toEqual(SUPPORTED_IDES);
    });
  });

  describe('TEMPLATE_ALIASES', () => {
    it('all alias values should be valid TEMPLATES keys', () => {
      for (const [alias, canonical] of Object.entries(TEMPLATE_ALIASES)) {
        expect(TEMPLATES).toHaveProperty(canonical,
          expect.anything(),
        );
      }
    });

    it('should include expected shorthand aliases', () => {
      expect(TEMPLATE_ALIASES['js']).toBe('javascript-expert');
      expect(TEMPLATE_ALIASES['ts']).toBe('javascript-expert');
      expect(TEMPLATE_ALIASES['go']).toBe('golang-expert');
      expect(TEMPLATE_ALIASES['py']).toBe('python-expert');
      expect(TEMPLATE_ALIASES['rs']).toBe('rust-expert');
      expect(TEMPLATE_ALIASES['kt']).toBe('kotlin-expert');
    });
  });

  describe('resolveTemplateAlias', () => {
    it('should resolve known aliases to canonical names', () => {
      expect(resolveTemplateAlias('js')).toBe('javascript-expert');
      expect(resolveTemplateAlias('typescript')).toBe('javascript-expert');
      expect(resolveTemplateAlias('go')).toBe('golang-expert');
      expect(resolveTemplateAlias('golang')).toBe('golang-expert');
      expect(resolveTemplateAlias('py')).toBe('python-expert');
      expect(resolveTemplateAlias('rs')).toBe('rust-expert');
      expect(resolveTemplateAlias('kotlin')).toBe('kotlin-expert');
      expect(resolveTemplateAlias('kt')).toBe('kotlin-expert');
    });

    it('should pass through unknown names unchanged', () => {
      expect(resolveTemplateAlias('web-frontend')).toBe('web-frontend');
      expect(resolveTemplateAlias('blockchain')).toBe('blockchain');
      expect(resolveTemplateAlias('nonexistent')).toBe('nonexistent');
    });

    it('should pass through canonical template names unchanged', () => {
      expect(resolveTemplateAlias('javascript-expert')).toBe('javascript-expert');
      expect(resolveTemplateAlias('golang-expert')).toBe('golang-expert');
      expect(resolveTemplateAlias('python-expert')).toBe('python-expert');
    });
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('Utility Functions', () => {
  describe('getAlternateFilename', () => {
    it('should add -1 suffix before extension', () => {
      expect(getAlternateFilename('/path/to/file.md')).toBe('/path/to/file-1.md');
      expect(getAlternateFilename('/path/to/code-quality.md')).toBe('/path/to/code-quality-1.md');
    });

    it('should handle files without directory', () => {
      expect(getAlternateFilename('file.md')).toBe('file-1.md');
    });

    it('should handle different extensions', () => {
      expect(getAlternateFilename('/path/to/file.txt')).toBe('/path/to/file-1.txt');
      expect(getAlternateFilename('/path/to/file.json')).toBe('/path/to/file-1.json');
    });
  });

  describe('filesMatch', () => {
    let tempDir;
    
    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-templates-test-'));
    });
    
    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should return true for identical files', () => {
      const file1 = path.join(tempDir, 'file1.md');
      const file2 = path.join(tempDir, 'file2.md');
      const content = '# Test Content\n\nSome text here.';
      
      fs.writeFileSync(file1, content);
      fs.writeFileSync(file2, content);
      
      expect(filesMatch(file1, file2)).toBe(true);
    });

    it('should return false for different files', () => {
      const file1 = path.join(tempDir, 'file1.md');
      const file2 = path.join(tempDir, 'file2.md');
      
      fs.writeFileSync(file1, '# Content A');
      fs.writeFileSync(file2, '# Content B');
      
      expect(filesMatch(file1, file2)).toBe(false);
    });

    it('should return false if file does not exist', () => {
      const file1 = path.join(tempDir, 'exists.md');
      const file2 = path.join(tempDir, 'not-exists.md');
      
      fs.writeFileSync(file1, '# Content');
      
      expect(filesMatch(file1, file2)).toBe(false);
    });
  });

  describe('isOurFile', () => {
    let tempDir;
    
    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-templates-test-'));
    });
    
    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should return false if file does not exist', () => {
      const filePath = path.join(tempDir, 'nonexistent.md');
      const templatePath = path.join(tempDir, 'template.md');
      
      expect(isOurFile(filePath, templatePath)).toBe(false);
    });

    it('should return true if template does not exist (assume ours)', () => {
      const filePath = path.join(tempDir, 'file.md');
      const templatePath = path.join(tempDir, 'nonexistent-template.md');
      
      fs.writeFileSync(filePath, '# Content');
      
      expect(isOurFile(filePath, templatePath)).toBe(true);
    });

    it('should return true if files match', () => {
      const filePath = path.join(tempDir, 'file.md');
      const templatePath = path.join(tempDir, 'template.md');
      const content = '# Same Content';
      
      fs.writeFileSync(filePath, content);
      fs.writeFileSync(templatePath, content);
      
      expect(isOurFile(filePath, templatePath)).toBe(true);
    });

    it('should return false if files differ', () => {
      const filePath = path.join(tempDir, 'file.md');
      const templatePath = path.join(tempDir, 'template.md');
      
      fs.writeFileSync(filePath, '# Modified Content');
      fs.writeFileSync(templatePath, '# Original Template');
      
      expect(isOurFile(filePath, templatePath)).toBe(false);
    });
  });
});

// ============================================================================
// Markdown Parsing Tests
// ============================================================================

describe('Markdown Parsing', () => {
  describe('parseMarkdownSections', () => {
    it('should parse sections with ## headings', () => {
      const content = `# Title

Some preamble text.

## Section One

Content for section one.

## Section Two

Content for section two.
`;
      const result = parseMarkdownSections(content);
      
      expect(result.preamble).toContain('# Title');
      expect(result.preamble).toContain('Some preamble text.');
      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].heading).toBe('Section One');
      expect(result.sections[1].heading).toBe('Section Two');
    });

    it('should handle content with no sections', () => {
      const content = '# Just a title\n\nSome content without sections.';
      const result = parseMarkdownSections(content);
      
      expect(result.sections).toHaveLength(0);
      expect(result.preamble).toContain('# Just a title');
    });

    it('should preserve section content', () => {
      const content = `## My Section

Line 1
Line 2
Line 3
`;
      const result = parseMarkdownSections(content);
      
      expect(result.sections[0].content).toContain('Line 1');
      expect(result.sections[0].content).toContain('Line 2');
      expect(result.sections[0].content).toContain('Line 3');
    });

    it('should generate signatures for sections', () => {
      const content = `## Test Section

Some meaningful content here.
`;
      const result = parseMarkdownSections(content);
      
      expect(result.sections[0]).toHaveProperty('signature');
      expect(typeof result.sections[0].signature).toBe('string');
      expect(result.sections[0].signature.length).toBeGreaterThan(0);
    });
  });

  describe('generateSectionSignature', () => {
    it('should normalize heading to lowercase', () => {
      const sig1 = generateSectionSignature('My Heading', ['content']);
      const sig2 = generateSectionSignature('my heading', ['content']);
      
      expect(sig1).toBe(sig2);
    });

    it('should remove special characters from heading', () => {
      const sig1 = generateSectionSignature('Heading: With (Special) Chars!', ['content']);
      const sig2 = generateSectionSignature('Heading With Special Chars', ['content']);
      
      expect(sig1).toBe(sig2);
    });

    it('should include content in signature', () => {
      const sig1 = generateSectionSignature('Heading', ['Line A']);
      const sig2 = generateSectionSignature('Heading', ['Line B']);
      
      expect(sig1).not.toBe(sig2);
    });

    it('should filter out empty lines and special lines', () => {
      const sig = generateSectionSignature('Heading', [
        '',
        '# Subheading',
        '| table |',
        '- list item',
        'Meaningful content',
      ]);
      
      expect(sig).toContain('meaningful content');
    });
  });

  describe('findMissingSections', () => {
    it('should find sections in template that are missing from existing', () => {
      const existing = `## Section A

Content A

## Section B

Content B
`;
      const template = `## Section A

Content A

## Section B

Content B

## Section C

Content C
`;
      const result = findMissingSections(existing, template);
      
      expect(result.missing).toHaveLength(1);
      expect(result.missing[0].heading).toBe('Section C');
      expect(result.matchedCount).toBe(2);
    });

    it('should return empty array when all sections present', () => {
      const content = `## Section A

Content

## Section B

Content
`;
      const result = findMissingSections(content, content);
      
      expect(result.missing).toHaveLength(0);
      expect(result.matchedCount).toBe(2);
    });

    it('should match by heading regardless of case', () => {
      const existing = '## SECTION A\n\nContent';
      const template = '## Section A\n\nContent';
      
      const result = findMissingSections(existing, template);
      
      expect(result.missing).toHaveLength(0);
      expect(result.matchedCount).toBe(1);
    });
  });

  describe('mergeClaudeContent', () => {
    it('should merge missing sections into existing content', () => {
      const existing = `# Title

## Section A

Content A
`;
      const template = `# Title

## Section A

Content A

## Section B

Content B
`;
      const result = mergeClaudeContent(existing, template);
      
      expect(result.merged).toContain('## Section A');
      expect(result.merged).toContain('## Section B');
      expect(result.addedSections).toContain('Section B');
    });

    it('should return unchanged content when nothing to merge', () => {
      const content = `## Section A

Content
`;
      const result = mergeClaudeContent(content, content);
      
      expect(result.merged).toBe(content);
      expect(result.addedSections).toHaveLength(0);
    });

    it('should preserve preamble', () => {
      const existing = `# My Title

Introduction paragraph.

## Existing Section

Content
`;
      const template = `## Existing Section

Content

## New Section

New content
`;
      const result = mergeClaudeContent(existing, template);
      
      expect(result.merged).toContain('# My Title');
      expect(result.merged).toContain('Introduction paragraph');
    });
  });
});

// ============================================================================
// Content Generation Tests
// ============================================================================

describe('Content Generation', () => {
  describe('generateClaudeMdContent', () => {
    it('should generate valid markdown', () => {
      const content = generateClaudeMdContent(['web-frontend']);
      
      expect(content).toContain('# CLAUDE.md - Development Guide');
      expect(content).toContain('web-frontend');
    });

    it('should include template description', () => {
      const content = generateClaudeMdContent(['web-frontend']);
      
      expect(content).toContain(TEMPLATES['web-frontend'].description);
    });

    it('should include multiple templates', () => {
      const content = generateClaudeMdContent(['web-frontend', 'web-backend']);
      
      expect(content).toContain('web-frontend');
      expect(content).toContain('web-backend');
      expect(content).toContain(TEMPLATES['web-frontend'].description);
      expect(content).toContain(TEMPLATES['web-backend'].description);
    });

    it('should include shared rules table', () => {
      const content = generateClaudeMdContent(['web-frontend']);
      
      expect(content).toContain('core-principles.md');
      expect(content).toContain('code-quality.md');
      expect(content).toContain('security-fundamentals.md');
    });

    it('should include development principles', () => {
      const content = generateClaudeMdContent(['web-frontend']);
      
      expect(content).toContain('Honesty Over Output');
      expect(content).toContain('Security First');
      expect(content).toContain('Tests Are Required');
    });

    it('should include definition of done', () => {
      const content = generateClaudeMdContent(['web-frontend']);
      
      expect(content).toContain('Definition of Done');
      expect(content).toContain('Code written and reviewed');
      expect(content).toContain('Tests written and passing');
    });
  });

  describe('generateCopilotInstructionsContent', () => {
    it('should generate valid markdown', () => {
      const content = generateCopilotInstructionsContent(['web-frontend']);
      
      expect(content).toContain('# Copilot Instructions');
      expect(content).toContain('web-frontend');
    });

    it('should include installed templates list', () => {
      const content = generateCopilotInstructionsContent(['web-frontend', 'web-backend']);
      
      expect(content).toContain('**Installed Templates:** web-frontend, web-backend');
    });

    it('should include core principles', () => {
      const content = generateCopilotInstructionsContent(['web-frontend']);
      
      expect(content).toContain('Honesty Over Output');
      expect(content).toContain('Security First');
      expect(content).toContain('Tests Are Required');
    });
  });
});

// ============================================================================
// File Operations Tests
// ============================================================================

describe('File Operations', () => {
  let tempDir;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-templates-test-'));
  });
  
  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('copyFile', () => {
    it('should copy file to new location', () => {
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'dest.md');
      const content = '# Test Content';
      
      fs.writeFileSync(src, content);
      
      const result = copyFile(src, dest);
      
      expect(result.status).toBe('copied');
      expect(result.destFile).toBe(dest);
      expect(fs.readFileSync(dest, 'utf8')).toBe(content);
    });

    it('should create destination directory if needed', () => {
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'subdir', 'dest.md');
      
      fs.writeFileSync(src, '# Content');
      
      const result = copyFile(src, dest);
      
      expect(result.status).toBe('copied');
      expect(fs.existsSync(dest)).toBe(true);
    });

    it('should skip identical files', () => {
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'dest.md');
      const content = '# Same Content';
      
      fs.writeFileSync(src, content);
      fs.writeFileSync(dest, content);
      
      const result = copyFile(src, dest);
      
      expect(result.status).toBe('skipped');
      expect(result.destFile).toBe(dest);
    });

    it('should rename to -1 when destination differs', () => {
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'dest.md');
      
      fs.writeFileSync(src, '# New Content');
      fs.writeFileSync(dest, '# Existing Different Content');
      
      const result = copyFile(src, dest, false);
      
      expect(result.status).toBe('renamed');
      expect(result.destFile).toBe(path.join(tempDir, 'dest-1.md'));
      expect(fs.existsSync(path.join(tempDir, 'dest-1.md'))).toBe(true);
      // Original should be preserved
      expect(fs.readFileSync(dest, 'utf8')).toBe('# Existing Different Content');
    });

    it('should overwrite with force flag', () => {
      const src = path.join(tempDir, 'source.md');
      const dest = path.join(tempDir, 'dest.md');
      
      fs.writeFileSync(src, '# New Content');
      fs.writeFileSync(dest, '# Old Content');
      
      const result = copyFile(src, dest, true);
      
      expect(result.status).toBe('updated');
      expect(fs.readFileSync(dest, 'utf8')).toBe('# New Content');
    });
  });
});

// ============================================================================
// Install/Remove/Reset Integration Tests
// ============================================================================

describe('Install/Remove/Reset Operations', () => {
  let tempDir;
  let originalCwd;
  let consoleLogSpy;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-templates-test-'));
    originalCwd = process.cwd();
    // Suppress console output during tests
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('install', () => {
    it('should create .cursor/rules directory', async () => {
      await install(tempDir, ['web-frontend'], false, false, ['cursor']);

      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules'))).toBe(true);
    });

    it('should install shared rules', async () => {
      await install(tempDir, ['web-frontend'], false, false, ['cursor']);

      for (const rule of SHARED_RULES) {
        expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', rule))).toBe(true);
      }
    });

    it('should install template-specific rules with prefix', async () => {
      await install(tempDir, ['web-frontend'], false, false, ['cursor']);

      for (const rule of TEMPLATES['web-frontend'].rules) {
        const prefixedName = `web-frontend-${rule}`;
        expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', prefixedName))).toBe(true);
      }
    });

    it('should create CLAUDE.md for claude IDE', async () => {
      await install(tempDir, ['web-frontend'], false, false, ['claude']);

      expect(fs.existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
      const content = fs.readFileSync(path.join(tempDir, 'CLAUDE.md'), 'utf8');
      expect(content).toContain('# CLAUDE.md - Development Guide');
    });

    it('should create copilot-instructions.md for codex IDE', async () => {
      await install(tempDir, ['web-frontend'], false, false, ['codex']);

      expect(fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions.md'))).toBe(true);
    });

    it('should install for all IDEs by default', async () => {
      await install(tempDir, ['web-frontend'], false, false, DEFAULT_IDES);

      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions.md'))).toBe(true);
    });

    it('should not write files in dry-run mode', async () => {
      await install(tempDir, ['web-frontend'], true, false, ['cursor']);

      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules'))).toBe(false);
    });

    it('should install multiple templates', async () => {
      await install(tempDir, ['web-frontend', 'web-backend'], false, false, ['cursor']);

      // Check web-frontend rules
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md'))).toBe(true);
      // Check web-backend rules
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-backend-overview.md'))).toBe(true);
    });

    it('should copy legacy .cursorrules/ files to .cursor/rules/ then remove legacy dir when cleanup confirmed', async () => {
      const legacyDir = path.join(tempDir, LEGACY_CURSORRULES_DIR);
      const cursorRulesDir = path.join(tempDir, '.cursor', 'rules');
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(path.join(legacyDir, 'old-rule.md'), '# Old rule');
      fs.writeFileSync(path.join(legacyDir, 'custom-guide.md'), '# Custom guide');

      await install(tempDir, ['web-frontend'], false, false, ['cursor'], true);

      expect(fs.existsSync(legacyDir)).toBe(false);
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md'))).toBe(true);
      expect(fs.existsSync(path.join(cursorRulesDir, 'old-rule.md'))).toBe(true);
      expect(fs.readFileSync(path.join(cursorRulesDir, 'old-rule.md'), 'utf8')).toBe('# Old rule');
      expect(fs.existsSync(path.join(cursorRulesDir, 'custom-guide.md'))).toBe(true);
      expect(fs.readFileSync(path.join(cursorRulesDir, 'custom-guide.md'), 'utf8')).toBe('# Custom guide');
    });

    it('should not overwrite existing .cursor/rules/ files when migrating legacy', async () => {
      const legacyDir = path.join(tempDir, LEGACY_CURSORRULES_DIR);
      const cursorRulesDir = path.join(tempDir, '.cursor', 'rules');
      fs.mkdirSync(cursorRulesDir, { recursive: true });
      fs.writeFileSync(path.join(cursorRulesDir, 'my-rule.md'), '# New structure content');
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(path.join(legacyDir, 'my-rule.md'), '# Legacy content');

      await install(tempDir, ['web-frontend'], false, false, ['cursor'], true);

      expect(fs.readFileSync(path.join(cursorRulesDir, 'my-rule.md'), 'utf8')).toBe('# New structure content');
      expect(fs.existsSync(legacyDir)).toBe(false);
    });

    it('should show legacy warning in dry-run mode without prompting', async () => {
      // Create a legacy .cursorrules/ directory
      const legacyDir = path.join(tempDir, LEGACY_CURSORRULES_DIR);
      fs.mkdirSync(legacyDir, { recursive: true });
      fs.writeFileSync(path.join(legacyDir, 'old-rule.md'), '# Old rule');

      await install(tempDir, ['web-frontend'], true, false, ['cursor']);

      // Legacy dir should still exist (dry-run doesn't modify)
      expect(fs.existsSync(legacyDir)).toBe(true);
      // Warning should have been printed
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deprecated')
      );
    });
  });

  describe('remove', () => {
    beforeEach(async () => {
      // First install a template
      await install(tempDir, ['web-frontend'], false, false, ['cursor']);
    });

    it('should remove template-specific files', async () => {
      await remove(tempDir, ['web-frontend'], false, false, true, ['cursor']);

      for (const rule of TEMPLATES['web-frontend'].rules) {
        const prefixedName = `web-frontend-${rule}`;
        expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', prefixedName))).toBe(false);
      }
    });

    it('should keep shared rules when removing template', async () => {
      await remove(tempDir, ['web-frontend'], false, false, true, ['cursor']);

      for (const rule of SHARED_RULES) {
        expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', rule))).toBe(true);
      }
    });

    it('should not remove files in dry-run mode', async () => {
      await remove(tempDir, ['web-frontend'], true, false, true, ['cursor']);

      // Files should still exist
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md'))).toBe(true);
    });

    it('should skip modified files without force', async () => {
      // Modify a file
      const filePath = path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md');
      fs.writeFileSync(filePath, '# Modified content');

      await remove(tempDir, ['web-frontend'], false, false, true, ['cursor']);

      // Modified file should still exist
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('# Modified content');
    });

    it('should remove modified files with force', async () => {
      // Modify a file
      const filePath = path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md');
      fs.writeFileSync(filePath, '# Modified content');

      await remove(tempDir, ['web-frontend'], false, true, true, ['cursor']);

      // Modified file should be removed
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should also remove files from legacy .cursorrules/ directory', async () => {
      // Manually create files in legacy location
      const legacyDir = path.join(tempDir, LEGACY_CURSORRULES_DIR);
      fs.mkdirSync(legacyDir, { recursive: true });
      for (const rule of TEMPLATES['web-frontend'].rules) {
        fs.writeFileSync(path.join(legacyDir, `web-frontend-${rule}`), '# legacy content');
      }

      await remove(tempDir, ['web-frontend'], false, true, true, ['cursor']);

      // Both new and legacy files should be removed
      for (const rule of TEMPLATES['web-frontend'].rules) {
        const prefixedName = `web-frontend-${rule}`;
        expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', prefixedName))).toBe(false);
        expect(fs.existsSync(path.join(legacyDir, prefixedName))).toBe(false);
      }
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      // Install templates
      await install(tempDir, ['web-frontend', 'web-backend'], false, false, DEFAULT_IDES);
    });

    it('should remove all template files from .cursor/rules', async () => {
      await reset(tempDir, false, false, true, ['cursor']);

      // Template files should be removed
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md'))).toBe(false);
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-backend-overview.md'))).toBe(false);
    });

    it('should remove shared rules', async () => {
      await reset(tempDir, false, false, true, ['cursor']);

      for (const rule of SHARED_RULES) {
        expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', rule))).toBe(false);
      }
    });

    it('should remove CLAUDE.md', async () => {
      await reset(tempDir, false, false, true, ['claude']);

      expect(fs.existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(false);
    });

    it('should remove copilot-instructions.md', async () => {
      await reset(tempDir, false, false, true, ['codex']);

      expect(fs.existsSync(path.join(tempDir, '.github', 'copilot-instructions.md'))).toBe(false);
    });

    it('should not remove files in dry-run mode', async () => {
      await reset(tempDir, true, false, true, DEFAULT_IDES);

      // All files should still exist
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
    });

    it('should remove empty .cursor/rules directory', async () => {
      await reset(tempDir, false, false, true, ['cursor']);

      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules'))).toBe(false);
    });

    it('should keep .cursor/rules if non-template files remain', async () => {
      // Add a custom file
      fs.writeFileSync(path.join(tempDir, '.cursor', 'rules', 'my-custom-rules.md'), '# Custom');

      await reset(tempDir, false, false, true, ['cursor']);

      // Directory should still exist with custom file
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules'))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'my-custom-rules.md'))).toBe(true);
    });

    it('should also clean up legacy .cursorrules/ directory', async () => {
      // Manually create legacy directory with template files
      const legacyDir = path.join(tempDir, LEGACY_CURSORRULES_DIR);
      fs.mkdirSync(legacyDir, { recursive: true });
      for (const rule of SHARED_RULES) {
        fs.writeFileSync(path.join(legacyDir, rule), '# legacy shared');
      }
      fs.writeFileSync(path.join(legacyDir, 'web-frontend-overview.md'), '# legacy template');

      await reset(tempDir, false, true, true, ['cursor']);

      // Both directories should be cleaned up
      expect(fs.existsSync(path.join(tempDir, '.cursor', 'rules', 'web-frontend-overview.md'))).toBe(false);
      expect(fs.existsSync(path.join(legacyDir, 'web-frontend-overview.md'))).toBe(false);
    });
  });
});

// ============================================================================
// CLI Argument Parsing Tests
// ============================================================================

describe('CLI Argument Parsing', () => {
  let originalCwd;
  let tempDir;
  let exitSpy;
  let consoleLogSpy;
  let consoleErrorSpy;
  
  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-templates-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
    
    // Mock process.exit to prevent test from exiting
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('should show help with --help', async () => {
    await expect(run(['--help'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should show help with -h', async () => {
    await expect(run(['-h'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should list templates with --list', async () => {
    await expect(run(['--list'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should list templates with -l', async () => {
    await expect(run(['-l'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('should show version with --version', async () => {
    await expect(run(['--version'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('agentic-team-templates'));
  });

  it('should show version with -v', async () => {
    await expect(run(['-v'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('agentic-team-templates'));
  });

  it('should show changelog link with --version', async () => {
    await expect(run(['--version'])).rejects.toThrow('process.exit');
    
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('github.com'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('releases/tag'));
  });

  it('should error on unknown option', async () => {
    await expect(run(['--unknown-option'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should error when no templates specified', async () => {
    await expect(run([])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error on unknown template', async () => {
    await expect(run(['nonexistent-template'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error on unknown IDE', async () => {
    await expect(run(['web-frontend', '--ide=unknown'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should accept valid template', async () => {
    await run(['web-frontend', '--dry-run']);
    
    // Should not exit with error
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept multiple templates', async () => {
    await run(['web-frontend', 'web-backend', '--dry-run']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept valid IDE option', async () => {
    await run(['web-frontend', '--ide=cursor', '--dry-run']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept multiple IDE options', async () => {
    await run(['web-frontend', '--ide=cursor', '--ide=claude', '--dry-run']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should error when using --remove and --reset together', async () => {
    await expect(run(['--remove', '--reset'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error when --reset has template arguments', async () => {
    await expect(run(['--reset', 'web-frontend'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should error when --remove has no templates', async () => {
    await expect(run(['--remove'])).rejects.toThrow('process.exit');
    
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('should accept --remove with valid template', async () => {
    // First install, then remove
    await run(['web-frontend']);
    await run(['--remove', 'web-frontend', '--yes']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept --reset with --yes', async () => {
    // First install, then reset
    await run(['web-frontend']);
    await run(['--reset', '--yes']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept --force flag', async () => {
    await run(['web-frontend', '--force', '--dry-run']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept -f shorthand for force', async () => {
    await run(['web-frontend', '-f', '--dry-run']);
    
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should accept -y shorthand for yes', async () => {
    await run(['web-frontend']);
    await run(['--reset', '-y']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should resolve shorthand alias "js" to javascript-expert', async () => {
    await run(['js', '--dry-run']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should resolve shorthand alias "go" to golang-expert', async () => {
    await run(['go', '--dry-run']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should resolve shorthand alias "py" to python-expert', async () => {
    await run(['py', '--dry-run']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should resolve shorthand alias "rs" to rust-expert', async () => {
    await run(['rs', '--dry-run']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should resolve shorthand alias "kt" to kotlin-expert', async () => {
    await run(['kt', '--dry-run']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should resolve aliases in --remove mode', async () => {
    await run(['go']);
    await run(['--remove', 'go', '--yes']);

    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should still accept canonical template names', async () => {
    await run(['javascript-expert', '--dry-run']);

    expect(exitSpy).not.toHaveBeenCalled();
  });
});
