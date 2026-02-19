/**
 * Public programmatic API for agent-skills-kit.
 *
 * Use this to consume skill packs at runtime in agent frameworks:
 *
 *   import { loadSkill, listSkills, getAdapter, ADAPTERS } from '@djm204/agent-skills/api';
 *
 * @module agent-skills-kit
 */

import fs from 'fs';
import path from 'path';
import { loadSkill as _loadSkill } from '../core/skill-loader.js';
import { getAdapter, ADAPTERS } from '../adapters/index.js';
import { composeSkills as _composeSkills } from '../core/composer.js';
import {
  loadTestSuite as _loadTestSuite,
  runTestSuite as _runTestSuite,
  evaluateResponse,
  validateTestCase,
} from '../testing/test-runner.js';

export { evaluateResponse, validateTestCase };

// Re-export adapter utilities
export { getAdapter, ADAPTERS };

/**
 * Load a skill from a directory path.
 *
 * @param {string} skillPath - Absolute or relative path to the skill directory
 * @param {{ tier?: 'minimal' | 'standard' | 'comprehensive' }} [options]
 * @returns {Promise<import('../core/skill-loader.js').SkillPack>}
 */
export async function loadSkill(skillPath, options = {}) {
  const resolvedPath = path.resolve(skillPath);
  return _loadSkill(resolvedPath, options);
}

/**
 * List all skills in a skills directory.
 * Returns metadata only (no prompt content loaded).
 *
 * @param {string} skillsDir - Directory containing skill subdirectories
 * @returns {Promise<SkillMeta[]>}
 *
 * @typedef {object} SkillMeta
 * @property {string} name
 * @property {string} version
 * @property {string} category
 * @property {string[]} tags
 * @property {{ short: string, long: string }} description
 * @property {string} path - Absolute path to skill directory
 */
export async function listSkills(skillsDir) {
  const resolvedDir = path.resolve(skillsDir);

  if (!fs.existsSync(resolvedDir)) {
    return [];
  }

  const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
  const metas = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillPath = path.join(resolvedDir, entry.name);
    const manifestPath = path.join(skillPath, 'skill.yaml');

    if (!fs.existsSync(manifestPath)) continue;

    try {
      // Load just the manifest (no prompts) for metadata
      const skill = await _loadSkill(skillPath);
      metas.push({
        name: skill.name,
        version: skill.version,
        category: skill.category,
        tags: skill.tags,
        description: skill.description,
        path: skillPath,
      });
    } catch {
      // Skip skills with invalid manifests in listing
    }
  }

  return metas.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Compose multiple skills into a single merged prompt within a token budget.
 *
 * @param {object[]} skills - Array of SkillPack objects (from loadSkill)
 * @param {{
 *   budget?: number,
 *   primary?: string,
 *   conflictResolution?: 'throw' | 'primary_wins'
 * }} [options]
 * @returns {Promise<import('../core/composer.js').ComposedSkillPack>}
 */
export async function composeSkills(skills, options = {}) {
  return _composeSkills(skills, options);
}

/**
 * Load a skill's test suite from its tests/test_cases.yaml file.
 *
 * @param {string} skillPath - Absolute or relative path to the skill directory
 * @returns {object|null} Test suite, or null if no test cases found
 */
export function loadTestSuite(skillPath) {
  return _loadTestSuite(path.resolve(skillPath));
}

/**
 * Run all test cases in a suite through a response provider function.
 *
 * @param {object} suite - Test suite from loadTestSuite()
 * @param {function} provider - async (prompt: string) => string
 * @param {{ tags?: string[] }} [options]
 * @returns {Promise<import('../testing/test-runner.js').TestRunResult>}
 */
export async function runTestSuite(suite, provider, options = {}) {
  return _runTestSuite(suite, provider, options);
}
