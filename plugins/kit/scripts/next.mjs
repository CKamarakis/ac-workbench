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
import { knowledgeDir, listKnowledge, prdLink } from './knowledge.mjs';
import { scan as docsScan } from './docs.mjs';
import { verifyStatus } from './verify.mjs';
import { decisionStatus, openLine } from './decisions.mjs';

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

// PRD_LINE and prdLink live in knowledge.mjs, shared with docs.mjs without an import cycle; re-exported here.
export { PRD_LINE, prdLink } from './knowledge.mjs';

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

/** Reminder for Draft or Review PRDs with open questions put off for later; rides along on any suggestion, never a gate. */
export function questionsLine(knowledge) {
  const prds = (knowledge?.list?.prds ?? []).filter(p => p.valid && ['Draft', 'Review'].includes(p.status) && p.openQuestions > 0);
  if (!prds.length) return null;
  const [p, ...rest] = prds;
  return `PRD "${p.slug}" has ${p.openQuestions} open question(s) to answer before Ready (/kit:prd)${rest.length ? `; ${rest.length} more PRD(s) with open questions` : ''}`;
}

/**
 * Pure decision. Input:
 *   openspec: { root, changes: [{ name, completedTasks, totalTasks, lastModified, status }] } (openspec list --json)
 *   statusOf: name -> { artifacts: [{ id, status }], isPlanningComplete }               (openspec status --json)
 *   map: laneMap(registry)
 */
/** kit-docs: a one-line reminder when the docs page is older than the newest archive (spec: skill-routing
 *  "Stale docs page suggested"). Never the next step itself. `page` is docs.mjs scan().page. */
export function docsLine(page) {
  return page?.exists && page.stale ? 'docs page is older than the last archive; run /kit:docs' : null;
}

export function suggest({ openspec, statusOf, map, knowledge = null, changedSince, verifyOf = () => null, decisionsOf = () => null, docs = null }) {
  if (!openspec || openspec.root == null) {
    return { phase: 'setup', owner: 'kit', use: '/kit:start', alternatives: [], reason: 'No OpenSpec here yet: set the project up first.' };
  }
  // Every change in `openspec list` is unarchived; "complete" only means all tasks are ticked (verify + archive still due).
  const active = (openspec.changes ?? []).filter(c => c.status !== 'archived')
    .sort((a, b) => String(b.lastModified).localeCompare(String(a.lastModified)));
  const { suggestion, warnings } = prdSuggest({ knowledge, map, activeCount: active.length, changedSince });
  const questions = questionsLine(knowledge);
  const withWarnings = s => ({ ...s, ...(questions ? { questions } : {}), ...(docs ? { docs } : {}), ...(warnings.length ? { warnings } : {}) });
  if (suggestion) return withWarnings(suggestion);
  return withWarnings(openspecSuggest({ active, statusOf, map, verifyOf, decisionsOf }));
}

function openspecSuggest({ active, statusOf, map, verifyOf, decisionsOf = () => null }) {
  const s = openspecStep({ active, statusOf, map, verifyOf, decisionsOf });
  // build-readiness D3: open decisions ride along on any suggestion for the change; never a gate.
  const open = s.change ? openLine(decisionsOf(s.change)) : null;
  return open ? { ...s, open } : s;
}

