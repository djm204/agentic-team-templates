/**
 * Tests for the skill composition engine.
 *
 * The composer takes multiple SkillPacks and:
 * 1. Checks for conflicts between skills
 * 2. Allocates token budget across skills (primary gets more)
 * 3. Selects appropriate tier per skill to fit budget
 * 4. Merges prompts into a single composed output
 * 5. Returns a ComposedSkillPack
 */

import { describe, it, expect } from 'vitest';
import {
  allocateBudget,
  checkConflicts,
  selectTierForBudget,
  composeSkills,
  COMPOSITION_GLUE_TOKENS,
} from './composer.js';

// ============================================================================
// Fixtures
// ============================================================================

function makeSkill(overrides = {}) {
  return {
    name: overrides.name || 'skill-a',
    version: '1.0.0',
    category: overrides.category || 'engineering',
    tags: [],
    description: { short: `${overrides.name || 'skill-a'} description`, long: '' },
    context_budget: overrides.context_budget || { minimal: 800, standard: 3200, comprehensive: 8000 },
    prompts: overrides.prompts || {
      minimal: `# ${overrides.name || 'skill-a'} Minimal\n\nCore.`,
      standard: `# ${overrides.name || 'skill-a'} Standard\n\nFull.`,
      comprehensive: `# ${overrides.name || 'skill-a'} Comprehensive\n\nDetailed.`,
    },
    systemPrompt: `# ${overrides.name || 'skill-a'} Standard\n\nFull.`,
    tierUsed: 'standard',
    tools: overrides.tools || [],
    composable_with: overrides.composable_with || {},
    conflicts_with: overrides.conflicts_with || [],
    requires_tools: false,
    requires_memory: false,
  };
}

const SKILL_A = makeSkill({ name: 'skill-a' });
const SKILL_B = makeSkill({ name: 'skill-b' });
const SKILL_C = makeSkill({ name: 'skill-c' });
const SKILL_WITH_CONFLICT = makeSkill({
  name: 'skill-conflict',
  conflicts_with: ['skill-a'],
});

// ============================================================================
// allocateBudget tests
// ============================================================================

describe('allocateBudget', () => {
  it('allocates primary skill a larger share than supporting skills', () => {
    const alloc = allocateBudget([SKILL_A, SKILL_B], {
      totalBudget: 8000,
      primary: 'skill-a',
    });
    expect(alloc['skill-a']).toBeGreaterThan(alloc['skill-b']);
  });

  it('returns allocations for all skills', () => {
    const alloc = allocateBudget([SKILL_A, SKILL_B, SKILL_C], { totalBudget: 10000 });
    expect(Object.keys(alloc)).toHaveLength(3);
    for (const key of ['skill-a', 'skill-b', 'skill-c']) {
      expect(typeof alloc[key]).toBe('number');
      expect(alloc[key]).toBeGreaterThan(0);
    }
  });

  it('total allocation does not exceed budget minus composition glue', () => {
    const alloc = allocateBudget([SKILL_A, SKILL_B], { totalBudget: 5000 });
    const total = Object.values(alloc).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(5000 - COMPOSITION_GLUE_TOKENS);
  });

  it('single skill gets most of the budget', () => {
    const alloc = allocateBudget([SKILL_A], { totalBudget: 5000 });
    expect(alloc['skill-a']).toBeGreaterThan(3000);
  });
});

// ============================================================================
// checkConflicts tests
// ============================================================================

describe('checkConflicts', () => {
  it('returns no conflicts for compatible skills', () => {
    const conflicts = checkConflicts([SKILL_A, SKILL_B]);
    expect(conflicts).toEqual([]);
  });

  it('detects a conflict when one skill lists another in conflicts_with', () => {
    const conflicts = checkConflicts([SKILL_A, SKILL_WITH_CONFLICT]);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]).toContain('skill-conflict');
    expect(conflicts[0]).toContain('skill-a');
  });

  it('returns conflicts as descriptive strings', () => {
    const conflicts = checkConflicts([SKILL_A, SKILL_WITH_CONFLICT]);
    for (const c of conflicts) {
      expect(typeof c).toBe('string');
    }
  });

  it('no false positives for non-conflicting skills', () => {
    const safe = makeSkill({ name: 'safe-skill', conflicts_with: ['other-skill'] });
    const conflicts = checkConflicts([SKILL_A, safe]);
    expect(conflicts).toEqual([]);
  });
});

