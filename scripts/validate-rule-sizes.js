#!/usr/bin/env node
/**
 * Validates that all .mdc rule files in templates/ are under the line limit.
 * Exits with code 1 if any file exceeds MAX_LINES.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const MAX_LINES = 100;

const failures = [];

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.mdc')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      if (lines > MAX_LINES) {
        const relPath = path.relative(TEMPLATES_DIR, fullPath);
        failures.push({ file: relPath, lines });
      }
    }
  }
}

walkDir(TEMPLATES_DIR);

if (failures.length > 0) {
  console.error(`\x1b[31m${failures.length} rule file(s) exceed ${MAX_LINES} lines:\x1b[0m`);
  for (const f of failures) {
    console.error(`  ${f.file}: ${f.lines} lines`);
  }
  process.exit(1);
} else {
  console.log(`\x1b[32mAll rule files are within ${MAX_LINES}-line limit.\x1b[0m`);
}
