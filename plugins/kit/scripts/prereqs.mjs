// Prerequisites for /kit:start (spec: project-starter "Machine tools are checked first",
// "Missing prerequisites are reported, not guessed"). Zero dependencies.
// Usage: node prereqs.mjs [--json]   -> exit 0 ready, 1 blocked (required tool missing), 3 machine tools missing
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { locate } from './locate.mjs';
import { plan as setupPlan, loadRegistry } from './setup.mjs';

// Tools the starter itself runs. Missing one blocks the run before anything is written.
export const REQUIRED = ['git', 'openspec'];

const HINTS = {
  git: 'winget install --id Git.Git -e (or run /kit:setup)',
  openspec: 'npm install -g @fission-ai/openspec (or run /kit:setup)',
};

/**
 * Returns {
 *   ready: boolean,                      // nothing blocks the starter
 *   blocked: [{ name, hint }],           // required tools missing -> stop before any write
 *   machineMissing: [{ name, install }], // other machine tools missing -> offer /kit:setup
 *   warnings: [string],
 *   located: { tool: path|null }
 * }
 */
export function checkPrereqs({ registry = loadRegistry(), locateFn = locate, setupDeps } = {}) {
  const located = Object.fromEntries(REQUIRED.map(t => [t, locateFn(t, { preferKnown: t === 'git' })?.path ?? null]));
  const entry = name => (registry.tools ?? []).find(t => t.name === name);
  const blocked = REQUIRED.filter(t => !located[t]).map(t => ({
    name: t,
    hint: entry(t)?.install?.[process.platform] ? `${entry(t).install[process.platform]} (or run /kit:setup)` : HINTS[t],
  }));
  const sp = setupPlan(registry, setupDeps);
  const machineMissing = sp.missing.filter(m => !REQUIRED.includes(m.name)).map(m => ({ name: m.name, install: m.install }));
  return { ready: blocked.length === 0, blocked, machineMissing, warnings: sp.warnings, located };
}

export function formatPrereqs(r) {
  const lines = [];
  for (const b of r.blocked) lines.push(`  BLOCKED  ${b.name} is missing. Install: ${b.hint}`);
  for (const m of r.machineMissing) lines.push(`  missing  ${m.name} (machine tool) -> /kit:setup can install it: ${m.install ?? '(no install command)'}`);
  for (const w of r.warnings) lines.push(`  WARNING  ${w}`);
  if (!r.blocked.length && !r.machineMissing.length) lines.push('  ok       all required and machine tools are present');
  lines.push(r.blocked.length ? '\nStop: install the blocked tools first. Nothing was changed.' : r.machineMissing.length ? '\nReady, but some machine tools are missing (offer /kit:setup).' : '\nReady.');
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = checkPrereqs();
  console.log(process.argv.includes('--json') ? JSON.stringify(r, null, 2) : formatPrereqs(r));
  process.exit(r.blocked.length ? 1 : r.machineMissing.length ? 3 : 0);
}
