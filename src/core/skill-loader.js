/**
 * skill-loader.js
 *
 * Loads and validates agent skill packs from the universal skill format.
 * A skill lives in a directory containing:
 *   - skill.yaml        (manifest)
 *   - prompts/
 *       minimal.md      (~800 tokens: core identity only)
 *       standard.md     (~3200 tokens: full behavioral prompt)
 *       comprehensive.md (~8000 tokens: includes examples)
 *   - tools/            (optional YAML tool definitions)
 *   - output_schemas/   (optional output schema definitions)
 *   - tests/            (optional test cases)
 */

import fs from 'fs';
import path from 'path';
import { resolveFragments } from './fragments.js';

// ============================================================================
// Constants
// ============================================================================

export const REQUIRED_MANIFEST_FIELDS = ['name', 'version', 'category', 'description', 'context_budget'];

const SEMVER_RE = /^\d+\.\d+\.\d+/;

const TIER_ORDER = ['minimal', 'standard', 'comprehensive'];

// ============================================================================
// YAML parser (minimal — handles the subset used in skill.yaml)
// ============================================================================

/**
 * Parse a minimal subset of YAML sufficient for skill manifests.
 * Handles: strings, numbers, booleans, arrays (- item), nested objects (key:\n  child:).
 * Does NOT handle: anchors, multi-line strings, quoted strings with colons.
 */
export function parseYaml(text) {
  const lines = text.split('\n');
  return parseBlock(lines, 0, 0).value;
}

function parseBlock(lines, startIndex, baseIndent) {
  const result = {};
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      i++;
      continue;
    }

    const indent = line.length - trimmed.length;

    // Dedent signals end of this block
    if (indent < baseIndent) {
      break;
    }

    // Array item
    if (trimmed.startsWith('- ')) {
      // Arrays are handled by the parent; return early
      break;
    }

    // Key: value pair
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      i++;
      continue;
    }

    const key = trimmed.slice(0, colonIdx).trim();
    const rest = trimmed.slice(colonIdx + 1).trimStart();

    if (rest === '' || rest === '\r') {
      // Value is a nested block or array on next lines
      i++;
      if (i < lines.length) {
        const nextTrimmed = lines[i].trimStart();
        if (nextTrimmed.startsWith('- ')) {
          // Array
          const arr = [];
          while (i < lines.length) {
            const l = lines[i];
            const t = l.trimStart();
            if (!t || t.startsWith('#')) { i++; continue; }
            if (!t.startsWith('- ')) break;
            const itemIndent = l.length - t.length;
            if (itemIndent < indent) break;
            const itemContent = t.slice(2).trim();
            const colonIdx = itemContent.indexOf(':');
            // Object item: "- key: value" (not a quoted string)
            if (
              colonIdx > 0 &&
              !itemContent.startsWith('"') &&
              !itemContent.startsWith("'")
            ) {
              const firstKey = itemContent.slice(0, colonIdx).trim();
              const firstRest = itemContent.slice(colonIdx + 1).trimStart();
              const obj = {};
              if (firstRest !== '' && firstRest !== '\r') {
                obj[firstKey] = parseScalar(firstRest);
              }
              i++;
              // Parse remaining properties at itemIndent + 2
              const child = parseBlock(lines, i, itemIndent + 2);
              Object.assign(obj, child.value);
              i = child.nextIndex;
              arr.push(obj);
            } else {
              arr.push(parseScalar(itemContent));
              i++;
            }
          }
          result[key] = arr;
        } else {
          // Nested object
          const child = parseBlock(lines, i, indent + 1);
          result[key] = child.value;
          i = child.nextIndex;
        }
      }
    } else {
      result[key] = parseScalar(rest);
      i++;
    }
  }

  return { value: result, nextIndex: i };
}

