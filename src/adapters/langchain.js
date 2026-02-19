/**
 * LangChain adapter (Python)
 *
 * Outputs a Python module that constructs a LangChain agent with:
 * - SystemMessage containing the skill prompt
 * - StructuredTool definitions (when tools are defined)
 *
 * Output: <skill-name>_agent.py
 *
 * Usage:
 *   from strategic_negotiator_agent import get_agent
 *   agent = get_agent()
 */

/**
 * @param {import('../core/skill-loader.js').SkillPack} skillPack
 * @param {{ tier?: string }} [options]
 * @returns {{ files: Array<{ path: string, content: string }>, summary: string }}
 */
export function langchainAdapter(skillPack, options = {}) {
  const { tier = skillPack.tierUsed || 'standard' } = options;
  const prompt = skillPack.prompts[tier] || skillPack.systemPrompt;

  const moduleName = skillPack.name.replace(/-/g, '_');
  const className = skillPack.name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  const toolDefs = (skillPack.tools || []).map((tool) => {
    const params = Object.entries(tool.parameters || {})
      .map(([key, def]) => `        ${key}: ${def.type === 'array' ? 'list' : 'str'}  # ${def.description || ''}`)
      .join('\n');
    return `
def ${tool.name}(${Object.keys(tool.parameters || {}).join(', ')}):
    """${tool.description || tool.name}"""
    # TODO: Implement ${tool.name}
    raise NotImplementedError("${tool.name} must be implemented")

${tool.name}_tool = StructuredTool.from_function(
    func=${tool.name},
    name="${tool.name}",
    description="${tool.description || tool.name}",
)`;
  });

  const toolImport = skillPack.tools?.length
    ? 'from langchain.tools import StructuredTool\n'
    : '';
  const toolList = skillPack.tools?.length
    ? `\n    tools = [${skillPack.tools.map((t) => `${t.name}_tool`).join(', ')}]`
    : '\n    tools = []';

  const content = `"""
${skillPack.name} — LangChain agent module
Skill: ${skillPack.name} v${skillPack.version} | tier: ${tier} | category: ${skillPack.category}
${skillPack.description.short}
"""

from langchain.schema import SystemMessage
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
${toolImport}
SYSTEM_PROMPT = """${prompt.replace(/"""/g, "'''")}"""

${toolDefs.join('\n')}

def get_agent(model: str = "gpt-4o", temperature: float = 0.0) -> AgentExecutor:
    """
    Returns a configured LangChain AgentExecutor for the ${skillPack.name} skill.
    """
    llm = ChatOpenAI(model=model, temperature=temperature)
    system_message = SystemMessage(content=SYSTEM_PROMPT)
${toolList}
    agent = create_openai_functions_agent(llm=llm, tools=tools, prompt=system_message)
    return AgentExecutor(agent=agent, tools=tools, verbose=True)
`;

  return {
    files: [{ path: `${moduleName}_agent.py`, content }],
    summary: `LangChain: ${moduleName}_agent.py (tier: ${tier})`,
  };
}
