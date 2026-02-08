import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// Cursor rules directory paths
const CURSOR_RULES_DIR = '.cursor/rules';          // New path (Cursor IDE)
const LEGACY_CURSORRULES_DIR = '.cursorrules';      // Deprecated path

// Read package.json for version info
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const PACKAGE_NAME = packageJson.name;
const CURRENT_VERSION = packageJson.version;
const REPO_URL = 'https://github.com/djm204/agentic-team-templates';
const CHANGELOG_URL = `${REPO_URL}/releases/tag/${PACKAGE_NAME}-v${CURRENT_VERSION}`;

// Template categories (storage-only, not exposed to CLI users)
const CATEGORIES = [
  'engineering',
  'languages',
  'creative',
  'business',
  'professional',
  'education',
  'agents',
];

// Available templates
const TEMPLATES = {
  'brand-guardian': {
    category: 'creative',
    description: 'Brand voice enforcement, visual identity compliance, content review workflows, and multi-channel consistency',
    rules: ['brand-voice.mdc', 'content-review.mdc', 'ethical-guidelines.mdc', 'multi-channel.mdc', 'overview.mdc', 'visual-identity.mdc']
  },
  'blockchain': {
    category: 'engineering',
    description: 'Smart contracts, DeFi protocols, and Web3 applications (Solidity, Foundry, Viem)',
    rules: ['defi-patterns.mdc', 'gas-optimization.mdc', 'overview.mdc', 'security.mdc', 'smart-contracts.mdc', 'testing.mdc', 'web3-integration.mdc']
  },
  'cpp-expert': {
    category: 'languages',
    description: 'Principal-level C++ engineering (modern C++, RAII, concurrency, templates, performance)',
    rules: ['concurrency.mdc', 'error-handling.mdc', 'memory-and-ownership.mdc', 'modern-cpp.mdc', 'overview.mdc', 'performance.mdc', 'testing.mdc', 'tooling.mdc']
  },
  'csharp-expert': {
    category: 'languages',
    description: 'Principal-level C# engineering (async, DI, EF Core, ASP.NET Core, testing)',
    rules: ['aspnet-core.mdc', 'async-patterns.mdc', 'dependency-injection.mdc', 'error-handling.mdc', 'language-features.mdc', 'overview.mdc', 'performance.mdc', 'testing.mdc', 'tooling.mdc']
  },
  'content-creation-expert': {
    category: 'creative',
    description: 'Content strategy, long-form writing, copywriting, SEO content, multimedia production, and editorial operations',
    rules: ['content-strategy.mdc', 'copywriting.mdc', 'editorial-operations.mdc', 'multimedia-production.mdc', 'overview.mdc', 'seo-content.mdc']
  },
  'cli-tools': {
    category: 'engineering',
    description: 'Command-line applications and developer tools (Cobra, Commander, Click)',
    rules: ['architecture.mdc', 'arguments.mdc', 'distribution.mdc', 'error-handling.mdc', 'overview.mdc', 'testing.mdc', 'user-experience.mdc']
  },
  'data-engineering': {
    category: 'engineering',
    description: 'Data platforms and pipelines (ETL, data modeling, data quality)',
    rules: ['data-modeling.mdc', 'data-quality.mdc', 'overview.mdc', 'performance.mdc', 'pipeline-design.mdc', 'security.mdc', 'testing.mdc']
  },
  'devops-sre': {
    category: 'engineering',
    description: 'DevOps and SRE practices (incident management, observability, SLOs, chaos engineering)',
    rules: ['capacity-planning.mdc', 'change-management.mdc', 'chaos-engineering.mdc', 'disaster-recovery.mdc', 'incident-management.mdc', 'observability.mdc', 'overview.mdc', 'postmortems.mdc', 'runbooks.mdc', 'slo-sli.mdc', 'toil-reduction.mdc']
  },
  'documentation': {
    category: 'professional',
    description: 'Technical documentation standards (READMEs, API docs, ADRs, code comments)',
    rules: ['adr.mdc', 'api-documentation.mdc', 'code-comments.mdc', 'maintenance.mdc', 'overview.mdc', 'readme-standards.mdc']
  },
  'educator': {
    category: 'education',
    description: 'World-class pedagogy with evidence-based teaching, learning retention, gamification, and assessment design',
    rules: ['accessibility.mdc', 'assessment.mdc', 'curriculum.mdc', 'engagement.mdc', 'instructional-design.mdc', 'overview.mdc', 'retention.mdc']
  },
  'executive-assistant': {
    category: 'professional',
    description: 'Executive support with calendar optimization, communication management, meeting coordination, and priority triage',
    rules: ['calendar.mdc', 'confidentiality.mdc', 'email.mdc', 'meetings.mdc', 'overview.mdc', 'prioritization.mdc', 'stakeholder-management.mdc', 'travel.mdc']
  },
  'fullstack': {
    category: 'engineering',
    description: 'Full-stack web applications (Next.js, Nuxt, SvelteKit, Remix)',
    rules: ['api-contracts.mdc', 'architecture.mdc', 'overview.mdc', 'shared-types.mdc', 'testing.mdc']
  },
  'grant-writer': {
    category: 'professional',
    description: 'Grant writing with proposal development, budget justification, compliance management, and post-award stewardship',
    rules: ['budgets.mdc', 'compliance.mdc', 'funding-research.mdc', 'narrative.mdc', 'overview.mdc', 'post-award.mdc', 'review-criteria.mdc', 'sustainability.mdc']
  },
  'golang-expert': {
    category: 'languages',
    description: 'Principal-level Go engineering (concurrency, stdlib, production patterns, testing)',
    rules: ['concurrency.mdc', 'error-handling.mdc', 'interfaces-and-types.mdc', 'overview.mdc', 'performance.mdc', 'production-patterns.mdc', 'stdlib-and-tooling.mdc', 'testing.mdc']
  },
  'java-expert': {
    category: 'languages',
    description: 'Principal-level Java engineering (JVM, Spring Boot, concurrency, JPA, testing)',
    rules: ['concurrency.mdc', 'error-handling.mdc', 'modern-java.mdc', 'overview.mdc', 'performance.mdc', 'persistence.mdc', 'spring-boot.mdc', 'testing.mdc', 'tooling.mdc']
  },
  'javascript-expert': {
    category: 'languages',
    description: 'Principal-level JavaScript & TypeScript engineering (Node.js, React, type system, testing)',
    rules: ['language-deep-dive.mdc', 'node-patterns.mdc', 'overview.mdc', 'performance.mdc', 'react-patterns.mdc', 'testing.mdc', 'tooling.mdc', 'typescript-deep-dive.mdc']
  },
  'knowledge-synthesis': {
    category: 'professional',
    description: 'Knowledge management with document ingestion, knowledge graphs, search/retrieval, summarization, and research workflows',
    rules: ['document-management.mdc', 'knowledge-graphs.mdc', 'overview.mdc', 'research-workflow.mdc', 'search-retrieval.mdc', 'summarization.mdc']
  },
  'kotlin-expert': {
    category: 'languages',
    description: 'Principal-level Kotlin engineering (coroutines, multiplatform, Ktor, Spring Boot, testing)',
    rules: ['coroutines.mdc', 'error-handling.mdc', 'frameworks.mdc', 'language-features.mdc', 'overview.mdc', 'performance.mdc', 'testing.mdc', 'tooling.mdc']
  },
  'life-logistics': {
    category: 'professional',
    description: 'Personal logistics optimization including scheduling, bill negotiation, insurance comparison, and vendor research',
    rules: ['financial-optimization.mdc', 'negotiation.mdc', 'overview.mdc', 'research-methodology.mdc', 'scheduling.mdc', 'task-management.mdc']
  },
  'market-intelligence': {
    category: 'business',
    description: 'Market intelligence with data source aggregation, sentiment analysis, trend detection, and risk signal monitoring',
    rules: ['data-sources.mdc', 'overview.mdc', 'reporting.mdc', 'risk-signals.mdc', 'sentiment-analysis.mdc', 'trend-detection.mdc']
  },
  'marketing-expert': {
    category: 'business',
    description: 'Principal marketing strategy covering brand positioning, campaign planning, market analysis, analytics, and growth frameworks',
    rules: ['brand-strategy.mdc', 'campaign-planning.mdc', 'growth-frameworks.mdc', 'market-analysis.mdc', 'marketing-analytics.mdc', 'overview.mdc']
  },
  'ml-ai': {
    category: 'engineering',
    description: 'Machine learning and AI systems (model development, deployment, monitoring)',
    rules: ['data-engineering.mdc', 'deployment.mdc', 'model-development.mdc', 'monitoring.mdc', 'overview.mdc', 'security.mdc', 'testing.mdc']
  },
  'narrative-architect': {
    category: 'creative',
    description: 'World-building, continuity tracking, timeline management, story bible creation, and collaborative storytelling',
    rules: ['collaboration.mdc', 'continuity-tracking.mdc', 'overview.mdc', 'story-bible.mdc', 'timeline-management.mdc', 'world-building.mdc']
  },
  'mobile': {
    category: 'engineering',
    description: 'Mobile applications (React Native, Flutter, native iOS/Android)',
    rules: ['navigation.mdc', 'offline-first.mdc', 'overview.mdc', 'performance.mdc', 'testing.mdc']
  },
  'predictive-maintenance': {
    category: 'business',
    description: 'Industrial sensor monitoring, failure prediction, maintenance scheduling, asset lifecycle management, and alerting',
    rules: ['alerting.mdc', 'asset-lifecycle.mdc', 'failure-prediction.mdc', 'maintenance-scheduling.mdc', 'overview.mdc', 'sensor-analytics.mdc']
  },
  'platform-engineering': {
    category: 'engineering',
    description: 'Internal developer platforms, infrastructure automation, and reliability engineering',
    rules: ['ci-cd.mdc', 'developer-experience.mdc', 'infrastructure-as-code.mdc', 'kubernetes.mdc', 'observability.mdc', 'overview.mdc', 'security.mdc', 'testing.mdc']
  },
  'product-manager': {
    category: 'business',
    description: 'Product management with customer-centric discovery, prioritization, and execution',
    rules: ['communication.mdc', 'discovery.mdc', 'metrics.mdc', 'overview.mdc', 'prioritization.mdc', 'requirements.mdc']
  },
  'regulatory-sentinel': {
    category: 'business',
    description: 'Regulatory compliance tracking, impact assessment, monitoring, risk classification, and compliance reporting',
    rules: ['compliance-tracking.mdc', 'impact-assessment.mdc', 'monitoring.mdc', 'overview.mdc', 'reporting.mdc', 'risk-classification.mdc']
  },
  'research-assistant': {
    category: 'professional',
    description: 'World-class research with advanced search strategies, source evaluation, OSINT techniques, and rigorous synthesis',
    rules: ['citation-attribution.mdc', 'information-synthesis.mdc', 'overview.mdc', 'research-methodologies.mdc', 'search-strategies.mdc', 'source-evaluation.mdc']
  },
  'resource-allocator': {
    category: 'business',
    description: 'Resource allocation with demand prediction, scheduling optimization, crisis management, and capacity modeling',
    rules: ['capacity-modeling.mdc', 'coordination.mdc', 'crisis-management.mdc', 'demand-prediction.mdc', 'overview.mdc', 'scheduling.mdc']
  },
  'project-manager': {
    category: 'business',
    description: 'Project management with WBS planning, risk management, status reporting, and change control',
    rules: ['overview.mdc', 'reporting.mdc', 'risk-management.mdc', 'scheduling.mdc', 'scope-management.mdc', 'stakeholder-management.mdc']
  },
  'python-expert': {
    category: 'languages',
    description: 'Principal-level Python engineering (type system, async, testing, FastAPI, Django)',
    rules: ['async-python.mdc', 'overview.mdc', 'patterns-and-idioms.mdc', 'performance.mdc', 'testing.mdc', 'tooling.mdc', 'type-system.mdc', 'web-and-apis.mdc']
  },
  'qa-engineering': {
    category: 'engineering',
    description: 'Quality assurance programs for confident, rapid software delivery',
    rules: ['automation.mdc', 'metrics.mdc', 'overview.mdc', 'quality-gates.mdc', 'test-design.mdc', 'test-strategy.mdc']
  },
  'social-media-expert': {
    category: 'creative',
    description: 'Social media strategy covering platform optimization, content planning, audience growth, community management, and analytics',
    rules: ['audience-growth.mdc', 'community-management.mdc', 'content-strategy.mdc', 'overview.mdc', 'platform-strategy.mdc', 'social-analytics.mdc']
  },
  'strategic-negotiator': {
    category: 'business',
    description: 'Negotiation strategy with game theory, deal structuring, scenario modeling, preparation frameworks, and contract analysis',
    rules: ['contract-analysis.mdc', 'deal-structuring.mdc', 'game-theory.mdc', 'overview.mdc', 'preparation.mdc', 'scenario-modeling.mdc']
  },
  'supply-chain-harmonizer': {
    category: 'business',
    description: 'Supply chain optimization with disruption response, rerouting, inventory rebalancing, and scenario simulation',
    rules: ['disruption-response.mdc', 'inventory-rebalancing.mdc', 'overview.mdc', 'rerouting.mdc', 'scenario-simulation.mdc', 'stakeholder-notifications.mdc']
  },
  'ruby-expert': {
    category: 'languages',
    description: 'Principal-level Ruby engineering (idioms, concurrency, Rails, performance, testing)',
    rules: ['concurrency-and-threading.mdc', 'error-handling.mdc', 'idioms-and-style.mdc', 'overview.mdc', 'performance.mdc', 'rails-and-frameworks.mdc', 'testing.mdc', 'tooling.mdc']
  },
  'rust-expert': {
    category: 'languages',
    description: 'Principal-level Rust engineering (ownership, concurrency, unsafe, traits, async)',
    rules: ['concurrency.mdc', 'ecosystem-and-tooling.mdc', 'error-handling.mdc', 'overview.mdc', 'ownership-and-borrowing.mdc', 'performance-and-unsafe.mdc', 'testing.mdc', 'traits-and-generics.mdc']
  },
  'supply-chain': {
    category: 'business',
    description: 'Supply chain management with inventory optimization, demand forecasting, supplier evaluation, and logistics',
    rules: ['cost-modeling.mdc', 'demand-forecasting.mdc', 'inventory-management.mdc', 'logistics.mdc', 'overview.mdc', 'supplier-evaluation.mdc']
  },
  'swift-expert': {
    category: 'languages',
    description: 'Principal-level Swift engineering (concurrency, SwiftUI, protocols, testing, Apple platforms)',
    rules: ['concurrency.mdc', 'error-handling.mdc', 'language-features.mdc', 'overview.mdc', 'performance.mdc', 'swiftui.mdc', 'testing.mdc', 'tooling.mdc']
  },
  'trend-forecaster': {
    category: 'creative',
    description: 'Trend analysis with signal detection, cultural analysis, trend lifecycle modeling, forecasting methods, and reporting',
    rules: ['cultural-analysis.mdc', 'forecasting-methods.mdc', 'overview.mdc', 'reporting.mdc', 'signal-analysis.mdc', 'trend-lifecycle.mdc']
  },
  'testing': {
    category: 'engineering',
    description: 'Comprehensive testing practices (TDD, test design, CI/CD integration, performance testing)',
    rules: ['advanced-techniques.mdc', 'ci-cd-integration.mdc', 'overview.mdc', 'performance-testing.mdc', 'quality-metrics.mdc', 'reliability.mdc', 'tdd-methodology.mdc', 'test-data.mdc', 'test-design.mdc', 'test-types.mdc']
  },
  'unity-dev-expert': {
    category: 'engineering',
    description: 'Unity game development with C# architecture, ECS/DOTS, physics/rendering, UI systems, multiplayer networking, and performance optimization',
    rules: ['csharp-architecture.mdc', 'multiplayer-networking.mdc', 'overview.mdc', 'performance-optimization.mdc', 'physics-rendering.mdc', 'ui-systems.mdc']
  },
  'utility-agent': {
    category: 'agents',
    description: 'AI agent utilities with context management and hallucination prevention',
    rules: ['action-control.mdc', 'context-management.mdc', 'hallucination-prevention.mdc', 'overview.mdc', 'token-optimization.mdc']
  },
  'ux-designer': {
    category: 'creative',
    description: 'Principal-level UX design with user research, interaction design, design systems, accessibility, and emotional design',
    rules: ['accessibility.mdc', 'emotional-design.mdc', 'handoff.mdc', 'information-architecture.mdc', 'interaction-design.mdc', 'overview.mdc', 'research.mdc', 'visual-design.mdc']
  },
  'wellness-orchestrator': {
    category: 'professional',
    description: 'Unified wellness planning across fitness, nutrition, sleep, and mental wellness with wearable data integration',
    rules: ['adaptive-planning.mdc', 'data-integration.mdc', 'fitness-programming.mdc', 'nutrition-planning.mdc', 'overview.mdc', 'sleep-optimization.mdc']
  },
  'web-backend': {
    category: 'engineering',
    description: 'Backend APIs and services (REST, GraphQL, microservices)',
    rules: ['api-design.mdc', 'authentication.mdc', 'database-patterns.mdc', 'error-handling.mdc', 'overview.mdc', 'security.mdc', 'testing.mdc']
  },
  'web-frontend': {
    category: 'engineering',
    description: 'Frontend web applications (SPAs, SSR, static sites, PWAs)',
    rules: ['accessibility.mdc', 'component-patterns.mdc', 'overview.mdc', 'performance.mdc', 'state-management.mdc', 'styling.mdc', 'testing.mdc']
  }
};

