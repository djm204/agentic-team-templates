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

  // --------------------------------------------------------------------------
  // Output schema loading
  // --------------------------------------------------------------------------

  it('includes output_schemas array (empty when no output_schemas/ dir)', async () => {
    const skillDir = path.join(tmpDir, 'test-skill');
    createSkillFixture(skillDir);

    const skill = await loadSkill(skillDir);

    expect(Array.isArray(skill.output_schemas)).toBe(true);
    expect(skill.output_schemas).toHaveLength(0);
  });

  it('loads output schemas from output_schemas/ directory', async () => {
    const skillDir = path.join(tmpDir, 'schema-skill');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'output_schemas'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'output_schemas', 'report.yaml'),
      'name: report\ndescription: A structured report\nformat: json\nschema:\n  type: object\n'
    );

    const skill = await loadSkill(skillDir);

    expect(skill.output_schemas).toHaveLength(1);
    expect(skill.output_schemas[0].name).toBe('report');
    expect(skill.output_schemas[0].format).toBe('json');
  });

  it('loads multiple output schemas sorted by name', async () => {
    const skillDir = path.join(tmpDir, 'multi-schema-skill');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'output_schemas'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'output_schemas', 'summary.yaml'),
      'name: summary\ndescription: Summary\nformat: json\n'
    );
    fs.writeFileSync(
      path.join(skillDir, 'output_schemas', 'analysis.yaml'),
      'name: analysis\ndescription: Analysis\nformat: json\n'
    );

    const skill = await loadSkill(skillDir);

    expect(skill.output_schemas).toHaveLength(2);
    expect(skill.output_schemas[0].name).toBe('analysis');
    expect(skill.output_schemas[1].name).toBe('summary');
  });

  // --------------------------------------------------------------------------
  // Fragment resolution
  // --------------------------------------------------------------------------

  it('resolves {{fragment:name}} references in prompts when fragmentsDir is provided', async () => {
    const skillDir = path.join(tmpDir, 'fragment-skill');
    const fragDir = path.join(tmpDir, 'fragments');
    fs.mkdirSync(fragDir, { recursive: true });
    fs.writeFileSync(path.join(fragDir, 'ethics.md'), 'Always be ethical.');

    createSkillFixture(skillDir, VALID_MANIFEST, {
      'standard.md': 'Standard prompt.\n{{fragment:ethics}}',
    });

    const skill = await loadSkill(skillDir, { fragmentsDir: fragDir });

    expect(skill.prompts.standard).toContain('Always be ethical.');
    expect(skill.prompts.standard).not.toContain('{{fragment:ethics}}');
  });

  it('leaves prompts unchanged when fragmentsDir is not provided', async () => {
    const skillDir = path.join(tmpDir, 'no-frag-skill');
    createSkillFixture(skillDir, VALID_MANIFEST, {
      'standard.md': 'Standard prompt.\n{{fragment:ethics}}',
    });

    const skill = await loadSkill(skillDir);

    expect(skill.prompts.standard).toContain('{{fragment:ethics}}');
  });

  it('resolves fragments in all tiers when fragmentsDir is provided', async () => {
    const skillDir = path.join(tmpDir, 'multi-tier-frag-skill');
    const fragDir = path.join(tmpDir, 'fragments');
    fs.mkdirSync(fragDir, { recursive: true });
    fs.writeFileSync(path.join(fragDir, 'footer.md'), 'Footer content.');

    createSkillFixture(skillDir, VALID_MANIFEST, {
      'minimal.md': 'Minimal.\n{{fragment:footer}}',
      'standard.md': 'Standard.\n{{fragment:footer}}',
      'comprehensive.md': 'Comprehensive.\n{{fragment:footer}}',
    });

    const skill = await loadSkill(skillDir, { fragmentsDir: fragDir });

    expect(skill.prompts.minimal).toContain('Footer content.');
    expect(skill.prompts.standard).toContain('Footer content.');
    expect(skill.prompts.comprehensive).toContain('Footer content.');
  });

  it('loads full tool schema fields (description, when_to_use, parameters, returns)', async () => {
    const skillDir = path.join(tmpDir, 'skill-full-tool');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'tools'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'tools', 'scenario_model.yaml'),
      [
        'name: scenario_model',
        'description: "Model a negotiation scenario"',
        'when_to_use: "When analyzing deal structures"',
        'parameters:',
        '  parties:',
        '    type: array',
        '    description: "List of negotiating parties"',
        '    required: true',
        '  scenarios:',
        '    type: array',
        '    description: "Possible outcome scenarios"',
        '    required: true',
        'returns:',
        '  type: object',
        '  description: "Ranked scenarios with recommendations"',
      ].join('\n')
    );

    const skill = await loadSkill(skillDir);
    const tool = skill.tools[0];

    expect(tool.name).toBe('scenario_model');
    expect(tool.description).toContain('negotiation scenario');
    expect(tool.when_to_use).toContain('deal structures');
    expect(tool.parameters.parties.type).toBe('array');
    expect(tool.parameters.parties.required).toBe(true);
    expect(tool.returns.type).toBe('object');
  });

  it('loads multiple tool files and sorts by name', async () => {
    const skillDir = path.join(tmpDir, 'skill-multi-tools');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'tools'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'tools', 'web_search.yaml'),
      'name: web_search\ndescription: Search\nparameters:\n  query:\n    type: string\n    required: true\n'
    );
    fs.writeFileSync(
      path.join(skillDir, 'tools', 'document_fetch.yaml'),
      'name: document_fetch\ndescription: Fetch doc\nparameters:\n  url:\n    type: string\n    required: true\n'
    );

    const skill = await loadSkill(skillDir);

    expect(skill.tools).toHaveLength(2);
    const names = skill.tools.map(t => t.name).sort();
    expect(names).toContain('web_search');
    expect(names).toContain('document_fetch');
  });

  it('ignores non-yaml files in output_schemas/', async () => {
    const skillDir = path.join(tmpDir, 'schema-ignore-skill');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'output_schemas'), { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'output_schemas', 'report.yaml'),
      'name: report\ndescription: A report\nformat: json\n'
    );
    fs.writeFileSync(path.join(skillDir, 'output_schemas', 'README.md'), '# Schemas');

    const skill = await loadSkill(skillDir);

    expect(skill.output_schemas).toHaveLength(1);
  });

  it('real skill market-intelligence has output schemas', async () => {
    const skillDir = new URL('../../skills/market-intelligence', import.meta.url).pathname;
    const skill = await loadSkill(skillDir);
    expect(skill.output_schemas.length).toBeGreaterThan(0);
    const schemaNames = skill.output_schemas.map((s) => s.name);
    expect(schemaNames).toContain('market_report');
  });

  it('real skill strategic-negotiator has output schemas', async () => {
    const skillDir = new URL('../../skills/strategic-negotiator', import.meta.url).pathname;
    const skill = await loadSkill(skillDir);
    expect(skill.output_schemas.length).toBeGreaterThan(0);
    const schemaNames = skill.output_schemas.map((s) => s.name);
    expect(schemaNames).toContain('negotiation_analysis');
    expect(skill.tools).toHaveLength(1);
    expect(skill.tools[0].name).toBe('scenario_model');
  });

  it('ignores non-yaml files in tools/ directory', async () => {
    const skillDir = path.join(tmpDir, 'skill-tools-nonjson');
    createSkillFixture(skillDir);
    fs.mkdirSync(path.join(skillDir, 'tools'), { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'tools', 'README.md'), '# Tools');
    fs.writeFileSync(
      path.join(skillDir, 'tools', 'web_search.yaml'),
      'name: web_search\ndescription: Search\nparameters:\n  query:\n    type: string\n    required: true\n'
    );

    const skill = await loadSkill(skillDir);

    expect(skill.tools).toHaveLength(1);
  });
});

