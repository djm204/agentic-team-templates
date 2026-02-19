/**
 * test-runner.js — Skill test suite loader and evaluator
 *
 * Loads test cases from skills/<name>/tests/test_cases.yaml, validates their
 * structure, and evaluates agent responses against declared assertions.
 *
 * Test case YAML format:
 *
 *   name: skill-name-tests
 *   skill: skill-name
 *   version: 1.0.0
 *   cases:
 *     - id: unique-id
 *       description: "What this case verifies"
 *       prompt: "The user message to send to the agent"
 *       expected:
 *         contains: [str, ...]       # all must appear in response (case-insensitive)
 *         contains_any: [str, ...]   # at least one must appear
 *         not_contains: [str, ...]   # none may appear
 *         min_length: N              # response char length minimum
 *         max_length: N              # response char length maximum
 *       tags: [tag, ...]
 */

import fs from 'fs';
import path from 'path';
import { parseYaml } from '../core/skill-loader.js';

// ============================================================================
// Constants
// ============================================================================

export const REQUIRED_CASE_FIELDS = ['id', 'description', 'prompt'];

const TEST_CASES_FILENAME = 'test_cases.yaml';

// ============================================================================
// loadTestSuite
// ============================================================================

/**
 * Load a test suite from a skill directory.
 *
 * @param {string} skillDir - Path to the skill directory
 * @returns {object|null} Parsed test suite, or null if no tests directory/file found
 */
export function loadTestSuite(skillDir) {
  const testsDir = path.join(skillDir, 'tests');
  if (!fs.existsSync(testsDir)) return null;

  const yamlPath = path.join(testsDir, TEST_CASES_FILENAME);
  if (!fs.existsSync(yamlPath)) return null;

  const raw = fs.readFileSync(yamlPath, 'utf8');
  const parsed = parseYaml(raw);

  // Ensure cases is always an array
  if (!Array.isArray(parsed.cases)) {
    parsed.cases = [];
  }

  return parsed;
}

// ============================================================================
// validateTestCase
// ============================================================================

/**
 * Validate a single test case object.
 *
 * @param {object} testCase
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validateTestCase(testCase) {
  const errors = [];

  // Required fields
  for (const field of REQUIRED_CASE_FIELDS) {
    if (testCase[field] === undefined || testCase[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // id must be a string
  if (testCase.id !== undefined && typeof testCase.id !== 'string') {
    errors.push('Field "id" must be a string');
  }

  // expected assertions validation
  const exp = testCase.expected;
  if (exp) {
    for (const key of ['contains', 'contains_any', 'not_contains']) {
      if (exp[key] !== undefined && !Array.isArray(exp[key])) {
        errors.push(`Field "expected.${key}" must be an array`);
      }
    }

    if (exp.min_length !== undefined) {
      if (typeof exp.min_length !== 'number' || exp.min_length < 0) {
        errors.push('Field "expected.min_length" must be a non-negative number');
      }
    }

    if (exp.max_length !== undefined) {
      if (typeof exp.max_length !== 'number' || exp.max_length < 0) {
        errors.push('Field "expected.max_length" must be a non-negative number');
      }
      const minLen = typeof exp.min_length === 'number' ? exp.min_length : 0;
      if (typeof exp.max_length === 'number' && exp.max_length < minLen) {
        errors.push('Field "expected.max_length" must be >= min_length');
      }
    }
  }

  return errors;
}

// ============================================================================
// evaluateResponse
// ============================================================================

/**
 * Evaluate an agent response against the expected assertions for a test case.
 *
 * @param {string} response - The agent's response text
 * @param {object} [expected={}] - The expected assertions object
 * @returns {{ passed: boolean, failures: string[] }}
 */
export function evaluateResponse(response, expected = {}) {
  const failures = [];
  const lower = response.toLowerCase();

  // contains — all must appear (case-insensitive)
  if (Array.isArray(expected.contains)) {
    for (const str of expected.contains) {
      if (!lower.includes(str.toLowerCase())) {
        failures.push(`contains: "${str}" not found in response`);
      }
    }
  }

  // contains_any — at least one must appear
  if (Array.isArray(expected.contains_any) && expected.contains_any.length > 0) {
    const anyFound = expected.contains_any.some((str) => lower.includes(str.toLowerCase()));
    if (!anyFound) {
      failures.push(`contains_any: none of [${expected.contains_any.join(', ')}] found in response`);
    }
  }

  // not_contains — none may appear
  if (Array.isArray(expected.not_contains)) {
    for (const str of expected.not_contains) {
      if (lower.includes(str.toLowerCase())) {
        failures.push(`not_contains: "${str}" was found in response`);
      }
    }
  }

  // min_length
  if (typeof expected.min_length === 'number') {
    if (response.length < expected.min_length) {
      failures.push(
        `min_length: response length ${response.length} < required ${expected.min_length}`
      );
    }
  }

  // max_length
  if (typeof expected.max_length === 'number') {
    if (response.length > expected.max_length) {
      failures.push(
        `max_length: response length ${response.length} > limit ${expected.max_length}`
      );
    }
  }

  return { passed: failures.length === 0, failures };
}

// ============================================================================
// runTestSuite
// ============================================================================

/**
 * Run all test cases in a suite through a response provider.
 *
 * @param {object} suite - Loaded test suite (from loadTestSuite)
 * @param {function} provider - async (prompt: string) => string
 * @param {{ tags?: string[] }} [options={}]
 * @returns {Promise<TestRunResult>}
 *
 * @typedef {object} CaseResult
 * @property {string} id
 * @property {boolean} passed
 * @property {string[]} failures
 * @property {string} [error]
 * @property {number} durationMs
 *
 * @typedef {object} TestRunResult
 * @property {string} skill
 * @property {number} total
 * @property {number} passed
 * @property {number} failed
 * @property {number} passRate
 * @property {CaseResult[]} cases
 */
export async function runTestSuite(suite, provider, options = {}) {
  const { tags } = options;

  // Filter cases by tag if requested
  let cases = suite.cases || [];
  if (tags && tags.length > 0) {
    cases = cases.filter((c) => {
      const caseTags = c.tags || [];
      return tags.some((t) => caseTags.includes(t));
    });
  }

  const caseResults = [];

  for (const testCase of cases) {
    const start = Date.now();
    let response = '';
    let caseError = null;

    try {
      response = await provider(testCase.prompt);
    } catch (err) {
      caseError = err.message || String(err);
    }

    const { passed, failures } = caseError
      ? { passed: false, failures: [] }
      : evaluateResponse(response, testCase.expected || {});

    const result = {
      id: testCase.id,
      description: testCase.description,
      passed: caseError ? false : passed,
      failures,
      durationMs: Date.now() - start,
    };
    if (caseError) result.error = caseError;

    caseResults.push(result);
  }

  const passedCount = caseResults.filter((r) => r.passed).length;
  const failedCount = caseResults.length - passedCount;

  return {
    skill: suite.skill,
    name: suite.name,
    total: caseResults.length,
    passed: passedCount,
    failed: failedCount,
    passRate: caseResults.length > 0 ? passedCount / caseResults.length : 0,
    cases: caseResults,
  };
}
