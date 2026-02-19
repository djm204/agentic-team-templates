/**
 * composer.js — Skill composition engine
 *
 * Composes multiple SkillPacks into a single merged prompt that fits
 * within a token budget, with conflict detection and tier selection.
 */

import { deduplicateFragments } from './fragments.js';

// Token overhead for inter-skill routing instructions (separator + context)
export const COMPOSITION_GLUE_TOKENS = 400;

// Budget share ratios: primary skill gets 50%, rest split equally
const PRIMARY_SHARE = 0.5;

// ============================================================================
// allocateBudget
// ============================================================================

/**
 * Allocate a token budget across skills.
 * Primary skill gets PRIMARY_SHARE of the net budget; remaining skills split evenly.
 *
 * @param {object[]} skills - Array of SkillPack objects
 * @param {{ totalBudget: number, primary?: string }} options
 * @returns {Record<string, number>} Tokens allocated per skill name
 */
export function allocateBudget(skills, options = {}) {
  const { totalBudget, primary } = options;
  const netBudget = totalBudget - COMPOSITION_GLUE_TOKENS;

  if (skills.length === 0) return {};

  if (skills.length === 1) {
    return { [skills[0].name]: Math.floor(netBudget) };
  }

  const alloc = {};
  const primarySkill = primary ? skills.find((s) => s.name === primary) : null;
  const supportingSkills = primarySkill
    ? skills.filter((s) => s.name !== primary)
    : skills;

  if (primarySkill) {
    // Supporting skills get their minimal tier budget (compressed role)
    // Primary gets everything that's left (guaranteed standard or higher)
    let supportingUsed = 0;
    for (const s of supportingSkills) {
      const minimalBudget = s.context_budget?.minimal || 800;
      alloc[s.name] = minimalBudget;
      supportingUsed += minimalBudget;
    }
    alloc[primarySkill.name] = Math.max(0, netBudget - supportingUsed);
  } else {
    const perSkill = Math.floor(netBudget / skills.length);
    for (const s of skills) {
      alloc[s.name] = perSkill;
    }
  }

  return alloc;
}

// ============================================================================
// checkConflicts
// ============================================================================

/**
 * Check for conflicts between skills.
 * A conflict occurs when skill A lists skill B in its conflicts_with array
 * and both are present in the composition.
 *
 * @param {object[]} skills - Array of SkillPack objects
 * @returns {string[]} Conflict descriptions (empty = no conflicts)
 */
export function checkConflicts(skills) {
  const names = new Set(skills.map((s) => s.name));
  const conflicts = [];

  for (const skill of skills) {
    if (!Array.isArray(skill.conflicts_with)) continue;
    for (const conflictName of skill.conflicts_with) {
      if (names.has(conflictName)) {
        conflicts.push(
          `"${skill.name}" conflicts with "${conflictName}" — they cannot be composed together`
        );
      }
    }
  }

  return conflicts;
}

// ============================================================================
// selectTierForBudget
// ============================================================================

/**
 * Select the highest prompt tier that fits within the token budget.
 * Falls back to 'minimal' if even that exceeds the budget.
 *
 * @param {object} skill - SkillPack
 * @param {number} tokenBudget
 * @returns {'minimal' | 'standard' | 'comprehensive'}
 */
export function selectTierForBudget(skill, tokenBudget) {
  const tiers = ['comprehensive', 'standard', 'minimal'];

  for (const tier of tiers) {
    const prompt = skill.prompts?.[tier];
    if (!prompt) continue;

    const tierBudget = skill.context_budget?.[tier];
    if (tierBudget === undefined || tierBudget <= tokenBudget) {
      return tier;
    }
  }

  return 'minimal';
}

// ============================================================================
// composeSkills
// ============================================================================

/**
 * Compose multiple skills into a single merged SkillPack.
 *
 * @param {object[]} skills - Array of SkillPack objects
 * @param {{
 *   budget?: number,
 *   primary?: string,
 *   conflictResolution?: 'throw' | 'primary_wins'
 * }} options
 * @returns {Promise<ComposedSkillPack>}
 *
 * @typedef {object} CompositionEntry
 * @property {string} name
 * @property {'minimal'|'standard'|'comprehensive'} tier
 * @property {number} tokensAllocated
 *
 * @typedef {object} ComposedSkillPack
 * @property {string} systemPrompt - Merged prompt
 * @property {object[]} tools - Combined tools from all skills
 * @property {CompositionEntry[]} composition - Per-skill allocation details
 * @property {number} estimatedTokens - Rough token count of systemPrompt
 */
export async function composeSkills(skills, options = {}) {
  const {
    budget = 8000,
    primary,
    conflictResolution = 'throw',
  } = options;

  if (skills.length === 0) {
    return { systemPrompt: '', tools: [], composition: [], estimatedTokens: 0 };
  }

  // Conflict detection
  const conflicts = checkConflicts(skills);
  if (conflicts.length > 0) {
    if (conflictResolution === 'throw') {
      throw new Error(`Skill conflict detected:\n  ${conflicts.join('\n  ')}`);
    }
    // primary_wins: filter out conflicting non-primary skills
    if (conflictResolution === 'primary_wins' && primary) {
      const primarySkill = skills.find((s) => s.name === primary);
      const primaryConflicts = new Set(primarySkill?.conflicts_with || []);
      // Remove skills that conflict with primary
      skills = skills.filter((s) => !primaryConflicts.has(s.name) || s.name === primary);
    }
  }

  // Budget allocation
  const alloc = allocateBudget(skills, { totalBudget: budget, primary });

  // Tier selection and prompt assembly
  const sections = [];
  const composition = [];
  const allTools = [];

  for (const skill of skills) {
    const tokenBudget = alloc[skill.name] || 0;
    const tier = selectTierForBudget(skill, tokenBudget);
    const prompt = skill.prompts?.[tier] || skill.systemPrompt || '';

    sections.push(prompt);
    composition.push({ name: skill.name, tier, tokensAllocated: tokenBudget });
    allTools.push(...(skill.tools || []));
  }

  const rawPrompt = sections.join('\n\n---\n\n');
  const systemPrompt = deduplicateFragments(rawPrompt);
  const estimatedTokens = Math.ceil(systemPrompt.length / 4);

  return {
    systemPrompt,
    tools: allTools,
    composition,
    estimatedTokens,
  };
}
