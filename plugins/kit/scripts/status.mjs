// /kit:status facts (kit-status design D1-D11; spec: project-status). Gathers what a project is, what's built,
// what's under way and what's next, each from the source that owns it, as JSON for the skill to put in words.
// Read-only: never writes a file and keeps no record of its own. Zero dependencies.
// Usage: node status.mjs [--dir <project>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { knowledgeDir, listKnowledge, prdLink } from './knowledge.mjs';
import { parseRoadmap, checkRoadmap, reportRoadmap, gitFindings, FINISHED } from './roadmap.mjs';
import { readKnowledge, isNewProject } from './next.mjs';
import { listRecords, OPEN as OPEN_EXPLORE } from './explore.mjs';
import { readDecisions } from './decisions.mjs';
import { locate } from './locate.mjs';
import { readLooseEnds, isOpen as looseOpen } from './loose-ends.mjs';

export const CAP = 5;
export const DESCRIPTION_FILES = ['PRODUCT.md', 'docs/project-context.md', 'README.md'];
const CONTEXT_DOC = 'docs/project-context.md';

// The kit's context template lines (current file, plus the template kits before 0.18 wrote), so a doc nobody has filled
// in isn't taken as the project's description (first-run-guidance D2).
const OLD_TEMPLATE_LINES = [
  '## Goal', 'What this project is for, in two or three sentences.', '## Users and needs', "Who it's for and the problem it solves for them.",
  '## Constraints', 'Budget, platform, deadlines, must-use or must-avoid tools.',
];
let templateLines = null;
function contextTemplateLines() {
  if (!templateLines) {
    let t = '';
    try { t = fs.readFileSync(fileURLToPath(new URL('../templates/project-context.md', import.meta.url)), 'utf8'); } catch { /* kit files missing */ }
    templateLines = new Set([...t.split(/\r?\n/), ...OLD_TEMPLATE_LINES].map(l => l.trim()).filter(Boolean));
  }
  return templateLines;
}

/** True when the doc holds nothing but the kit's template: its title, intro line, headings and hint lines. A heading the
 *  user added counts as their text (C6). */
export function isBlankContext(text) {
  const known = contextTemplateLines();
  return String(text).split(/\r?\n/).map(l => l.trim())
    .filter(l => l && !/^# .+: project context$/.test(l) && !l.startsWith('Living context doc.') && !/^<!--.*-->$/.test(l))
    .every(l => known.has(l));
}

/** The first file that describes the project; a blank context doc doesn't count. */
function describe(dir) {
  const t = read(path.join(dir, CONTEXT_DOC));
  const blank = t != null && isBlankContext(t);
  const found = DESCRIPTION_FILES.find(f => fs.existsSync(path.join(dir, f)) && !(f === CONTEXT_DOC && blank)) ?? null;
  if (found) return { path: found };
  // A blank doc means the kit set the project up and nobody has described it yet (first-run-guidance).
  if (blank) return { path: null, notDescribed: true, looked: DESCRIPTION_FILES, fix: `fill ${CONTEXT_DOC} (the problem, the users, what it does)` };
  return { path: null, looked: DESCRIPTION_FILES, fix: '/kit:start' };
}

const posix = p => p.split(path.sep).join('/');
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const dirs = d => { try { return fs.readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(); } catch { return []; } };
const ARCHIVED = /^(\d{4}-\d{2}-\d{2})-(.+)$/;
const isOpen = i => i.status === 'open' || i.status === 'later';
const words = name => name.replace(/-/g, ' ');

/** Whole days from an ISO date (or time) to `now`; null when unknown. */
export function ageDays(date, now = Date.now()) {
  const t = Date.parse(String(date ?? ''));
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((now - t) / 86400000));
}

/** Rows cut to CAP, with how many more there were (design D7). */
export function cap(rows, n = CAP) {
  return { rows: rows.slice(0, n), more: Math.max(0, rows.length - n) };
}

// ---------- owners (design D3, D5) ----------

