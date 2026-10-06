// /kit:next: suggest the next step from the project's OpenSpec state and the lane map
// (design D6; spec: skill-routing "Next-step suggestion"). Owners and skills always come from the
// lane map, never from this file. Zero dependencies.
// Usage: node next.mjs [--dir <project>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { laneMap } from './lanes.mjs';
import { loadRegistry } from './setup.mjs';
import { locate, pathWith } from './locate.mjs';
import { knowledgeDir, listKnowledge } from './knowledge.mjs';

const lane = (map, phase) => map.lanes.find(l => l.phase === phase) ?? { phase, owner: null, alternatives: [] };

function step(map, phase, reason, extra = {}) {
  const l = lane(map, phase);
  const use = l.owner ? (l.owner.skill ?? l.owner.name) : null;
  return {
    phase,
    owner: l.owner?.name ?? null,
    use: use ?? `no owner yet for "${phase}" - ask`,
    alternatives: l.alternatives.filter(a => a.skill).map(a => ({ tool: a.name, use: a.skill })),
    reason,
    ...extra,
  };
}

// ---------- PRD rules (spec: skill-routing "Next-step suggestion uses PRD status"; design D5, D7) ----------

export const PRD_LINE = /PRD:\s*`?([^\s`@]+\.md)`?\s*@\s*`?([0-9a-f]{4,40}|uncommitted)`?/i;

/** The PRD line of a proposal, or null. */
export function prdLink(proposalText) {
  const m = PRD_LINE.exec(proposalText ?? '');
  return m ? { path: m[1].replace(/\\/g, '/'), commit: m[2].toLowerCase() } : null;
}

/**
 * Pure PRD rules, checked before the OpenSpec rules. Input:
 *   knowledge: { dir (project-relative), list (listKnowledge), changes: [{ name, archived, link }] }
 *   changedSince: (projectRelPath, commit) -> true | false | null (unknown)
 * Returns { suggestion|null, warnings: [] }.
 */
export function prdSuggest({ knowledge, map, activeCount = 0, changedSince = () => null }) {
  const warnings = [];
  if (!knowledge?.list?.exists) return { suggestion: null, warnings };
  const { dir, list, changes = [] } = knowledge;
  for (const x of list.invalid) warnings.push(`invalid: ${x.path}: ${x.errors.join('; ')}`);
  const full = p => `${dir}/${p}`;
  const prds = list.prds.filter(p => p.valid);
  const changeFor = p => changes.find(c => c.name === p.change) ?? changes.find(c => c.link?.path === full(p.path)) ?? null;
  const at = (phase, reason, prd, extra = {}) => ({ suggestion: step(map, phase, reason, { prd: full(prd.path), ...extra }), warnings });

  for (const p of prds.filter(x => x.status === 'Building')) {
    const c = changeFor(p);
    if (c?.archived) return at('prd', `Change "${c.name}" is archived: mark PRD "${p.slug}" Shipped (only on your yes).`, p, { change: c.name });
  }
  for (const p of prds.filter(x => x.status === 'Building')) {
    const c = changeFor(p);
    if (!c?.link) continue;
    const changed = c.link.commit === 'uncommitted' ? null : changedSince(full(p.path), c.link.commit);
    if (changed === null) { warnings.push(`could not check whether PRD "${p.slug}" changed since "${c.name}" was planned`); continue; }
    if (changed) return at('plan', `PRD "${p.slug}" changed after change "${c.name}" was planned (at ${c.link.commit}): review the plan against it.`, p, { change: c.name });
  }
  const ready = prds.filter(p => p.status === 'Ready' && !p.change && !changeFor(p));
  if (ready.length) {
    const others = ready.slice(1).map(p => p.slug);
    return at('artifacts', `PRD "${ready[0].slug}" is Ready and no change uses it yet: propose a change from it.`, ready[0], others.length ? { otherReady: others } : {});
  }
  if (list.notes.length && !list.prds.length && activeCount === 0) {
    return { suggestion: step(map, 'prd', `${list.notes.length} note(s) in ${dir}/notes and no PRD yet: shape them into a PRD.`), warnings };
  }
  return { suggestion: null, warnings };
}

/**
 * Pure decision. Input:
 *   openspec: { root, changes: [{ name, completedTasks, totalTasks, lastModified, status }] } (openspec list --json)
 *   statusOf: name -> { artifacts: [{ id, status }], isPlanningComplete }               (openspec status --json)
 *   map: laneMap(registry)
 */
export function suggest({ openspec, statusOf, map, knowledge = null, changedSince }) {
  if (!openspec || openspec.root == null) {
    return { phase: 'setup', owner: 'kit', use: '/kit:start', alternatives: [], reason: 'No OpenSpec here yet: set the project up first.' };
  }
  const active = (openspec.changes ?? []).filter(c => c.status !== 'complete')
    .sort((a, b) => String(b.lastModified).localeCompare(String(a.lastModified)));
  const { suggestion, warnings } = prdSuggest({ knowledge, map, activeCount: active.length, changedSince });
  const withWarnings = s => (warnings.length ? { ...s, warnings } : s);
  if (suggestion) return withWarnings(suggestion);
  return withWarnings(openspecSuggest({ active, statusOf, map }));
}

function openspecSuggest({ active, statusOf, map }) {
  if (!active.length) return step(map, 'brainstorm', 'No active change: explore the next idea before proposing it.');

  const change = active[0];
  const others = active.slice(1).map(c => c.name);
  const st = statusOf(change.name) ?? {};
  const arts = st.artifacts ?? [];
  const extra = { change: change.name, ...(others.length ? { otherActive: others } : {}) };
  const planningDone = st.isPlanningComplete ?? st.isComplete ?? (arts.length > 0 && arts.every(a => a.status === 'done' || a.status === 'skipped'));

  if (!planningDone) {
    const next = arts.find(a => a.status === 'ready');
    const done = arts.filter(a => a.status === 'done').length;
    // Nothing written yet -> the artifacts owner starts it; otherwise the plan owner continues it.
    const phase = done === 0 ? 'artifacts' : 'plan';
    return step(map, phase, `Change "${change.name}" is still being planned${next ? `: next artifact is "${next.id}"` : ''}.`, { ...extra, nextArtifact: next?.id ?? null });
  }
  const total = change.totalTasks ?? 0, completed = change.completedTasks ?? 0;
  if (total === 0 || completed < total) {
    return step(map, 'build', `Planning of "${change.name}" is complete; ${total - completed} of ${total} tasks are open.`, extra);
  }
  const verify = step(map, 'verify', `All ${total} tasks of "${change.name}" are done: verify, then close the change.`, extra);
  const close = lane(map, 'close');
  return { ...verify, then: close.owner ? (close.owner.skill ?? close.owner.name) : null };
}

export function format(s) {
  const lines = [`Next: ${s.use}`, `  why:   ${s.reason}`, `  phase: ${s.phase}${s.owner ? ` (owner: ${s.owner})` : ''}`];
  if (s.prd) lines.push(`  prd:   ${s.prd}`);
  if (s.then) lines.push(`  then:  ${s.then}`);
  if (s.nextArtifact) lines.push(`  next artifact: ${s.nextArtifact}`);
  if (s.alternatives?.length) lines.push(`  big or risky change? alternative: ${s.alternatives.map(a => `${a.use} (${a.tool})`).join('; ')}`);
  if (s.otherActive?.length) lines.push(`  other active changes: ${s.otherActive.join(', ')}`);
  if (s.otherReady?.length) lines.push(`  other Ready PRDs: ${s.otherReady.join(', ')}`);
  for (const w of s.warnings ?? []) lines.push(`  WARNING ${w}`);
  return lines.join('\n');
}

/** Knowledge list plus every change's PRD link (active and archived), for prdSuggest. */
export function readKnowledge(dir) {
  const kdir = knowledgeDir(dir);
  const rel = path.relative(dir, kdir).split(path.sep).join('/');
  const changes = [];
  const root = path.join(dir, 'openspec', 'changes');
  const scan = (base, archived) => {
    let entries = [];
    try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || (!archived && e.name === 'archive')) continue;
      let text = null;
      try { text = fs.readFileSync(path.join(base, e.name, 'proposal.md'), 'utf8'); } catch { /* no proposal yet */ }
      changes.push({ name: archived ? e.name.replace(/^\d{4}-\d{2}-\d{2}-/, '') : e.name, archived, link: prdLink(text) });
    }
  };
  scan(root, false);
  scan(path.join(root, 'archive'), true);
  return { dir: rel, list: listKnowledge(kdir), changes };
}

/** (projectRelPath, commit) -> true if the file has commits after `commit` or uncommitted changes; null if git can't tell. */
export function gitChangedSince(dir) {
  const git = locate('git')?.path ?? 'git';
  const run = args => spawnSync(git, args, { cwd: dir, encoding: 'utf8', timeout: 30000 });
  return (file, commit) => {
    const log = run(['log', '--format=%h', `${commit}..HEAD`, '--', file]);
    if (log.status !== 0) return null;
    if (log.stdout.trim()) return true;
    const st = run(['status', '--porcelain', '--', file]);
    if (st.status !== 0) return null;
    return st.stdout.trim().length > 0;
  };
}

function openspecJson(args, cwd) {
  const os = locate('openspec');
  if (!os) return null;
  const r = spawnSync(`"${os.path}" ${args}`, { cwd, shell: true, encoding: 'utf8', env: { ...process.env, PATH: pathWith({ os }) }, timeout: 60000 });
  const out = r.stdout ?? '';
  const start = out.indexOf('{');
  try { return start >= 0 ? JSON.parse(out.slice(start)) : null; } catch { return null; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const di = args.indexOf('--dir');
  const dir = path.resolve(di >= 0 ? args[di + 1] : process.cwd());
  const ri = args.indexOf('--registry');
  const registry = loadRegistry(ri >= 0 ? args[ri + 1] : undefined);
  const openspec = fs.existsSync(path.join(dir, 'openspec')) ? openspecJson('list --json', dir) : { root: null, changes: [] };
  const s = suggest({ openspec, statusOf: name => openspecJson(`status --change "${name}" --json`, dir), map: laneMap(registry), knowledge: readKnowledge(dir), changedSince: gitChangedSince(dir) });
  console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : format(s));
}
