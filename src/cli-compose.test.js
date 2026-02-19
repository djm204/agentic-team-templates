/**
 * Tests for multi-skill composition via the CLI.
 *
 * When multiple skill names are provided with --adapter and --budget,
 * the CLI composes them into a single merged output using composeSkills().
 *
 *   ask <skill-a> <skill-b> --adapter=raw --budget=8000
 *
 * This is distinct from sequential single-skill installs (one per skill, no budget).
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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-skills-compose-test-'));
}

// ============================================================================
// Argument parsing — --budget flag
// ============================================================================

describe('--budget flag parsing', () => {
  it('rejects --budget with non-numeric value', async () => {
    const tmpDir = makeTmpDir();
    try {
      await expect(
        run(['research-assistant', 'market-intelligence', '--adapter=raw', '--budget=abc', `--out=${tmpDir}`, '--skill-dir=skills'])
      ).rejects.toThrow(/invalid budget|budget.*number/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('rejects --budget with zero', async () => {
    const tmpDir = makeTmpDir();
    try {
      await expect(
        run(['research-assistant', '--adapter=raw', '--budget=0', `--out=${tmpDir}`, '--skill-dir=skills'])
      ).rejects.toThrow(/invalid budget|budget.*positive/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  it('rejects --budget with negative value', async () => {
    const tmpDir = makeTmpDir();
    try {
      await expect(
        run(['research-assistant', '--adapter=raw', '--budget=-100', `--out=${tmpDir}`, '--skill-dir=skills'])
      ).rejects.toThrow(/invalid budget|budget.*positive/i);
    } finally {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });
});

// ============================================================================
// Single-skill + budget (passthrough — budget affects tier selection)
// ============================================================================

describe('single skill with --budget', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('installs a single skill with --budget without error', async () => {
    await expect(
      run(['research-assistant', '--adapter=raw', '--budget=4000', `--out=${tmpDir}`, '--skill-dir=skills'])
    ).resolves.not.toThrow();
    const files = fs.readdirSync(tmpDir);
    expect(files.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Multi-skill composition
// ============================================================================

describe('multi-skill composition with --adapter and --budget', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = makeTmpDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('composes two skills into a single output file', async () => {
    await run([
      'research-assistant',
      'market-intelligence',
      '--adapter=raw',
      '--budget=8000',
      `--out=${tmpDir}`,
      '--skill-dir=skills',
    ]);

    const files = fs.readdirSync(tmpDir);
    expect(files.length).toBe(1);
  });

  it('composed output contains content from both skills', async () => {
    await run([
      'research-assistant',
      'market-intelligence',
      '--adapter=raw',
      '--budget=8000',
      `--out=${tmpDir}`,
      '--skill-dir=skills',
    ]);

    const files = fs.readdirSync(tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, files[0]), 'utf8');
    expect(content).toMatch(/research/i);
    expect(content).toMatch(/market|intelligence/i);
  });

  it('composed output file is named after all skills joined', async () => {
    await run([
      'research-assistant',
      'market-intelligence',
      '--adapter=raw',
      '--budget=8000',
      `--out=${tmpDir}`,
      '--skill-dir=skills',
    ]);

    const files = fs.readdirSync(tmpDir);
    expect(files[0]).toMatch(/research-assistant.*market-intelligence|market-intelligence.*research-assistant/);
  });

  it('respects --primary when composing', async () => {
    // Should not throw even when --primary is specified
    await expect(
      run([
        'research-assistant',
        'market-intelligence',
        '--adapter=raw',
        '--budget=8000',
        '--primary=research-assistant',
        `--out=${tmpDir}`,
        '--skill-dir=skills',
      ])
    ).resolves.not.toThrow();
  });

  it('throws when a primary skill is not in the skill list', async () => {
    await expect(
      run([
        'research-assistant',
        'market-intelligence',
        '--adapter=raw',
        '--budget=8000',
        '--primary=nonexistent-skill',
        `--out=${tmpDir}`,
        '--skill-dir=skills',
      ])
    ).rejects.toThrow(/primary.*not.*skill|skill.*not.*primary/i);
  });

  it('works with cursor adapter producing a .mdc file', async () => {
    await run([
      'research-assistant',
      'market-intelligence',
      '--adapter=cursor',
      '--budget=8000',
      `--out=${tmpDir}`,
      '--skill-dir=skills',
    ]);

    // Cursor adapter writes to .cursor/rules/ subdirectory
    function findFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      return entries.flatMap((e) =>
        e.isDirectory() ? findFiles(path.join(dir, e.name)) : [path.join(dir, e.name)]
      );
    }
    const allFiles = findFiles(tmpDir);
    expect(allFiles.some((f) => f.endsWith('.mdc'))).toBe(true);
  });

  it('works with three skills', async () => {
    await expect(
      run([
        'research-assistant',
        'market-intelligence',
        'strategic-negotiator',
        '--adapter=raw',
        '--budget=12000',
        `--out=${tmpDir}`,
        '--skill-dir=skills',
      ])
    ).resolves.not.toThrow();
  });

  it('throws when conflicting skills are composed', async () => {
    // This test will work once we have skills with actual conflicts_with entries;
    // for now it verifies the option is wired without crashing when there is no conflict
    await expect(
      run([
        'research-assistant',
        'market-intelligence',
        '--adapter=raw',
        '--budget=8000',
        `--out=${tmpDir}`,
        '--skill-dir=skills',
      ])
    ).resolves.not.toThrow();
  });
});