/** Archived changes, newest first: { folder, change, date, specs: [capability] }. */
function archivedChanges(dir) {
  const root = path.join(dir, 'openspec', 'changes', 'archive');
  return dirs(root).filter(n => ARCHIVED.test(n)).reverse().map(folder => {
    const [, date, change] = ARCHIVED.exec(folder);
    return { folder, change, date, specs: specNames(path.join(root, folder, 'specs')) };
  });
}

/** Capability paths under a specs folder (folders holding a spec.md), e.g. "roadmap" or "identity/user-auth". */
function specNames(root) {
  const out = [];
  const walk = (d, rel) => {
    for (const n of dirs(d)) {
      const p = path.join(d, n), r = rel ? `${rel}/${n}` : n;
      if (fs.existsSync(path.join(p, 'spec.md'))) out.push(r);
      walk(p, r);
    }
  };
  walk(root, '');
  return out;
}

/** Built = main specs, newest-archived first; never PRD status, docs page or roadmap ticks (D3, D10). */
function built(dir, archived) {
  const specs = specNames(path.join(dir, 'openspec', 'specs'));
  const order = [];
  for (const a of archived) for (const s of a.specs) if (specs.includes(s) && !order.includes(s)) order.push(s);
  for (const s of specs) if (!order.includes(s)) order.push(s);
  return { count: specs.length, newest: order.slice(0, CAP), source: 'openspec/specs/' };
}

/** Task counts from a tasks.md: a box holding only x is done. */
function taskCounts(file) {
  const text = read(file) ?? '';
  // A checkbox holds only spaces or an x; "- [design](design.md)" is a link, not a task (verify C4).
  const boxes = text.split(/\r?\n/).filter(l => /^\s*- \[\s*[xX]?\s*\]/.test(l));
  const done = boxes.filter(l => /^\s*- \[\s*[xX]\s*\]/.test(l)).length;
  return { done, total: boxes.length };
}

/** Under way = active OpenSpec changes (D5): every folder under openspec/changes/ except archive/. */
function activeChanges(dir, knowledge) {
  const root = path.join(dir, 'openspec', 'changes');
  return dirs(root).filter(n => n !== 'archive').map(name => {
    const link = prdLink(read(path.join(root, name, 'proposal.md')));
    const prd = link ? knowledge.list.prds.find(p => `${knowledge.dir}/${p.path}` === link.path) : null;
    return { name, title: prd?.label ?? prd?.title ?? words(name), tasks: taskCounts(path.join(root, name, 'tasks.md')), source: `openspec/changes/${name}/` };
  });
}

function gitRun(git, dir) {
  return args => {
    if (!git) return null;
    const r = spawnSync(git, args, { cwd: dir, encoding: 'utf8', timeout: 30000 });
    return r.status === 0 ? r.stdout.trim() : null;
  };
}

// ---------- sections (spec "Facts from their owners"; D7, D11) ----------

const row = (item, left, status, source, extra = {}) => ({ item, left, status, source, ...extra });

function nowRows({ roadmap, report, changes, roadmapRel, last, now }) {
  const rows = [];
  if (report?.exists && report.current) {
    const m = roadmap.milestones.find(x => x.id === report.current);
    const r = report.rows.find(x => x.id === report.current);
    if (m && r) rows.push(row(m.title, r.left.map(t => `T${t.n} ${t.text}`), `${r.status}, ${r.done} of ${r.total} done`, `${roadmapRel}/${m.file}`, { kind: 'milestone', id: m.id }));
  }
  for (const c of changes) {
    const open = c.tasks.total - c.tasks.done;
    const commit = last(c.name);
    rows.push(row(c.title, c.tasks.total ? `${open} of ${c.tasks.total} tasks open` : 'planning', c.tasks.total && !open ? 'tasks done: verify, then archive' : 'under way', c.source,
      { kind: 'change', change: c.name, ...(commit ? { last: commit.text, age: ageDays(commit.date, now) } : {}) }));
  }
  return rows;
}

