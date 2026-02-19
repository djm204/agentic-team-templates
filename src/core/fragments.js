/**
 * fragments.js — Shared prompt fragment system
 *
 * Fragments are reusable markdown prompt blocks stored as individual files
 * in a `fragments/` directory. Skills reference them with `{{fragment:name}}`
 * syntax. The composer deduplicates fragments so identical blocks appear
 * only once in the final composed system prompt.
 *
 * Fragment file format: `fragments/<name>.md`
 * Reference syntax in prompts: `{{fragment:name}}`
 * Resolved markers: `<!-- fragment:name -->...<!-- /fragment:name -->`
 */

import fs from 'fs';
import path from 'path';

const FRAGMENT_REF_RE = /\{\{fragment:([a-zA-Z0-9_-]+)\}\}/g;
const FRAGMENT_BLOCK_RE =
  /<!-- fragment:([a-zA-Z0-9_-]+) -->([\s\S]*?)<!-- \/fragment:\1 -->/g;

// ============================================================================
// loadFragment
// ============================================================================

/**
 * Load a single fragment by name from a directory.
 *
 * @param {string} name - Fragment name (without .md extension)
 * @param {string} fragmentsDir - Directory containing fragment .md files
 * @returns {string} Fragment content
 * @throws {Error} If the directory or fragment file does not exist
 */
export function loadFragment(name, fragmentsDir) {
  const filePath = path.join(fragmentsDir, `${name}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fragment not found: "${name}" (looked in ${fragmentsDir})`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// ============================================================================
// loadFragments
// ============================================================================

/**
 * Load all fragments from a directory.
 *
 * @param {string} fragmentsDir - Directory containing fragment .md files
 * @returns {Record<string, string>} Map of fragment name → content
 */
export function loadFragments(fragmentsDir) {
  if (!fragmentsDir || !fs.existsSync(fragmentsDir)) return {};

  const result = {};
  for (const file of fs.readdirSync(fragmentsDir)) {
    if (!file.endsWith('.md')) continue;
    const name = file.slice(0, -3); // strip .md
    result[name] = fs.readFileSync(path.join(fragmentsDir, file), 'utf8');
  }
  return result;
}

// ============================================================================
// resolveFragments
// ============================================================================

/**
 * Replace `{{fragment:name}}` references in a prompt text with fragment content.
 *
 * Each resolved fragment is wrapped in HTML comment markers so that
 * `deduplicateFragments()` can remove duplicate occurrences when
 * multiple skills are composed together.
 *
 * If `fragmentsDir` is null/undefined, the text is returned unchanged.
 *
 * @param {string} text - Prompt text with optional fragment references
 * @param {string|null|undefined} fragmentsDir - Path to fragments directory
 * @returns {{ text: string, usedFragments: string[] }}
 */
export function resolveFragments(text, fragmentsDir) {
  if (!fragmentsDir) {
    return { text, usedFragments: [] };
  }

  const usedSet = new Set();

  const resolved = text.replace(FRAGMENT_REF_RE, (_match, name) => {
    const content = loadFragment(name, fragmentsDir);
    usedSet.add(name);
    return `<!-- fragment:${name} -->\n${content}\n<!-- /fragment:${name} -->`;
  });

  // Reset lastIndex since we're reusing the regex object
  FRAGMENT_REF_RE.lastIndex = 0;

  return { text: resolved, usedFragments: Array.from(usedSet) };
}

// ============================================================================
// deduplicateFragments
// ============================================================================

/**
 * Remove duplicate fragment blocks from a composed prompt.
 *
 * When multiple skills share a fragment, `resolveFragments()` will inline
 * it multiple times (once per skill). This function scans the composed text
 * for `<!-- fragment:name -->...<!-- /fragment:name -->` blocks and removes
 * all but the first occurrence of each.
 *
 * @param {string} text - Composed prompt potentially containing duplicate fragments
 * @returns {string} Deduplicated text
 */
export function deduplicateFragments(text) {
  const seen = new Set();

  const result = text.replace(FRAGMENT_BLOCK_RE, (match, name) => {
    if (seen.has(name)) return '';
    seen.add(name);
    return match;
  });

  // Reset lastIndex
  FRAGMENT_BLOCK_RE.lastIndex = 0;

  return result;
}
