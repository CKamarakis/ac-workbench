// /kit:next: suggest the next step from the project's OpenSpec state and the lane map
// (design D6; spec: skill-routing "Next-step suggestion"). Owners and skills always come from the
// lane map, never from this file. Zero dependencies.
// Usage: node next.mjs [--dir <project>] [--change <name>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { laneMap } from './lanes.mjs';
import { loadRegistry } from './setup.mjs';
import { locate, pathWith } from './locate.mjs';
import { knowledgeDir, listKnowledge, prdLink, withoutSection } from './knowledge.mjs';
import { pageStatus } from './docs.mjs';
import { verifyStatus } from './verify.mjs';
import { decisionStatus, openLine, archivedOpen, archivedLine } from './decisions.mjs';
import { readLooseEnds, isOpen as looseOpen } from './loose-ends.mjs';
import { listRecords, OPEN as OPEN_EXPLORE } from './explore.mjs';
import { parseRoadmap, reportRoadmap } from './roadmap.mjs';

const lane = (map, phase) => map.lanes.find(l => l.phase === phase) ?? { phase, owner: null, alternatives: [] };
// The command a reason names for a phase: its lane owner's, not a hard-coded one; null when no tool owns it, and the
// reason then leaves that part out (L17).
const cmd = (map, phase) => lane(map, phase).owner?.skill ?? null; // a bare tool name isn't a command (C9)

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
export function prdSuggest({ knowledge, map, activeCount = 0, activeName = null, changedSince = () => null }) {
  const warnings = [];
  if (!knowledge?.list?.exists) return { suggestion: null, warnings };
  const { dir, list, changes = [] } = knowledge;
  for (const x of list.invalid) warnings.push(`invalid: ${x.path}: ${x.errors.join('; ')}`);
  const full = p => `${dir}/${p}`;
  const prds = list.prds.filter(p => p.valid);
  const changeFor = p => changes.find(c => c.name === p.change) ?? changes.find(c => c.link?.path === full(p.path)) ?? null;
  const at = (phase, reason, prd, extra = {}) => ({ suggestion: step(map, phase, reason, { prd: full(prd.path), ...extra }), warnings });

  // A part is named "<parent>/<part>" (prd-parts D2); a single PRD's name is its slug.
  const nm = p => p.name ?? p.slug;
  // A parent with parts is built through its parts, never on its own (prd-parts D4).
  const building = prds.filter(x => x.status === 'Building' && !x.parts?.length);
  for (const p of building) {
    const c = changeFor(p);
    // A PRD can be built across several changes, so this asks rather than advising Shipped (L1).
    if (c?.archived) return at('prd', `Change "${c.name}" is archived: is PRD "${nm(p)}" done, or does it continue in another change? Mark it Shipped, or link the next change (only on your yes).`, p, { change: c.name });
  }
  for (const p of building) {
    const c = changeFor(p);
    if (!c?.link) continue;
    const changed = c.link.commit === 'uncommitted' ? null : changedSince(full(p.path), c.link.commit);
    if (changed === null) warnings.push(`could not check whether PRD "${nm(p)}" changed since "${c.name}" was planned`);
    if (changed) return at('plan', `PRD "${nm(p)}" changed after change "${c.name}" was planned (at ${c.link.commit}): review the plan against it.`, p, { change: c.name });
    // prd-parts D7: the parent's shared goals count too, even when the part itself can't be checked; an edit
    // to another part doesn't.
    const par = c.link.parent;
    if (!par || !p.partOf) continue;
    // Adding a part writes a row into the parent's Parts table; that alone isn't a change to plan against (D1).
    const parentChanged = par.commit === 'uncommitted' ? null : changedSince(par.path, par.commit, { ignoreSection: 'Parts' });
    if (parentChanged === null) warnings.push(`could not check whether parent PRD "${p.partOf}" changed since "${c.name}" was planned`);
    if (parentChanged) return at('plan', `Parent PRD "${p.partOf}" changed after change "${c.name}" was planned (at ${par.commit}): review the plan against it.`, p, { change: c.name });
  }
  const ready = prds.filter(p => p.status === 'Ready' && !p.parts?.length && !p.change && !changeFor(p));
  // kit-followups D1: finish the active change first; a Ready PRD waits as a reminder line.
  if (ready.length && activeCount > 0) {
    return { suggestion: null, warnings, waiting: `PRD ${ready.map(nm).join(', ')} ${ready.length === 1 ? 'is' : 'are'} Ready; ${ready.length === 1 ? 'it waits' : 'they wait'} until ${activeName ?? 'the active change'} is done` };
  }
  if (ready.length) {
    const others = ready.slice(1).map(nm);
    return at('artifacts', `PRD "${nm(ready[0])}" is Ready and no change uses it yet: propose a change from it.`, ready[0], others.length ? { otherReady: others } : {});
  }
  // explore-stage: notes alone never lead to a suggestion; a note is input that an explore reads.
  return { suggestion: null, warnings };
}