function nextAndAfter({ roadmap, report, knowledge, changes, roadmapRel, now }) {
  if (report?.exists) {
    const open = report.rows.filter(r => !FINISHED.includes(r.status) && r.id !== report.current);
    const asRow = r => {
      const m = roadmap.milestones.find(x => x.id === r.id);
      return row(r.title, r.left.map(t => `T${t.n} ${t.text}`), `${r.status}${r.total ? `, ${r.done} of ${r.total} done` : ''}`, m ? `${roadmapRel}/${m.file}` : `${roadmapRel}/roadmap.md`, { kind: 'milestone', id: r.id });
    };
    return { next: open.slice(0, 1).map(asRow), after: open.slice(1).map(asRow) };
  }
  // No roadmap: Ready PRDs no change uses, newest first, then notes no change or PRD uses. Hints only (D7).
  const used = new Set(changes.map(c => c.name));
  const ready = knowledge.list.prds.filter(p => p.valid && p.status === 'Ready' && !p.parts?.length && !(p.change && used.has(p.change)) && !knowledge.changes.some(c => c.link?.path === `${knowledge.dir}/${p.path}`))
    .map(p => row(p.label ?? p.title, 'ready to propose', 'PRD Ready', `${knowledge.dir}/${p.path}`, { kind: 'prd', age: ageDays(p.updated, now) }));
  return { next: ready, after: [] };
}

/** Open explore records as Now rows (explore-stage D7). */
function exploreRows(explores, kdir) {
  return explores.filter(r => OPEN_EXPLORE.includes(r.state)).map(r => row(r.title, r.questions.length ? r.questions.map(q => `${q.id} ${q.text}`) : 'ready for a PRD', r.state, `${kdir}/${r.file}`, { kind: 'explore', explore: r.slug }));
}

function saidRows({ dir, roadmap, roadmapRel, knowledge, changes, archived, now }) {
  const rows = [];
  if (roadmap?.exists) for (const w of roadmap.waiting.filter(x => !x.bad)) {
    rows.push(row(w.question, w.milestone === 'general' ? 'general' : `milestone ${w.milestone}`, 'waiting on you', `${roadmapRel}/roadmap.md`, { kind: 'roadmap', answer: '/kit:roadmap', date: w.date, age: ageDays(w.date, now) }));
  }
  for (const p of knowledge.list.prds.filter(x => x.valid && x.openQuestions > 0)) {
    rows.push(row(`PRD "${p.label ?? p.title}": ${p.openQuestions} open question(s)`, `${p.openQuestions}`, `PRD ${p.status}`, `${knowledge.dir}/${p.path}`, { kind: 'prd', answer: '/kit:prd', date: p.updated?.slice(0, 10) ?? null, age: ageDays(p.updated, now) }));
  }
  const decisions = (folder, change, archivedTo) => {
    const st = readDecisions(path.join(dir, folder, 'decisions.md'));
    for (const i of (st?.items ?? []).filter(isOpen)) {
      const date = i.dates?.later ?? i.dates?.opened ?? null;
      rows.push(row(i.text, change, archivedTo ? `${i.status} (archived change)` : i.status, `${folder}/decisions.md`, { kind: 'decision', answer: '/kit:ready', id: i.id, date, age: ageDays(date, now) }));
    }
  };
  for (const c of changes) decisions(`openspec/changes/${c.name}`, c.name, false);
  for (const a of archived) decisions(`openspec/changes/archive/${a.folder}`, a.change, true);
  // Grouped by kind (the order above), oldest first within each kind.
  const kinds = ['roadmap', 'prd', 'decision'];
  return kinds.flatMap(k => rows.filter(r => r.kind === k).sort((a, b) => String(a.date ?? '').localeCompare(String(b.date ?? ''))));
}

// ---------- loose ends (loose-ends design D5; spec project-status "Facts from their owners") ----------

