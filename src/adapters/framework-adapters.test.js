/**
 * Tests for framework-specific adapters:
 * - openai-agents: OpenAI Agents SDK (Python/TS) instructions + tool schemas
 * - langchain: LangChain SystemMessage + tool defs (Python)
 * - crewai: CrewAI Agent config (Python)
 */

import { describe, it, expect } from 'vitest';
import { openaiAgentsAdapter } from './openai-agents.js';
import { langchainAdapter } from './langchain.js';
import { crewaiAdapter } from './crewai.js';
import { ADAPTERS, getAdapter } from './index.js';

// ============================================================================
// Fixtures
// ============================================================================

const SKILL_PACK = {
  name: 'strategic-negotiator',
  version: '1.0.0',
  category: 'business',
  tags: ['negotiation', 'game-theory'],
  description: {
    short: 'Game theory and negotiation strategy',
    long: 'Principal-level negotiation for M&A and contracts.',
  },
  context_budget: { minimal: 700, standard: 2800, comprehensive: 7500 },
  prompts: {
    minimal: '# Strategic Negotiator (Minimal)\n\nCore identity and 5 rules.',
    standard: '# Strategic Negotiator (Standard)\n\nFull behavioral framework.',
    comprehensive: '# Strategic Negotiator (Comprehensive)\n\nDetailed with examples.',
  },
  systemPrompt: '# Strategic Negotiator (Standard)\n\nFull behavioral framework.',
  tierUsed: 'standard',
  tools: [
    {
      name: 'scenario_model',
      description: 'Model a negotiation scenario with multiple parties',
      parameters: {
        parties: { type: 'array', description: 'List of negotiating parties', required: true },
        scenarios: { type: 'array', description: 'Possible outcome scenarios', required: true },
      },
    },
  ],
  composable_with: {},
  conflicts_with: [],
  requires_tools: true,
  requires_memory: false,
};

const SKILL_NO_TOOLS = { ...SKILL_PACK, tools: [], requires_tools: false };

// ============================================================================
// openai-agents adapter
// ============================================================================

describe('openaiAgentsAdapter', () => {
  it('outputs files with path and content', () => {
    const result = openaiAgentsAdapter(SKILL_PACK);
    expect(result.files.length).toBeGreaterThan(0);
    for (const f of result.files) {
      expect(typeof f.path).toBe('string');
      expect(typeof f.content).toBe('string');
    }
  });

  it('includes a summary string', () => {
    const result = openaiAgentsAdapter(SKILL_PACK);
    expect(typeof result.summary).toBe('string');
  });

  it('outputs an agent instructions file', () => {
    const result = openaiAgentsAdapter(SKILL_PACK);
    const paths = result.files.map((f) => f.path);
    expect(paths.some((p) => p.includes('instructions') || p.includes('agent'))).toBe(true);
  });

  it('includes the system prompt in the output', () => {
    const result = openaiAgentsAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('Strategic Negotiator');
  });

  it('includes tool schema JSON when tools are present', () => {
    const result = openaiAgentsAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('scenario_model');
  });

  it('omits tool schema file when no tools', () => {
    const result = openaiAgentsAdapter(SKILL_NO_TOOLS);
    const paths = result.files.map((f) => f.path);
    expect(paths.some((p) => p.includes('tool'))).toBe(false);
  });

  it('respects tier option', () => {
    const result = openaiAgentsAdapter(SKILL_PACK, { tier: 'minimal' });
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('Minimal');
  });
});

// ============================================================================
// langchain adapter
// ============================================================================

describe('langchainAdapter', () => {
  it('outputs files with path and content', () => {
    const result = langchainAdapter(SKILL_PACK);
    expect(result.files.length).toBeGreaterThan(0);
  });

  it('includes a summary string', () => {
    expect(typeof langchainAdapter(SKILL_PACK).summary).toBe('string');
  });

  it('output references SystemMessage or system prompt pattern', () => {
    const result = langchainAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toMatch(/system|SystemMessage|system_prompt/i);
  });

  it('includes the skill system prompt content', () => {
    const result = langchainAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('Strategic Negotiator');
  });

  it('includes tool definitions when tools are present', () => {
    const result = langchainAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('scenario_model');
  });
});

// ============================================================================
// crewai adapter
// ============================================================================

describe('crewaiAdapter', () => {
  it('outputs files with path and content', () => {
    const result = crewaiAdapter(SKILL_PACK);
    expect(result.files.length).toBeGreaterThan(0);
  });

  it('includes a summary string', () => {
    expect(typeof crewaiAdapter(SKILL_PACK).summary).toBe('string');
  });

  it('output includes Agent role, goal, or backstory patterns', () => {
    const result = crewaiAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toMatch(/role|goal|backstory|Agent/i);
  });

  it('includes the skill system prompt content', () => {
    const result = crewaiAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('Strategic Negotiator');
  });

  it('includes tools section when tools are present', () => {
    const result = crewaiAdapter(SKILL_PACK);
    const allContent = result.files.map((f) => f.content).join('\n');
    expect(allContent).toContain('scenario_model');
  });
});

// ============================================================================
// Registry includes new adapters
// ============================================================================

describe('ADAPTERS registry includes framework adapters', () => {
  it('includes openai-agents', () => {
    expect(ADAPTERS).toContain('openai-agents');
  });

  it('includes langchain', () => {
    expect(ADAPTERS).toContain('langchain');
  });

  it('includes crewai', () => {
    expect(ADAPTERS).toContain('crewai');
  });

  it('getAdapter works for all three', () => {
    for (const name of ['openai-agents', 'langchain', 'crewai']) {
      expect(typeof getAdapter(name)).toBe('function');
    }
  });
});