// Shorthand aliases for language expert templates
const TEMPLATE_ALIASES = {
  'js': 'javascript-expert',
  'javascript': 'javascript-expert',
  'ts': 'javascript-expert',
  'typescript': 'javascript-expert',
  'go': 'golang-expert',
  'golang': 'golang-expert',
  'py': 'python-expert',
  'python': 'python-expert',
  'rs': 'rust-expert',
  'rust': 'rust-expert',
  'ruby': 'ruby-expert',
  'rb': 'ruby-expert',
  'swift': 'swift-expert',
  'kotlin': 'kotlin-expert',
  'kt': 'kotlin-expert',
  'java': 'java-expert',
  'cpp': 'cpp-expert',
  'csharp': 'csharp-expert',
  'cs': 'csharp-expert',
  'unity': 'unity-dev-expert',
  'teach': 'educator',
  'teacher': 'educator',
  'marketing': 'marketing-expert',
  'social-media': 'social-media-expert',
  'content-creation': 'content-creation-expert',
  'ux': 'ux-designer',
  'uxd': 'ux-designer',
  'design': 'ux-designer',
  'designer': 'ux-designer',
  'research': 'research-assistant',
  'researcher': 'research-assistant',
  // Engineering
  'frontend': 'web-frontend',
  'fe': 'web-frontend',
  'backend': 'web-backend',
  'api': 'web-backend',
  'devops': 'devops-sre',
  'sre': 'devops-sre',
  'cli': 'cli-tools',
  'data': 'data-engineering',
  'dataeng': 'data-engineering',
  'ml': 'ml-ai',
  'ai': 'ml-ai',
  'qa': 'qa-engineering',
  'test': 'testing',
  'chain': 'blockchain',
  'web3': 'blockchain',
  'platform': 'platform-engineering',
  'platform-eng': 'platform-engineering',
  // Professional
  'docs': 'documentation',
  'grants': 'grant-writer',
  'exec': 'executive-assistant',
  'ea': 'executive-assistant',
  'knowledge': 'knowledge-synthesis',
  'wellness': 'wellness-orchestrator',
  'life': 'life-logistics',
  'logistics': 'life-logistics',
  // Business
  'product': 'product-manager',
  'project': 'project-manager',
  'compliance': 'regulatory-sentinel',
  'regulatory': 'regulatory-sentinel',
  'allocator': 'resource-allocator',
  'resources': 'resource-allocator',
  'market-intel': 'market-intelligence',
  'supplychain': 'supply-chain',
  'harmonizer': 'supply-chain-harmonizer',
  'negotiator': 'strategic-negotiator',
  'predictive': 'predictive-maintenance',
  // Creative
  'brand': 'brand-guardian',
  'narrative': 'narrative-architect',
  'story': 'narrative-architect',
  'trends': 'trend-forecaster',
  // Agents
  'agent': 'utility-agent',
  'utility': 'utility-agent',
};

