// /kit:start planner (design D4, D5, D14; spec: project-starter). Computes every file and tool action
// for a project WITHOUT writing anything. Zero dependencies.
// Usage: node start-plan.mjs --dir <project> [--type <t>] [--opt-in a,b] [--json] [--registry <file.json>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { laneMap, routingBlock, BLOCK_START, BLOCK_END } from './lanes.mjs';
import { loadRegistry, defaultDeps, installFor, nothingToInstall } from './setup.mjs';
import { DEFAULT_DIR, SUBDIRS, stampKnowledgeDir } from './knowledge.mjs';
import { WEB_APP_CONFIG } from './project.mjs';

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

// ---------- tool versions (tool-version-sync; spec: project-starter "Re-sync brings tools to the tested version") ----------

/** The first x.y.z (or x.y) in a string, e.g. "skill-v4.6.0" -> "4.6.0"; null when there is none. */
export const versionOf = s => /\d+\.\d+(?:\.\d+)*/.exec(String(s ?? ''))?.[0] ?? null;

export function compareVersions(a, b) {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0) ? 1 : -1;
  return 0;
}

/** The version a project tool recorded in the project (registry `project_version: { file, pattern }`), or null. */
export function projectVersion(entry, dir) {
  const pv = entry.project_version;
  if (!pv?.file || !pv?.pattern) return null;
  return versionOf(new RegExp(pv.pattern, 'm').exec(read(path.join(dir, pv.file)) ?? '')?.[1]);
}

/** The file holds no version the pattern can read (e.g. a changed format): said in the plan, not hidden. */
const versionUnreadable = (entry, dir) => !!entry.project_version?.file && fs.existsSync(path.join(dir, entry.project_version.file)) && !projectVersion(entry, dir);

// OpenSpec writes its project skills for the CLI on this machine (design D3), so they're compared with that CLI.
export const OPENSPEC_SKILLS = 'openspec-skills';
export const OPENSPEC_UPDATE_NOTE = 'also removes skills outside your OpenSpec profile (openspec config profile)';

