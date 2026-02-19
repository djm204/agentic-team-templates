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