/** Reminder for Draft or Review PRDs with open questions put off for later; rides along on any suggestion, never a gate. */
export function questionsLine(knowledge) {
  const prds = (knowledge?.list?.prds ?? []).filter(p => p.valid && ['Draft', 'Review'].includes(p.status) && p.openQuestions > 0);
  if (!prds.length) return null;
  const [p, ...rest] = prds;
  return `PRD "${p.name ?? p.slug}" has ${p.openQuestions} open question(s) to answer before Ready (/kit:prd)${rest.length ? `; ${rest.length} more PRD(s) with open questions` : ''}`;
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

export function suggest({ openspec, statusOf, map, knowledge = null, changedSince, verifyOf = () => null, decisionsOf = () => null, docs = null, archived = null, change = null, loose = [], looseWarning = null, explores = [], explore = null, roadmap = null }) {
  if (!openspec || openspec.root == null) {
    return { phase: 'setup', owner: 'kit', use: '/kit:start', alternatives: [], reason: 'No OpenSpec here yet: set the project up first.' };
  }
  // Every change in `openspec list` is unarchived; "complete" only means all tasks are ticked (verify + archive still due).
  const active = (openspec.changes ?? []).filter(c => c.status !== 'archived')
    .sort((a, b) => String(b.lastModified).localeCompare(String(a.lastModified)));
  // A name that isn't active counts only when something is (verify C3): with nothing active, "Nothing open" applies.
  const named = change && active.some(c => c.name === change) ? change : null;
  const { suggestion, warnings, waiting } = prdSuggest({ knowledge, map, activeCount: active.length, activeName: named ?? active[0]?.name, changedSince });
  if (looseWarning) warnings.push(looseWarning);
  for (const r of explores.filter(x => x.state === 'unreadable')) warnings.push(r.error);
  const questions = questionsLine(knowledge);
  const withWarnings = s => ({ ...s, ...blockedBy(loose, s.change), ...(questions ? { questions } : {}), ...(docs ? { docs } : {}), ...(waiting ? { waiting } : {}), ...(archivedLine(archived) ? { archived: archivedLine(archived) } : {}), ...(warnings.length ? { warnings } : {}) });
  // With a change named, a PRD step wins only when it is about that change (verify C1).
  if (suggestion && (!named || suggestion.change === named)) return withWarnings(suggestion);
  // kit-status D6: next works inside one item. Several active changes and none named -> the user picks one.
  if (change && !named && active.length) return withWarnings(chooseStep(active, `No active change named "${change}".`));
  if (!named && active.length > 1) return withWarnings(chooseStep(active, `${active.length} changes are active.`));
  const picked = named ? active.filter(c => c.name === named) : active;
  const leftover = leftoverCount(knowledge, archived, loose);
  if (!active.length) return withWarnings(outsideChange({ map, explores, explore, roadmap, leftover, fresh: isNewProject({ knowledge, explores }) }));
  return withWarnings(openspecSuggest({ active: picked, statusOf, map, verifyOf, decisionsOf }));
}

/**
 * A new project (first-run-guidance D1), the one test /kit:next and /kit:status share: set up by the kit (its knowledge
 * folder exists), with no notes (valid, invalid or not imported yet), PRDs, explore records or changes (active or
 * archived). Without a knowledge folder it's not one the kit set up, and the suggestion stays as before.
 */
export function isNewProject({ knowledge, explores = [] }) {
  const l = knowledge?.list;
  if (!l?.exists) return false;
  const any = xs => (xs ?? []).length > 0;
  return !any(l.notes) && !any(l.prds) && !any(l.invalid) && !any(l.unimported) && !any(knowledge.changes) && !any(explores);
}

const leftoverText = l => (l?.total ? ` ${l.total} item${l.total === 1 ? '' : 's'} left for later (${[l.builds ? `${l.builds} from builds` : null, l.prd ? `${l.prd} PRD question${l.prd === 1 ? '' : 's'}` : null, l.loose ? `${l.loose} loose end${l.loose === 1 ? '' : 's'}` : null].filter(Boolean).join(', ')}).` : '');

/**
 * No active change (explore-stage D4): the explore stage, then the roadmap's next step, then "Nothing open".
 *   explores: listRecords(dir); roadmap: reportRoadmap(parseRoadmap(...)) or null.
 */
export function outsideChange({ map, explores = [], explore = null, roadmap = null, leftover = null, fresh = false }) {
  // Unreadable records are skipped here (suggest reports them as warnings, verify C1).
  const open = explores.filter(r => OPEN_EXPLORE.includes(r.state));
  const named = explore ? open.find(r => r.slug === explore) : null;
  // A name that matches no open explore is said, like --change (verify C6).
  if (explore && !named && open.length) {
    return { phase: 'choose', owner: null, use: 'pick an explore', alternatives: [], reason: `No open explore named "${explore}". Pick one, then run /kit:next --explore <slug>.`, choose: open.map(r => r.slug) };
  }
  if (!named && open.length > 1) {
    return { phase: 'choose', owner: null, use: 'pick an explore', alternatives: [], reason: `${open.length} explores are open${explore ? ` (none named "${explore}")` : ''}. Pick one, then run /kit:next --explore <slug>.`, choose: open.map(r => r.slug) };
  }
  const r = named ?? open[0];
  if (r?.state === 'ready-for-prd') return step(map, 'prd', `Explore "${r.title}" has no open questions: write the PRD from it.`, { explore: r.slug, record: r.file });
  if (r?.state === 'exploring') return step(map, 'brainstorm', `Explore "${r.title}" still has open questions: ${r.questions.map(q => `${q.id} ${q.text}`).join('; ')}.`, { explore: r.slug, record: r.file });
  const more = leftoverText(leftover);
  if (roadmap?.exists && roadmap.current) {
    const cur = roadmap.rows.find(x => x.id === roadmap.current);
    // Done when nothing is left, including a milestone whose every task was dropped (C1).
    if (cur && cur.status === 'active' && cur.total + (cur.dropped ?? 0) > 0 && !cur.left.length) {
      const nx = roadmap.rows.find(x => x.id === roadmap.next);
      return step(map, 'roadmap', `${cur.id} ${cur.title} is done.${nx ? ` Next: ${nx.id} ${nx.title}.` : ' Nothing after it on the roadmap.'} Mark ${cur.id} done${cmd(map, 'roadmap') ? ` with ${cmd(map, 'roadmap')}` : ''}${nx && cmd(map, 'brainstorm') ? `, then start with ${cmd(map, 'brainstorm')}` : ''}.${more}`, { milestone: cur.id, ...(nx ? { nextMilestone: nx.id } : {}) });
    }
    if (cur?.left.length) {
      const t0 = cur.left[0];
      return step(map, 'brainstorm', `Next on the roadmap: ${cur.id} T${t0.n} ${t0.text} (${cur.title}).${cmd(map, 'brainstorm') ? ` Start with ${cmd(map, 'brainstorm')}.` : ''}${more}`, { milestone: cur.id, task: `T${t0.n}` });
    }
  }
  // A new project gets a real first step instead of "Nothing open" (first-run-guidance, L25).
  const capture = cmd(map, 'capture'), explorer = cmd(map, 'brainstorm');
  if (fresh && capture) return step(map, 'capture', `Nothing here yet.${more} Start with ${capture} to save ideas and notes${explorer ? `, or ${explorer} to explore an idea you already have` : ''}.`);
  const see = cmd(map, 'status'), reorder = cmd(map, 'roadmap');
  const hint = see ? ` Run ${see} to see what's next${reorder ? `, or ${reorder} to change the order` : ''}.` : reorder ? ` Run ${reorder} to change the order.` : '';
  return step(map, 'status', `Nothing open.${more}${hint}`);
}

/** Several items under way (spec skill-routing "Several active changes"): list them; the skill asks which one. */
function chooseStep(active, why) {
  const names = active.map(c => c.name);
  return { phase: 'choose', owner: null, use: 'pick a change', alternatives: [], reason: `${why} Pick one, then run /kit:next --change <name>.`, choose: names };
}

/** Items left for later (readiness D1, D4): open decisions in archived changes, PRD questions put off, and open
 *  loose ends that aren't `accepted` (loose-ends D6). */
export function leftoverCount(knowledge, archived, loose = []) {
  const builds = archived?.open ?? 0;
  const prd = (knowledge?.list?.prds ?? []).filter(p => p.valid && ['Draft', 'Review'].includes(p.status)).reduce((n, p) => n + (p.openQuestions ?? 0), 0);
  const ends = loose.filter(i => looseOpen(i) && i.kind !== 'accepted').length;
  return { builds, prd, loose: ends, total: builds + prd + ends };
}

/** Open loose ends blocking the change the step is for: a reminder, never the step (loose-ends D6). */
function blockedBy(loose, change) {
  const b = change ? loose.filter(i => looseOpen(i) && i.blocks === change).map(i => `${i.id} ${i.text}`) : [];
  return b.length ? { blocked: b } : {};
}

function openspecSuggest({ active, statusOf, map, verifyOf, decisionsOf = () => null }) {
  const s = openspecStep({ active, statusOf, map, verifyOf, decisionsOf });
  // build-readiness D3: open decisions ride along on any suggestion for the change; never a gate.
  const open = s.change ? openLine(decisionsOf(s.change)) : null;
  return open ? { ...s, open } : s;
}

function openspecStep({ active, statusOf, map, verifyOf, decisionsOf }) {
  // Only one change reaches here: several go through the choose step first (kit-status D6).
  const change = active[0];
  const st = statusOf(change.name) ?? {};
  const arts = st.artifacts ?? [];
  const extra = { change: change.name };
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
  if (s.waiting) lines.push(`  waiting: ${s.waiting}`);
  if (s.archived) lines.push(`  archived: ${s.archived}`);
  if (s.docs) lines.push(`  docs:  ${s.docs}`);
  if (s.nextArtifact) lines.push(`  next artifact: ${s.nextArtifact}`);
  if (s.alternatives?.length) lines.push(`  big or risky change? alternative: ${s.alternatives.map(a => `${a.use} (${a.tool})`).join('; ')}`);
  if (s.otherReady?.length) lines.push(`  other Ready PRDs: ${s.otherReady.join(', ')}`);
  if (s.choose?.length) lines.push(`  choose: ${s.choose.join(', ')}`);
  if (s.record) lines.push(`  record: ${s.record}`);
  for (const b of s.blocked ?? []) lines.push(`  blocked by: ${b} (/kit:loose-ends)`);
  for (const w of s.warnings ?? []) lines.push(`  WARNING ${w}`);
  return lines.join('\n');
}

/** Knowledge list plus every change's PRD link (active and archived), for prdSuggest. */
export function readKnowledge(dir) {
  const kdir = knowledgeDir(dir);
  const rel = path.relative(dir, kdir).split(path.sep).join('/');
  const list = listKnowledge(kdir);
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
  return { dir: rel, list, changes };
}

/**
 * (projectRelPath, commit, { ignoreSection }) -> true if the file has commits after `commit` or uncommitted changes;
 * null if git can't tell. With `ignoreSection`, the file's text at `commit` is compared with its text now, leaving
 * that `## section` out (prd-parts D1: a new Parts row on the parent isn't a change to the shared goals).
 */
export function gitChangedSince(dir) {
  const git = locate('git')?.path ?? 'git';
  const run = args => spawnSync(git, args, { cwd: dir, encoding: 'utf8', timeout: 30000 });
  return (file, commit, { ignoreSection = null } = {}) => {
    // "./" makes git read the path from the project folder, also when the project sits in a subfolder of the
    // repo (rc.2 feedback: the parent check gave up there). A file git can't show falls back to the plain check.
    const old = ignoreSection ? run(['show', `${commit}:./${file}`]) : null;
    if (old?.status === 0) {
      let now;
      try { now = fs.readFileSync(path.join(dir, file), 'utf8'); } catch { return true; }
      return withoutSection(old.stdout, ignoreSection) !== withoutSection(now, ignoreSection);
    }
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

/** Loose ends for the CLI; a file that can't be read becomes a warning, never an empty list in silence (verify C2). */
function looseFor(dir) {
  try { return { loose: readLooseEnds(dir).items }; } catch (e) { return { loose: [], looseWarning: e.message }; }
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
  const ei = args.indexOf('--explore');
  const explore = ei >= 0 ? args[ei + 1] : null;
  const ci = args.indexOf('--change');
  const change = ci >= 0 ? args[ci + 1] : null;
  const ri = args.indexOf('--registry');
  const registry = loadRegistry(ri >= 0 ? args[ri + 1] : undefined);
  const openspec = fs.existsSync(path.join(dir, 'openspec')) ? openspecJson('list --json', dir) : { root: null, changes: [] };
  let docs = null;
  try { docs = docsLine(pageStatus(dir)); } catch { /* no docs reminder */ }
  const s = suggest({ openspec, statusOf: name => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) return null; // folder names reach a shell string: kebab-case only
    const st = openspecJson(`status --change "${name}" --json`, dir);
    const files = planningFromFiles(path.join(dir, 'openspec', 'changes', name));
    return st ? { ...st, files } : { isPlanningComplete: files.complete, files }; // status failed: the files decide
  }, map: laneMap(registry), knowledge: readKnowledge(dir), changedSince: gitChangedSince(dir), verifyOf: name => { try { return verifyStatus({ dir, change: name }).status; } catch { return null; } }, decisionsOf: name => decisionStatus({ dir, change: name }), docs, archived: archivedOpen(dir), change, ...looseFor(dir), explores: (() => { try { return listRecords(dir); } catch { return []; } })(), explore, roadmap: (() => { try { const p = parseRoadmap(knowledgeDir(dir)); return p.exists ? reportRoadmap(p) : null; } catch { return null; } })() });
  console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : format(s));
}