/** Oldest `generatedBy` among the project's .claude/skills/openspec-* skills, or null. */
export function openspecSkillsVersion(dir) {
  const root = path.join(dir, '.claude', 'skills');
  let names = [];
  try { names = fs.readdirSync(root).filter(n => n.startsWith('openspec-')); } catch { return null; }
  const vs = names.map(n => versionOf(/generatedBy:\s*"?([0-9.]+)/.exec(read(path.join(root, n, 'SKILL.md')) ?? '')?.[1])).filter(Boolean);
  return vs.length ? vs.sort(compareVersions)[0] : null;
}

function openspecVersions(registry, dir, deps) {
  const entry = (registry.tools ?? []).find(t => t.name === 'openspec');
  const r = deps.run(entry?.check ?? 'openspec --version', { cwd: dir, timeout: 60000 });
  const cli = r.status === 0 ? versionOf(r.stdout) : null;
  const tested = versionOf(entry?.reviewed_version);
  const warnings = [], tools = [];
  if (!cli) return { warnings, tools };
  if (tested && compareVersions(cli, tested) < 0) warnings.push(`OpenSpec ${cli} is older than the kit tested (${tested}); update it: ${installFor(entry, deps.platform) ?? 'see /kit:setup'}`);
  const skills = fs.existsSync(path.join(dir, 'openspec')) ? openspecSkillsVersion(dir) : null;
  if (skills && compareVersions(skills, cli) < 0) tools.push({ name: OPENSPEC_SKILLS, tier: 'global', status: entry?.status ?? 'adopted', action: 'update', from: skills, tested: cli, to: cli, command: 'openspec update', note: OPENSPEC_UPDATE_NOTE, why: "this project's OpenSpec skills" });
  return { warnings, tools };
}

function toolAction(entry, dir, deps) {
  const base = { name: entry.name, tier: entry.tier, status: entry.status };
  if (nothingToInstall(entry)) return { ...base, action: 'present' };
  const check = deps.run(entry.check, { cwd: dir, timeout: 60000 });
  const present = check.status === 0 && (!entry.check_match || new RegExp(entry.check_match, 'm').test(check.stdout));
  if (present) {
    const from = projectVersion(entry, dir), tested = versionOf(entry.reviewed_version);
    if (from && tested && compareVersions(from, tested) < 0 && entry.update) return { ...base, action: 'update', from, tested, command: entry.update };
    if (from && tested && compareVersions(from, tested) > 0) return { ...base, action: 'present', newer: from, tested };
    if (versionUnreadable(entry, dir)) return { ...base, action: 'present', unreadable: entry.project_version.file };
    return { ...base, action: 'present' };
  }
  // Installed but waiting on the user (e.g. OAuth not done): the check runs, its match fails. Don't reinstall.
  if (check.status === 0 && entry.check_match && entry.install_note) return { ...base, action: 'pending', command: null, note: entry.install_note };
  const command = entry.plugin ? `claude plugin install ${entry.plugin} --scope project --json` : installFor(entry, deps.platform);
  if (entry.interactive) return { ...base, action: 'pending', command, note: entry.install_note ?? 'needs you to complete it' };
  if (!command) return { ...base, action: 'pending', command: null, note: `no install command for ${deps.platform}` };
  return { ...base, action: 'install', kind: entry.plugin ? 'plugin' : 'command', plugin: entry.plugin ?? null, command, note: entry.install_note ?? null };
}

// ---------- question context (followups D5; spec: project-starter "Starter questions carry context") ----------

export const DEFAULT_RECOMMEND = { recommend: 'no', why: 'optional; add it later when a change needs it' };

// Config files that make a project type likely. Only types the registry defines are recommended.
export const TYPE_HINTS = {
  'web-ui': { pattern: WEB_APP_CONFIG, why: f => `found ${f}: this is a web app` },
};

const ACTION_ABOUT = {
  '.gitignore': ["Adds the kit's block: keeps personal Claude Code settings out of git", 'yes', 'your settings.local.json stays private; only the kit block changes'],
  'CLAUDE.md': ["Adds or updates the kit's routing section: which skill to use per phase, plus the knowledge and PRD rules", 'yes', "the agent follows the kit's workflow; your own text in the file is kept"],
  'openspec/config.yaml': ["Points OpenSpec's context at docs/project-context.md", 'yes', 'every proposal then reads your project context'],
  '.claude/kit.json': ['The kit stamp: kit version, project type, tools and knowledge folder', 'yes', 'the kit reads it to re-sync this project later'],
  'docs/project-context.md': ['Your project context doc (problem, users, what it does, rules for the agent, decisions); yours once created', 'yes', 'OpenSpec reads it before every proposal'],
  knowledge: ['A folder of the knowledge tree (notes, PRDs, assets, archive)', 'yes', '/kit:capture and /kit:prd keep notes and PRDs there'],
};

export function aboutAction(id, knowledgeDir = DEFAULT_DIR) {
  const key = id.startsWith(`${knowledgeDir}/`) ? 'knowledge' : id;
  const a = ACTION_ABOUT[key];
  return a ? { about: a[0], recommend: a[1], why: a[2] } : {};
}

/** Project types with the tools each adds, and a recommendation from the project's config files. */
export function typeOptions(registry, dir) {
  let files = [];
  try { files = fs.readdirSync(dir); } catch { /* new folder */ }
  return projectTypes(registry).map(name => {
    const tools = (registry.tools ?? []).filter(t => t.tier === `project-type:${name}` && ACTIVE.includes(t.status)).map(t => t.name);
    const hint = TYPE_HINTS[name];
    const hit = hint && files.find(f => hint.pattern.test(f));
    return { name, tools, about: tools.length ? `adds ${tools.join(', ')}` : 'adds no tools yet', recommended: !!hit, why: hit ? hint.why(hit) : null };
  });
}

/** Opt-in (project-tier) tools with their registry reason and recommendation. */
export function offeredTools(registry, names) {
  return names.map(n => {
    const t = (registry.tools ?? []).find(x => x.name === n) ?? {};
    const r = t.recommend ? { recommend: t.recommend, why: t.recommend_why } : DEFAULT_RECOMMEND;
    return { name: n, about: t.reason ?? '', ...r };
  });
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
  const knowledgeDir = stampKnowledgeDir(stampCur);
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
  const block = routingBlock(laneMap(registry), { kitVersion: version, knowledgeDir, libraryDocs: true, qualityGates: true });
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
  const tools = chosen.map(({ entry, why }) => ({ ...toolAction(entry, abs, deps), why, ...(entry.first_use ? { firstUse: entry.first_use } : {}), ...(entry.install_why ? { installWhy: entry.install_why } : {}) }));
  const os_ = openspecVersions(registry, abs, deps);
  tools.push(...os_.tools);
  const warnings = os_.warnings;

  // stamp
  const stamp = {
    kit_version: version,
    setup_date: stampCur?.setup_date ?? today,
    knowledge_dir: knowledgeDir,
    project_type: type,
    opted_in: [...optIn].sort(),
    tools: tools.filter(t => t.name !== OPENSPEC_SKILLS).map(t => t.name).sort(),
  };
  const stampJson = JSON.stringify(stamp, null, 2) + '\n';
  const stampAction = !stampCur ? 'create' : JSON.stringify({ ...stampCur }) === JSON.stringify(stamp) ? 'same' : 'differs';
  actions.push({ id: '.claude/kit.json', kind: 'file', action: stampAction, content: stampJson, ...(stampAction === 'differs' ? { diff: lineDiff(JSON.stringify(stampCur, null, 2), stampJson.trimEnd()) } : {}) });

  for (const a of actions) if (a.kind === 'file') Object.assign(a, aboutAction(a.id, knowledgeDir));
  const changes = actions.filter(a => !['same', 'keep'].includes(a.action)).length + tools.filter(t => ['install', 'update'].includes(t.action)).length;
  const conflicts = actions.filter(a => a.action === 'conflict').length;
  return { project, dir: abs, knowledgeDir, type, optIn: [...optIn].sort(), kitVersion: version, actions, tools, offered, offeredTools: offeredTools(registry, offered), types: projectTypes(registry), typeOptions: typeOptions(registry, abs), warnings, docsLater: !fs.existsSync(path.join(abs, knowledgeDir, 'docs')), roadmapLater: !fs.existsSync(path.join(abs, knowledgeDir, 'roadmaps', 'roadmap.md')), changes, conflicts };
}

export const CONTEXT_LINE = 'Project context, decisions and open ideas: docs/project-context.md. Read it before any proposal.';

// build-prereqs D3: OpenSpec passes per-artifact rules to the agent writing that artifact.
export const TASKS_RULE = "Don't add tasks that need a running app, a browser or a check by hand; cover behavior with automated tests. /kit:verify offers a browser check on request.";
const TASKS_ITEM = `- "${TASKS_RULE}"`;

/** The context pointer and the tasks rule (build-prereqs D5): any part that can't be placed makes the file a conflict. */
export function configAction(cfg) {
  const id = 'openspec/config.yaml';
  cfg = cfg.replace(/\r\n/g, '\n');
  const missing = [];
  let result = cfg;
  if (!result.includes('docs/project-context.md')) {
    if (!/^context:/m.test(result)) result = configWithContext(result);
    else {
      const r = appendToContextBlock(result);
      if (r == null) missing.push('config has a one-line context: entry; add a line pointing to docs/project-context.md yourself');
      else result = r;
    }
  }
  const t = withTasksRule(result);
  if (t == null) missing.push(`rules: isn't a block; add this under rules.tasks yourself: ${TASKS_ITEM}`);
  else result = t;
  if (missing.length) return { id, kind: 'file', action: 'conflict', reason: missing.join('; ') };
  if (result === cfg) return { id, kind: 'file', action: 'same' };
  return { id, kind: 'file', action: 'differs', content: result, diff: lineDiff(cfg, result) };
}

/** Adds the kit's line to rules.tasks (build-prereqs D4); null when `rules:` or `tasks:` isn't a block it can safely add to. */
export function withTasksRule(cfg) {
  if (cfg.includes(TASKS_RULE)) return cfg;
  const lines = cfg.split('\n');
  const r = lines.findIndex(l => /^rules:/.test(l));
  if (r < 0) return cfg.replace(/\s*$/, '\n') + `\nrules:\n  tasks:\n    ${TASKS_ITEM}\n`;
  if (!/^rules:\s*(#.*)?$/.test(lines[r])) return null;
  let indent = null, tasks = -1;
  for (let i = r + 1; i < lines.length; i++) {
    if (!lines[i].trim() || /^\s*#/.test(lines[i])) continue;
    const m = /^(\s+)\S/.exec(lines[i]);
    if (!m) break;
    indent ??= m[1];
    if (m[1] !== indent || !/^\s+tasks:/.test(lines[i])) continue;
    if (!/^\s+tasks:\s*(#.*)?$/.test(lines[i])) return null; // e.g. tasks: []
    tasks = i;
  }
  indent ??= '  ';
  if (tasks < 0) {
    lines.splice(r + 1, 0, `${indent}tasks:`, `${indent}${indent}${TASKS_ITEM}`);
    return lines.join('\n');
  }
  // The new item takes the list's own indent; an empty tasks: gets one level deeper.
  const next = lines.slice(tasks + 1).find(l => l.trim() && !/^\s*#/.test(l));
  const item = next && /^(\s*)- /.exec(next);
  const itemIndent = item && item[1].length >= indent.length ? item[1] : indent + indent;
  lines.splice(tasks + 1, 0, `${itemIndent}${TASKS_ITEM}`);
  return lines.join('\n');
}

/** Appends the pointer as the last line of an existing `context: |` block; null when context isn't a block. */
export function appendToContextBlock(cfg) {
  const lines = cfg.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex(l => /^context:\s*[|>][-+]?\s*$/.test(l));
  if (start < 0) return null;
  let last = start, indent = '  ';
  for (let i = start + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const m = /^(\s+)\S/.exec(lines[i]);
    if (!m) break;
    if (last === start) indent = m[1];
    last = i;
  }
  lines.splice(last + 1, 0, `${indent}${CONTEXT_LINE}`);
  return lines.join('\n');
}

export const configWithContext = cfg => cfg.replace(/\s*$/, '\n') + `\ncontext: |\n  ${CONTEXT_LINE}\n`;

export const ROADMAP_LATER = "optional: when you want the goals in order, what's left and the decisions waiting in one place, run /kit:roadmap, any time";
export const DOCS_LATER = "optional: when you want a browsable page of what's built (worth it beyond a day or two of work), run /kit:docs, any time, also mid-project";

export function formatPlan(p) {
  const lines = [`Project: ${p.project}  (${p.dir})`, `Type: ${p.type ?? '(none)'}   kit ${p.kitVersion}`, ''];
  for (const a of p.actions) {
    const tag = { create: 'CREATE', same: 'same', differs: 'CHANGE', conflict: 'CONFLICT', keep: 'keep', run: 'RUN', 'after-init': 'AFTER' }[a.action] ?? a.action;
    lines.push(`  ${tag.padEnd(8)} ${a.id}${a.command ? `  -> ${a.command}` : ''}${a.reason ? `  (${a.reason})` : ''}`);
    if (a.diff) lines.push(a.diff.split('\n').map(l => '           ' + l).join('\n'));
  }
  if (p.tools.length) lines.push('', 'Tools for this project:');
  for (const t of p.tools) {
    const tag = { present: 'ok', install: 'INSTALL', pending: 'YOU', update: 'UPDATE' }[t.action];
    const version = t.action === 'update' ? (t.to ? `  ${t.from} -> ${t.to} (this machine's OpenSpec)` : `  ${t.from} -> latest (tested ${t.tested})`) : t.newer ? `  ${t.newer}, newer than the kit tested (${t.tested})` : t.unreadable ? `  version not readable from ${t.unreadable}` : '';
    lines.push(`  ${tag.padEnd(8)} ${t.name.padEnd(16)} ${t.why}${version}${t.command && t.action !== 'present' ? `\n           ${t.command}` : ''}${t.note && ['pending', 'update'].includes(t.action) ? `\n           note: ${t.note}` : ''}${t.installWhy && !['present', 'update'].includes(t.action) ? `\n           why: ${t.installWhy}` : ''}`);
  }
  for (const w of p.warnings ?? []) lines.push(`  WARNING  ${w}`);
  const later = p.tools.filter(x => x.firstUse);
  if (later.length || p.docsLater || p.roadmapLater) {
    lines.push('', 'Later (when you first use it):');
    for (const x of later) lines.push(`  ${x.name.padEnd(16)} ${x.firstUse}`);
    // Living docs stay optional (spec: project-starter "Docs page mentioned at setup"); the line lives here, not in the skill.
    if (p.docsLater) lines.push(`  ${'kit:docs'.padEnd(16)} ${DOCS_LATER}`);
    // The roadmap is optional too (spec: project-starter "Roadmap mentioned at setup"): mentioned, never asked or created.
    if (p.roadmapLater) lines.push(`  ${'kit:roadmap'.padEnd(16)} ${ROADMAP_LATER}`);
  }
  const notOpted = p.offered.filter(n => !p.optIn.includes(n));
  if (notOpted.length) {
    // One-question setup (followups D5b): opt-ins are listed, never asked; added on demand when a change needs them.
    lines.push('', 'Available on demand (not installed now; added when a change needs them):');
    for (const o of (p.offeredTools ?? []).filter(x => notOpted.includes(x.name))) lines.push(`  ${o.name.padEnd(16)} ${o.about}`);
  }
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
    else if (a === '--files-only') o.filesOnly = true;
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
