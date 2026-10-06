// /kit:start planner (design D4, D5, D14; spec: project-starter). Computes every file and tool action
// for a project WITHOUT writing anything. Zero dependencies.
// Usage: node start-plan.mjs --dir <project> [--type <t>] [--opt-in a,b] [--json] [--registry <file.json>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { laneMap, routingBlock, BLOCK_START, BLOCK_END } from './lanes.mjs';
import { loadRegistry, defaultDeps } from './setup.mjs';
import { DEFAULT_DIR, SUBDIRS } from './knowledge.mjs';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACTIVE = ['adopted', 'trial'];
export const GI_START = /^# kit:start.*$/m;
export const GI_END = /^# kit:end.*$/m;

const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const norm = s => (s == null ? s : s.replace(/\r\n/g, '\n'));
export const kitVersion = () => JSON.parse(fs.readFileSync(path.join(KIT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
const template = name => fs.readFileSync(path.join(KIT, 'templates', name), 'utf8').replace(/\r\n/g, '\n');
const fill = (t, vars) => t.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));

// ---------- managed blocks (D5) ----------

/** Replace or append a marker-delimited block. start/end: string (literal line) or RegExp (line match). */
export function managedBlock(text, start, end, block) {
  const find = (m, from = 0) => {
    if (typeof m === 'string') { const i = text.indexOf(m, from); return i < 0 ? null : { i, len: m.length }; }
    const re = new RegExp(m.source, m.flags.includes('g') ? m.flags : m.flags + 'g');
    re.lastIndex = from;
    const r = re.exec(text);
    return r ? { i: r.index, len: r[0].length } : null;
  };
  const s = find(start), e = s ? find(end, s.i + s.len) : find(end);
  if (!s && !e) {
    const sep = text.length === 0 ? '' : text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
    return { action: 'append', result: text + sep + block + '\n' };
  }
  if (!s || !e) return { action: 'conflict', reason: `damaged kit block: ${s ? 'end' : 'start'} marker missing` };
  const current = text.slice(s.i, e.i + e.len);
  if (current === block) return { action: 'same', result: text };
  return { action: 'replace', result: text.slice(0, s.i) + block + text.slice(e.i + e.len) };
}

// ---------- small line diff (LCS) ----------

export function lineDiff(a, b) {
  const x = norm(a ?? '').split('\n'), y = norm(b ?? '').split('\n');
  if (x.length * y.length > 400000) return `--- current (${x.length} lines)\n+++ proposed (${y.length} lines)\n(too large to diff)`;
  const L = Array.from({ length: x.length + 1 }, () => new Uint32Array(y.length + 1));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { out.push('  ' + x[i]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) out.push('- ' + x[i++]);
    else out.push('+ ' + y[j++]);
  }
  while (i < x.length) out.push('- ' + x[i++]);
  while (j < y.length) out.push('+ ' + y[j++]);
  // keep changed lines with 2 lines of context
  const keep = new Set();
  out.forEach((l, k) => { if (!l.startsWith('  ')) for (let d = -2; d <= 2; d++) keep.add(k + d); });
  const lines = [];
  let last = -2;
  out.forEach((l, k) => { if (keep.has(k)) { if (k > last + 1 && lines.length) lines.push('  ...'); lines.push(l); last = k; } });
  return lines.join('\n');
}

// ---------- tool selection by tier (spec: "Tools are applied by tier") ----------

export function projectTypes(registry) {
  return [...new Set((registry.tools ?? []).map(t => t.tier).filter(t => t?.startsWith('project-type:')).map(t => t.slice(13)))].sort();
}

export function selectTools(registry, { type = null, optIn = [] } = {}) {
  const chosen = [], offered = [];
  for (const t of registry.tools ?? []) {
    if (t.scope !== 'project' || !ACTIVE.includes(t.status)) continue;
    if (t.tier === 'global') chosen.push({ entry: t, why: 'global tier: every kit project' });
    else if (t.tier === 'project') {
      offered.push(t.name);
      if (optIn.includes(t.name)) chosen.push({ entry: t, why: 'project tier: you opted in' });
    } else if (type && t.tier === `project-type:${type}`) chosen.push({ entry: t, why: `project type ${type}` });
  }
  return { chosen, offered };
}

function toolAction(entry, dir, deps) {
  const base = { name: entry.name, tier: entry.tier, status: entry.status };
  const check = deps.run(entry.check, { cwd: dir, timeout: 60000 });
  const present = check.status === 0 && (!entry.check_match || new RegExp(entry.check_match, 'm').test(check.stdout));
  if (present) return { ...base, action: 'present' };
  // Installed but waiting on the user (e.g. OAuth not done): the check runs, its match fails. Don't reinstall.
  if (check.status === 0 && entry.check_match && entry.install_note) return { ...base, action: 'pending', command: null, note: entry.install_note };
  const command = entry.plugin ? `claude plugin install ${entry.plugin} --scope project --json` : entry.install?.[deps.platform] ?? null;
  if (entry.interactive) return { ...base, action: 'pending', command, note: entry.install_note ?? 'needs you to complete it' };
  if (!command) return { ...base, action: 'pending', command: null, note: `no install command for ${deps.platform}` };
  return { ...base, action: 'install', kind: entry.plugin ? 'plugin' : 'command', plugin: entry.plugin ?? null, command, note: entry.install_note ?? null };
}

// ---------- the plan ----------

/**
 * plan = { project, dir, type, kitVersion, actions: [...], tools: [...], offered: [...], stamp, changes, conflicts }
 * action  (files/commands): create | same | differs | conflict | keep | run | after-init
 * tool    (per project):    present | install | pending
 */
export function planProject({ dir, type = null, optIn = [], registry = loadRegistry(), version = kitVersion(), today = new Date().toISOString().slice(0, 10), deps = defaultDeps() }) {
  const abs = path.resolve(dir);
  const project = path.basename(abs);
  const actions = [];
  const stampCur = (() => { try { return JSON.parse(read(path.join(abs, '.claude', 'kit.json'))); } catch { return null; } })();
  const knowledgeDir = (typeof stampCur?.knowledge_dir === 'string' && stampCur.knowledge_dir.trim()) ? stampCur.knowledge_dir.trim().replace(/\\/g, '/').replace(/\/+$/, '') : DEFAULT_DIR;
  const file = (rel, proposed, { owned = true } = {}) => {
    const cur = norm(read(path.join(abs, rel)));
    if (cur == null) return actions.push({ id: rel, kind: 'file', action: 'create', content: proposed });
    if (!owned) return actions.push({ id: rel, kind: 'file', action: 'keep', reason: 'exists; yours, never edited by the kit' });
    return null; // caller handles managed files
  };

  // git
  actions.push(fs.existsSync(path.join(abs, '.git')) ? { id: 'git', kind: 'run', action: 'same' } : { id: 'git', kind: 'run', action: 'run', command: 'git init' });

  // .gitignore (managed block)
  const gi = template('gitignore-block.txt').trimEnd();
  const giCur = norm(read(path.join(abs, '.gitignore')));
  if (giCur == null) actions.push({ id: '.gitignore', kind: 'file', action: 'create', content: gi + '\n' });
  else {
    const m = managedBlock(giCur, GI_START, GI_END, gi);
    actions.push(m.action === 'same' ? { id: '.gitignore', kind: 'file', action: 'same' }
      : m.action === 'conflict' ? { id: '.gitignore', kind: 'file', action: 'conflict', reason: m.reason }
      : { id: '.gitignore', kind: 'file', action: 'differs', content: m.result, diff: lineDiff(giCur, m.result) });
  }

  // CLAUDE.md (managed routing block)
  const block = routingBlock(laneMap(registry), { kitVersion: version, knowledgeDir });
  const cmCur = norm(read(path.join(abs, 'CLAUDE.md')));
  if (cmCur == null) actions.push({ id: 'CLAUDE.md', kind: 'file', action: 'create', content: fill(template('CLAUDE.md'), { project, routing: block }) });
  else {
    const m = managedBlock(cmCur, BLOCK_START, BLOCK_END, block);
    actions.push(m.action === 'same' ? { id: 'CLAUDE.md', kind: 'file', action: 'same' }
      : m.action === 'conflict' ? { id: 'CLAUDE.md', kind: 'file', action: 'conflict', reason: m.reason }
      : { id: 'CLAUDE.md', kind: 'file', action: 'differs', content: m.result, diff: lineDiff(cmCur, m.result) });
  }

  // project context doc: created once, then the user's
  file('docs/project-context.md', fill(template('project-context.md'), { project, date: today }), { owned: false });

  // knowledge folder: create only missing subfolders (a .gitkeep keeps them in git); never touch what's there
  for (const sub of SUBDIRS) {
    const rel = `${knowledgeDir}/${sub}`;
    actions.push(fs.existsSync(path.join(abs, rel)) ? { id: `${rel}/`, kind: 'file', action: 'same' } : { id: `${rel}/.gitkeep`, kind: 'file', action: 'create', content: '' });
  }

  // OpenSpec + config pointing to the context doc
  const hasOpenspec = fs.existsSync(path.join(abs, 'openspec'));
  actions.push(hasOpenspec ? { id: 'openspec', kind: 'run', action: 'same' } : { id: 'openspec', kind: 'run', action: 'run', command: 'openspec init --tools claude' });
  const cfg = norm(read(path.join(abs, 'openspec', 'config.yaml')));
  if (!hasOpenspec || cfg == null) actions.push({ id: 'openspec/config.yaml', kind: 'file', action: 'after-init', reason: 'point context at docs/project-context.md after openspec init' });
  else actions.push(configAction(cfg));

  // tools by tier
  const { chosen, offered } = selectTools(registry, { type, optIn });
  const tools = chosen.map(({ entry, why }) => ({ ...toolAction(entry, abs, deps), why }));

  // stamp
  const stamp = {
    kit_version: version,
    setup_date: stampCur?.setup_date ?? today,
    knowledge_dir: knowledgeDir,
    project_type: type,
    opted_in: [...optIn].sort(),
    tools: tools.map(t => t.name).sort(),
  };
  const stampJson = JSON.stringify(stamp, null, 2) + '\n';
  const stampAction = !stampCur ? 'create' : JSON.stringify({ ...stampCur }) === JSON.stringify(stamp) ? 'same' : 'differs';
  actions.push({ id: '.claude/kit.json', kind: 'file', action: stampAction, content: stampJson, ...(stampAction === 'differs' ? { diff: lineDiff(JSON.stringify(stampCur, null, 2), stampJson.trimEnd()) } : {}) });

  const changes = actions.filter(a => !['same', 'keep'].includes(a.action)).length + tools.filter(t => t.action === 'install').length;
  const conflicts = actions.filter(a => a.action === 'conflict').length;
  return { project, dir: abs, knowledgeDir, type, optIn: [...optIn].sort(), kitVersion: version, actions, tools, offered, types: projectTypes(registry), changes, conflicts };
}

export const CONTEXT_LINE = 'Project context, decisions and open ideas: docs/project-context.md. Read it before any proposal.';

export function configAction(cfg) {
  if (cfg.includes('docs/project-context.md')) return { id: 'openspec/config.yaml', kind: 'file', action: 'same' };
  if (/^context:/m.test(cfg)) return { id: 'openspec/config.yaml', kind: 'file', action: 'conflict', reason: 'config already has a context: entry; add a line pointing to docs/project-context.md yourself' };
  const result = configWithContext(cfg);
  return { id: 'openspec/config.yaml', kind: 'file', action: 'differs', content: result, diff: lineDiff(cfg, result) };
}

export const configWithContext = cfg => cfg.replace(/\s*$/, '\n') + `\ncontext: |\n  ${CONTEXT_LINE}\n`;

export function formatPlan(p) {
  const lines = [`Project: ${p.project}  (${p.dir})`, `Type: ${p.type ?? '(none)'}   kit ${p.kitVersion}`, ''];
  for (const a of p.actions) {
    const tag = { create: 'CREATE', same: 'same', differs: 'CHANGE', conflict: 'CONFLICT', keep: 'keep', run: 'RUN', 'after-init': 'AFTER' }[a.action] ?? a.action;
    lines.push(`  ${tag.padEnd(8)} ${a.id}${a.command ? `  -> ${a.command}` : ''}${a.reason ? `  (${a.reason})` : ''}`);
    if (a.diff) lines.push(a.diff.split('\n').map(l => '           ' + l).join('\n'));
  }
  if (p.tools.length) lines.push('', 'Tools for this project:');
  for (const t of p.tools) {
    const tag = { present: 'ok', install: 'INSTALL', pending: 'YOU' }[t.action];
    lines.push(`  ${tag.padEnd(8)} ${t.name.padEnd(16)} ${t.why}${t.command && t.action !== 'present' ? `\n           ${t.command}` : ''}${t.note && t.action !== 'present' ? `\n           note: ${t.note}` : ''}`);
  }
  const notOpted = p.offered.filter(n => !p.optIn.includes(n));
  if (notOpted.length) lines.push('', `Optional for this project (opt in with --opt-in): ${notOpted.join(', ')}`);
  lines.push('', p.conflicts ? `${p.conflicts} conflict(s) need you; they will be skipped.` : p.changes ? `${p.changes} change(s) to apply.` : 'Nothing to change.');
  return lines.join('\n');
}

export function parseArgs(argv) {
  const o = { dir: process.cwd(), type: null, optIn: [], json: false, accept: [] };
  // --home and --registry exist for evals/tests: a sandbox home for projects.json, a fake registry.
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') o.dir = argv[++i];
    else if (a === '--type') o.type = argv[++i] === 'none' ? null : argv[i];
    else if (a === '--opt-in') o.optIn = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--accept') o.accept = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (a === '--json') o.json = true;
    else if (a === '--home') o.home = argv[++i];
    else if (a === '--registry') o.registry = loadRegistry(argv[++i]);
    else throw new Error(`unknown option ${a}`);
  }
  return o;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const o = parseArgs(process.argv.slice(2));
  const p = planProject(o);
  console.log(o.json ? JSON.stringify(p, null, 2) : formatPlan(p));
}