// ============================================================================
// Tool definitions in real skills
// ============================================================================

describe('real skills with tool definitions', () => {
  const SKILLS_DIR = path.resolve('skills');

  it('research-assistant has web_search tool', async () => {
    const skill = await loadSkill(path.join(SKILLS_DIR, 'research-assistant'));
    const tool = skill.tools.find(t => t.name === 'web_search');
    expect(tool).toBeDefined();
    expect(tool.parameters.query).toBeDefined();
  });

  it('market-intelligence has fetch_market_data tool', async () => {
    const skill = await loadSkill(path.join(SKILLS_DIR, 'market-intelligence'));
    const tool = skill.tools.find(t => t.name === 'fetch_market_data');
    expect(tool).toBeDefined();
    expect(tool.parameters).toBeDefined();
  });

  it('strategic-negotiator has scenario_model tool', async () => {
    const skill = await loadSkill(path.join(SKILLS_DIR, 'strategic-negotiator'));
    const tool = skill.tools.find(t => t.name === 'scenario_model');
    expect(tool).toBeDefined();
    expect(tool.parameters.parties).toBeDefined();
  });

  it('devops-sre has query_metrics tool', async () => {
    const skill = await loadSkill(path.join(SKILLS_DIR, 'devops-sre'));
    const tool = skill.tools.find(t => t.name === 'query_metrics');
    expect(tool).toBeDefined();
    expect(tool.parameters).toBeDefined();
  });

  it('all tool files have required name and description fields', async () => {
    const skillNames = ['research-assistant', 'market-intelligence', 'strategic-negotiator', 'devops-sre'];
    for (const skillName of skillNames) {
      const skill = await loadSkill(path.join(SKILLS_DIR, skillName));
      for (const tool of skill.tools) {
        expect(tool.name, `${skillName}/${tool.name || '(unnamed)'} missing name`).toBeTruthy();
        expect(tool.description, `${skillName}/${tool.name} missing description`).toBeTruthy();
        expect(tool.parameters, `${skillName}/${tool.name} missing parameters`).toBeDefined();
      }
    }
  });
});
