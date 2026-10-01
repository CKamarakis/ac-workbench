// One-command machine setup from the registry (design D13; spec: tool-setup). Zero dependencies.
//   node setup.mjs plan  [--json]          -> what is present / missing / skipped, plus warnings
//   node setup.mjs apply [--json] [name..] -> install the missing machine tools (all, or only the named ones)
//   --registry <file.json>                  -> use another registry (tests, evals); default: ../data/toolkit.json
// The skill shows the plan and asks for confirmation before calling `apply`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { locate, pathWith } from './locate.mjs';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACTIVE = ['adopted', 'trial'];

export function loadRegistry(file = path.join(KIT, 'data', 'toolkit.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Default runner: a shell command with a PATH that includes the tools' real folders.
// Windows Git\cmd comes first so `claude plugin install` can clone with submodules (evals/trials/plugin-cli.md).
export function defaultDeps() {
  const tools = ['git', 'node', 'npm', 'claude', 'gh', 'winget', 'openspec', 'jq', 'gitleaks'];
  const located = Object.fromEntries(tools.map(t => [t, locate(t, { preferKnown: t === 'git' })]));
  const env = { ...process.env, PATH: pathWith(located) };
  return {
    platform: process.platform,
    userSettings: () => readJson(path.join(os.homedir(), '.claude', 'settings.json')),
    run: (command, { timeout = 300000 } = {}) => {
      const r = spawnSync(command, { shell: true, encoding: 'utf8', env, timeout });
      return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: (r.stderr ?? '') + (r.error ? String(r.error) : '') };
    },
  };
}

function isPresent(entry, deps) {
  const r = deps.run(entry.check, { timeout: 60000 });
  if (r.status !== 0) return { present: false, detail: firstLine(r.stderr) || `check exited ${r.status}` };
  if (entry.check_match && !new RegExp(entry.check_match, 'm').test(r.stdout)) {
    return { present: false, detail: `check output did not match /${entry.check_match}/` };
  }
  return { present: true, detail: entry.check_match ? `found ${entry.check_match}` : firstLine(r.stdout) };
}

const firstLine = s => String(s).trim().split(/\r?\n/)[0]?.slice(0, 160) ?? '';

/**
 * Plan: classify every registry entry.
 *   present / missing   adopted|trial entries with scope machine
 *   skipped             dropped|later entries, and project-scope entries (enabled per project by the starter)
 *   warnings            project-scope plugins found enabled in the user-level settings (spec: never global)
 */
export function plan(registry, deps = defaultDeps()) {
  const out = { present: [], missing: [], skipped: [], warnings: [] };
  for (const e of registry.tools ?? []) {
    if (!ACTIVE.includes(e.status)) { out.skipped.push({ name: e.name, reason: `status ${e.status}` }); continue; }
    if (e.scope !== 'machine') { out.skipped.push({ name: e.name, reason: 'project scope (enabled per project by /kit:start)' }); continue; }
    const p = isPresent(e, deps);
    const item = { name: e.name, detail: p.detail, install: e.install?.[deps.platform] ?? null };
    (p.present ? out.present : out.missing).push(item);
  }
  const enabled = deps.userSettings()?.enabledPlugins ?? {};
  for (const e of registry.tools ?? []) {
    if (e.scope !== 'project') continue;
    for (const [id, on] of Object.entries(enabled)) {
      if (on && id.split('@')[0] === e.name) {
        out.warnings.push(`${id} is enabled in ~/.claude/settings.json (user scope). Kit rule: project-scope tools are enabled per project only. Move it: remove it there and run /kit:start in the projects that need it.`);
      }
    }
  }
  return out;
}

/**
 * Apply: install each missing machine tool (or only `only`), one at a time; a failure never stops the rest.
 * Re-plans first, so anything already present is never reinstalled (idempotent).
 */
export function apply(registry, { only = [], deps = defaultDeps() } = {}) {
  const p = plan(registry, deps);
  const todo = p.missing.filter(m => !only.length || only.includes(m.name));
  const result = { installed: [], failed: [], present: p.present.map(x => x.name), skipped: p.skipped.map(x => x.name), warnings: p.warnings };
  for (const m of todo) {
    if (!m.install) { result.failed.push({ name: m.name, error: `no install command for ${deps.platform}`, hint: 'add install.' + deps.platform + ' to the registry entry' }); continue; }
    const r = deps.run(m.install);
    const entry = registry.tools.find(t => t.name === m.name);
    const after = r.status === 0 ? isPresent(entry, deps) : { present: false };
    if (r.status === 0 && after.present) result.installed.push(m.name);
    else result.failed.push({
      name: m.name,
      error: firstLine(r.stderr) || firstLine(r.stdout) || (r.status === 0 ? 'installed, but the check still fails (open a new terminal so PATH refreshes, then re-run)' : `exit ${r.status}`),
      hint: `run it yourself: ${m.install}`,
    });
  }
  return result;
}

export function formatPlan(p) {
  const lines = [];
  for (const m of p.missing) lines.push(`  MISSING  ${m.name.padEnd(24)} -> ${m.install ?? '(no install command)'}`);
  for (const m of p.present) lines.push(`  ok       ${m.name.padEnd(24)} ${m.detail}`);
  for (const m of p.skipped) lines.push(`  skip     ${m.name.padEnd(24)} ${m.reason}`);
  for (const w of p.warnings) lines.push(`  WARNING  ${w}`);
  lines.push(p.missing.length ? `\n${p.missing.length} to install.` : '\nNothing to do: every machine tool is present.');
  return lines.join('\n');
}

export function formatResult(r) {
  const lines = [];
  for (const n of r.installed) lines.push(`  installed  ${n}`);
  for (const f of r.failed) lines.push(`  FAILED     ${f.name}: ${f.error}\n             fix: ${f.hint}`);
  for (const n of r.present) lines.push(`  present    ${n}`);
  for (const w of r.warnings) lines.push(`  WARNING    ${w}`);
  lines.push(!r.installed.length && !r.failed.length ? '\nNothing to do: every machine tool is present.' : `\n${r.installed.length} installed, ${r.failed.length} failed.`);
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  const json = rest.includes('--json');
  const ri = rest.indexOf('--registry');
  const registryFile = ri >= 0 ? rest[ri + 1] : undefined;
  const names = rest.filter((a, i) => !a.startsWith('--') && !(ri >= 0 && i === ri + 1));
  const registry = loadRegistry(registryFile);
  if (cmd === 'plan') {
    const p = plan(registry);
    console.log(json ? JSON.stringify(p, null, 2) : formatPlan(p));
  } else if (cmd === 'apply') {
    const r = apply(registry, { only: names });
    console.log(json ? JSON.stringify(r, null, 2) : formatResult(r));
    process.exit(r.failed.length ? 1 : 0);
  } else {
    console.error('usage: node setup.mjs plan|apply [--json] [name...]');
    process.exit(2);
  }
}