/**
 * Resolve a template alias to its canonical name
 * @param {string} name - Template name or alias
 * @returns {string} Canonical template name
 */
function resolveTemplateAlias(name) {
  return TEMPLATE_ALIASES[name] || name;
}

/**
 * Get the source path for a template's rule files
 * @param {string} template - Template name
 * @param {string} rule - Rule filename
 * @returns {string} Full path to the rule file in templates/<category>/<template>/.cursor/rules/
 */
function getTemplateRulePath(template, rule) {
  const { category } = TEMPLATES[template];
  return path.join(TEMPLATES_DIR, category, template, '.cursor', 'rules', rule);
}

const SHARED_RULES = [
  'code-quality.mdc',
  'communication.mdc',
  'core-principles.mdc',
  'git-workflow.mdc',
  'security-fundamentals.mdc'
];

/**
 * Extract the description field from a .mdc file's YAML front matter
 * Falls back to the first heading or the filename.
 * @param {string} filePath - Full path to the .mdc file
 * @returns {string} Description text
 */
function extractDescription(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const descMatch = fmMatch[1].match(/description:\s*(.+)/);
      if (descMatch) return descMatch[1].trim();
    }
    const headingMatch = content.match(/^#\s+(.+)/m);
    return headingMatch ? headingMatch[1].trim() : path.basename(filePath, '.mdc');
  } catch {
    return path.basename(filePath, '.mdc');
  }
}

// Supported IDEs/tools
const SUPPORTED_IDES = ['cursor', 'claude', 'codex'];
const DEFAULT_IDES = ['cursor', 'claude', 'codex']; // Default: install for all IDEs

// Colors
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  blue: (s) => `\x1b[34m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

/**
 * Compare two semver version strings
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * Check npm for the latest version and notify if update available
 * Fails silently on network errors
 */
async function checkForUpdates() {
  try {
    const { stdout } = await execAsync(`npm view ${PACKAGE_NAME} version`, {
      timeout: 5000, // 5 second timeout
    });
    const latestVersion = stdout.trim();
    
    if (compareVersions(CURRENT_VERSION, latestVersion) < 0) {
      console.log(colors.cyan(`
┌────────────────────────────────────────────────────────────┐
│  Update available: ${CURRENT_VERSION} → ${latestVersion}                              │
│  Run: npx ${PACKAGE_NAME}@latest                │
└────────────────────────────────────────────────────────────┘
`));
    }
  } catch {
    // Silently ignore network errors or timeouts
  }
}

function printBanner() {
  console.log(colors.blue(`
╔═══════════════════════════════════════════════════════════╗
║           Agentic Team Templates Installer                ║
╚═══════════════════════════════════════════════════════════╝
`));
}

function printHelp() {
  console.log(`${colors.yellow('Usage:')}
  npx cursor-templates <templates...> [options]
  npx cursor-templates --remove <templates...> [options]
  npx cursor-templates --reset [options]

${colors.yellow('Options:')}
  --ide=<name>   Install for specific IDE (cursor, claude, codex)
                 Can be specified multiple times: --ide=cursor --ide=claude
                 Default: all (cursor, claude, codex)
  --list, -l     List available templates
  --help, -h     Show this help message
  --version, -v  Show version number
  --dry-run      Show what would be changed
  --force, -f    Overwrite/remove even if files were modified
  --yes, -y      Skip confirmation prompt (for --remove and --reset)

${colors.yellow('Removal Options:')}
  --remove       Remove specified templates (keeps shared rules and other templates)
  --reset        Remove ALL installed content (shared rules, templates, generated files)

${colors.yellow('IDE Targets:')}
  cursor         .cursor/rules/ directory (Cursor IDE)
  claude         CLAUDE.md file (Claude Code, Cursor with Claude)
  codex          .github/copilot-instructions.md (GitHub Copilot)

${colors.yellow('Shorthand Aliases:')}
  Languages:  js, ts, go, py, rs, ruby, rb, swift, kotlin, kt, java, cpp, csharp, cs
  Engineering: frontend, fe, backend, api, devops, sre, cli, data, ml, ai, qa, test, chain, web3, platform
  Professional: docs, grants, exec, ea, knowledge, wellness, life, logistics, research
  Business: product, project, compliance, allocator, market-intel, supplychain, harmonizer, negotiator
  Creative: ux, design, brand, narrative, story, trends, marketing, social-media, content-creation
  Other: unity, teach, teacher, agent, utility

  Run --list to see full alias → template mapping.

${colors.yellow('Examples:')}
  npx cursor-templates js
  npx cursor-templates web-frontend
  npx cursor-templates web-frontend --ide=cursor
  npx cursor-templates web-frontend --ide=claude --ide=codex
  npx cursor-templates fullstack --ide=codex
  npx cursor-templates web-backend --force

${colors.yellow('Removal Examples:')}
  npx cursor-templates --remove web-frontend
  npx cursor-templates --remove web-frontend web-backend
  npx cursor-templates --remove web-frontend --ide=cursor
  npx cursor-templates --reset
  npx cursor-templates --reset --ide=cursor
  npx cursor-templates --reset --yes

