// /kit:start apply step (design D4, D14; spec: project-starter). Re-plans, then applies only what is
// allowed: new files, confirmed changes, init commands, per-project tool installs, the stamp, and the
// machine's project list. Never deletes a file; never writes user-level Claude settings. Zero dependencies.
// Usage: node start-apply.mjs --dir <project> [--type <t>] [--opt-in a,b] [--accept all|id,id] [--json] [--home <dir>] [--registry <file.json>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planProject, parseArgs, configWithContext, kitVersion } from './start-plan.mjs';
import { loadRegistry, defaultDeps } from './setup.mjs';

const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const first = s => String(s ?? '').trim().split(/\r?\n/)[0]?.slice(0, 200) ?? '';

function writeFile(dir, rel, content) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

/** Fallback when `claude plugin install` fails: merge only the kit's keys into the project's settings. */
export function enablePluginInSettings(dir, pluginId, marketplace = null) {
  const p = path.join(dir, '.claude', 'settings.json');
  let s = {};
  const cur = read(p);
  if (cur != null) {
    try { s = JSON.parse(cur); } catch { return { ok: false, error: '.claude/settings.json is not valid JSON; not touched' }; }
  }
  s.enabledPlugins = { ...(s.enabledPlugins ?? {}), [pluginId]: true };
  if (marketplace) s.extraKnownMarketplaces = { ...(s.extraKnownMarketplaces ?? {}), ...marketplace };
  writeFile(dir, '.claude/settings.json', JSON.stringify(s, null, 2) + '\n');
  return { ok: true };
}

/** Add or update this project in the machine's project list (design D3). */
export function registerProject({ home = os.homedir(), name, dir, today }) {
  const file = path.join(home, '.claude', 'kit', 'projects.json');
  let list = { projects: [] };
  try { list = JSON.parse(read(file)) ?? list; } catch { /* new list */ }
  list.projects = Array.isArray(list.projects) ? list.projects : [];
  const key = path.resolve(dir).toLowerCase();
  const existing = list.projects.find(p => path.resolve(p.path).toLowerCase() === key);
  if (existing) existing.name = name;
  else list.projects.push({ name, path: path.resolve(dir), links: {}, added: today });
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + '\n');
  return file;
}

/**
 * accept: 'all' or a list of action ids whose `differs` change may be applied.
 * Returns { written, skipped, ran, tools: { installed, failed, pending, present, fallback }, projectsFile, plan }.
 */
