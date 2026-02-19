/**
 * Tests for the --test CLI flag.
 *
 * `ask <skill-name> --test` loads the skill's test suite and prints
 * a report of all test cases (without calling an LLM).
 */

import { describe, it, expect } from 'vitest';
import { run } from './index.js';

describe('--test flag', () => {
  it('throws when --test is used without a skill name', async () => {
    await expect(run(['--test', '--skill-dir=skills'])).rejects.toThrow(
      /skill.*name|no skill/i
    );
  });

  it('throws when the skill does not exist', async () => {
    await expect(
      run(['nonexistent-skill', '--test', '--skill-dir=skills'])
    ).rejects.toThrow(/not found|no such/i);
  });

  it('throws when the skill has no test suite', async () => {
    // educator skill has no tests/ directory
    await expect(
      run(['educator', '--test', '--skill-dir=skills'])
    ).rejects.toThrow(/no test suite|test.*not found/i);
  });

  it('resolves without error for a skill with a test suite (dry-run mode)', async () => {
    await expect(
      run(['research-assistant', '--test', '--skill-dir=skills'])
    ).resolves.not.toThrow();
  });

  it('resolves without error for strategic-negotiator', async () => {
    await expect(
      run(['strategic-negotiator', '--test', '--skill-dir=skills'])
    ).resolves.not.toThrow();
  });
});
