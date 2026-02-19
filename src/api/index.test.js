/**
 * Tests for the programmatic public API.
 *
 * The public API allows agent frameworks to consume skills at runtime:
 *   loadSkill(nameOrPath, options) → SkillPack
 *   listSkills(skillsDir)          → SkillMeta[]
 *   getAdapter(name)               → AdapterFn
 *   ADAPTERS                       → string[]
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadSkill, listSkills, getAdapter, ADAPTERS } from './index.js';

// ============================================================================
// Fixtures
// ============================================================================

const VALID_MANIFEST = `name: test-api-skill
version: 1.0.0
category: engineering
tags:
  - testing
description:
  short: "A skill for API testing"
  long: "Used to validate the public API module."
context_budget:
  minimal: 800
  standard: 3200
  comprehensive: 8000
composable_with:
  recommended:
    - other-skill
conflicts_with: []
requires_tools: false
requires_memory: false
`;

function createSkillDir(baseDir, name = 'test-api-skill') {
  const dir = path.join(baseDir, name);
  fs.mkdirSync(path.join(dir, 'prompts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'skill.yaml'), VALID_MANIFEST.replace('test-api-skill', name));
  fs.writeFileSync(path.join(dir, 'prompts', 'minimal.md'), `# ${name} Minimal\n\nCore identity.`);
  fs.writeFileSync(path.join(dir, 'prompts', 'standard.md'), `# ${name} Standard\n\nFull prompt.`);
  fs.writeFileSync(path.join(dir, 'prompts', 'comprehensive.md'), `# ${name} Comprehensive\n\nFull with examples.`);
  return dir;
}

// ============================================================================
// loadSkill tests
// ============================================================================

describe('loadSkill (public API)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads a skill by directory path', async () => {
    const skillDir = createSkillDir(tmpDir);
    const skill = await loadSkill(skillDir);
    expect(skill.name).toBe('test-api-skill');
    expect(skill.version).toBe('1.0.0');
  });

  it('returns systemPrompt for the default tier (standard)', async () => {
    const skillDir = createSkillDir(tmpDir);
    const skill = await loadSkill(skillDir);
    expect(skill.systemPrompt).toContain('Standard');
    expect(skill.tierUsed).toBe('standard');
  });

  it('returns systemPrompt for a requested tier', async () => {
    const skillDir = createSkillDir(tmpDir);
    const skill = await loadSkill(skillDir, { tier: 'minimal' });
    expect(skill.systemPrompt).toContain('Minimal');
    expect(skill.tierUsed).toBe('minimal');
  });

  it('includes tools array', async () => {
    const skillDir = createSkillDir(tmpDir);
    const skill = await loadSkill(skillDir);
    expect(Array.isArray(skill.tools)).toBe(true);
  });

  it('throws on non-existent path', async () => {
    await expect(loadSkill('/does/not/exist')).rejects.toThrow();
  });
});

// ============================================================================
// listSkills tests
// ============================================================================

describe('listSkills', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-list-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns an array of skill metadata objects', async () => {
    createSkillDir(tmpDir, 'skill-a');
    createSkillDir(tmpDir, 'skill-b');
    const skills = await listSkills(tmpDir);
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(2);
  });

  it('each item has name, version, category, description.short', async () => {
    createSkillDir(tmpDir, 'skill-a');
    const [meta] = await listSkills(tmpDir);
    expect(typeof meta.name).toBe('string');
    expect(typeof meta.version).toBe('string');
    expect(typeof meta.category).toBe('string');
    expect(typeof meta.description?.short).toBe('string');
  });

  it('returns empty array for an empty directory', async () => {
    const skills = await listSkills(tmpDir);
    expect(skills).toEqual([]);
  });

  it('ignores non-skill subdirectories (no skill.yaml)', async () => {
    createSkillDir(tmpDir, 'real-skill');
    fs.mkdirSync(path.join(tmpDir, 'not-a-skill'));
    const skills = await listSkills(tmpDir);
    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('real-skill');
  });

  it('sorts skills alphabetically by name', async () => {
    createSkillDir(tmpDir, 'zebra-skill');
    createSkillDir(tmpDir, 'apple-skill');
    const skills = await listSkills(tmpDir);
    expect(skills[0].name).toBe('apple-skill');
    expect(skills[1].name).toBe('zebra-skill');
  });
});

// ============================================================================
// getAdapter and ADAPTERS re-exports
// ============================================================================

describe('getAdapter (re-exported from adapters)', () => {
  it('returns a function for known adapter names', () => {
    const adapter = getAdapter('raw');
    expect(typeof adapter).toBe('function');
  });

  it('throws for unknown adapter names', () => {
    expect(() => getAdapter('nonexistent')).toThrow(/unknown adapter/i);
  });
});

describe('ADAPTERS re-export', () => {
  it('is an array of adapter name strings', () => {
    expect(Array.isArray(ADAPTERS)).toBe(true);
    expect(ADAPTERS.length).toBeGreaterThan(0);
    for (const name of ADAPTERS) {
      expect(typeof name).toBe('string');
    }
  });

  it('includes the four built-in adapters', () => {
    expect(ADAPTERS).toEqual(expect.arrayContaining(['raw', 'cursor', 'claude-code', 'copilot']));
  });
});