export function applyProject(opts) {
  const { accept = [], home = opts.home ?? os.homedir(), deps = defaultDeps(), registry = loadRegistry(), version = kitVersion(), today = new Date().toISOString().slice(0, 10) } = opts;
  const plan = planProject({ ...opts, registry, version, today, deps });
  const dir = plan.dir;
  const ok = id => accept === 'all' || (Array.isArray(accept) && (accept.includes('all') || accept.includes(id)));
  const out = { written: [], skipped: [], ran: [], errors: [], tools: { installed: [], failed: [], pending: [], present: [], fallback: [] }, plan };
  fs.mkdirSync(dir, { recursive: true });

  const run = (command, why) => {
    const r = deps.run(command, { cwd: dir });
    if (r.status === 0) out.ran.push(command);
    else out.errors.push(`${why}: ${command} failed: ${first(r.stderr) || first(r.stdout) || `exit ${r.status}`}`);
    return r.status === 0;
  };

  const stampAction = plan.actions.find(a => a.id === '.claude/kit.json');
  for (const a of plan.actions) {
    if (a === stampAction) continue; // written last, after tools
    if (a.kind === 'run' && a.action === 'run') {
      if (!run(a.command, a.id)) continue;
      if (a.id === 'openspec') {
        const cfgPath = path.join(dir, 'openspec', 'config.yaml');
        const cfg = (read(cfgPath) ?? 'schema: spec-driven\n').replace(/\r\n/g, '\n');
        if (!cfg.includes('docs/project-context.md') && !/^context:/m.test(cfg)) { fs.writeFileSync(cfgPath, configWithContext(cfg)); out.written.push('openspec/config.yaml'); }
      }
      continue;
    }
    if (a.kind !== 'file') continue;
    if (a.action === 'create') { writeFile(dir, a.id, a.content); out.written.push(a.id); }
    else if (a.action === 'differs') { if (ok(a.id)) { writeFile(dir, a.id, a.content); out.written.push(a.id); } else out.skipped.push({ id: a.id, reason: 'not confirmed' }); }
    else if (a.action === 'conflict') out.skipped.push({ id: a.id, reason: a.reason });
    else if (a.action === 'after-init' && !out.written.includes('openspec/config.yaml')) {
      const cfgPath = path.join(dir, 'openspec', 'config.yaml');
      const cfg = read(cfgPath);
      if (cfg != null && !cfg.includes('docs/project-context.md') && !/^context:/m.test(cfg)) { fs.writeFileSync(cfgPath, configWithContext(cfg.replace(/\r\n/g, '\n'))); out.written.push('openspec/config.yaml'); }
    }
  }

  for (const t of plan.tools) {
    if (t.action === 'present') { out.tools.present.push(t.name); continue; }
    if (t.action === 'pending') { out.tools.pending.push({ name: t.name, command: t.command, note: t.note }); continue; }
    const entry = registry.tools.find(e => e.name === t.name);
    const r = deps.run(t.command, { cwd: dir });
    const check = deps.run(entry.check, { cwd: dir, timeout: 60000 });
    const present = check.status === 0 && (!entry.check_match || new RegExp(entry.check_match, 'm').test(check.stdout));
    if (r.status === 0 && present) { out.tools.installed.push(t.name); continue; }
    if (r.status === 0 && entry.install_note) { out.tools.pending.push({ name: t.name, command: null, note: entry.install_note }); continue; }
    if (t.kind === 'plugin') {
      const f = enablePluginInSettings(dir, t.plugin);
      if (f.ok) { out.tools.fallback.push({ name: t.name, error: first(r.stderr) || first(r.stdout) || 'check failed after install' }); continue; }
    }
    out.tools.failed.push({ name: t.name, error: r.status !== 0 ? first(r.stderr) || first(r.stdout) || `exit ${r.status}` : 'installed, but its check still fails', fix: `run it yourself in the project: ${t.command}` });
  }

  // Stamp last, so it reflects the final state of this run.
  if (stampAction.action !== 'same') {
    if (stampAction.action === 'create' || ok('.claude/kit.json')) { writeFile(dir, '.claude/kit.json', stampAction.content); out.written.push('.claude/kit.json'); }
    else out.skipped.push({ id: '.claude/kit.json', reason: 'not confirmed' });
  }
  out.projectsFile = registerProject({ home, name: plan.project, dir, today });
  return out;
}

export function formatResult(r) {
  const L = [];
  for (const w of r.written) L.push(`  wrote      ${w}`);
  for (const c of r.ran) L.push(`  ran        ${c}`);
  for (const s of r.skipped) L.push(`  skipped    ${s.id}: ${s.reason}`);
  for (const e of r.errors) L.push(`  ERROR      ${e}`);
  for (const n of r.tools.installed) L.push(`  installed  ${n}`);
  for (const n of r.tools.present) L.push(`  present    ${n}`);
  for (const f of r.tools.fallback) L.push(`  enabled    ${f.name} (written to .claude/settings.json; the CLI install failed: ${f.error})`);
  for (const f of r.tools.failed) L.push(`  FAILED     ${f.name}: ${f.error}\n             fix: ${f.fix}`);
  for (const p of r.tools.pending) L.push(`  PENDING    ${p.name}: needs you${p.command ? `\n             run: ${p.command}` : ''}${p.note ? `\n             note: ${p.note}` : ''}`);
  L.push(`  listed in  ${r.projectsFile}`);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const o = parseArgs(process.argv.slice(2));
  const r = applyProject({ ...o, accept: o.accept.length ? o.accept : [] });
  console.log(o.json ? JSON.stringify({ ...r, plan: undefined }, null, 2) : formatResult(r));
  process.exit(r.errors.length || r.tools.failed.length ? 1 : 0);
}
