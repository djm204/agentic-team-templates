/**
 * TypeScript type definitions for @djm204/agent-skills public API.
 *
 * Usage:
 *   import { loadSkill, composeSkills, getAdapter, ADAPTERS } from '@djm204/agent-skills/api';
 */

// ============================================================================
// Core types
// ============================================================================

export type Tier = 'minimal' | 'standard' | 'comprehensive';

export interface SkillDescription {
  short: string;
  long?: string;
}

export interface ContextBudget {
  minimal: number;
  standard: number;
  comprehensive: number;
}

export interface ComposableWith {
  recommended?: string[];
  conflicts_with?: string[];
  enhances?: string[];
}

export interface ToolParameter {
  type: string;
  description?: string;
  required?: boolean;
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  when_to_use?: string;
  parameters?: Record<string, ToolParameter>;
  returns?: {
    type: string;
    description?: string;
    items?: Record<string, unknown>;
    properties?: Record<string, unknown>;
  };
  [key: string]: unknown;
}

export interface OutputSchema {
  name: string;
  description?: string;
  format?: string;
  schema?: Record<string, unknown>;
  [key: string]: unknown;
}

// ============================================================================
// SkillPack — returned by loadSkill()
// ============================================================================

export interface SkillPack {
  name: string;
  version: string;
  category: string;
  tags: string[];
  description: SkillDescription;
  context_budget: ContextBudget;
  composable_with: ComposableWith;
  conflicts_with: string[];
  requires_tools: boolean;
  requires_memory: boolean;
  prompts: {
    minimal?: string;
    standard?: string;
    comprehensive?: string;
  };
  /** The resolved system prompt for the requested (or fallback) tier. */
  systemPrompt: string;
  /** The tier actually used (may differ from requested if file missing). */
  tierUsed: Tier;
  tools: ToolDefinition[];
  output_schemas: OutputSchema[];
}

// ============================================================================
// ComposedSkillPack — returned by composeSkills()
// ============================================================================

export interface CompositionEntry {
  name: string;
  tier: Tier;
  tokensAllocated: number;
}

export interface ComposedSkillPack {
  systemPrompt: string;
  tools: ToolDefinition[];
  composition: CompositionEntry[];
  /** Rough token count: Math.ceil(systemPrompt.length / 4). */
  estimatedTokens: number;
}

// ============================================================================
// Skill metadata — returned by listSkills()
// ============================================================================

export interface SkillMeta {
  name: string;
  version: string;
  category: string;
  tags: string[];
  description: SkillDescription;
  /** Absolute path to the skill directory. */
  path: string;
}

// ============================================================================
// Test runner types
// ============================================================================

export interface TestExpected {
  contains?: string[];
  contains_any?: string[];
  not_contains?: string[];
  min_length?: number;
  max_length?: number;
}

export interface TestCase {
  id: string;
  description: string;
  prompt: string;
  expected?: TestExpected;
  tags?: string[];
}

export interface TestSuite {
  name: string;
  skill: string;
  version: string;
  cases: TestCase[];
}

export interface CaseResult {
  id: string;
  description: string;
  passed: boolean;
  failures: string[];
  error?: string;
  durationMs: number;
}

export interface TestRunResult {
  skill: string;
  name: string;
  total: number;
  passed: number;
  failed: number;
  /** Value between 0 and 1. */
  passRate: number;
  cases: CaseResult[];
}

export interface EvaluationResult {
  passed: boolean;
  failures: string[];
}

// ============================================================================
// Adapter types
// ============================================================================

export type AdapterName =
  | 'raw'
  | 'cursor'
  | 'claude-code'
  | 'copilot'
  | 'openai-agents';

export interface AdapterOutputFile {
  path: string;
  content: string;
}

export interface AdapterOutput {
  files: AdapterOutputFile[];
}

export type AdapterFn = (skill: SkillPack) => AdapterOutput;

// ============================================================================
// Exported functions
// ============================================================================

/**
 * Load a skill pack from a directory.
 *
 * @param skillPath - Absolute or relative path to the skill directory.
 * @param options.tier - Prompt tier to load. Defaults to 'standard'.
 * @param options.fragmentsDir - Optional directory of shared fragment files.
 */
export function loadSkill(
  skillPath: string,
  options?: { tier?: Tier; fragmentsDir?: string }
): Promise<SkillPack>;

/**
 * List all skills in a directory. Returns metadata only — no prompt content.
 *
 * @param skillsDir - Directory containing skill subdirectories.
 */
export function listSkills(skillsDir: string): Promise<SkillMeta[]>;

/**
 * Compose multiple SkillPack objects into a single merged prompt
 * within a token budget.
 *
 * @param skills - Array of SkillPack objects from loadSkill().
 * @param options.budget - Token budget for the composed output. Default 8000.
 * @param options.primary - Name of the primary skill (gets full tier allocation).
 * @param options.conflictResolution - How to handle conflicting skills.
 */
export function composeSkills(
  skills: SkillPack[],
  options?: {
    budget?: number;
    primary?: string;
    conflictResolution?: 'throw' | 'primary_wins';
  }
): Promise<ComposedSkillPack>;

/**
 * Load a skill's test suite from its tests/test_cases.yaml file.
 * Returns null if the file does not exist.
 *
 * @param skillPath - Absolute or relative path to the skill directory.
 */
export function loadTestSuite(skillPath: string): TestSuite | null;

/**
 * Run all test cases in a suite through a response provider function.
 *
 * @param suite - Test suite from loadTestSuite().
 * @param provider - Async function that takes a prompt and returns a response string.
 * @param options.tags - If provided, only cases with matching tags are run.
 */
export function runTestSuite(
  suite: TestSuite,
  provider: (prompt: string) => Promise<string>,
  options?: { tags?: string[] }
): Promise<TestRunResult>;

/**
 * Evaluate a response string against a set of expected assertions.
 * Does not call an LLM — all checks are deterministic string operations.
 *
 * @param response - The agent response to evaluate.
 * @param expected - Assertions to check.
 */
export function evaluateResponse(
  response: string,
  expected?: TestExpected
): EvaluationResult;

/**
 * Validate a single test case object. Returns an array of error strings.
 * Empty array means the test case is valid.
 *
 * @param testCase - The test case to validate.
 */
export function validateTestCase(testCase: unknown): string[];

/**
 * Get an adapter function by name.
 *
 * @param name - Adapter name (e.g. 'cursor', 'openai-agents').
 */
export function getAdapter(name: AdapterName): AdapterFn;

/** List of all registered adapter names. */
export const ADAPTERS: AdapterName[];