/** Rows for important items and items blocking current work (important first), count lines per kind for the rest. */
export function looseSection(loose, current) {
  if (loose.error) return { rows: [], more: 0, counts: [], note: loose.error };
  if (!loose.exists) return { rows: [], more: 0, counts: [], note: 'none yet; /kit:loose-ends adds them' };
  const open = loose.items.filter(looseOpen);
  const shown = open.filter(i => i.kind !== 'accepted' && (i.important || (i.blocks && current.has(i.blocks))))
    .sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0) || Number(a.id.slice(1)) - Number(b.id.slice(1)));
  const rows = shown.map(i => row(i.text, i.kind, [i.important ? 'important' : null, i.blocks && current.has(i.blocks) ? `blocks ${i.blocks}` : null].filter(Boolean).join(', '),
    `${loose.rel} (${i.id})`, { kind: 'loose', id: i.id, answer: '/kit:loose-ends', origin: i.source }));
  const rest = open.filter(i => i.kind !== 'accepted' && !shown.includes(i));
  const counts = [...new Set(rest.map(i => i.kind))].map(k => ({ kind: k, n: rest.filter(i => i.kind === k).length }));
  return { ...cap(rows), counts, ...(!rows.length && !counts.length ? { note: 'none open' } : {}) };
}

// ---------- mismatches (spec "Mismatches shown, never resolved"; D4) ----------

export function mismatches({ roadmap, report, changes, knowledge, archived, branches, findings, roadmapRel, loose = null }) {
  const out = [];
  // (a) The roadmap says a milestone is active with work left, but nothing is under way for it.
  if (report?.exists && report.current && branches) {
    const m = roadmap.milestones.find(x => x.id === report.current);
    const left = m?.tasks.filter(t => !t.done && !t.dropped).length ?? 0;
    const branch = (m?.links.branches ?? []).some(b => branches.includes(b));
    if (m && m.status === 'active' && left > 0 && changes.length === 0 && !branch) {
      out.push({ what: `the roadmap says "${m.title}" (${m.id}) is active with ${left} task(s) left, but no change is active and no branch for it exists`, sources: [`${roadmapRel}/${m.file}`, 'openspec/changes/'], fix: 'propose a change for it, or update Now (/kit:roadmap)' });
    }
  }
  // (b) A PRD still says Building after its change was archived.
  const done = new Set(archived.map(a => a.change));
  for (const p of knowledge.list.prds.filter(x => x.valid && x.status === 'Building' && x.change && done.has(x.change))) {
    // A PRD can be built across several changes, so this asks rather than advising Shipped (L1).
    out.push({ what: `PRD "${p.label ?? p.title}" is Building, but its change ${p.change} is archived: is the PRD done, or does it continue in another change?`, sources: [`${knowledge.dir}/${p.path}`, 'openspec/changes/archive/'], fix: '/kit:prd: mark it Shipped, or link the next change (on your yes)' });
  }
  // (c) The roadmap check's own git findings, passed through with their fixes.
  for (const f of findings?.tidy ?? []) out.push({ what: f.problem, sources: [`${roadmapRel}/${f.file}`, 'git log'], fix: f.fix });
  for (const u of findings?.unplanned ?? []) out.push({ what: `change ${u.change} is under way but no milestone links it`, sources: [`openspec/changes/${u.change}/`, `${roadmapRel}/milestones/`], fix: u.fix });
  // (d) A loose end blocks work that is finished (loose-ends design D10).
  const items = loose?.items ?? [];
  const active = new Set(changes.map(c => c.name));
  for (const i of items.filter(x => looseOpen(x) && x.blocks)) {
    const m = roadmap?.exists ? roadmap.milestones.find(x => x.id === i.blocks) : null;
    const l = items.find(x => x.id === i.blocks);
    const why = m && FINISHED.includes(m.status) ? [`${m.id} is ${m.status}`, `${roadmapRel}/${m.file}`]
      : !m && !l && done.has(i.blocks) && !active.has(i.blocks) ? [`change ${i.blocks} is archived`, 'openspec/changes/archive/']
        : l && !looseOpen(l) ? [`${l.id} is ${l.state}`, loose.rel] : null;
    if (why) out.push({ what: `${i.id} blocks ${i.blocks}, but ${why[0]}`, sources: [loose.rel, why[1]], fix: `mark ${i.id} done, drop it, or point it at what it blocks now (/kit:loose-ends)` });
  }
  return out;
}