${colors.dim('Shared rules (code-quality, security, git-workflow, etc.) are always included.')}
${colors.dim('Identical files are skipped. Modified files are preserved; ours saved as *-1.mdc.')}
${colors.dim('CLAUDE.md: missing sections are intelligently merged (not overwritten).')}
`);
}

function printTemplates() {
  // Build reverse map: canonical name -> list of aliases
  const aliasesByTemplate = {};
  for (const [alias, canonical] of Object.entries(TEMPLATE_ALIASES)) {
    if (!aliasesByTemplate[canonical]) {
      aliasesByTemplate[canonical] = [];
    }
    aliasesByTemplate[canonical].push(alias);
  }

  console.log(colors.yellow('Available Templates:\n'));

  // Group templates by category
  const byCategory = {};
  for (const [name, info] of Object.entries(TEMPLATES)) {
    const cat = info.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ name, info });
  }

  for (const category of CATEGORIES) {
    const templates = byCategory[category];
    if (!templates || templates.length === 0) continue;
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    console.log(colors.blue(`  ${label}:`));
    for (const { name, info } of templates) {
      const aliases = aliasesByTemplate[name];
      const aliasSuffix = aliases ? ` ${colors.dim(`(aliases: ${aliases.join(', ')})`)}` : '';
      console.log(`    ${colors.green(name)}${aliasSuffix}`);
      console.log(`      ${info.description}\n`);
    }
  }

  console.log(colors.blue('Shared rules (always included):'));
  for (const rule of SHARED_RULES) {
    console.log(`  - ${rule.replace('.mdc', '')}`);
  }
  console.log();
}

/**
 * Check if two files have identical content
 */
function filesMatch(file1, file2) {
  try {
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');
    return content1 === content2;
  } catch {
    return false;
  }
}

/**
 * Parse markdown content into sections by ## headings
 * @param {string} content - Markdown content
 * @returns {Array<{heading: string, content: string, signature: string}>}
 */
function parseMarkdownSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let preamble = [];

  for (const line of lines) {
    if (line.startsWith('## ')) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentSection.lines.join('\n');
        currentSection.signature = generateSectionSignature(currentSection.heading, currentSection.lines);
        delete currentSection.lines;
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        heading: line.slice(3).trim(),
        lines: []
      };
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else {
      // Content before first ## heading (preamble)
      preamble.push(line);
    }
  }

  // Don't forget the last section
  if (currentSection) {
    currentSection.content = currentSection.lines.join('\n');
    currentSection.signature = generateSectionSignature(currentSection.heading, currentSection.lines);
    delete currentSection.lines;
    sections.push(currentSection);
  }

  return { preamble: preamble.join('\n'), sections };
}

/**
 * Generate a signature for a section based on heading + first meaningful lines
 * Used for matching sections even if heading text differs slightly
 * @param {string} heading
 * @param {string[]} lines
 * @returns {string}
 */
function generateSectionSignature(heading, lines) {
  // Normalize heading: lowercase, remove special chars, collapse whitespace
  const normalizedHeading = heading.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Get first 3 non-empty, non-heading lines for content signature
  const meaningfulLines = lines
    .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('-'))
    .slice(0, 3)
    .map(l => l.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim())
    .join(' ');

  return `${normalizedHeading}::${meaningfulLines.slice(0, 100)}`;
}

/**
 * Find sections from template that are missing in existing content
 * @param {string} existingContent
 * @param {string} templateContent
 * @returns {{missing: Array<{heading: string, content: string}>, matchedCount: number}}
 */
function findMissingSections(existingContent, templateContent) {
  const existing = parseMarkdownSections(existingContent);
  const template = parseMarkdownSections(templateContent);

  const existingSignatures = new Set(existing.sections.map(s => s.signature));
  const existingHeadings = new Set(existing.sections.map(s => s.heading.toLowerCase()));

  const missing = [];
  let matchedCount = 0;

  for (const section of template.sections) {
    // Check by signature first (heading + content), then by heading alone
    const signatureMatch = existingSignatures.has(section.signature);
    const headingMatch = existingHeadings.has(section.heading.toLowerCase());

    if (signatureMatch || headingMatch) {
      matchedCount++;
    } else {
      missing.push(section);
    }
  }

  return { missing, matchedCount };
}

/**
 * Merge template sections into existing content, inserting missing sections in template order
 * @param {string} existingContent
 * @param {string} templateContent
 * @returns {{merged: string, addedSections: string[]}}
 */
function mergeClaudeContent(existingContent, templateContent) {
  const existing = parseMarkdownSections(existingContent);
  const template = parseMarkdownSections(templateContent);
  const { missing } = findMissingSections(existingContent, templateContent);

  if (missing.length === 0) {
    return { merged: existingContent, addedSections: [] };
  }

  // Build a map of existing sections by normalized heading for insertion point lookup
  const existingByHeading = new Map();
  existing.sections.forEach((s, i) => {
    existingByHeading.set(s.heading.toLowerCase(), i);
  });

  // Find template section order and determine where to insert missing sections
  const templateOrder = template.sections.map(s => s.heading.toLowerCase());
  
  // For each missing section, find the best insertion point based on template order
  const insertions = []; // { afterIndex: number, section: section }
  
  for (const missingSection of missing) {
    const missingIndex = templateOrder.indexOf(missingSection.heading.toLowerCase());
    
    // Find the closest preceding section that exists in the existing content
    let insertAfterIndex = -1; // -1 means insert at beginning (after preamble)
    
    for (let i = missingIndex - 1; i >= 0; i--) {
      const precedingHeading = templateOrder[i];
      if (existingByHeading.has(precedingHeading)) {
        insertAfterIndex = existingByHeading.get(precedingHeading);
        break;
      }
    }
    
    insertions.push({ afterIndex: insertAfterIndex, section: missingSection });
  }

  // Sort insertions by afterIndex (descending) so we insert from bottom to top
  // This preserves indices as we insert
  insertions.sort((a, b) => b.afterIndex - a.afterIndex);

  // Build the merged content
  const mergedSections = [...existing.sections];
  const addedSections = [];

  for (const { afterIndex, section } of insertions) {
    const insertAt = afterIndex + 1;
    mergedSections.splice(insertAt, 0, section);
    addedSections.push(section.heading);
  }

  // Reconstruct the markdown
  let merged = existing.preamble;
  if (merged && !merged.endsWith('\n\n')) {
    merged = merged.trimEnd() + '\n\n';
  }

  for (const section of mergedSections) {
    merged += `## ${section.heading}\n${section.content}\n`;
  }

  // addedSections is in reverse order due to sorting, reverse it back
  addedSections.reverse();

  return { merged: merged.trimEnd() + '\n', addedSections };
}

/**
 * Get alternate filename with -1 suffix (e.g., code-quality.mdc -> code-quality-1.mdc)
 */
function getAlternateFilename(filepath) {
  const dir = path.dirname(filepath);
  const ext = path.extname(filepath);
  const base = path.basename(filepath, ext);
  return path.join(dir, `${base}-1${ext}`);
}

/**
 * Copy file, handling existing files intelligently
 * @returns {{ status: string, destFile: string }}
 *   status: 'copied' | 'skipped' | 'renamed' | 'updated'
 *   destFile: actual destination path (may differ if renamed)
 */
function copyFile(src, dest, force = false) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const exists = fs.existsSync(dest);
  
  if (!exists) {
    // File doesn't exist - copy normally
    fs.copyFileSync(src, dest);
    return { status: 'copied', destFile: dest };
  }
  
  if (force) {
    // Force mode - overwrite
    fs.copyFileSync(src, dest);
    return { status: 'updated', destFile: dest };
  }
  
  // File exists - check if it matches our template
  if (filesMatch(src, dest)) {
    // Same content - skip
    return { status: 'skipped', destFile: dest };
  }
  
  // Different content - save ours alongside with -1 suffix
  const altDest = getAlternateFilename(dest);
  fs.copyFileSync(src, altDest);
  return { status: 'renamed', destFile: altDest };
}

function generateClaudeMdContent(installedTemplates) {
  const templateList = installedTemplates
    .map(t => `- **${t}**: ${TEMPLATES[t].description}`)
    .join('\n');

  const templateRuleTables = installedTemplates.map(template => {
    const rules = TEMPLATES[template].rules
      .map(rule => `| \`${template}-${rule}\` | ${rule.replace('.mdc', '').replace(/-/g, ' ')} guidelines |`)
      .join('\n');
    
    return `
#### ${template.charAt(0).toUpperCase() + template.slice(1)} Rules

| Rule | Purpose |
|------|---------|
${rules}`;
  }).join('\n');

  return `# CLAUDE.md - Development Guide

This project uses AI-assisted development. Rules in \`.cursor/rules/\` provide guidance.

## Installed Templates

- **Shared** (always included): Core principles, code quality, security, git workflow, communication
${templateList}

## Rule Files

All rules are in \`.cursor/rules/\`. The AI assistant reads these automatically.

#### Shared Rules

| Rule | Purpose |
|------|---------|
| \`core-principles.mdc\` | Honesty, simplicity, testing requirements |
| \`code-quality.mdc\` | SOLID, DRY, clean code patterns |
| \`security-fundamentals.mdc\` | Zero trust, input validation, secrets |
| \`git-workflow.mdc\` | Commits, branches, PRs, safety |
| \`communication.mdc\` | Direct, objective, professional |
${templateRuleTables}

## Customization

- Create new \`.mdc\` files in \`.cursor/rules/\` for project-specific rules
- Edit existing files directly; changes take effect immediately
- Re-run to update: \`npx cursor-templates ${installedTemplates.join(' ')}\`
`;
}

function generateClaudeMd(targetDir, installedTemplates) {
  const content = generateClaudeMdContent(installedTemplates);
  fs.writeFileSync(path.join(targetDir, 'CLAUDE.md'), content);
}

