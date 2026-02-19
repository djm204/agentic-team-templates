/**
 * Adapter registry.
 *
 * Adapters transform a universal SkillPack into framework-specific output files.
 * All adapters share the same interface:
 *   adapt(skillPack, options) → { files: Array<{ path, content }>, summary }
 */

import { rawAdapter } from './raw.js';
import { cursorAdapter } from './cursor.js';
import { claudeCodeAdapter } from './claude-code.js';
import { copilotAdapter } from './copilot.js';
import { openaiAgentsAdapter } from './openai-agents.js';
import { langchainAdapter } from './langchain.js';
import { crewaiAdapter } from './crewai.js';

const ADAPTER_MAP = {
  raw: rawAdapter,
  cursor: cursorAdapter,
  'claude-code': claudeCodeAdapter,
  copilot: copilotAdapter,
  'openai-agents': openaiAgentsAdapter,
  langchain: langchainAdapter,
  crewai: crewaiAdapter,
};

/** List of all registered adapter names */
export const ADAPTERS = Object.keys(ADAPTER_MAP);

/**
 * Get an adapter function by name.
 * @param {string} name
 * @returns {Function}
 * @throws {Error} when name is not registered
 */
export function getAdapter(name) {
  const adapter = ADAPTER_MAP[name];
  if (!adapter) {
    throw new Error(
      `Unknown adapter: "${name}". Available adapters: ${ADAPTERS.join(', ')}`
    );
  }
  return adapter;
}

export {
  rawAdapter,
  cursorAdapter,
  claudeCodeAdapter,
  copilotAdapter,
  openaiAgentsAdapter,
  langchainAdapter,
  crewaiAdapter,
};
