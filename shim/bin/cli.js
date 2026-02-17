#!/usr/bin/env node

console.warn(
  '\x1b[33m⚠  agentic-team-templates has been renamed to @djm204/agent-skills.\x1b[0m'
);
console.warn(
  '\x1b[33m   Use: npx @djm204/agent-skills\x1b[0m\n'
);

const { run } = await import('@djm204/agent-skills/src/index.js');
run(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