// ---------- gather ----------

/**
 * Every fact /kit:status shows. `git`: path to git, or null to skip git. `openspec`: whether the OpenSpec CLI was
 * found (the facts are read from the files; the CLI's absence is reported so the user can fix it).
 */
export function projectStatus(dir, { git = locate('git')?.path ?? null, openspec = Boolean(locate('openspec')), now = Date.now() } = {}) {
  dir = path.resolve(dir);
  const kroot = knowledgeDir(dir);
  const roadmapRel = posix(path.relative(dir, path.join(kroot, 'roadmaps')));
  const knowledge = readKnowledge(dir);
  const hasOpenSpec = fs.existsSync(path.join(dir, 'openspec'));
  const archived = archivedChanges(dir);
  const changes = activeChanges(dir, knowledge);
  const roadmap = parseRoadmap(kroot);
  const report = roadmap.exists ? reportRoadmap(roadmap, checkRoadmap(roadmap)) : { exists: false };
  const g = gitRun(git, dir);
  const isRepo = g(['rev-parse', '--is-inside-work-tree']) === 'true';
  const run = isRepo ? g : () => null;
  const findings = roadmap.exists && isRepo ? gitFindings(dir, roadmap) : null;
  const branchList = run(['branch', '--list', '--format=%(refname:short)']);
  const branches = isRepo ? (branchList ?? '').split('\n').filter(Boolean) : null;
  const last = name => {
    const out = run(['log', '-1', '--format=%h%x09%cI%x09%s', '--', `openspec/changes/${name}`]);
    if (!out) return null;
    const [h, date, subject] = out.split('\t');
    return { text: `${h} ${subject}`, date };
  };

  // The real path also when the file can't be read, so the source link still works (verify C3).
  const looseRel = posix(path.relative(dir, path.join(kroot, 'loose-ends.md')));
  let loose;
  try { loose = { ...readLooseEnds(dir), rel: looseRel }; } catch (e) { loose = { exists: true, items: [], error: e.message, rel: looseRel }; }
  const current = new Set([...(report.exists && report.current ? [report.current] : []), ...changes.map(c => c.name)]);
  const description = describe(dir);
  const ctx = { dir, roadmap, report, knowledge, changes, archived, roadmapRel, now, last };
  const { next, after } = nextAndAfter(ctx);
  let explores = [];
  try { explores = listRecords(dir); } catch { /* no explore folder */ }
  const nowAll = [...nowRows(ctx), ...exploreRows(explores, knowledge.dir)];
  const sections = {
    now: cap(nowAll),
    // With or without a roadmap: notes are never rows, only a plain count (flexible-handoffs D7).
    next: { ...cap(next), noteCount: knowledge.list.notes.length },
    said: cap(saidRows(ctx)),
    loose: looseSection(loose, current),
    after: cap(after),
  };
  const missing = [
    ...(roadmap.exists ? [] : [{ source: 'roadmap', fix: '/kit:roadmap can set the order (optional)' }]),
    ...(!hasOpenSpec ? [{ source: 'openspec', fix: '/kit:start sets OpenSpec up' }] : !openspec ? [{ source: 'openspec CLI', fix: 'read from the files instead; /kit:setup installs it' }] : []),
    ...(!git ? [{ source: 'git', fix: '/kit:setup installs it; last commits and branch checks skipped' }] : !isRepo ? [{ source: 'git', fix: 'not a git repository; last commits and branch checks skipped' }] : []),
  ];
  // Every active change, not only those left after the section cap (verify C5).
  const underWay = nowAll.filter(r => r.kind === 'change' || r.kind === 'explore');
  const builtNow = built(dir, archived);
  // The same new-project test as /kit:next (first-run-guidance D1); shown only when nothing is under way or queued.
  const fresh = isNewProject({ knowledge, explores });
  return {
    dir: posix(dir),
    overview: {
      description,
      built: builtNow,
      archived: archived.slice(0, CAP).map(a => ({ change: a.change, date: a.date, source: `openspec/changes/archive/${a.folder}/` })),
    },
    roadmap: roadmap.exists,
    sections,
    mismatches: mismatches({ roadmap, report, changes, knowledge, archived, branches, findings, roadmapRel, loose }),
    notes: [...(findings?.notes ?? []), ...explores.filter(r => r.state === 'unreadable').map(r => r.error)],
    missing,
    handoff: underWay.length
      ? { underWay: underWay.map(r => ({ item: r.item, ...(r.change ? { change: r.change } : { explore: r.explore }) })), command: '/kit:next' }
      : { underWay: [], candidates: sections.next.rows.map(r => ({ item: r.item, source: r.source, age: r.age ?? null })), command: '/kit:next', fresh },
  };
}