function generateClaudeMdToPath(targetDir, installedTemplates, destPath) {
  const content = generateClaudeMdContent(installedTemplates);
  fs.writeFileSync(destPath, content);
}

/**
 * Generate content for GitHub Copilot instructions file.
 * Uses description-based summaries instead of full content concatenation
 * to keep the file within context window limits.
 */
function generateCopilotInstructionsContent(installedTemplates) {
  // Build shared rules table with descriptions from front matter
  const sharedRulesTable = SHARED_RULES.map(rule => {
    const rulePath = path.join(TEMPLATES_DIR, '_shared', rule);
    const desc = extractDescription(rulePath);
    return `| \`${rule}\` | ${desc} |`;
  }).join('\n');

  // Build template rules tables with descriptions from front matter
  const templateTables = installedTemplates.map(template => {
    const rulesRows = TEMPLATES[template].rules.map(rule => {
      const rulePath = getTemplateRulePath(template, rule);
      const desc = extractDescription(rulePath);
      return `| \`${rule}\` | ${desc} |`;
    }).join('\n');

    return `### ${template}

${TEMPLATES[template].description}

| Rule | Guidance |
|------|----------|
${rulesRows}`;
  }).join('\n\n');

  return `# Copilot Instructions

Guidelines for GitHub Copilot in this project. Full rules are in \`.cursor/rules/\`.

## Project Configuration

**Installed Templates:** ${installedTemplates.join(', ')}

## Core Principles

- **Honesty over output**: Say what works and what doesn't; admit uncertainty
- **Security first**: Zero trust, validate all inputs, no secrets in code
- **Tests required**: No feature ships without tests; test behavior, not implementation
- **Code quality**: SOLID, DRY, explicit over implicit

## Shared Rules

| Rule | Guidance |
|------|----------|
${sharedRulesTable}

## Template Rules

${templateTables}
`;
}

async function install(targetDir, templates, dryRun = false, force = false, ides = DEFAULT_IDES, skipConfirm = false) {
  const stats = { copied: 0, skipped: 0, updated: 0, renamed: 0 };
  const renamedFiles = [];
  const installedFor = [];

  console.log(`${colors.blue('Installing to:')} ${targetDir}`);
  console.log(`${colors.blue('Target IDEs:')} ${ides.join(', ')}`);
  if (!force) {
    console.log(colors.dim('(identical files skipped, modified files preserved with ours saved as *-1.mdc)'));
  }
  console.log();

  // 1. Install .cursor/rules/ for Cursor IDE
  if (ides.includes('cursor')) {
    installedFor.push('cursor');
    const cursorRulesDir = path.join(targetDir, CURSOR_RULES_DIR);

    if (!dryRun && !fs.existsSync(cursorRulesDir)) {
      fs.mkdirSync(cursorRulesDir, { recursive: true });
    }

    // Install shared rules
    console.log(colors.green(`► Installing shared rules (${CURSOR_RULES_DIR}/)...`));
    for (const rule of SHARED_RULES) {
      const src = path.join(TEMPLATES_DIR, '_shared', rule);
      const dest = path.join(cursorRulesDir, rule);
      
      if (dryRun) {
        const exists = fs.existsSync(dest);
        if (!exists) {
          console.log(`  ${colors.dim('[copy]')} ${rule}`);
        } else if (force) {
          console.log(`  ${colors.dim('[update]')} ${rule}`);
        } else if (filesMatch(src, dest)) {
          console.log(`  ${colors.yellow('[skip]')} ${rule} (identical)`);
        } else {
          const altName = path.basename(getAlternateFilename(dest));
          console.log(`  ${colors.blue('[rename]')} ${rule} → ${altName}`);
        }
      } else {
        const result = copyFile(src, dest, force);
        stats[result.status]++;
        if (result.status === 'skipped') {
          console.log(`  ${colors.yellow('[skip]')} ${rule} (identical)`);
        } else if (result.status === 'renamed') {
          const altName = path.basename(result.destFile);
          renamedFiles.push({ original: rule, renamed: altName });
          console.log(`  ${colors.blue('[rename]')} ${rule} → ${altName}`);
        } else {
          console.log(`  ${colors.dim(`[${result.status}]`)} ${rule}`);
        }
      }
    }
    console.log();

    // Install template-specific rules
    for (const template of templates) {
      console.log(colors.green(`► Installing ${template} template (${CURSOR_RULES_DIR}/)...`));

      for (const rule of TEMPLATES[template].rules) {
        const src = getTemplateRulePath(template, rule);
        const dest = path.join(cursorRulesDir, `${template}-${rule}`);
        const destName = `${template}-${rule}`;
        
        if (dryRun) {
          const exists = fs.existsSync(dest);
          if (!exists) {
            console.log(`  ${colors.dim('[copy]')} ${destName}`);
          } else if (force) {
            console.log(`  ${colors.dim('[update]')} ${destName}`);
          } else if (filesMatch(src, dest)) {
            console.log(`  ${colors.yellow('[skip]')} ${destName} (identical)`);
          } else {
            const altName = path.basename(getAlternateFilename(dest));
            console.log(`  ${colors.blue('[rename]')} ${destName} → ${altName}`);
          }
        } else {
          const result = copyFile(src, dest, force);
          stats[result.status]++;
          if (result.status === 'skipped') {
            console.log(`  ${colors.yellow('[skip]')} ${destName} (identical)`);
          } else if (result.status === 'renamed') {
            const altName = path.basename(result.destFile);
            renamedFiles.push({ original: destName, renamed: altName });
            console.log(`  ${colors.blue('[rename]')} ${destName} → ${altName}`);
          } else {
            console.log(`  ${colors.dim(`[${result.status}]`)} ${destName}`);
          }
        }
      }
      console.log();
    }

    // Legacy .cursorrules/ detection and cleanup
    const legacyDir = path.join(targetDir, LEGACY_CURSORRULES_DIR);
    if (fs.existsSync(legacyDir)) {
      console.log(colors.yellow(`⚠  Deprecated ${LEGACY_CURSORRULES_DIR}/ directory detected.`));
      console.log(colors.yellow(`   Cursor now uses ${CURSOR_RULES_DIR}/ for rule files.`));
      console.log(colors.yellow(`   New rules have been installed to ${CURSOR_RULES_DIR}/.`));
      console.log();
      console.log(colors.yellow(`   Your existing ${LEGACY_CURSORRULES_DIR}/ files are still present.`));
      console.log(colors.yellow(`   Support for ${LEGACY_CURSORRULES_DIR}/ will be removed in a future version.`));
      console.log();

      if (!dryRun) {
        const shouldCleanup = skipConfirm || await confirm(
          colors.yellow(`? Would you like to remove the deprecated ${LEGACY_CURSORRULES_DIR}/ directory?`)
        );

        if (shouldCleanup) {
          // Copy legacy rule files to .cursor/rules/ before removing (don't overwrite existing)
          const legacyEntries = fs.readdirSync(legacyDir, { withFileTypes: true });
          let copiedCount = 0;
          for (const entry of legacyEntries) {
            if (!entry.isFile()) continue;
            const name = entry.name;
            const legacyPath = path.join(legacyDir, name);
            const destPath = path.join(cursorRulesDir, name);
            if (!fs.existsSync(destPath)) {
              fs.copyFileSync(legacyPath, destPath);
              console.log(colors.dim(`  ${colors.green('[migrated]')} ${name} → ${CURSOR_RULES_DIR}/`));
              copiedCount++;
            }
          }
          if (copiedCount > 0) {
            console.log(colors.green(`  ✓ Migrated ${copiedCount} file(s) from ${LEGACY_CURSORRULES_DIR}/ to ${CURSOR_RULES_DIR}/.`));
          }
          fs.rmSync(legacyDir, { recursive: true });
          console.log(colors.green(`  ✓ Removed deprecated ${LEGACY_CURSORRULES_DIR}/ directory.`));
        } else {
          // Create reference file so Cursor AI knows about legacy rules
          const noticePath = path.join(cursorRulesDir, 'legacy-cursorrules-notice.md');
          const noticeContent = `# Legacy Rules Notice

This project contains additional rule files in the deprecated \`.cursorrules/\` directory
at the project root. Those rules are still active and should be consulted alongside the
rules in this directory.

The \`.cursorrules/\` directory will be removed in a future version.
To clean up manually, move any custom rules to \`.cursor/rules/\` and delete \`.cursorrules/\`.
`;
          fs.writeFileSync(noticePath, noticeContent);
          console.log(colors.dim(`  Created ${CURSOR_RULES_DIR}/legacy-cursorrules-notice.md as a reference.`));
        }
      } else {
        console.log(colors.dim('  (dry-run: skipping cleanup prompt)'));
      }
      console.log();
    }
  }

  // 2. Generate CLAUDE.md for Claude Code
  if (ides.includes('claude')) {
    installedFor.push('claude');
    const claudePath = path.join(targetDir, 'CLAUDE.md');
    const claudeExists = fs.existsSync(claudePath);
    const templateContent = generateClaudeMdContent(templates);
    
    console.log(colors.green('► Generating CLAUDE.md (Claude Code)...'));
    if (dryRun) {
      if (!claudeExists) {
        console.log(`  ${colors.dim('[copy]')} CLAUDE.md`);
      } else if (force) {
        console.log(`  ${colors.dim('[update]')} CLAUDE.md`);
      } else {
        const existingContent = fs.readFileSync(claudePath, 'utf8');
        const { missing } = findMissingSections(existingContent, templateContent);
        if (missing.length === 0) {
          console.log(`  ${colors.yellow('[skip]')} CLAUDE.md (all sections present)`);
        } else {
          console.log(`  ${colors.blue('[merge]')} CLAUDE.md (would add ${missing.length} section(s))`);
          for (const section of missing) {
            console.log(`    ${colors.dim('+')} ${section.heading}`);
          }
        }
      }
    } else if (!claudeExists) {
      fs.writeFileSync(claudePath, templateContent);
      console.log(`  ${colors.dim('[copied]')} CLAUDE.md`);
      stats.copied++;
    } else if (force) {
      fs.writeFileSync(claudePath, templateContent);
      console.log(`  ${colors.dim('[updated]')} CLAUDE.md`);
      stats.updated++;
    } else {
      const existingContent = fs.readFileSync(claudePath, 'utf8');
      const { merged, addedSections } = mergeClaudeContent(existingContent, templateContent);
      
      if (addedSections.length === 0) {
        console.log(`  ${colors.yellow('[skip]')} CLAUDE.md (all sections present)`);
        stats.skipped++;
      } else {
        fs.writeFileSync(claudePath, merged);
        console.log(`  ${colors.blue('[merged]')} CLAUDE.md`);
        console.log(`    ${colors.green('Added sections:')}`);
        for (const heading of addedSections) {
          console.log(`      ${colors.dim('+')} ${heading}`);
        }
        stats.updated++;
      }
    }
    console.log();
  }

  // 3. Generate .github/copilot-instructions.md for GitHub Copilot (Codex)
  if (ides.includes('codex')) {
    installedFor.push('codex');
    const githubDir = path.join(targetDir, '.github');
    const copilotPath = path.join(githubDir, 'copilot-instructions.md');
    const copilotExists = fs.existsSync(copilotPath);
    const copilotContent = generateCopilotInstructionsContent(templates);
    
    if (!dryRun && !fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }
    
    console.log(colors.green('► Generating .github/copilot-instructions.md (GitHub Copilot)...'));
    if (dryRun) {
      if (!copilotExists) {
        console.log(`  ${colors.dim('[copy]')} .github/copilot-instructions.md`);
      } else if (force) {
        console.log(`  ${colors.dim('[update]')} .github/copilot-instructions.md`);
      } else {
        const existingContent = fs.readFileSync(copilotPath, 'utf8');
        const { missing } = findMissingSections(existingContent, copilotContent);
        if (missing.length === 0) {
          console.log(`  ${colors.yellow('[skip]')} .github/copilot-instructions.md (all sections present)`);
        } else {
          console.log(`  ${colors.blue('[merge]')} .github/copilot-instructions.md (would add ${missing.length} section(s))`);
        }
      }
    } else if (!copilotExists) {
      fs.writeFileSync(copilotPath, copilotContent);
      console.log(`  ${colors.dim('[copied]')} .github/copilot-instructions.md`);
      stats.copied++;
    } else if (force) {
      fs.writeFileSync(copilotPath, copilotContent);
      console.log(`  ${colors.dim('[updated]')} .github/copilot-instructions.md`);
      stats.updated++;
    } else {
      const existingContent = fs.readFileSync(copilotPath, 'utf8');
      const { merged, addedSections } = mergeClaudeContent(existingContent, copilotContent);
      
      if (addedSections.length === 0) {
        console.log(`  ${colors.yellow('[skip]')} .github/copilot-instructions.md (all sections present)`);
        stats.skipped++;
      } else {
        fs.writeFileSync(copilotPath, merged);
        console.log(`  ${colors.blue('[merged]')} .github/copilot-instructions.md`);
        stats.updated++;
      }
    }
    console.log();
  }

  // Summary
  console.log(colors.green('════════════════════════════════════════════════════════════'));
  console.log(colors.green('✓ Installation complete!\n'));
  
  console.log(colors.yellow('Summary:'));
  console.log(`  - ${stats.copied} files created`);
  if (stats.updated > 0) {
    console.log(`  - ${stats.updated} files updated`);
  }
  if (stats.skipped > 0) {
    console.log(`  - ${stats.skipped} files skipped (identical to template)`);
  }
  if (stats.renamed > 0) {
    console.log(`  - ${colors.blue(`${stats.renamed} files saved as *-1.mdc`)} (yours preserved)`);
  }
  console.log();
  
  console.log(colors.yellow('Installed for:'));
  for (const ide of installedFor) {
    const ideInfo = {
      cursor: '.cursor/rules/ (Cursor IDE)',
      claude: 'CLAUDE.md (Claude Code)',
      codex: '.github/copilot-instructions.md (GitHub Copilot)'
    };
    console.log(`  - ${ideInfo[ide]}`);
  }
  console.log();
  
  console.log(colors.yellow('Templates:'));
  console.log('  - _shared (always included)');
  for (const template of templates) {
    console.log(`  - ${template}`);
  }
  console.log();
  
  if (renamedFiles.length > 0) {
    console.log(colors.blue('Files saved alongside existing (your files preserved):'));
    for (const { original, renamed } of renamedFiles) {
      console.log(`  - ${original} → ${renamed}`);
    }
    console.log(colors.dim('\nReview the -1 files and merge changes as needed.'));
    console.log(colors.dim('Use --force to overwrite existing files instead.'));
    console.log();
  }
  
  console.log(colors.blue('Next steps:'));
  if (installedFor.includes('claude')) {
    console.log('  1. Review CLAUDE.md for any customization');
  }
  if (installedFor.includes('codex')) {
    console.log('  2. Review .github/copilot-instructions.md');
  }
  console.log('  3. Commit the new files to your repository');
  console.log();
}

