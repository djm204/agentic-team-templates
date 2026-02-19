/**
 * CrewAI adapter (Python)
 *
 * Outputs a Python module that constructs a CrewAI Agent with:
 * - role: skill name (human-readable)
 * - goal: skill short description
 * - backstory: skill system prompt (standard or requested tier)
 * - tools: list of tool stubs (when tools are defined)
 *
 * Output: <skill-name>_crew.py
 *
 * Usage:
 *   from strategic_negotiator_crew import get_agent
 *   agent = get_agent()
 */

/**
 * @param {import('../core/skill-loader.js').SkillPack} skillPack
 * @param {{ tier?: string }} [options]
 * @returns {{ files: Array<{ path: string, content: string }>, summary: string }}
 */
export function crewaiAdapter(skillPack, options = {}) {
  const { tier = skillPack.tierUsed || 'standard' } = options;
  const prompt = skillPack.prompts[tier] || skillPack.systemPrompt;

  const moduleName = skillPack.name.replace(/-/g, '_');
  const roleDisplay = skillPack.name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const toolDefs = (skillPack.tools || []).map((tool) => `
class ${tool.name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Tool(BaseTool):
    name: str = "${tool.name}"
    description: str = "${tool.description || tool.name}"

    def _run(self, ${Object.keys(tool.parameters || {}).join(', ')}) -> str:
        """${tool.description || tool.name}"""
        # TODO: Implement ${tool.name}
        raise NotImplementedError("${tool.name} must be implemented")`);

  const toolImport = skillPack.tools?.length
    ? 'from crewai.tools import BaseTool\n'
    : '';
  const toolInstances = skillPack.tools?.length
    ? skillPack.tools.map((t) => {
        const className = t.name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        return `    ${t.name}_tool = ${className}Tool()`;
      }).join('\n')
    : '';
  const toolList = skillPack.tools?.length
    ? `\n    tools = [${skillPack.tools.map((t) => `${t.name}_tool`).join(', ')}]`
    : '\n    tools = []';

  const content = `"""
${skillPack.name} — CrewAI agent module
Skill: ${skillPack.name} v${skillPack.version} | tier: ${tier} | category: ${skillPack.category}
${skillPack.description.short}
"""

from crewai import Agent
${toolImport}
BACKSTORY = """${prompt.replace(/"""/g, "'''")}"""
${toolDefs.join('\n')}

def get_agent(llm=None) -> Agent:
    """
    Returns a configured CrewAI Agent for the ${skillPack.name} skill.
    """
${toolInstances}
${toolList}
    return Agent(
        role="${roleDisplay}",
        goal="${skillPack.description.short}",
        backstory=BACKSTORY,
        tools=tools,
        llm=llm,
        verbose=True,
    )
`;

  return {
    files: [{ path: `${moduleName}_crew.py`, content }],
    summary: `CrewAI: ${moduleName}_crew.py (tier: ${tier})`,
  };
}
