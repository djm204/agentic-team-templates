#!/usr/bin/env node
/**
 * Dogfood script — installs this project's own templates into itself.
 *
 * Uses bin/cli.js so the project eats its own cooking without creating
 * a circular npm dependency. Cursor rules get --force (always latest),
 * CLAUDE.md gets merge mode (preserves project-specific content).
 *
 * Usage:
 *   node scripts/dogfood.js              # full run
 *   node scripts/dogfood.js --hook       # pre-commit mode (re-stages files)
 *   node scripts/dogfood.js --dry-run    # preview only
 */
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'cli.js');

// Templates this project uses for its own development
const TEMPLATES = ['js', 'cli-tools', 'testing'];

// Paths that trigger a dogfood re-run (used in --hook mode)
const TRIGGER_PATHS = ['templates/', 'src/index.js'];

const args = process.argv.slice(2);
const hookMode = args.includes('--hook');
const dryRun = args.includes('--dry-run');

function run(cmdArgs, label) {
  const fullArgs = [CLI, ...cmdArgs];
  console.log(`\n\x1b[36m[dogfood] ${label}\x1b[0m`);
  if (dryRun) fullArgs.push('--dry-run');

  try {
    execFileSync('node', fullArgs, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    console.error(`\x1b[31m[dogfood] ${label} failed\x1b[0m`);
    process.exit(1);
  }
}

function hasStagedChanges() {
  try {
    const diff = execFileSync(
      'git', ['diff', '--cached', '--name-only'],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    return diff.split('\n').some(
      f => TRIGGER_PATHS.some(p => f.startsWith(p))
    );
  } catch {
    return false;
  }
}

function restageFiles() {
  // Re-stage cursor rules and CLAUDE.md that the CLI may have updated
  const paths = ['.cursor/rules/', 'CLAUDE.md'];
  for (const p of paths) {
    const full = path.join(ROOT, p);
    if (existsSync(full)) {
      try {
        execFileSync('git', ['add', p], { cwd: ROOT, stdio: 'pipe' });
      } catch { /* ignore */ }
    }
  }
}

// In hook mode, skip if no relevant files are staged
if (hookMode && !hasStagedChanges()) {
  process.exit(0);
}

// 1. Cursor rules: --force to always sync to latest templates
run([...TEMPLATES, '--force', '--ide=cursor', '-y'], 'cursor rules (force)');

// 2. CLAUDE.md: merge mode to preserve project-specific content
run([...TEMPLATES, '--ide=claude', '-y'], 'CLAUDE.md (merge)');

// In hook mode, re-stage updated files
if (hookMode) {
  restageFiles();
  console.log('\x1b[36m[dogfood] re-staged updated files\x1b[0m');
}

console.log('\n\x1b[32m[dogfood] done\x1b[0m');