/**
 * Prompt user for confirmation
 * @param {string} message - The prompt message
 * @returns {Promise<boolean>}
 */
async function confirm(message) {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Check if a file was created by our installer (matches template content)
 * @param {string} filePath - Path to the file
 * @param {string} templatePath - Path to the template file
 * @returns {boolean}
 */
function isOurFile(filePath, templatePath) {
  if (!fs.existsSync(filePath)) return false;
  if (!fs.existsSync(templatePath)) return true; // No template to compare, assume ours
  return filesMatch(filePath, templatePath);
}

/**
 * Remove specific templates from the installation
 */
async function remove(targetDir, templates, dryRun = false, force = false, skipConfirm = false, ides = DEFAULT_IDES) {
  const stats = { removed: 0, skipped: 0, notFound: 0 };
  const filesToRemove = [];
  const modifiedFiles = [];

  console.log(`${colors.blue('Removing from:')} ${targetDir}`);
  console.log(`${colors.blue('Target IDEs:')} ${ides.join(', ')}`);
  console.log(`${colors.blue('Templates:')} ${templates.join(', ')}`);
  console.log();

  // 1. Collect files to remove from .cursor/rules/ (and legacy .cursorrules/)
  if (ides.includes('cursor')) {
    const cursorRulesDir = path.join(targetDir, CURSOR_RULES_DIR);
    const legacyDir = path.join(targetDir, LEGACY_CURSORRULES_DIR);
    const dirsToScan = [];

    if (fs.existsSync(cursorRulesDir)) dirsToScan.push({ dir: cursorRulesDir, label: CURSOR_RULES_DIR });
    if (fs.existsSync(legacyDir)) dirsToScan.push({ dir: legacyDir, label: LEGACY_CURSORRULES_DIR });

    if (dirsToScan.length > 0) {
      for (const template of templates) {
        console.log(colors.yellow(`► Scanning ${template} template files...`));

        for (const { dir, label } of dirsToScan) {
          for (const rule of TEMPLATES[template].rules) {
            const destName = `${template}-${rule}`;
            const destPath = path.join(dir, destName);
            const srcPath = getTemplateRulePath(template, rule);

            if (!fs.existsSync(destPath)) {
              continue;
            }

            const isUnmodified = isOurFile(destPath, srcPath);
            const displayName = `${destName} (${label}/)`;

            if (!isUnmodified && !force) {
              console.log(`  ${colors.yellow('[modified]')} ${displayName} (use --force to remove)`);
              modifiedFiles.push(displayName);
              stats.skipped++;
            } else {
              console.log(`  ${colors.red('[remove]')} ${displayName}${!isUnmodified ? ' (modified, --force)' : ''}`);
              filesToRemove.push({ path: destPath, name: displayName });
            }
          }

          // Also check for -1 variant files
          for (const rule of TEMPLATES[template].rules) {
            const altName = `${template}-${rule.replace('.mdc', '-1.mdc')}`;
            const altPath = path.join(dir, altName);

            if (fs.existsSync(altPath)) {
              console.log(`  ${colors.red('[remove]')} ${altName} (${label}/, alternate file)`);
              filesToRemove.push({ path: altPath, name: altName });
            }
          }
        }

        // Check for legacy-cursorrules-notice.md in new dir
        const noticePath = path.join(cursorRulesDir, 'legacy-cursorrules-notice.md');
        if (fs.existsSync(noticePath)) {
          console.log(`  ${colors.red('[remove]')} legacy-cursorrules-notice.md`);
          filesToRemove.push({ path: noticePath, name: 'legacy-cursorrules-notice.md' });
        }

        // Log not-found for templates that weren't in either dir
        for (const rule of TEMPLATES[template].rules) {
          const destName = `${template}-${rule}`;
          const inNew = fs.existsSync(path.join(cursorRulesDir, destName));
          const inLegacy = fs.existsSync(path.join(legacyDir, destName));
          if (!inNew && !inLegacy) {
            console.log(`  ${colors.dim('[not found]')} ${destName}`);
            stats.notFound++;
          }
        }

        console.log();
      }
    } else {
      console.log(colors.dim(`No ${CURSOR_RULES_DIR}/ or ${LEGACY_CURSORRULES_DIR}/ directory found.\n`));
    }
  }

  // 2. Note about CLAUDE.md and copilot-instructions.md
  // These are regenerated, not patched, so we can't easily remove just one template's content
  // We'll warn the user about this
  if (ides.includes('claude') || ides.includes('codex')) {
    console.log(colors.yellow('Note: CLAUDE.md and copilot-instructions.md contain merged content.'));
    console.log(colors.dim('To update these files, re-run the installer with the remaining templates.\n'));
  }

  if (filesToRemove.length === 0) {
    console.log(colors.yellow('Nothing to remove.\n'));
    return;
  }

  // Confirmation
  if (!dryRun && !skipConfirm) {
    console.log(colors.yellow(`\nAbout to remove ${filesToRemove.length} file(s).`));
    const confirmed = await confirm(colors.red('Proceed with removal?'));
    if (!confirmed) {
      console.log(colors.dim('\nAborted.\n'));
      return;
    }
    console.log();
  }

  // Execute removal
  if (dryRun) {
    console.log(colors.yellow('DRY RUN - No files were removed.\n'));
  } else {
    for (const file of filesToRemove) {
      try {
        fs.unlinkSync(file.path);
        stats.removed++;
      } catch (err) {
        console.error(colors.red(`Failed to remove ${file.name}: ${err.message}`));
      }
    }
  }

  // Summary
  console.log(colors.green('════════════════════════════════════════════════════════════'));
  console.log(colors.green(`✓ Removal complete!\n`));
  
  console.log(colors.yellow('Summary:'));
  console.log(`  - ${stats.removed} files removed`);
  if (stats.skipped > 0) {
    console.log(`  - ${stats.skipped} files skipped (modified, use --force)`);
  }
  if (stats.notFound > 0) {
    console.log(`  - ${stats.notFound} files not found`);
  }
  console.log();

  if (modifiedFiles.length > 0) {
    console.log(colors.yellow('Modified files preserved:'));
    for (const file of modifiedFiles) {
      console.log(`  - ${file}`);
    }
    console.log(colors.dim('\nUse --force to remove modified files.\n'));
  }
}

/**
 * Reset - remove all installed content
 */
async function reset(targetDir, dryRun = false, force = false, skipConfirm = false, ides = DEFAULT_IDES) {
  const stats = { removed: 0, skipped: 0 };
  const filesToRemove = [];
  const modifiedFiles = [];
  const dirsToRemove = [];

  console.log(`${colors.blue('Resetting:')} ${targetDir}`);
  console.log(`${colors.blue('Target IDEs:')} ${ides.join(', ')}`);
  console.log();

  // 1. Remove .cursor/rules/ and legacy .cursorrules/ contents for Cursor
  if (ides.includes('cursor')) {
    const cursorRulesDir = path.join(targetDir, CURSOR_RULES_DIR);
    const legacyDir = path.join(targetDir, LEGACY_CURSORRULES_DIR);
    const dirsToScan = [];

    if (fs.existsSync(cursorRulesDir)) dirsToScan.push({ dir: cursorRulesDir, label: CURSOR_RULES_DIR });
    if (fs.existsSync(legacyDir)) dirsToScan.push({ dir: legacyDir, label: LEGACY_CURSORRULES_DIR });

    if (dirsToScan.length > 0) {
      for (const { dir, label } of dirsToScan) {
        console.log(colors.yellow(`► Scanning ${label}/ directory...`));

        // Check shared rules
        for (const rule of SHARED_RULES) {
          const destPath = path.join(dir, rule);
          const srcPath = path.join(TEMPLATES_DIR, '_shared', rule);

          if (!fs.existsSync(destPath)) continue;

          const isUnmodified = isOurFile(destPath, srcPath);

          if (!isUnmodified && !force) {
            console.log(`  ${colors.yellow('[modified]')} ${rule} (use --force to remove)`);
            modifiedFiles.push(`${rule} (${label}/)`);
            stats.skipped++;
          } else {
            console.log(`  ${colors.red('[remove]')} ${rule}${!isUnmodified ? ' (modified, --force)' : ''}`);
            filesToRemove.push({ path: destPath, name: `${rule} (${label}/)` });
          }

          // Check for -1 variant
          const altPath = path.join(dir, rule.replace('.mdc', '-1.mdc'));
          if (fs.existsSync(altPath)) {
            console.log(`  ${colors.red('[remove]')} ${rule.replace('.mdc', '-1.mdc')} (alternate file)`);
            filesToRemove.push({ path: altPath, name: rule.replace('.mdc', '-1.mdc') });
          }
        }

        // Check template-specific rules
        for (const [templateName, templateInfo] of Object.entries(TEMPLATES)) {
          for (const rule of templateInfo.rules) {
            const destName = `${templateName}-${rule}`;
            const destPath = path.join(dir, destName);
            const srcPath = getTemplateRulePath(templateName, rule);

            if (!fs.existsSync(destPath)) continue;

            const isUnmodified = isOurFile(destPath, srcPath);

            if (!isUnmodified && !force) {
              console.log(`  ${colors.yellow('[modified]')} ${destName} (use --force to remove)`);
              modifiedFiles.push(`${destName} (${label}/)`);
              stats.skipped++;
            } else {
              console.log(`  ${colors.red('[remove]')} ${destName}${!isUnmodified ? ' (modified, --force)' : ''}`);
              filesToRemove.push({ path: destPath, name: `${destName} (${label}/)` });
            }

            // Check for -1 variant
            const altName = destName.replace('.mdc', '-1.mdc');
            const altPath = path.join(dir, altName);
            if (fs.existsSync(altPath)) {
              console.log(`  ${colors.red('[remove]')} ${altName} (alternate file)`);
              filesToRemove.push({ path: altPath, name: altName });
            }
          }
        }

        // Check for legacy-cursorrules-notice.md
        const noticePath = path.join(dir, 'legacy-cursorrules-notice.md');
        if (fs.existsSync(noticePath)) {
          console.log(`  ${colors.red('[remove]')} legacy-cursorrules-notice.md`);
          filesToRemove.push({ path: noticePath, name: 'legacy-cursorrules-notice.md' });
        }

        // Check if we should remove the directory itself (only if it would be empty)
        const remainingFiles = fs.readdirSync(dir).filter(f => {
          const fullPath = path.join(dir, f);
          const willBeRemoved = filesToRemove.some(fr => fr.path === fullPath);
          return !willBeRemoved;
        });

        if (remainingFiles.length === 0 || force) {
          console.log(`  ${colors.red('[remove]')} ${label}/ directory`);
          dirsToRemove.push(dir);
          // If removing .cursor/rules/, also check if .cursor/ would be empty
          if (label === CURSOR_RULES_DIR) {
            const cursorDir = path.join(targetDir, '.cursor');
            dirsToRemove.push(cursorDir);
          }
        } else if (remainingFiles.length > 0) {
          console.log(colors.dim(`  ${label}/ will be kept (${remainingFiles.length} non-template file(s) remain)`));
        }

        console.log();
      }
    } else {
      console.log(colors.dim(`No ${CURSOR_RULES_DIR}/ or ${LEGACY_CURSORRULES_DIR}/ directory found.\n`));
    }
  }

  // 2. Remove CLAUDE.md for Claude
  if (ides.includes('claude')) {
    const claudePath = path.join(targetDir, 'CLAUDE.md');
    
    if (fs.existsSync(claudePath)) {
      console.log(colors.yellow('► Checking CLAUDE.md...'));
      
      // Check if it contains our signature content
      const content = fs.readFileSync(claudePath, 'utf8');
      const isOurs = content.includes('# CLAUDE.md - Development Guide') &&
                     (content.includes('.cursor/rules/') || content.includes('.cursorrules/'));
      
      if (!isOurs && !force) {
        console.log(`  ${colors.yellow('[modified]')} CLAUDE.md (doesn't match template, use --force)`);
        modifiedFiles.push('CLAUDE.md');
        stats.skipped++;
      } else {
        console.log(`  ${colors.red('[remove]')} CLAUDE.md${!isOurs ? ' (modified, --force)' : ''}`);
        filesToRemove.push({ path: claudePath, name: 'CLAUDE.md' });
      }
      console.log();
    }
  }

  // 3. Remove .github/copilot-instructions.md for Codex
  if (ides.includes('codex')) {
    const copilotPath = path.join(targetDir, '.github', 'copilot-instructions.md');
    
    if (fs.existsSync(copilotPath)) {
      console.log(colors.yellow('► Checking .github/copilot-instructions.md...'));
      
      // Check if it contains our signature content
      const content = fs.readFileSync(copilotPath, 'utf8');
      const isOurs = content.includes('# Copilot Instructions') && 
                     content.includes('Installed Templates:');
      
      if (!isOurs && !force) {
        console.log(`  ${colors.yellow('[modified]')} .github/copilot-instructions.md (doesn't match template, use --force)`);
        modifiedFiles.push('.github/copilot-instructions.md');
        stats.skipped++;
      } else {
        console.log(`  ${colors.red('[remove]')} .github/copilot-instructions.md${!isOurs ? ' (modified, --force)' : ''}`);
        filesToRemove.push({ path: copilotPath, name: '.github/copilot-instructions.md' });
      }
      console.log();
    }
  }

  if (filesToRemove.length === 0 && dirsToRemove.length === 0) {
    console.log(colors.yellow('Nothing to remove.\n'));
    return;
  }

  // Confirmation
  if (!dryRun && !skipConfirm) {
    const totalItems = filesToRemove.length + dirsToRemove.length;
    console.log(colors.yellow(`\nAbout to remove ${totalItems} item(s).`));
    const confirmed = await confirm(colors.red('Proceed with reset?'));
    if (!confirmed) {
      console.log(colors.dim('\nAborted.\n'));
      return;
    }
    console.log();
  }

  // Execute removal
  if (dryRun) {
    console.log(colors.yellow('DRY RUN - No files were removed.\n'));
  } else {
    // Remove files first
    for (const file of filesToRemove) {
      try {
        fs.unlinkSync(file.path);
        stats.removed++;
      } catch (err) {
        console.error(colors.red(`Failed to remove ${file.name}: ${err.message}`));
      }
    }
    
    // Then remove directories
    for (const dir of dirsToRemove) {
      try {
        // Check if directory is now empty
        const remaining = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
        if (remaining.length === 0) {
          fs.rmdirSync(dir);
          stats.removed++;
        } else if (force) {
          fs.rmSync(dir, { recursive: true });
          stats.removed++;
        }
      } catch (err) {
        console.error(colors.red(`Failed to remove directory: ${err.message}`));
      }
    }
  }

  // Summary
  console.log(colors.green('════════════════════════════════════════════════════════════'));
  console.log(colors.green(`✓ Reset complete!\n`));
  
  console.log(colors.yellow('Summary:'));
  console.log(`  - ${stats.removed} items removed`);
  if (stats.skipped > 0) {
    console.log(`  - ${stats.skipped} files skipped (modified, use --force)`);
  }
  console.log();

  if (modifiedFiles.length > 0) {
    console.log(colors.yellow('Modified files preserved:'));
    for (const file of modifiedFiles) {
      console.log(`  - ${file}`);
    }
    console.log(colors.dim('\nUse --force to remove modified files.\n'));
  }
}

export async function run(args) {
  const templates = [];
  const ides = [];
  let dryRun = false;
  let force = false;
  let skipConfirm = false;
  let removeMode = false;
  let resetMode = false;

  // Parse arguments
  for (const arg of args) {
    if (arg === '--list' || arg === '-l') {
      printBanner();
      printTemplates();
      process.exit(0);
    } else if (arg === '--help' || arg === '-h') {
      printBanner();
      printHelp();
      process.exit(0);
    } else if (arg === '--version' || arg === '-v') {
      console.log(`${PACKAGE_NAME} v${CURRENT_VERSION}`);
      console.log(`${colors.dim('Changelog:')} ${CHANGELOG_URL}`);
      process.exit(0);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      force = true;
    } else if (arg === '--yes' || arg === '-y') {
      skipConfirm = true;
    } else if (arg === '--remove') {
      removeMode = true;
    } else if (arg === '--reset') {
      resetMode = true;
    } else if (arg.startsWith('--ide=')) {
      const ide = arg.slice(6).toLowerCase();
      if (!SUPPORTED_IDES.includes(ide)) {
        console.error(colors.red(`Error: Unknown IDE '${ide}'`));
        console.error(colors.dim(`Supported: ${SUPPORTED_IDES.join(', ')}`));
        process.exit(1);
      }
      if (!ides.includes(ide)) {
        ides.push(ide);
      }
    } else if (arg.startsWith('-')) {
      console.error(colors.red(`Error: Unknown option '${arg}'`));
      printHelp();
      process.exit(1);
    } else {
      templates.push(arg);
    }
  }

  printBanner();

  // Check for updates (non-blocking, fails silently)
  await checkForUpdates();

  // Resolve template aliases to canonical names
  const resolvedTemplates = templates.map(resolveTemplateAlias);

  // Use default IDEs if none specified
  const targetIdes = ides.length > 0 ? ides : DEFAULT_IDES;

  // Handle reset mode
  if (resetMode) {
    if (removeMode) {
      console.error(colors.red('Error: Cannot use --remove and --reset together\n'));
      process.exit(1);
    }
    if (resolvedTemplates.length > 0) {
      console.error(colors.red('Error: --reset does not accept template arguments\n'));
      console.error(colors.dim('Use --remove <templates...> to remove specific templates.\n'));
      process.exit(1);
    }

    if (dryRun) {
      console.log(colors.yellow('DRY RUN - No changes will be made\n'));
    }
    if (force) {
      console.log(colors.yellow('FORCE MODE - Modified files will be removed\n'));
    }

    await reset(process.cwd(), dryRun, force, skipConfirm, targetIdes);
    return;
  }

  // Handle remove mode
  if (removeMode) {
    if (resolvedTemplates.length === 0) {
      console.error(colors.red('Error: No templates specified for removal\n'));
      console.error(colors.dim('Usage: npx cursor-templates --remove <templates...>\n'));
      printTemplates();
      process.exit(1);
    }

    for (const template of resolvedTemplates) {
      if (!TEMPLATES[template]) {
        console.error(colors.red(`Error: Unknown template '${template}'\n`));
        printTemplates();
        process.exit(1);
      }
    }

    if (dryRun) {
      console.log(colors.yellow('DRY RUN - No changes will be made\n'));
    }
    if (force) {
      console.log(colors.yellow('FORCE MODE - Modified files will be removed\n'));
    }

    await remove(process.cwd(), resolvedTemplates, dryRun, force, skipConfirm, targetIdes);
    return;
  }

  // Install mode (default)
  if (resolvedTemplates.length === 0) {
    console.error(colors.red('Error: No templates specified\n'));
    printHelp();
    process.exit(1);
  }

  for (const template of resolvedTemplates) {
    if (!TEMPLATES[template]) {
      console.error(colors.red(`Error: Unknown template '${template}'\n`));
      printTemplates();
      process.exit(1);
    }
  }

  if (dryRun) {
    console.log(colors.yellow('DRY RUN - No changes will be made\n'));
  }

  if (force) {
    console.log(colors.yellow('FORCE MODE - Existing files will be overwritten\n'));
  }

  // Install to current directory
  await install(process.cwd(), resolvedTemplates, dryRun, force, targetIdes, skipConfirm);
}

// Export internals for testing
export const _internals = {
  PACKAGE_NAME,
  CURRENT_VERSION,
  REPO_URL,
  CHANGELOG_URL,
  CURSOR_RULES_DIR,
  LEGACY_CURSORRULES_DIR,
  CATEGORIES,
  TEMPLATES,
  TEMPLATE_ALIASES,
  SHARED_RULES,
  SUPPORTED_IDES,
  DEFAULT_IDES,
  compareVersions,
  checkForUpdates,
  resolveTemplateAlias,
  getTemplateRulePath,
  filesMatch,
  parseMarkdownSections,
  generateSectionSignature,
  findMissingSections,
  mergeClaudeContent,
  getAlternateFilename,
  copyFile,
  generateClaudeMdContent,
  generateCopilotInstructionsContent,
  isOurFile,
  install,
  remove,
  reset,
};