function parseScalar(str) {
  const s = str.trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  const n = Number(s);
  if (!Number.isNaN(n) && s !== '') return n;
  // Strip surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ============================================================================
// Manifest validation
// ============================================================================

/**
 * Validate a parsed skill manifest object.
 * @param {object} manifest
 * @returns {string[]} Array of error messages (empty = valid)
 */
export function validateManifest(manifest) {
  const errors = [];

  // Required fields
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (manifest[field] === undefined || manifest[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // name must be a string
  if (manifest.name !== undefined && typeof manifest.name !== 'string') {
    errors.push('Field "name" must be a string');
  }

  // version must match semver
  if (manifest.version !== undefined) {
    if (typeof manifest.version !== 'string' || !SEMVER_RE.test(manifest.version)) {
      errors.push('Field "version" must be a valid semver string (e.g. 1.0.0)');
    }
  }

  // description.short is required
  if (manifest.description !== undefined) {
    if (typeof manifest.description !== 'object' || !manifest.description.short) {
      errors.push('Field "description.short" is required');
    }
  }

  // context_budget fields must be positive numbers
  if (manifest.context_budget !== undefined && typeof manifest.context_budget === 'object') {
    for (const tier of ['minimal', 'standard', 'comprehensive']) {
      const val = manifest.context_budget[tier];
      if (val === undefined) {
        errors.push(`Missing required field: context_budget.${tier}`);
      } else if (typeof val !== 'number' || val <= 0) {
        errors.push(`Field "context_budget.${tier}" must be a positive number`);
      }
    }
  }

  // conflicts_with must not overlap with composable_with.recommended
  if (manifest.conflicts_with && manifest.composable_with?.recommended) {
    const conflicts = new Set(manifest.conflicts_with);
    const overlapping = manifest.composable_with.recommended.filter((s) => conflicts.has(s));
    if (overlapping.length > 0) {
      errors.push(
        `Skills cannot both conflict with and be recommended alongside: ${overlapping.join(', ')}`
      );
    }
  }

  return errors;
}

// ============================================================================
// Tool loader
// ============================================================================

function loadYamlDir(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  const items = [];
  for (const file of fs.readdirSync(dirPath).sort()) {
    if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
    const raw = fs.readFileSync(path.join(dirPath, file), 'utf8');
    items.push(parseYaml(raw));
  }
  return items;
}

function loadTools(skillDir) {
  return loadYamlDir(path.join(skillDir, 'tools'));
}

function loadOutputSchemas(skillDir) {
  return loadYamlDir(path.join(skillDir, 'output_schemas'));
}

// ============================================================================
// Skill loader
// ============================================================================

/**
 * Load a skill from a directory.
 *
 * @param {string} skillDir - Path to the skill directory
 * @param {object} [options]
 * @param {'minimal'|'standard'|'comprehensive'} [options.tier='standard'] - Prompt tier to use
 * @param {string|null} [options.fragmentsDir=null] - Optional directory of shared fragment .md files
 * @returns {Promise<SkillPack>}
 *
 * @typedef {object} SkillPack
 * @property {string} name
 * @property {string} version
 * @property {string} category
 * @property {string[]} tags
 * @property {object} description
 * @property {object} context_budget
 * @property {{ minimal: string, standard: string, comprehensive: string }} prompts
 * @property {string} systemPrompt - The prompt for the requested tier (with fallback)
 * @property {'minimal'|'standard'|'comprehensive'} tierUsed - Actual tier used (may differ due to fallback)
 * @property {object[]} tools
 */
export async function loadSkill(skillDir, options = {}) {
  const { tier = 'standard', fragmentsDir = null } = options;

  // Verify directory exists
  if (!fs.existsSync(skillDir)) {
    throw new Error(`Skill directory not found: ${skillDir}`);
  }

  // Load and parse manifest
  const manifestPath = path.join(skillDir, 'skill.yaml');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`skill.yaml not found in ${skillDir}`);
  }

  const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
  const manifest = parseYaml(manifestRaw);

  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid skill manifest in ${skillDir}:\n  ${errors.join('\n  ')}`);
  }

  // Load prompt tiers (resolve fragment references if fragmentsDir is provided)
  const promptsDir = path.join(skillDir, 'prompts');
  const prompts = {};
  for (const t of TIER_ORDER) {
    const filePath = path.join(promptsDir, `${t}.md`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const { text } = resolveFragments(raw, fragmentsDir);
      prompts[t] = text;
    }
  }

  // Resolve tier with fallback
  let tierUsed = tier;
  let systemPrompt = prompts[tier];

  if (!systemPrompt) {
    // Fall back through tier order toward standard
    const fallbackOrder =
      tier === 'minimal' ? ['standard', 'comprehensive'] : ['standard', 'minimal', 'comprehensive'];
    for (const fallback of fallbackOrder) {
      if (prompts[fallback]) {
        tierUsed = fallback;
        systemPrompt = prompts[fallback];
        break;
      }
    }
  }

  // Load tools and output schemas
  const tools = loadTools(skillDir);
  const output_schemas = loadOutputSchemas(skillDir);

  return {
    name: manifest.name,
    version: manifest.version,
    category: manifest.category,
    tags: manifest.tags || [],
    description: manifest.description,
    context_budget: manifest.context_budget,
    composable_with: manifest.composable_with || {},
    conflicts_with: manifest.conflicts_with || [],
    requires_tools: manifest.requires_tools || false,
    requires_memory: manifest.requires_memory || false,
    prompts,
    systemPrompt: systemPrompt || '',
    tierUsed,
    tools,
    output_schemas,
  };
}
