/**
 * OpenAI Agents SDK adapter
 *
 * Outputs framework-specific files for the OpenAI Agents SDK (Python/TS):
 * - <skill-name>-instructions.md   — agent instructions (system prompt)
 * - <skill-name>-tools.json        — tool schemas (only when tools defined)
 *
 * Usage (Python):
 *   from agents import Agent
 *   instructions = open("strategic-negotiator-instructions.md").read()
 *   tools = json.load(open("strategic-negotiator-tools.json"))
 *   agent = Agent(name="Strategic Negotiator", instructions=instructions, tools=tools)
 *
 * Usage (TypeScript):
 *   import { Agent } from '@openai/agents';
 *   const agent = new Agent({ name: 'Strategic Negotiator', instructions, tools });
 */

/**
 * @param {import('../core/skill-loader.js').SkillPack} skillPack
 * @param {{ tier?: string }} [options]
 * @returns {{ files: Array<{ path: string, content: string }>, summary: string }}
 */
export function openaiAgentsAdapter(skillPack, options = {}) {
  const { tier = skillPack.tierUsed || 'standard' } = options;
  const prompt = skillPack.prompts[tier] || skillPack.systemPrompt;

  const files = [];

  // Instructions file
  const instructionsContent = [
    `# ${skillPack.description.short}`,
    `<!-- skill: ${skillPack.name} v${skillPack.version} | tier: ${tier} | adapter: openai-agents -->`,
    '',
    prompt,
  ].join('\n');

  files.push({
    path: `${skillPack.name}-instructions.md`,
    content: instructionsContent,
  });

  // Tool schemas (only when tools exist)
  if (skillPack.tools && skillPack.tools.length > 0) {
    const toolSchemas = skillPack.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description || '',
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(tool.parameters || {}).map(([key, def]) => [
              key,
              {
                type: def.type || 'string',
                description: def.description || '',
              },
            ])
          ),
          required: Object.entries(tool.parameters || {})
            .filter(([, def]) => def.required)
            .map(([key]) => key),
        },
      },
    }));

    files.push({
      path: `${skillPack.name}-tools.json`,
      content: JSON.stringify(toolSchemas, null, 2),
    });
  }

  return {
    files,
    summary: `OpenAI Agents: ${files.map((f) => f.path).join(', ')} (tier: ${tier})`,
  };
}