// ---------- output ----------

const TITLES = { now: 'Now', next: 'Next', said: "We said we'd do", loose: 'Loose ends', after: 'After' };

export function format(s) {
  const o = s.overview;
  const out = [`Project   ${o.description.path ?? (o.description.notDescribed ? `Project not described yet: ${o.description.fix}` : `no description found (looked for ${o.description.looked.join(', ')}; ${o.description.fix})`)}`,
    `Built     ${o.built.count} capabilities${o.built.newest.length ? `; newest: ${o.built.newest.join(', ')}` : ''}`];
  for (const [k, title] of Object.entries(TITLES)) {
    const sec = s.sections[k];
    out.push('', title);
    if (!sec.rows.length && !sec.counts?.length && !sec.noteCount) out.push(`  ${sec.note ?? '(none)'}`);
    for (const r of sec.rows) out.push(`  ${r.item} | ${Array.isArray(r.left) ? r.left.join('; ') || '-' : r.left} | ${r.status} | ${r.source}${r.answer ? ` | ${r.answer}` : ''}`);
    if (sec.more) out.push(`  +${sec.more} more`);
    // flexible-handoffs D7: a plain count, no call to action.
    if (sec.noteCount) out.push(`  + ${sec.noteCount} note${sec.noteCount === 1 ? '' : 's'}`);
    if (sec.counts?.length) out.push(`  + ${sec.counts.map(c => `${c.n} ${c.kind}`).join(', ')} (/kit:loose-ends)`);
  }
  if (s.mismatches.length) {
    out.push('', `Doesn't match (${s.mismatches.length})`);
    for (const m of s.mismatches) out.push(`  ${m.what} [${m.sources.join(' vs ')}] fix: ${m.fix}`);
  }
  for (const m of s.missing) out.push(`Missing: ${m.source} (${m.fix})`);
  for (const n of s.notes) out.push(`Note: ${n}`);
  const h = s.handoff;
  out.push('', h.underWay.length
    ? `-> Working on: ${h.underWay.map(u => u.item).join(', ')}. Run ${h.command}${h.underWay.length > 1 ? ' (it asks which one)' : ''}.`
    : h.candidates.length ? `-> Nothing under way. Pick the next item (first: ${h.candidates[0].item}), then run ${h.command}.` : h.fresh ? `-> Nothing here yet. Start with /kit:capture to save ideas and notes, or /opsx:explore to explore an idea you already have.`
        : `-> Nothing under way and nothing queued. Capture an idea (/kit:capture) or plan one (/kit:roadmap).`);
  return out.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const di = args.indexOf('--dir');
    const s = projectStatus(di >= 0 ? args[di + 1] : process.cwd());
    console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : format(s));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}