function openspecStep({ active, statusOf, map, verifyOf, decisionsOf }) {
  if (!active.length) return step(map, 'brainstorm', 'No active change: explore the next idea before proposing it.');

  const change = active[0];
  const others = active.slice(1).map(c => c.name);
  const st = statusOf(change.name) ?? {};
  const arts = st.artifacts ?? [];
  const extra = { change: change.name, ...(others.length ? { otherActive: others } : {}) };
  // st.files: the files check, added by the CLI (planningFromFiles); absent in pure calls.
  const planning = planningState(st, st.files ?? null);

  if (!planning.complete) {
    const next = planning.nextArtifact;
    const done = arts.filter(a => a.status === 'done').length;
    // Nothing written yet -> the artifacts owner starts it; otherwise the plan owner continues it.
    const phase = done === 0 ? 'artifacts' : 'plan';
    return step(map, phase, `Change "${change.name}" is still being planned${next ? `: next artifact is "${next}"` : ''}.`, { ...extra, nextArtifact: next });
  }
  const total = change.totalTasks ?? 0, completed = change.completedTasks ?? 0;
  if (total === 0 || completed < total) {
    // build-readiness D3: offer the readiness check once, before the first task, when the lane map has an owner for it.
    if (completed === 0 && total > 0 && !decisionsOf(change.name)?.readyAt && lane(map, 'ready').owner) {
      const build = lane(map, 'build');
      return step(map, 'ready', `Planning of "${change.name}" is complete and no task has started: check it's ready to build (it warns, never blocks).`, { ...extra, then: build.owner ? (build.owner.skill ?? build.owner.name) : null });
    }
    return step(map, 'build', `Planning of "${change.name}" is complete; ${total - completed} of ${total} tasks are open.`, extra);
  }
  const close = lane(map, 'close');
  // quality-gates: a passing (or overridden) verify report means the change can be closed.
  const v = verifyOf(change.name);
  if (v === 'pass' || v === 'overridden') return step(map, 'close', `All ${total} tasks of "${change.name}" are done and verify ${v === 'pass' ? 'passed' : 'was overridden'}: close the change.`, extra);
  const verify = step(map, 'verify', v === 'fail'
    ? `Verify failed for "${change.name}": fix the blocking items (see its verify.md) and verify again.`
    : `All ${total} tasks of "${change.name}" are done: verify, then close the change.`, extra);
  return { ...verify, then: close.owner ? (close.owner.skill ?? close.owner.name) : null };
}

export function format(s) {
  const lines = [`Next: ${s.use}`, `  why:   ${s.reason}`, `  phase: ${s.phase}${s.owner ? ` (owner: ${s.owner})` : ''}`];
  if (s.prd) lines.push(`  prd:   ${s.prd}`);
  if (s.then) lines.push(`  then:  ${s.then}`);
  if (s.open) lines.push(`  open:  ${s.open}`);
  if (s.questions) lines.push(`  later: ${s.questions}`);
  if (s.docs) lines.push(`  docs:  ${s.docs}`);
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

/** Every `spec.md` under a change's specs folder, sorted. */
export function specFiles(dir) {
  const out = [];
  const walk = d => {
    let es = [];
    try { es = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of es) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'spec.md') out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

/** Planning state from the files: proposal, specs (or skip_specs), tasks. Also the fallback without the OpenSpec CLI. */
export function planningFromFiles(cdir) {
  const has = f => fs.existsSync(path.join(cdir, f));
  let meta = '';
  try { meta = fs.readFileSync(path.join(cdir, '.openspec.yaml'), 'utf8'); } catch { /* none */ }
  const order = [['proposal', has('proposal.md')], ['specs', /skip_specs:\s*true/.test(meta) || specFiles(path.join(cdir, 'specs')).length > 0], ['tasks', has('tasks.md')]];
  const missing = order.find(([, ok]) => !ok);
  return { complete: !missing, nextArtifact: missing ? missing[0] : null };
}

/**
 * Ready to apply: OpenSpec's applyRequires are done (an optional design.md left unwritten doesn't hold it back)
 * AND the files check passes. applyRequires is often just ["tasks"], so it alone would pass a change with no specs.
 */
export function planningState(st, files = null) {
  const arts = st?.artifacts ?? [];
  const ok = a => a.status === 'done' || a.status === 'skipped';
  const done = id => arts.some(a => a.id === id && ok(a));
  const byOpenSpec = st?.applyRequires?.length ? st.applyRequires.every(done)
    : (st?.isPlanningComplete ?? st?.isComplete ?? (arts.length > 0 && arts.every(ok)));
  const complete = byOpenSpec && (files?.complete ?? true);
  const next = files && !files.complete ? files.nextArtifact : arts.find(a => a.status === 'ready')?.id ?? null;
  return { complete, nextArtifact: complete ? null : next };
}

export function openspecJson(args, cwd) {
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
  let docs = null;
  try { docs = docsLine(docsScan({ dir }).page); } catch { /* no docs reminder */ }
  const s = suggest({ openspec, statusOf: name => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) return null; // folder names reach a shell string: kebab-case only
    const st = openspecJson(`status --change "${name}" --json`, dir);
    const files = planningFromFiles(path.join(dir, 'openspec', 'changes', name));
    return st ? { ...st, files } : { isPlanningComplete: files.complete, files }; // status failed: the files decide
  }, map: laneMap(registry), knowledge: readKnowledge(dir), changedSince: gitChangedSince(dir), verifyOf: name => { try { return verifyStatus({ dir, change: name }).status; } catch { return null; } }, decisionsOf: name => decisionStatus({ dir, change: name }), docs });
  console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : format(s));
}
