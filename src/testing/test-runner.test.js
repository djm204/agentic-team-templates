/**
 * Tests for the skill test runner.
 *
 * The test runner loads test cases from skills/<name>/tests/test_cases.yaml,
 * evaluates agent responses against assertions, and returns structured results.
 *
 * Test case format:
 *   name: suite-name
 *   skill: skill-name
 *   version: 1.0.0
 *   cases:
 *     - id: unique-case-id
 *       description: "What this case verifies"
 *       prompt: "The user input to send to the agent"
 *       expected:
 *         contains: [str, ...]        # all must appear in response
 *         contains_any: [str, ...]    # at least one must appear
 *         not_contains: [str, ...]    # none may appear
 *         min_length: N               # response must be at least N chars
 *         max_length: N               # response must not exceed N chars
 *       tags: [tag, ...]
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadTestSuite,
  validateTestCase,
  evaluateResponse,
  runTestSuite,
  REQUIRED_CASE_FIELDS,
} from './test-runner.js';

// ============================================================================
// Fixtures
// ============================================================================

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-test-runner-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeTestCases(dir, content) {
  const testsDir = path.join(dir, 'tests');
  fs.mkdirSync(testsDir, { recursive: true });
  fs.writeFileSync(path.join(testsDir, 'test_cases.yaml'), content);
}

const MINIMAL_SUITE_YAML = `
name: my-skill-tests
skill: my-skill
version: 1.0.0
cases:
  - id: basic
    description: Basic test case
    prompt: What is the capital of France?
    expected:
      contains:
        - Paris
    tags:
      - core
`.trim();

const VALID_CASE = {
  id: 'basic',
  description: 'Basic test case',
  prompt: 'What is the capital of France?',
  expected: { contains: ['Paris'] },
  tags: ['core'],
};

// ============================================================================
// REQUIRED_CASE_FIELDS
// ============================================================================

describe('REQUIRED_CASE_FIELDS', () => {
  it('includes id, description, and prompt', () => {
    expect(REQUIRED_CASE_FIELDS).toEqual(
      expect.arrayContaining(['id', 'description', 'prompt'])
    );
  });
});

// ============================================================================
// loadTestSuite
// ============================================================================

describe('loadTestSuite', () => {
  it('loads a valid test suite from a skill directory', () => {
    writeTestCases(tmpDir, MINIMAL_SUITE_YAML);
    const suite = loadTestSuite(tmpDir);
    expect(suite.name).toBe('my-skill-tests');
    expect(suite.skill).toBe('my-skill');
    expect(suite.version).toBe('1.0.0');
    expect(Array.isArray(suite.cases)).toBe(true);
    expect(suite.cases).toHaveLength(1);
  });

  it('loads test case fields correctly', () => {
    writeTestCases(tmpDir, MINIMAL_SUITE_YAML);
    const suite = loadTestSuite(tmpDir);
    const c = suite.cases[0];
    expect(c.id).toBe('basic');
    expect(c.description).toBe('Basic test case');
    expect(c.prompt).toBe('What is the capital of France?');
    expect(c.expected.contains).toEqual(['Paris']);
    expect(c.tags).toEqual(['core']);
  });

  it('returns null when no tests/ directory exists', () => {
    const suite = loadTestSuite(tmpDir);
    expect(suite).toBeNull();
  });

  it('returns null when test_cases.yaml does not exist', () => {
    fs.mkdirSync(path.join(tmpDir, 'tests'));
    const suite = loadTestSuite(tmpDir);
    expect(suite).toBeNull();
  });

  it('loads a suite with multiple test cases', () => {
    writeTestCases(
      tmpDir,
      `
name: multi-tests
skill: my-skill
version: 1.0.0
cases:
  - id: case-one
    description: First case
    prompt: Prompt one
    expected:
      min_length: 10
  - id: case-two
    description: Second case
    prompt: Prompt two
    expected:
      contains:
        - hello
`.trim()
    );
    const suite = loadTestSuite(tmpDir);
    expect(suite.cases).toHaveLength(2);
    expect(suite.cases[0].id).toBe('case-one');
    expect(suite.cases[1].id).toBe('case-two');
  });

  it('real skill research-assistant has a test suite', () => {
    const skillDir = new URL('../../skills/research-assistant', import.meta.url).pathname;
    const suite = loadTestSuite(skillDir);
    expect(suite).not.toBeNull();
    expect(suite.cases.length).toBeGreaterThan(0);
  });

  it('real skill strategic-negotiator has a test suite', () => {
    const skillDir = new URL('../../skills/strategic-negotiator', import.meta.url).pathname;
    const suite = loadTestSuite(skillDir);
    expect(suite).not.toBeNull();
    expect(suite.cases.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// validateTestCase
// ============================================================================

describe('validateTestCase', () => {
  it('returns no errors for a valid test case', () => {
    expect(validateTestCase(VALID_CASE)).toEqual([]);
  });

  it('returns errors for missing required fields', () => {
    const errors = validateTestCase({});
    for (const field of REQUIRED_CASE_FIELDS) {
      expect(errors.some((e) => e.includes(field))).toBe(true);
    }
  });

  it('returns error when id is not a string', () => {
    const errors = validateTestCase({ ...VALID_CASE, id: 123 });
    expect(errors.some((e) => e.includes('id'))).toBe(true);
  });

  it('returns error when expected.contains is not an array', () => {
    const errors = validateTestCase({
      ...VALID_CASE,
      expected: { contains: 'not-an-array' },
    });
    expect(errors.some((e) => e.includes('contains'))).toBe(true);
  });

  it('returns error when expected.min_length is negative', () => {
    const errors = validateTestCase({
      ...VALID_CASE,
      expected: { min_length: -1 },
    });
    expect(errors.some((e) => e.includes('min_length'))).toBe(true);
  });

  it('returns error when expected.max_length is less than min_length', () => {
    const errors = validateTestCase({
      ...VALID_CASE,
      expected: { min_length: 100, max_length: 50 },
    });
    expect(errors.some((e) => e.includes('max_length'))).toBe(true);
  });

  it('returns no error when no expected assertions are present', () => {
    const noExpected = { id: 'x', description: 'y', prompt: 'z' };
    expect(validateTestCase(noExpected)).toEqual([]);
  });
});

// ============================================================================
// evaluateResponse
// ============================================================================

describe('evaluateResponse', () => {
  it('passes when contains strings all appear in response', () => {
    const result = evaluateResponse('Paris is the capital of France.', {
      contains: ['Paris', 'France'],
    });
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('fails when a required string is missing from response', () => {
    const result = evaluateResponse('London is a city.', { contains: ['Paris'] });
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes('Paris'))).toBe(true);
  });

  it('passes when at least one contains_any string appears', () => {
    const result = evaluateResponse('The answer is 42.', {
      contains_any: ['42', '100'],
    });
    expect(result.passed).toBe(true);
  });

  it('fails when no contains_any string appears', () => {
    const result = evaluateResponse('No numbers here.', {
      contains_any: ['42', '100'],
    });
    expect(result.passed).toBe(false);
  });

  it('passes when not_contains strings are absent', () => {
    const result = evaluateResponse('Safe content.', {
      not_contains: ['dangerous', 'harmful'],
    });
    expect(result.passed).toBe(true);
  });

  it('fails when a not_contains string is present', () => {
    const result = evaluateResponse('This is dangerous content.', {
      not_contains: ['dangerous'],
    });
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes('dangerous'))).toBe(true);
  });

  it('passes when response meets min_length', () => {
    const result = evaluateResponse('Hello world!', { min_length: 5 });
    expect(result.passed).toBe(true);
  });

  it('fails when response is shorter than min_length', () => {
    const result = evaluateResponse('Hi', { min_length: 100 });
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes('min_length'))).toBe(true);
  });

  it('passes when response meets max_length', () => {
    const result = evaluateResponse('Short.', { max_length: 1000 });
    expect(result.passed).toBe(true);
  });

  it('fails when response exceeds max_length', () => {
    const result = evaluateResponse('A'.repeat(200), { max_length: 50 });
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes('max_length'))).toBe(true);
  });

  it('passes with no expected assertions', () => {
    const result = evaluateResponse('Any response.', {});
    expect(result.passed).toBe(true);
  });

  it('passes with undefined expected', () => {
    const result = evaluateResponse('Any response.');
    expect(result.passed).toBe(true);
  });

  it('case-insensitive contains check', () => {
    const result = evaluateResponse('the answer is paris', { contains: ['Paris'] });
    expect(result.passed).toBe(true);
  });
});

// ============================================================================
// runTestSuite
// ============================================================================

describe('runTestSuite', () => {
  it('runs all cases through the response provider', async () => {
    const suite = {
      name: 'test',
      skill: 'my-skill',
      version: '1.0.0',
      cases: [
        { id: 'a', description: 'A', prompt: 'Question A', expected: { contains: ['answer'] } },
        { id: 'b', description: 'B', prompt: 'Question B', expected: { contains: ['result'] } },
      ],
    };

    const provider = async (prompt) => {
      if (prompt === 'Question A') return 'The answer is here.';
      if (prompt === 'Question B') return 'The result is here.';
      return '';
    };

    const results = await runTestSuite(suite, provider);
    expect(results.total).toBe(2);
    expect(results.passed).toBe(2);
    expect(results.failed).toBe(0);
  });

  it('reports failures when assertions do not pass', async () => {
    const suite = {
      name: 'test',
      skill: 'my-skill',
      version: '1.0.0',
      cases: [
        { id: 'a', description: 'A', prompt: 'Q', expected: { contains: ['Paris'] } },
      ],
    };

    const provider = async () => 'London is a city.';
    const results = await runTestSuite(suite, provider);
    expect(results.passed).toBe(0);
    expect(results.failed).toBe(1);
  });

  it('returns per-case results with id, passed, failures', async () => {
    const suite = {
      name: 'test',
      skill: 'my-skill',
      version: '1.0.0',
      cases: [
        { id: 'my-case', description: 'D', prompt: 'P', expected: { contains: ['x'] } },
      ],
    };

    const provider = async () => 'Nothing relevant here.';
    const results = await runTestSuite(suite, provider);

    expect(results.cases[0].id).toBe('my-case');
    expect(results.cases[0].passed).toBe(false);
    expect(Array.isArray(results.cases[0].failures)).toBe(true);
  });

  it('returns summary with pass rate', async () => {
    const suite = {
      name: 'test',
      skill: 'my-skill',
      version: '1.0.0',
      cases: [
        { id: 'a', description: 'A', prompt: 'Q1', expected: { contains: ['yes'] } },
        { id: 'b', description: 'B', prompt: 'Q2', expected: { contains: ['yes'] } },
      ],
    };

    const provider = async (prompt) =>
      prompt === 'Q1' ? 'yes answer' : 'no answer';

    const results = await runTestSuite(suite, provider);
    expect(results.passRate).toBeCloseTo(0.5);
  });

  it('handles provider errors gracefully — marks case as failed', async () => {
    const suite = {
      name: 'test',
      skill: 'my-skill',
      version: '1.0.0',
      cases: [
        { id: 'err-case', description: 'Error', prompt: 'P', expected: {} },
      ],
    };

    const provider = async () => { throw new Error('LLM unavailable'); };
    const results = await runTestSuite(suite, provider);
    expect(results.failed).toBe(1);
    expect(results.cases[0].error).toMatch(/LLM unavailable/);
  });

  it('filters by tag when tags option is provided', async () => {
    const suite = {
      name: 'test',
      skill: 'my-skill',
      version: '1.0.0',
      cases: [
        { id: 'core-case', description: 'Core', prompt: 'P1', expected: {}, tags: ['core'] },
        { id: 'edge-case', description: 'Edge', prompt: 'P2', expected: {}, tags: ['edge'] },
      ],
    };

    const provider = async () => 'response';
    const results = await runTestSuite(suite, provider, { tags: ['core'] });
    expect(results.total).toBe(1);
    expect(results.cases[0].id).toBe('core-case');
  });
});
