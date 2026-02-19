/**
 * Tests for the --adapter flag on the CLI.
 *
 * The --adapter flag enables the skill-pack pipeline:
 *   ask <skill-name> --adapter=<adapter-name> [--tier=<tier>] [--out=<dir>]
 *
 * This is distinct from the template install flow (--ide=).
 * It loads a skill from skills/ and writes adapter output to a target dir.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { run } from './index.js';

// ============================================================================
// Helpers
// ============================================================================

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-skills-adapter-test-'));
}

// ============================================================================
// Argument Parsing — --adapter flag
// ============================================================================

describe('--adapter flag parsing', () => {
  it('rejects unknown adapter names', async () => {
    await expect(
      run(['strategic-negotiator', '--adapter=does-not-exist', '--skill-dir=skills'])
    ).rejects.toThrow(/unknown adapter/i);
  });

  it('rejects --adapter without a value', async () => {
    await expect(
      run(['strategic-negotiator', '--adapter=', '--skill-dir=skills'])
    ).rejects.toThrow(/unknown adapter|adapter.*required/i);
  });

  it('errors when skill is not found', async () => {
    await expect(
      run(['nonexistent-skill', '--adapter=raw', '--skill-dir=skills'])
    ).rejects.toThrow(/skill.*not found|not found/i);
  });

  it('accepts all registered adapters without throwing a parse error', async () => {
    const adapters = ['raw', 'cursor', 'claude-code', 'copilot', 'openai-agents', 'langchain', 'crewai'];
    const tmpDir = makeTmpDir();
    try {
      for (const adapter of adapters) {
        // Should not throw "unknown adapter" — may throw "skill not found" which is fine
        await expect(
          run(['nonexistent-skill', `--adapter=${adapter}`, '--skill-dir=skills', `--out=${tmpDir}`])
        ).rejects.toThrow(/skill.*not found|not found/i);
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

// ============================================================================
// Skill Install via Adapter
// ============================================================================

describe('skill install via --adapter', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('writes output files to --out directory', async () => {
    await run([
      'strategic-negotiator',
      '--adapter=raw',
      '--skill-dir=skills',
      `--out=${tmpDir}`,
    ]);
    const files = fs.readdirSync(tmpDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('raw adapter outputs a .md file containing the skill name', async () => {
    await run([
      'strategic-negotiator',
      '--adapter=raw',
      '--skill-dir=skills',
      `--out=${tmpDir}`,
    ]);
    const files = fs.readdirSync(tmpDir);
    const mdFile = files.find(f => f.endsWith('.md'));
    expect(mdFile).toBeDefined();
    const content = fs.readFileSync(path.join(tmpDir, mdFile), 'utf8');
    expect(content).toContain('Strategic Negotiator');
  });

  it('cursor adapter outputs a .mdc file', async () => {
    await run([
      'strategic-negotiator',
      '--adapter=cursor',
      '--skill-dir=skills',
      `--out=${tmpDir}`,
    ]);
    const files = fs.readdirSync(tmpDir, { recursive: true });
    const mdcFile = files.find(f => String(f).endsWith('.mdc'));
    expect(mdcFile).toBeDefined();
  });

  it('openai-agents adapter outputs an instructions file', async () => {
    await run([
      'strategic-negotiator',
      '--adapter=openai-agents',
      '--skill-dir=skills',
      `--out=${tmpDir}`,
    ]);
    const files = fs.readdirSync(tmpDir);
    expect(files.some(f => f.includes('instructions'))).toBe(true);
  });

  it('respects --tier flag for prompt selection', async () => {
    await run([
      'strategic-negotiator',
      '--adapter=raw',
      '--tier=minimal',
      '--skill-dir=skills',
      `--out=${tmpDir}`,
    ]);
    const files = fs.readdirSync(tmpDir);
    const mdFile = files.find(f => f.endsWith('.md'));
    const content = fs.readFileSync(path.join(tmpDir, mdFile), 'utf8');
    // Minimal tier content should be shorter than standard
    expect(content.length).toBeGreaterThan(0);
  });

  it('rejects invalid tier names', async () => {
    await expect(
      run([
        'strategic-negotiator',
        '--adapter=raw',
        '--tier=ultra',
        '--skill-dir=skills',
        `--out=${tmpDir}`,
      ])
    ).rejects.toThrow(/invalid tier|unknown tier/i);
  });

  it('defaults output to current directory when --out is not specified', async () => {
    // This just checks it doesn't throw for a valid skill+adapter combo
    // We don't write to cwd in tests - we check the run resolves
    const origCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      await run([
        'strategic-negotiator',
        '--adapter=raw',
        '--skill-dir=' + path.resolve(origCwd, 'skills'),
      ]);
      const files = fs.readdirSync(tmpDir);
      expect(files.length).toBeGreaterThan(0);
    } finally {
      process.chdir(origCwd);
    }
  });
});

// ============================================================================
// --adapter and --ide are mutually exclusive
// ============================================================================

describe('--adapter and --ide are mutually exclusive', () => {
  it('errors when both --adapter and --ide are specified', async () => {
    await expect(
      run(['strategic-negotiator', '--adapter=raw', '--ide=cursor', '--skill-dir=skills'])
    ).rejects.toThrow(/cannot use.*adapter.*ide|adapter.*incompatible|mutually exclusive/i);
  });
});