// ============================================================================
// selectTierForBudget tests
// ============================================================================

describe('selectTierForBudget', () => {
  it('selects comprehensive when budget exceeds comprehensive threshold', () => {
    const tier = selectTierForBudget(SKILL_A, 9000);
    expect(tier).toBe('comprehensive');
  });

  it('selects standard when budget fits standard but not comprehensive', () => {
    const tier = selectTierForBudget(SKILL_A, 4000);
    expect(tier).toBe('standard');
  });

  it('selects minimal when budget fits only minimal', () => {
    const tier = selectTierForBudget(SKILL_A, 900);
    expect(tier).toBe('minimal');
  });

  it('selects minimal when budget is below all tiers', () => {
    const tier = selectTierForBudget(SKILL_A, 100);
    expect(tier).toBe('minimal');
  });

  it('only selects a tier that has a prompt available', () => {
    const skillNoComprehensive = makeSkill({
      name: 'slim-skill',
      prompts: { minimal: '# Slim Minimal', standard: '# Slim Standard' },
    });
    const tier = selectTierForBudget(skillNoComprehensive, 9000);
    expect(tier).toBe('standard');
  });
});

// ============================================================================
// composeSkills tests
// ============================================================================

describe('composeSkills', () => {
  it('returns a ComposedSkillPack with systemPrompt', async () => {
    const result = await composeSkills([SKILL_A, SKILL_B], { budget: 8000 });
    expect(typeof result.systemPrompt).toBe('string');
    expect(result.systemPrompt.length).toBeGreaterThan(0);
  });

  it('composed prompt contains content from all skills', async () => {
    const result = await composeSkills([SKILL_A, SKILL_B], { budget: 8000 });
    expect(result.systemPrompt).toContain('skill-a');
    expect(result.systemPrompt).toContain('skill-b');
  });

  it('respects budget — total token estimate does not greatly exceed budget', async () => {
    const result = await composeSkills([SKILL_A, SKILL_B, SKILL_C], { budget: 5000 });
    // Rough token estimate: characters / 4
    const estimatedTokens = result.systemPrompt.length / 4;
    expect(estimatedTokens).toBeLessThan(5000 * 1.2); // 20% tolerance
  });

  it('throws when conflicting skills are composed together without override', async () => {
    await expect(
      composeSkills([SKILL_A, SKILL_WITH_CONFLICT], { budget: 8000 })
    ).rejects.toThrow(/conflict/i);
  });

  it('allows conflict override with conflictResolution: "primary_wins"', async () => {
    const result = await composeSkills([SKILL_A, SKILL_WITH_CONFLICT], {
      budget: 8000,
      conflictResolution: 'primary_wins',
      primary: 'skill-a',
    });
    expect(result.systemPrompt).toContain('skill-a');
  });

  it('includes tools from all skills combined', async () => {
    const skillWithTool = makeSkill({
      name: 'tool-skill',
      tools: [{ name: 'my_tool', description: 'does something' }],
    });
    const result = await composeSkills([SKILL_A, skillWithTool], { budget: 8000 });
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('my_tool');
  });

  it('returns the list of skills and their allocated tiers', async () => {
    const result = await composeSkills([SKILL_A, SKILL_B], { budget: 8000 });
    expect(Array.isArray(result.composition)).toBe(true);
    expect(result.composition.length).toBe(2);
    for (const entry of result.composition) {
      expect(entry).toHaveProperty('name');
      expect(entry).toHaveProperty('tier');
      expect(entry).toHaveProperty('tokensAllocated');
    }
  });

  it('primary skill gets standard or higher tier', async () => {
    const result = await composeSkills([SKILL_A, SKILL_B, SKILL_C], {
      budget: 6000,
      primary: 'skill-a',
    });
    const primaryEntry = result.composition.find((e) => e.name === 'skill-a');
    expect(['standard', 'comprehensive']).toContain(primaryEntry.tier);
  });
});
