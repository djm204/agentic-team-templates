import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadSkill, validateManifest, REQUIRED_MANIFEST_FIELDS } from './skill-loader.js';

// ============================================================================
// Fixtures
// ============================================================================

const VALID_MANIFEST = {
  name: 'test-skill',
  version: '1.0.0',
  category: 'engineering',
  tags: ['testing'],
  description: {
    short: 'A test skill for unit testing',
    long: 'A comprehensive test skill used for validating the skill-loader module.',
  },
  context_budget: {
    minimal: 800,
    standard: 3200,
    comprehensive: 8000,
  },
};

function writeYaml(obj) {
  // Minimal YAML serializer for test fixtures (handles nested objects + arrays)
  function serialize(val, indent = 0) {
    const pad = '  '.repeat(indent);
    if (Array.isArray(val)) {
      return val.map((v) => `${pad}- ${typeof v === 'object' ? '\n' + serialize(v, indent + 1) : v}`).join('\n');
    }
    if (typeof val === 'object' && val !== null) {
      return Object.entries(val)
        .map(([k, v]) => {
          if (typeof v === 'object' && !Array.isArray(v)) {
            return `${pad}${k}:\n${serialize(v, indent + 1)}`;
          }
          if (Array.isArray(v)) {
            return `${pad}${k}:\n${serialize(v, indent + 1)}`;
          }
          return `${pad}${k}: ${v}`;
        })
        .join('\n');
    }
    return String(val);
  }
  return serialize(obj);
}

function createSkillFixture(dir, manifest = VALID_MANIFEST, prompts = {}) {
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, 'prompts'), { recursive: true });

  const yamlContent = writeYaml(manifest);
  fs.writeFileSync(path.join(dir, 'skill.yaml'), yamlContent);

  const defaultPrompts = {
    'minimal.md': '# Test Skill (Minimal)\n\nCore identity only.',
    'standard.md': '# Test Skill (Standard)\n\nFull behavioral prompt.',
    'comprehensive.md': '# Test Skill (Comprehensive)\n\nFull prompt with examples.',
  };
  const allPrompts = { ...defaultPrompts, ...prompts };

  for (const [filename, content] of Object.entries(allPrompts)) {
    if (content !== null) {
      fs.writeFileSync(path.join(dir, 'prompts', filename), content);
    }
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('REQUIRED_MANIFEST_FIELDS', () => {
  it('includes all required top-level fields', () => {
    expect(REQUIRED_MANIFEST_FIELDS).toEqual(
      expect.arrayContaining(['name', 'version', 'category', 'description', 'context_budget'])
    );
  });
});

describe('validateManifest', () => {
  it('returns no errors for a valid manifest', () => {
    const errors = validateManifest(VALID_MANIFEST);
    expect(errors).toEqual([]);
  });

  it('returns errors for missing required fields', () => {
    const errors = validateManifest({});
    for (const field of REQUIRED_MANIFEST_FIELDS) {
      expect(errors).toEqual(expect.arrayContaining([expect.stringContaining(field)]));
    }
  });

  it('returns error when name is not a string', () => {
    const errors = validateManifest({ ...VALID_MANIFEST, name: 123 });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('name')]));
  });

  it('returns error when version is not semver', () => {
    const errors = validateManifest({ ...VALID_MANIFEST, version: 'not-semver' });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('version')]));
  });

  it('returns error when description.short is missing', () => {
    const errors = validateManifest({
      ...VALID_MANIFEST,
      description: { long: 'only long' },
    });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('description.short')]));
  });

  it('returns error when context_budget.minimal is missing', () => {
    const errors = validateManifest({
      ...VALID_MANIFEST,
      context_budget: { standard: 3200, comprehensive: 8000 },
    });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('context_budget.minimal')]));
  });

  it('returns error when context_budget values are not positive numbers', () => {
    const errors = validateManifest({
      ...VALID_MANIFEST,
      context_budget: { minimal: -1, standard: 0, comprehensive: 'big' },
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns error when conflicts_with and composable_with.recommended overlap', () => {
    const errors = validateManifest({
      ...VALID_MANIFEST,
      composable_with: { recommended: ['foo'] },
      conflicts_with: ['foo'],
    });
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('conflict')]));
  });
});

describe('loadSkill', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-loader-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads a valid skill and returns structured result', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir);

    expect(skill.name).toBe('test-skill');
    expect(skill.version).toBe('1.0.0');
    expect(skill.category).toBe('engineering');
    expect(skill.description.short).toBe('A test skill for unit testing');
  });

  it('loads all three prompt tiers', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir);

    expect(skill.prompts.minimal).toContain('Minimal');
    expect(skill.prompts.standard).toContain('Standard');
    expect(skill.prompts.comprehensive).toContain('Comprehensive');
  });

  it('returns the prompt for a requested tier', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir, { tier: 'minimal' });

    expect(skill.systemPrompt).toContain('Minimal');
  });

  it('defaults to standard tier when no tier specified', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir);

    expect(skill.systemPrompt).toContain('Standard');
  });

  it('falls back to standard when minimal tier file is missing', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir, VALID_MANIFEST, { 'minimal.md': null });

    const skill = await loadSkill(skillDir, { tier: 'minimal' });

    expect(skill.systemPrompt).toContain('Standard');
    expect(skill.tierUsed).toBe('standard');
  });

  it('throws when skill directory does not exist', async () => {
    await expect(loadSkill('/nonexistent/path')).rejects.toThrow(/not found|does not exist/i);
  });

  it('throws when skill.yaml is missing', async () => {
    const skillDir = path.join(tmpDir, 'no-manifest');
    fs.mkdirSync(skillDir);

    await expect(loadSkill(skillDir)).rejects.toThrow(/skill\.yaml/i);
  });

  it('throws when skill.yaml has validation errors', async () => {
    const skillDir = path.join(tmpDir, 'bad-manifest');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'skill.yaml'), 'name: 123\nversion: bad');

    await expect(loadSkill(skillDir)).rejects.toThrow(/invalid|validation/i);
  });

  it('includes tools array (empty when no tools/ dir)', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir);

    expect(Array.isArray(skill.tools)).toBe(true);
    expect(skill.tools).toHaveLength(0);
  });

  it('includes the context_budget from manifest', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir);

    expect(skill.context_budget.minimal).toBe(800);
    expect(skill.context_budget.standard).toBe(3200);
    expect(skill.context_budget.comprehensive).toBe(8000);
  });

  it('loads tools from tools/ directory when present', async () => {
    const skillDir = path.join(tmpDir, 'skill-with-tools');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'tools'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'tools', 'web_search.yaml'),
      'name: web_search\ndescription: Search the web\nparameters:\n  query:\n    type: string\n    required: true\n'
    );

    const skill = await loadSkill(skillDir);

    expect(skill.tools).toHaveLength(1);
    expect(skill.tools[0].name).toBe('web_search');
  });
});
