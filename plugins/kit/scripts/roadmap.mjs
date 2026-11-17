// /kit:roadmap helper (roadmap-structure design D1-D7; spec: roadmap). The only writer of a project's
// roadmap, and its check: one file per milestone under <knowledge>/roadmaps/. Warns, never blocks.
// Zero dependencies.
// Usage: node roadmap.mjs <command> [--dir <project>] [--json] [options]
//   check | report
//   new
//   add      --title <t> [--goal <g>] [--id <ID>] [--after <ID> | --before <ID>] [--notes a,b]
//   status   --id <ID> --to planned|active|paused|done|dropped
//   task     --id <ID> --text <t>
//   edit     --id <ID> [--title <t>] [--goal <g>]            (keeps the ID; a new title is logged in the drift log)
//   tick     --id <ID> --task T<n> [--undo] [--date YYYY-MM-DD]   (writes "(done <date>)")
//   checkpoint --id <ID> (--after T<n> | --archive <change> | --clear)
//   decide   --id <ID> (--continue | --switch-to <ID>) --why <t> [--resume <t>]
//   resume   --id <ID> --text <t>                             (the one "Resume:" line under ## Notes)
//   drop-task --id <ID> --task T<n> --reason <r> [--date YYYY-MM-DD]
//   edit-task --id <ID> --task T<n> --text <t>
//   order    --ids <ID,ID,...>
//   now      (--text <t> | --text-file <f>)
//   wait     --milestone <ID|general> --question <q> [--date YYYY-MM-DD]
//   answer   --match <text> --answer <a> [--by user] [--date YYYY-MM-DD]
//   link     --id <ID> --kind notes|prd|changes|branches --value <v>
//   drift    --what <t> --why <t> [--alt <t>] [--impact <t>] [--by user] [--date YYYY-MM-DD]
// Exit codes: 0 ok (also with findings), 1 error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { knowledgeDir, parseFrontmatter, writeFrontmatter, slugify, today } from './knowledge.mjs';
import { locate } from './locate.mjs';
import { looseSummary } from './loose-ends.mjs';

export const STATUSES = ['planned', 'active', 'paused', 'done', 'dropped'];
export const FINISHED = ['done', 'dropped'];
export const LINK_KINDS = ['notes', 'prd', 'changes', 'branches'];
export const HEADINGS = ['North star', 'Principles', 'Order', 'Now', 'Waiting on you'];
export const LIMITS = { lines: 150, lineChars: 300, nowLines: 5 };

const TEMPLATES = fileURLToPath(new URL('../templates/roadmap/', import.meta.url));
const ID = /^[A-Za-z][A-Za-z0-9.-]*$/;
const TASK = /^- \[([ xX-])\] T(\d+) (\S.*)$/;
// Task text that starts with the task's own number ("T1 T1 PRD") is refused (L18); other T-words such as "T3 stack" or
// "t2.micro" are real text (C4).
const ownNumber = (text, n) => new RegExp(`^\\s*T${n}(?![\\w.])`, 'i').test(text);
// The note drop-task adds, removed again when the task is reopened (C3).
const DROP_NOTE = /\s*\(dropped \d{4}-\d{2}-\d{2}: .*\)$/;
// The date tick adds to a done task, kept out of its text and removed again on untick (tracks D8).
const DONE_NOTE = /\s*\(done (\d{4}-\d{2}-\d{2})\)$/;
// A milestone's checkpoint: after a task, or after a change is archived (tracks D1).
const CHECKPOINT = /^(?:T(\d+)|archive ([A-Za-z0-9][\w.-]*))$/;
const RESUME = /^Resume:\s*(.*)$/;
// More than this many active milestones gets one tidy-up line (spec "More than two active milestones").
export const TRACK_CAP = 2;
const WAIT = /^- \[([^\]]+)\] (.+?) \(proposed (\d{4}-\d{2}-\d{2})\)$/;

const norm = s => s.replace(/\r\n/g, '\n');
const read = p => { try { return norm(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const rdir = root => path.join(root, 'roadmaps');
const mainFile = root => path.join(rdir(root), 'roadmap.md');
const isComment = l => /^\s*<!--.*-->\s*$/.test(l);

// ---------- read (design D2) ----------

/** The `## <heading>` sections of roadmap.md: { lines, sections: { name: { start, end } } } (start = heading line index). */
function sections(text) {
  const lines = norm(text).split('\n');
  const heads = [];
  lines.forEach((l, i) => { const m = /^##\s+(.+?)\s*$/.exec(l); if (m) heads.push({ name: m[1], i }); });
  const out = {};
  heads.forEach((h, k) => { out[h.name] = { start: h.i, end: k + 1 < heads.length ? heads[k + 1].i : lines.length }; });
  return { lines, sections: out };
}

const sectionLines = (s, name) => {
  const sec = s.sections[name];
  if (!sec) return [];
  return s.lines.slice(sec.start + 1, sec.end).map((text, k) => ({ text, line: sec.start + 2 + k }))
    .filter(x => x.text.trim() && !isComment(x.text));
};

function readMilestone(file, folder) {
  const raw = read(file) ?? '';
  const fm = parseFrontmatter(raw);
  const offset = fm.hasFrontmatter ? raw.slice(0, raw.length - fm.body.length).split('\n').length - 1 : 0;
  const tasks = [], badTasks = [];
  let goal = null, goalLine = null, resume = null, heading = null, inComment = false;
  fm.body.split('\n').forEach((l, k) => {
    const line = offset + k + 1;
    // Lines inside a multi-line <!-- ... --> comment are nobody's goal (verify finding).
    if (inComment) { if (/-->/.test(l)) inComment = false; return; }
    if (/^\s*<!--/.test(l) && !/-->/.test(l)) { inComment = true; return; }
    const h = /^##\s+(.+?)\s*$/.exec(l);
    if (h) heading = h[1];
    const t = TASK.exec(l);
    // A dropped task (`- [-]`) is neither done nor left (kit-debt-fixes D1). A done task's date is not its text (D8).
    if (t) {
      const done = /[xX]/.test(t[1]);
      const date = done ? DONE_NOTE.exec(t[3]) : null;
      tasks.push({ n: Number(t[2]), done, dropped: t[1] === '-', text: date ? t[3].replace(DONE_NOTE, '') : t[3], doneDate: date?.[1] ?? null, line });
    } else if (/^\s*- \[/.test(l)) badTasks.push({ text: l, line });
    // The resume note is the `Resume:` line under ## Notes only; the same words elsewhere are the user's (verify finding).
    else if (heading === 'Notes' && RESUME.test(l)) resume = RESUME.exec(l)[1].trim();
    // The goal is the first plain line before any heading, so a note or a link line is never taken for it (verify finding).
    else if (!goal && heading === null && l.trim() && !/^#/.test(l) && !isComment(l)) { goal = l.trim(); goalLine = k; }
  });
  const d = fm.data ?? {};
  const list = v => (Array.isArray(v) ? v : v ? [v] : []);
  return {
    file: `${folder}/${path.basename(file)}`, folder, ok: fm.ok, error: fm.error ?? null,
    id: d.id ?? null, title: d.title ?? null, status: d.status ?? null, goal, goalLine, resume,
    checkpoint: parseCheckpoint(d.checkpoint),
    links: Object.fromEntries(LINK_KINDS.map(k => [k, list(d[k])])), tasks, badTasks, data: d, body: fm.body,
  };
}

/** `checkpoint:` as { raw, task } or { raw, change }, { raw, bad } when malformed, or null when absent. */
function parseCheckpoint(v) {
  if (v === undefined || v === null || v === '') return null;
  const raw = String(v).trim();
  const m = CHECKPOINT.exec(raw);
  if (!m) return { raw, bad: true };
  return m[1] !== undefined ? { raw, task: Number(m[1]) } : { raw, change: m[2] };
}
// `task` can be 0 (T0), so test for its presence, not its truth (verify finding).
const isTaskCp = c => c.task != null;
const checkpointLabel = c => (isTaskCp(c) ? `T${c.task}` : `the archive of ${c.change}`);

/** Whether a milestone's checkpoint is reached: its task is ticked, or its change is in `archived` (tracks D2). */
export function checkpointReached(m, archived = new Set()) {
  const c = m.checkpoint;
  if (!c || c.bad) return false;
  if (isTaskCp(c)) return Boolean(m.tasks.find(t => t.n === c.task && t.done));
  return archived.has(c.change);
}

/** Names of the archived OpenSpec changes in a project (folder `YYYY-MM-DD-<name>`). */
export function archivedNames(projectDir) {
  try {
    return new Set(fs.readdirSync(path.join(projectDir, 'openspec', 'changes', 'archive'), { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => /^\d{4}-\d{2}-\d{2}-(.+)$/.exec(e.name)?.[1]).filter(Boolean));
  } catch { return new Set(); }
}

/** Last done task: the latest date, the highest number for a tie; undated ones only when none is dated (spec "Tick date"). */
export function lastDone(tasks) {
  const done = tasks.filter(t => t.done && !t.dropped);
  const dated = done.filter(t => t.doneDate);
  const pool = dated.length ? dated : done;
  return pool.sort((a, b) => (b.doneDate ?? '').localeCompare(a.doneDate ?? '') || b.n - a.n)[0] ?? null;
}

/** Everything the check, report and writes need, from <root>/roadmaps/ (root = the knowledge folder). */
export function parseRoadmap(root) {
  const text = read(mainFile(root));
  if (text == null) return { exists: false, root };
  const s = sections(text);
  const order = sectionLines(s, 'Order').map(x => ({ ...x, id: /^- (\S+)/.exec(x.text)?.[1] ?? null }));
  const now = sectionLines(s, 'Now').map(x => x.text.trim());
  const waiting = sectionLines(s, 'Waiting on you').map(x => {
    const m = WAIT.exec(x.text.trim());
    return m ? { ...x, milestone: m[1], question: m[2], date: m[3] } : { ...x, bad: true };
  });
  const milestones = [];
  for (const folder of ['milestones', 'done']) {
    const dir = path.join(rdir(root), folder);
    let names = [];
    try { names = fs.readdirSync(dir).filter(n => n.endsWith('.md')).sort(); } catch { /* none */ }
    for (const n of names) milestones.push(readMilestone(path.join(dir, n), folder));
  }
  const driftText = read(path.join(rdir(root), 'drift-log.md')) ?? '';
  const drift = driftText.split('\n').filter(l => /^\|\s*\d{4}-\d{2}-\d{2}/.test(l)).map(raw => ({ raw }));
  return { exists: true, root, text, lines: s.lines, headings: Object.keys(s.sections), order, now, waiting, milestones, drift };
}

// ---------- check (spec "Roadmap check warns and never blocks") ----------

const finding = (file, line, problem, fix) => ({ file, line, problem, fix });

/** Pure check of a parsed roadmap: { broken, tidy, good }. Never throws on content. */
export function checkRoadmap(p) {
  const broken = [], tidy = [];
  if (!p.exists) return { exists: false, broken, tidy, good: true };
  for (const h of HEADINGS) if (!p.headings.includes(h)) broken.push(finding('roadmap.md', null, `missing heading "## ${h}"`, `add "## ${h}" (see the kit's roadmap template)`));
  const ids = new Map();
  for (const m of p.milestones) {
    if (!m.ok) { broken.push(finding(m.file, null, `unreadable frontmatter (${m.error})`, 'fix the frontmatter: id, title, status')); continue; }
    for (const k of ['id', 'title', 'status']) if (!m[k]) broken.push(finding(m.file, null, `missing ${k}`, `add "${k}:" to the frontmatter`));
    if (m.status && !STATUSES.includes(m.status)) broken.push(finding(m.file, null, `unknown status "${m.status}"`, `use one of ${STATUSES.join(', ')}`));
    if (m.id) ids.set(m.id, [...(ids.get(m.id) ?? []), m.file]);
    for (const b of m.badTasks) broken.push(finding(m.file, b.line, `task line in the wrong shape: ${b.text.trim()}`, 'write it as "- [ ] T<n> <text>"'));
    const seen = new Set();
    for (const t of m.tasks) { if (seen.has(t.n)) broken.push(finding(m.file, t.line, `T${t.n} used twice`, 'give each task its own number')); seen.add(t.n); }
    // A dropped task keeps its date and reason (spec "Roadmap layout"; V1).
    for (const t of m.tasks.filter(x => x.dropped && !DROP_NOTE.test(x.text))) broken.push(finding(m.file, t.line, `T${t.n} is dropped without its date and reason`, 'write it as "- [-] T<n> <text> (dropped <YYYY-MM-DD>: <reason>)", or use "roadmap.mjs drop-task"'));
    if (m.status === 'active' && !m.tasks.length) broken.push(finding(m.file, null, 'status is active but it has no tasks', 'add tasks ("roadmap.mjs task"), or set it back to planned'));
    // Every task dropped: nothing is left to do, so it reads as finished (C2, with /kit:next's C1).
    else if (m.status === 'active' && m.tasks.every(t => t.dropped)) tidy.push(finding(m.file, null, 'status is active but every task is dropped', 'mark it done or dropped ("roadmap.mjs status"), or add a task'));
    // A checkpoint in the wrong shape, or naming a task that's missing or dropped (tracks D5).
    if (m.checkpoint?.bad) broken.push(finding(m.file, null, `checkpoint "${m.checkpoint.raw}" in the wrong shape`, 'write it as "checkpoint: T<n>" or "checkpoint: archive <change>", or use "roadmap.mjs checkpoint"'));
    else if (m.checkpoint && isTaskCp(m.checkpoint)) {
      const t = m.tasks.find(x => x.n === m.checkpoint.task);
      if (!t) broken.push(finding(m.file, null, `checkpoint after T${m.checkpoint.task}, which this milestone doesn't have`, 'set it after an existing task ("roadmap.mjs checkpoint"), or clear it (--clear)'));
      else if (t.dropped) broken.push(finding(m.file, t.line, `checkpoint after T${t.n}, which is dropped`, 'set it after an open task ("roadmap.mjs checkpoint"), or clear it (--clear)'));
    }
    if (m.folder === 'milestones' && FINISHED.includes(m.status)) tidy.push(finding(m.file, null, `status is ${m.status}`, 'move it to done/ ("roadmap.mjs status" does this)'));
    if (m.folder === 'done' && m.status && !FINISHED.includes(m.status)) tidy.push(finding(m.file, null, `in done/ but status is ${m.status}`, 'move it back to milestones/'));
  }
  for (const [id, files] of ids) if (files.length > 1) broken.push(finding(files[1], null, `duplicate ID ${id} (also ${files[0]})`, 'IDs are never reused: give one of them a new ID'));
  const ordered = new Set();
  for (const o of p.order) {
    // A line that isn't a list item is the user's own text: it belongs elsewhere, not in an ID (L23).
    if (!/^\s*- /.test(o.text)) { broken.push(finding('roadmap.md', o.line, `text under ## Order: ${o.text.trim()}`, 'move this text out of ## Order (for example under North star); Order holds only milestone IDs')); continue; }
    if (!o.id || !ID.test(o.id)) { broken.push(finding('roadmap.md', o.line, `order line in the wrong shape: ${o.text.trim()}`, 'write it as "- <ID>"')); continue; }
    ordered.add(o.id);
    if (!ids.has(o.id)) broken.push(finding('roadmap.md', o.line, `${o.id} is in the order but has no milestone file`, `add milestones/${o.id.toLowerCase()}-<slug>.md, or remove it from the order`));
  }
  for (const [id, files] of ids) if (!ordered.has(id)) broken.push(finding(files[0], null, `${id} is not in the order`, 'add it under "## Order" where it belongs'));
  for (const w of p.waiting) {
    if (w.bad) broken.push(finding('roadmap.md', w.line, `waiting item in the wrong shape: ${w.text.trim()}`, 'write it as "- [<ID>|general] <question> (proposed YYYY-MM-DD)"'));
    else if (w.milestone !== 'general' && !ids.has(w.milestone)) broken.push(finding('roadmap.md', w.line, `waiting item names unknown milestone ${w.milestone}`, 'use a milestone ID from the order, or "general"'));
  }
  const active = p.milestones.filter(m => m.status === 'active').map(m => m.id);
  if (active.length > TRACK_CAP) tidy.push(finding('roadmap.md', null, `${active.length} milestones are active (${active.join(', ')}): more than ${TRACK_CAP} tracks in flight is a lot to switch between`, 'pause one ("roadmap.mjs status --to paused"), or keep going: this never blocks'));
  if (p.lines.length > LIMITS.lines) tidy.push(finding('roadmap.md', null, `${p.lines.length} lines (limit ${LIMITS.lines})`, 'shorten prose; finished work lives in done/ and the drift log'));
  p.lines.forEach((l, i) => { if (l.length > LIMITS.lineChars) tidy.push(finding('roadmap.md', i + 1, `line is ${l.length} characters (limit ${LIMITS.lineChars})`, 'shorten it, or move the detail into a milestone file')); });
  if (p.now.length > LIMITS.nowLines) tidy.push(finding('roadmap.md', null, `Now has ${p.now.length} lines (limit ${LIMITS.nowLines})`, 'keep Now to what is being worked on and where it stopped'));
  return { exists: true, broken, tidy, good: !broken.length && !tidy.length };
}

// ---------- git: stale Now and unplanned work (spec "Stale Now and unplanned work"; design D3, D4) ----------

/** Findings that need the project folder: { tidy: [stale Now], unplanned: [{ change, fix }], notes: [] }. */
export function gitFindings(projectDir, p) {
  const out = { tidy: [], unplanned: [], notes: [] };
  if (!p.exists) return out;
  const linked = new Set(p.milestones.flatMap(m => m.links.changes));
  let changes = [];
  try { changes = fs.readdirSync(path.join(projectDir, 'openspec', 'changes'), { withFileTypes: true }).filter(e => e.isDirectory() && e.name !== 'archive').map(e => e.name).sort(); } catch { /* no OpenSpec */ }
  for (const c of changes) if (!linked.has(c)) out.unplanned.push({ change: c, fix: `link it to a milestone ("roadmap.mjs link --kind changes"), or add a drift entry if it's off the plan` });

  const git = locate('git')?.path ?? 'git';
  const run = (args, extra = {}) => spawnSync(git, args, { cwd: projectDir, encoding: 'utf8', timeout: 30000, ...extra });
  const rel = path.relative(projectDir, mainFile(p.root)).split(path.sep).join('/');
  const last = run(['log', '-1', '--format=%cI', '--', rel]);
  const since = last.status === 0 ? last.stdout.trim() : '';
  if (!since) { out.notes.push("can't check whether Now is out of date until roadmap.md is committed"); return out; }
  const day = s => s.slice(0, 10);
  const after = t => Date.parse(t) > Date.parse(since);
  // Only the commit that added a change's archive folder counts as its archive (C5), and only commits after `since` (C10).
  const arch = run(['log', `--since=${since}`, '--diff-filter=A', '--format=@%cI', '--name-only', '--', 'openspec/changes/archive']);
  const archived = new Map();
  let when = null;
  for (const l of arch.status === 0 ? arch.stdout.split('\n') : []) {
    if (l.startsWith('@')) { when = l.slice(1); continue; }
    const m = /^openspec\/changes\/archive\/([^/]+)\//.exec(l);
    if (m && when && after(when) && !archived.has(m[1])) archived.set(m[1], when);
  }
  for (const [name, t] of archived) out.tidy.push(finding('roadmap.md', null, `Now may be stale: roadmap last updated ${day(since)}, then change ${name.replace(/^\d{4}-\d{2}-\d{2}-/, '')} was archived ${day(t)}`, 'update Now ("roadmap.mjs now") and tick its task'));
  const merges = run(['log', '--merges', `--since=${since}`, '--format=%H\t%P\t%cI\t%s']);
  const rows = (merges.status === 0 ? merges.stdout.split('\n').filter(Boolean) : []).map(l => {
    const [h, parents, t, subject] = l.split('\t');
    return { h, first: parents.split(' ')[0], t, subject };
  });
  // A merge that brings in a roadmap update is the update itself, not a reason to call Now stale (C4). One
  // `diff-tree --stdin` call compares each merge with its first parent only and prints the merge's ID before each
  // difference (kit-debt-fixes D3, L13). Source: https://git-scm.com/docs/git-diff-tree (--stdin: "The remaining
  // commits ... are used as if they are parents of the first commit"; "the ID of the first (or only) commit ... is
  // printed"); checked against today's per-merge `git diff` on 20 merges, 2026-10-19.
  const touched = new Set();
  if (rows.length) {
    const dt = run(['diff-tree', '--stdin', '-r', '--name-only', '--', rel], { input: rows.map(r => `${r.h} ${r.first}\n`).join('') });
    const ids = new Set(rows.map(r => r.h));
    for (const l of dt.status === 0 ? dt.stdout.split('\n') : []) if (ids.has(l.trim())) touched.add(l.trim());
  }
  for (const r of rows) {
    if (after(r.t) && !touched.has(r.h)) out.tidy.push(finding('roadmap.md', null, `Now may be stale: roadmap last updated ${day(since)}, then merge "${r.subject}" on ${day(r.t)}`, 'update Now ("roadmap.mjs now")'));
  }
  return out;
}

// ---------- report (spec "Roadmap report", "Waiting on you by relevance") ----------

/** Rows in order, Now, the current milestone, Blocking now and Later. Never sorts or flags by age. */
export function reportRoadmap(p, check = checkRoadmap(p), { archived = new Set() } = {}) {
  if (!p.exists) return { exists: false };
  const base = baseReport(p, check);
  // Tracks: every active or paused milestone, in order, side by side (spec "Checkpoint reached"; tracks D4).
  const byId = new Map(p.milestones.map(m => [m.id, m]));
  const tracks = base.rows.filter(r => r.status === 'active' || r.status === 'paused').map(r => {
    const m = byId.get(r.id);
    const last = lastDone(m.tasks);
    const next = m.tasks.filter(t => !t.done && !t.dropped).sort((a, b) => a.n - b.n)[0] ?? null;
    const cp = m.checkpoint && !m.checkpoint.bad ? m.checkpoint : null;
    return {
      id: r.id, title: r.title, status: r.status, done: r.done, total: r.total,
      last: last ? { n: last.n, text: last.text, date: last.doneDate } : null,
      next: next ? { n: next.n, text: next.text } : null,
      resume: m.resume,
      checkpoint: cp ? { after: checkpointLabel(cp), raw: cp.raw, reached: checkpointReached(m, archived) } : null,
    };
  });
  // Every open milestone's checkpoint, for its report row: a planned one can carry one too (verify finding).
  const marks = base.rows.filter(r => !FINISHED.includes(r.status)).map(r => byId.get(r.id))
    .filter(m => m?.checkpoint && !m.checkpoint.bad)
    .map(m => ({ id: m.id, title: m.title, status: m.status, after: checkpointLabel(m.checkpoint), reached: checkpointReached(m, archived) }));
  const checkpoints = marks.filter(k => k.reached).map(({ id, title, status, after: a }) => ({ id, title, status, after: a }));
  const ids = new Set(tracks.map(t => t.id));
  // With one track only, the other choice is the next planned milestone after it in the order, else the first one
  // (spec "No other track"; verify finding).
  let alt = null;
  if (tracks.length === 1) {
    const at = base.rows.findIndex(r => r.id === tracks[0].id);
    const planned = r => r.status === 'planned' && !ids.has(r.id);
    alt = base.rows.slice(at + 1).find(planned) ?? base.rows.find(planned) ?? null;
  }
  return { ...base, tracks, marks, checkpoints, alternative: alt ? { id: alt.id, title: alt.title, status: alt.status } : null };
}

function baseReport(p, check) {
  const byId = new Map(p.milestones.map(m => [m.id, m]));
  const rows = p.order.filter(o => o.id).map(o => {
    const m = byId.get(o.id);
    const kept = m?.tasks.filter(t => !t.dropped) ?? [];
    return { id: o.id, title: m?.title ?? '(no file)', status: m?.status ?? '?', done: kept.filter(t => t.done).length, total: kept.length, dropped: (m?.tasks.length ?? 0) - kept.length, left: kept.filter(t => !t.done) };
  });
  const open = rows.filter(r => !FINISHED.includes(r.status));
  const current = (rows.find(r => r.status === 'active') ?? open[0])?.id ?? null;
  const next = current ? open[open.findIndex(r => r.id === current) + 1]?.id ?? null : null;
  const items = p.waiting.filter(w => !w.bad);
  const blocking = items.filter(w => w.milestone === 'general' || w.milestone === current || w.milestone === next);
  const later = items.filter(w => !blocking.includes(w));
  return { exists: true, rows, now: p.now, current, next, blocking, later, check };
}

// ---------- writes (design D1): each returns the broken findings after it ----------

const after = root => ({ broken: checkRoadmap(parseRoadmap(root)).broken });
function need(root) {
  const p = parseRoadmap(root);
  if (!p.exists) throw new Error(`no roadmap at ${path.relative(process.cwd(), mainFile(root)) || mainFile(root)} (run "roadmap.mjs new")`);
  return p;
}
function milestoneOf(p, id) {
  if (!String(id ?? '').trim()) throw new Error('--id is required (a milestone ID such as M1)');
  // "m1" finds M1; the file's own ID is what gets written (rc.2 feedback).
  const want = String(id).trim();
  const m = p.milestones.find(x => x.id === want) ?? p.milestones.find(x => x.id.toLowerCase() === want.toLowerCase());
  if (!m) throw new Error(`no milestone ${want} (milestones: ${p.milestones.map(x => x.id).join(', ') || 'none'})`);
  return m;
}
const fileOf = (root, m) => path.join(rdir(root), m.file);
const writeMilestone = (root, m, data, body) => fs.writeFileSync(fileOf(root, m), writeFrontmatter(data, body));

/** The Order lines for new IDs: each ID line takes the next ID, the user's other lines stay where they were (L9). */
function orderLines(order, ids) {
  const out = [];
  let k = 0;
  let last = -1;
  for (const o of order) {
    if (o.id && k < ids.length) { out.push(`- ${ids[k++]}`); last = out.length; } else if (!o.id) out.push(o.text);
  }
  // An added ID goes after the last ID line (or at the end when there was none).
  out.splice(last < 0 ? out.length : last, 0, ...ids.slice(k).map(x => `- ${x}`));
  return out;
}

/** Replaces the lines of one `## name` section of roadmap.md with `lines` (blank lines around kept). */
function setSection(root, name, lines) {
  const s = sections(read(mainFile(root)));
  const sec = s.sections[name];
  if (!sec) throw new Error(`roadmap.md has no "## ${name}" heading`);
  const keep = s.lines.slice(sec.start + 1, sec.end).filter(isComment);
  const out = [...s.lines.slice(0, sec.start + 1), '', ...keep, ...lines, '', ...s.lines.slice(sec.end)];
  fs.writeFileSync(mainFile(root), out.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\n*$/, '\n'));
}

export function newRoadmap(root) {
  if (fs.existsSync(mainFile(root))) throw new Error('a roadmap already exists here');
  for (const sub of ['milestones', 'done']) fs.mkdirSync(path.join(rdir(root), sub), { recursive: true });
  for (const f of ['roadmap.md', 'drift-log.md']) fs.copyFileSync(path.join(TEMPLATES, f), path.join(rdir(root), f));
  return { created: 'roadmaps/', ...after(root) };
}

/** Next free ID: one more than the highest `M<n>` used by any milestone file or order line (never reused). */
function nextId(p) {
  const used = [...p.milestones.map(m => m.id), ...p.order.map(o => o.id)].filter(Boolean);
  const max = Math.max(0, ...used.map(id => Number(/^M(\d+)/i.exec(id)?.[1] ?? 0)));
  return `M${max + 1}`;
}

export function addMilestone(root, { title, goal = '', id = null, after: a = null, before = null, notes = [] }) {
  const p = need(root);
  if (!title?.trim()) throw new Error('--title is required');
  // File names are lowercased, so IDs are compared without case (C3).
  const used = new Set([...p.milestones.map(m => m.id), ...p.order.map(o => o.id)].filter(Boolean).map(x => x.toLowerCase()));
  if (id && used.has(id.toLowerCase())) throw new Error(`${id} is already used; IDs are never reused`);
  if (id && !ID.test(id)) throw new Error(`invalid ID "${id}"`);
  const newId = id ?? nextId(p);
  // Everything that can fail is checked before anything is written (C2, C3).
  const ids = p.order.map(o => o.id).filter(Boolean);
  const anchor = a ?? before;
  let at = ids.length;
  if (anchor) { const i = ids.indexOf(anchor); if (i < 0) throw new Error(`${anchor} is not in the order`); at = a ? i + 1 : i; }
  const file = path.join(rdir(root), 'milestones', `${newId.toLowerCase()}-${slugify(title)}.md`);
  if (fs.existsSync(file)) throw new Error(`${path.relative(root, file)} already exists`);
  const tpl = read(path.join(TEMPLATES, 'milestone.md')).replace('{{goal}}', () => goal.trim() || 'Goal: one line.');
  const body = parseFrontmatter(tpl).body;
  fs.writeFileSync(file, writeFrontmatter({ id: newId, title: title.trim(), status: 'planned', ...(notes.length ? { notes } : {}) }, body));
  ids.splice(at, 0, newId);
  setSection(root, 'Order', orderLines(p.order, ids));
  return { id: newId, file: path.relative(root, file).split(path.sep).join('/'), ...after(root) };
}

export function setStatus(root, { id, to }) {
  if (!STATUSES.includes(to)) throw new Error(`status must be one of ${STATUSES.join(', ')}`);
  const p = need(root);
  const m = milestoneOf(p, id);
  const folder = FINISHED.includes(to) ? 'done' : 'milestones';
  const dest = path.join(rdir(root), folder, path.basename(m.file));
  // Check the move before writing, so a failure leaves the file as it was (C1).
  if (folder !== m.folder && fs.existsSync(dest)) throw new Error(`${folder}/${path.basename(m.file)} already exists`);
  writeMilestone(root, m, { ...m.data, status: to }, m.body);
  if (folder !== m.folder) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(fileOf(root, m), dest);
  }
  return { id, from: m.status, to, folder, ...after(root) };
}

export function addTask(root, { id, text }) {
  if (!text?.trim()) throw new Error('--text is required');
  const p = need(root);
  const m = milestoneOf(p, id);
  const n = Math.max(0, ...m.tasks.map(t => t.n)) + 1;
  if (ownNumber(text, n)) throw new Error(`pass the task text without the task number (T${n} is added for you)`);
  const line = `- [ ] T${n} ${text.trim()}`;
  if (m.tasks.length) {
    // after the last task line (tasks carry their line number in the whole file)
    const all = read(fileOf(root, m)).split('\n');
    all.splice(m.tasks.at(-1).line, 0, line);
    fs.writeFileSync(fileOf(root, m), all.join('\n'));
  } else {
    const lines = m.body.split('\n');
    const h = lines.findIndex(l => /^##\s+Tasks\s*$/.test(l));
    if (h >= 0) lines.splice(h + 1, 0, '', line);
    const body = h >= 0 ? lines.join('\n').replace(/\n{3,}/g, '\n\n') : m.body.replace(/\s*$/, '') + `\n\n## Tasks\n\n${line}\n`;
    writeMilestone(root, m, m.data, body);
  }
  return { id, task: n, ...after(root) };
}

/** One task of a milestone by "T<n>" or "<n>"; a dropped task only when allowed. */
function taskOf(m, id, task, { dropped = false } = {}) {
  const n = Number(/^T?(\d+)$/i.exec(String(task))?.[1]);
  const t = m.tasks.find(x => x.n === n);
  if (!t) throw new Error(`${id} has no task T${Number.isNaN(n) ? task : n}`);
  if (t.dropped && !dropped) throw new Error(`T${t.n} is dropped`);
  return t;
}

/** Rewrites one task line in place. */
function writeTask(root, m, t, mark, text) {
  const all = read(fileOf(root, m)).split('\n');
  all[t.line - 1] = `- [${mark}] T${t.n} ${text}`;
  fs.writeFileSync(fileOf(root, m), all.join('\n'));
}

export function tick(root, { id, task, undo = false, date = today(), archived = new Set() }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error(`--date must be YYYY-MM-DD (got "${date}"); nothing written`);
  const p = need(root);
  const m = milestoneOf(p, id);
  // --undo also reopens a dropped task and removes its drop note; ticking a dropped task fails (C3).
  const t = taskOf(m, id, task, { dropped: undo });
  // Ticking a done task again changes nothing: no new date, no second checkpoint question (verify findings).
  if (!undo && t.done) return { id: m.id, task: `T${t.n}`, done: true, already: true, ...after(root) };
  // A tick records its date; an untick removes it (tracks D8). A "(done ...)" typed into an open task's text is not kept twice.
  const text = (t.dropped ? t.text.replace(DROP_NOTE, '') : t.text).replace(DONE_NOTE, '');
  writeTask(root, m, t, undo ? ' ' : 'x', undo ? text : `${text} (done ${date})`);
  const out = { id: m.id, task: `T${t.n}`, done: !undo, ...after(root) };
  // This tick reaches the milestone's checkpoint: say so, with the tracks side by side (spec "Checkpoint reached").
  if (!undo && m.checkpoint && isTaskCp(m.checkpoint) && m.checkpoint.task === t.n) {
    const r = reportRoadmap(parseRoadmap(root), undefined, { archived });
    out.checkpoint = { id: m.id, after: `T${t.n}`, reached: true };
    out.tracks = r.tracks;
    out.alternative = r.alternative;
  }
  return out;
}

/** Drops a task: it keeps its number and line, with the date and reason (kit-debt-fixes D1). */
export function dropTask(root, { id, task, reason, date = today() }) {
  if (!String(reason ?? '').trim()) throw new Error('--reason is required');
  const p = need(root);
  const m = milestoneOf(p, id);
  const t = taskOf(m, id, task);
  if (t.done) throw new Error(`T${t.n} is done; only an open task can be dropped`);
  writeTask(root, m, t, '-', `${t.text} (dropped ${date}: ${oneLine(reason)})`);
  return { id, task: `T${t.n}`, dropped: true, ...after(root) };
}

/** New text for an open or done task; its number and state stay. */
export function editTask(root, { id, task, text }) {
  if (!text?.trim()) throw new Error('--text is required');
  const p = need(root);
  const m = milestoneOf(p, id);
  const t = taskOf(m, id, task);
  if (ownNumber(text, t.n)) throw new Error(`pass the task text without the task number (T${t.n} stays)`);
  const clean = oneLine(text);
  // A done task keeps its date (spec "Tick date").
  writeTask(root, m, t, t.done ? 'x' : ' ', t.doneDate ? `${clean} (done ${t.doneDate})` : clean);
  return { id, task: `T${t.n}`, edited: true, ...after(root) };
}

// One-line text for a write, and a resume note without its "Resume:" label (shared; verify finding).
const oneLine = v => String(v ?? '').trim().replace(/\r?\n/g, ' ');
const resumeText = v => oneLine(v).replace(/^Resume:\s*/i, '');

/** New title and/or goal for a milestone; its ID, file name, status, tasks and links stay (spec "Edit a milestone"; D9). */
export function editMilestone(root, { id, title, goal, date = today() }) {
  if (title === undefined && goal === undefined) throw new Error('pass --title, --goal or both');
  for (const [k, v] of [['title', title], ['goal', goal]]) if (v !== undefined && !String(v).trim()) throw new Error(`--${k} is empty; nothing written`);
  const p = need(root);
  const m = milestoneOf(p, id);
  let body = m.body;
  if (goal !== undefined) {
    const lines = body.split('\n');
    if (m.goalLine != null) lines[m.goalLine] = oneLine(goal);
    else {
      // No goal line yet: put it before the first heading (or at the top).
      const h = lines.findIndex(l => /^#/.test(l));
      lines.splice(h < 0 ? 0 : h, 0, oneLine(goal), '');
    }
    body = lines.join('\n');
  }
  const newTitle = title !== undefined ? oneLine(title) : m.title;
  writeMilestone(root, m, { ...m.data, title: newTitle }, body);
  const renamed = title !== undefined && newTitle !== m.title;
  if (renamed) addDrift(root, { date, what: `${m.id} renamed: ${m.title} -> ${newTitle}`, why: 'title edited (ID and history kept)', alt: '-', impact: '-', by: 'user' });
  return { id: m.id, title: newTitle, renamed, from: m.title, goal: goal !== undefined, ...after(root) };
}

/** Sets or clears a milestone's one checkpoint: after a task, or after a change is archived (spec "Checkpoint on a milestone"). */
export function setCheckpoint(root, { id, after: task, archive, clear = false, archived = new Set() }) {
  const given = [task !== undefined, archive !== undefined, clear].filter(Boolean).length;
  if (given !== 1) throw new Error('pass exactly one of --after T<n>, --archive <change> or --clear');
  const p = need(root);
  const m = milestoneOf(p, id);
  if (FINISHED.includes(m.status)) throw new Error(`${m.id} is ${m.status}; a checkpoint goes on a planned, active or paused milestone`);
  let value = null;
  if (task !== undefined) value = `T${taskOf(m, m.id, task).n}`;
  else if (archive !== undefined) {
    const c = String(archive).trim();
    if (!CHECKPOINT.test(`archive ${c}`)) throw new Error(`"${archive}" is not a change name (letters, digits, dots, dashes and underscores)`);
    value = `archive ${c}`;
  }
  const { checkpoint: _old, ...rest } = m.data;
  writeMilestone(root, m, value ? { ...rest, checkpoint: value } : rest, m.body);
  const now = readMilestone(fileOf(root, m), m.folder);
  return { id: m.id, checkpoint: value, cleared: !value, reached: value ? checkpointReached(now, archived) : false, ...after(root) };
}

/** Sets the one `Resume:` line under ## Notes, replacing an older one (spec "Resume note when switching away"). */
export function setResume(root, { id, text }) {
  const note = resumeText(text);
  if (!note) throw new Error('--text is required; nothing written');
  const p = need(root);
  const m = milestoneOf(p, id);
  writeMilestone(root, m, m.data, withResume(m.body, note));
  return { id: m.id, resume: note, ...after(root) };
}

/** The body with one `Resume:` line right under ## Notes. Only the Notes section is touched; every other line stays as it was
 *  (spec "Roadmap writes never lose the user's text"; verify finding). */
function withResume(body, note) {
  const lines = body.split('\n');
  const h = lines.findIndex(l => /^##\s+Notes\s*$/.test(l));
  if (h < 0) return `${body.replace(/\s*$/, '')}\n\n## Notes\n\nResume: ${note}\n`;
  let end = lines.findIndex((l, i) => i > h && /^##\s/.test(l));
  if (end < 0) end = lines.length;
  // The Notes section without its old Resume line (and the blank line after it), and without its leading blank lines.
  const rest = lines.slice(h + 1, end);
  const old = rest.findIndex(l => RESUME.test(l));
  // The blank line after it goes too, unless it is the file's last line (the final newline stays).
  if (old >= 0) rest.splice(old, rest[old + 1] === '' && old + 2 < rest.length ? 2 : 1);
  while (rest[0] === '') rest.shift();
  // ## Notes, a blank line, the note, a blank line, then the user's notes as they were.
  return [...lines.slice(0, h + 1), '', `Resume: ${note}`, '', ...rest, ...lines.slice(end)].join('\n');
}

/** The answer at a reached checkpoint: continue, or switch to another milestone (spec "Continue or switch at a checkpoint"; D3, D10). */
export function decide(root, { id, cont = false, switchTo, why, resume, date = today(), archived = new Set() }) {
  if (cont === (switchTo !== undefined)) throw new Error('pass one of --continue or --switch-to <ID>');
  if (!String(why ?? '').trim()) throw new Error('--why is required; nothing written');
  const p = need(root);
  const m = milestoneOf(p, id);
  if (FINISHED.includes(m.status)) throw new Error(`${m.id} is ${m.status}; its checkpoint no longer applies (clear it with "roadmap.mjs checkpoint --clear")`);
  if (!m.checkpoint || m.checkpoint.bad) throw new Error(`${m.id} has no checkpoint to answer`);
  if (!checkpointReached(m, archived)) throw new Error(`the ${m.id} checkpoint (after ${checkpointLabel(m.checkpoint)}) isn't reached yet; nothing written`);
  // Everything that can fail is checked before anything is written.
  let target = null;
  if (switchTo !== undefined) {
    target = milestoneOf(p, switchTo);
    if (target.id === m.id) throw new Error(`can't switch from ${m.id} to itself; use --continue`);
    if (FINISHED.includes(target.status)) throw new Error(`${target.id} is ${target.status}; set its status first to reopen it ("roadmap.mjs status")`);
    // An active milestone needs tasks; refuse before writing rather than leave the roadmap broken (verify finding).
    if (!target.tasks.some(t => !t.dropped)) throw new Error(`${target.id} has no tasks yet; add one first ("roadmap.mjs task --id ${target.id} --text ...")`);
  }
  if (resume !== undefined && !target) throw new Error('--resume goes with --switch-to (the note is for the milestone you leave); use "roadmap.mjs resume" otherwise');
  if (resume !== undefined && !String(resume).trim()) throw new Error('--resume is empty; leave it out to skip the note');
  const { checkpoint: _cp, ...rest } = m.data;
  const label = `Checkpoint ${m.id} after ${checkpointLabel(m.checkpoint)}`;
  if (target) {
    const body = resume !== undefined ? withResume(m.body, resumeText(resume)) : m.body;
    // Only an active milestone is paused; a planned one (an archive checkpoint before work started) stays planned (verify finding).
    writeMilestone(root, m, { ...rest, status: m.status === 'active' ? 'paused' : m.status }, body);
    writeMilestone(root, target, { ...target.data, status: 'active' }, target.body);
  } else writeMilestone(root, m, rest, m.body);
  const left = m.status === 'active' ? `${m.id} paused` : `${m.id} stays ${m.status}`;
  addDrift(root, { date, what: `${label}: ${target ? `switched to ${target.id}` : `continued ${m.id}`}`, why, alt: target ? `continue ${m.id}` : 'switch to another track', impact: target ? `${left}, ${target.id} active` : '-', by: 'user' });
  return { id: m.id, choice: target ? 'switch' : 'continue', to: target?.id ?? m.id, resume: resume !== undefined, ...after(root) };
}

export function setOrder(root, { ids }) {
  const p = need(root);
  const cur = p.order.map(o => o.id).filter(Boolean);
  if (ids.length !== cur.length || [...ids].sort().join() !== [...cur].sort().join()) throw new Error(`the new order must have the same IDs as the current one (${cur.join(', ')}); add or finish milestones with "add" and "status"`);
  setSection(root, 'Order', orderLines(p.order, ids));
  return { order: ids, ...after(root) };
}

export function setNow(root, { text }) {
  need(root);
  // An empty Now is never written: a missing or mistyped flag must not wipe where work stopped (C6).
  const lines = norm(text ?? '').split('\n').map(l => l.trimEnd()).filter(Boolean);
  if (!lines.length) throw new Error('--text (or --text-file) is required; Now is left as it is');
  setSection(root, 'Now', lines);
  return { now: true, ...after(root) };
}

export function addWaiting(root, { milestone, question, date = today() }) {
  const p = need(root);
  if (!question?.trim()) throw new Error('--question is required');
  const tag = milestone === 'general' ? milestone : milestoneOf(p, milestone).id;
  setSection(root, 'Waiting on you', [...p.waiting.map(w => w.text.trim()), `- [${tag}] ${question.trim()} (proposed ${date})`]);
  return { waiting: p.waiting.length + 1, ...after(root) };
}

/** Answers one waiting item: it leaves roadmap.md and a drift-log row records it (readiness D6). */
export function resolveWaiting(root, { match, answer, by = 'user', date = today() }) {
  // Without an answer the decision would be lost: refuse before anything is written (L10).
  if (!String(answer ?? '').trim()) throw new Error('--answer is required; the decision stays under Waiting on you');
  const p = need(root);
  const hits = p.waiting.filter(w => !w.bad && w.question.toLowerCase().includes(String(match ?? '').toLowerCase()));
  if (!match || !hits.length) throw new Error(`no waiting item matches "${match ?? ''}"`);
  if (hits.length > 1) throw new Error(`"${match}" matches ${hits.length} items; be more specific`);
  const w = hits[0];
  setSection(root, 'Waiting on you', p.waiting.filter(x => x !== w).map(x => x.text.trim()));
  addDrift(root, { date, what: `Decided (${w.milestone}): ${w.question} -> ${answer}`, why: `proposed ${w.date}`, alt: '-', impact: '-', by });
  return { answered: w.question, answer, ...after(root) };
}

export function link(root, { id, kind, value }) {
  if (!LINK_KINDS.includes(kind)) throw new Error(`kind must be one of ${LINK_KINDS.join(', ')}`);
  if (!value?.trim()) throw new Error('--value is required');
  const p = need(root);
  const m = milestoneOf(p, id);
  const v = kind === 'prd' ? prdRef(root, value) : value.trim();
  const same = kind === 'prd' ? (x => prdKey(root, x) === prdKey(root, v)) : (x => x === v);
  const list = m.links[kind].some(same) ? m.links[kind] : [...m.links[kind], v];
  writeMilestone(root, m, { ...m.data, [kind]: list }, m.body);
  return { id: m.id, kind, [kind]: list, ...after(root) };
}

// A PRD link given as "<slug>", "<slug>/<part>", "prds/....md" or "<knowledge>/prds/....md" (rc.2 feedback).
const prdKey = (root, v) => String(v).trim().replace(/\\/g, '/').replace(/^\.\//, '')
  .replace(new RegExp(`^${path.basename(root).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`), '').replace(/^prds\//, '').replace(/\.md$/i, '');

/** The PRD or part a link names, as "prds/<slug>.md" or "prds/<slug>/<part>.md"; refuses one that doesn't exist. */
function prdRef(root, value) {
  const k = prdKey(root, value);
  if (!k || k.split('/').some(s => !s || s === '.' || s === '..')) throw new Error(`"${value}" is not a PRD name (use <slug>, <slug>/<part> or prds/<slug>.md). Nothing written.`);
  if (!fs.existsSync(path.join(root, 'prds', `${k}.md`))) throw new Error(`no PRD ${k} (looked for prds/${k}.md). Nothing written.`);
  return `prds/${k}.md`;
}

const cell = s => String(s ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim() || '-';

export function addDrift(root, { date = today(), what, why, alt = '-', impact = '-', by = 'user' }) {
  need(root);
  if (!what?.trim()) throw new Error('--what is required');
  const file = path.join(rdir(root), 'drift-log.md');
  const cur = read(file) ?? read(path.join(TEMPLATES, 'drift-log.md'));
  fs.writeFileSync(file, cur.replace(/\n*$/, '\n') + `| ${[date, what, why, alt, impact, by].map(cell).join(' | ')} |\n`);
  return { appended: date, ...after(root) };
}

// ---------- output ----------

const where = f => `${f.file}${f.line ? `:${f.line}` : ''}`;

export function formatCheck(c, g = { tidy: [], unplanned: [], notes: [] }) {
  if (!c.exists) return 'No roadmap here (optional). Start one with /kit:roadmap.';
  const tidy = [...c.tidy, ...g.tidy];
  const out = [];
  if (c.broken.length) { out.push(`BROKEN (${c.broken.length}):`); for (const f of c.broken) out.push(`  ${where(f)}: ${f.problem}. Fix: ${f.fix}`); }
  if (tidy.length) { out.push(`Tidy-up (${tidy.length}):`); for (const f of tidy) out.push(`  ${where(f)}: ${f.problem}. Fix: ${f.fix}`); }
  if (g.unplanned.length) { out.push(`Unplanned work (${g.unplanned.length}):`); for (const u of g.unplanned) out.push(`  change ${u.change}: ${u.fix}`); }
  for (const n of g.notes) out.push(`Note: ${n}`);
  // A reached checkpoint is a moment to decide, not something to fix (tracks D5).
  for (const k of c.checkpoints ?? []) out.push(checkpointLine(k));
  if (!c.broken.length && !tidy.length && !g.unplanned.length) out.unshift('Roadmap is in good condition.');
  return out.join('\n');
}

const checkpointLine = k => `Checkpoint reached: ${k.id} ${k.title} after ${k.after}. Continue or switch? (/kit:roadmap)`;
const taskLabel = t => (t ? `T${t.n} ${t.text}` : '(none)');

/** The tracks side by side: last done, next and resume note for each (spec "Checkpoint reached"). */
export function formatTracks(tracks, alternative = null) {
  const out = ['Tracks'];
  for (const t of tracks) {
    const cp = t.checkpoint ? ` · checkpoint after ${t.checkpoint.after}${t.checkpoint.reached ? ': reached' : ''}` : '';
    out.push(`  ${t.id} · ${t.title} · ${t.status}${t.total ? ` · ${t.done} of ${t.total} done` : ''}${cp}`);
    out.push(`     last done: ${taskLabel(t.last)}`, `     next:      ${taskLabel(t.next)}`);
    if (t.resume) out.push(`     resume:    ${t.resume}`);
  }
  if (alternative) out.push(`  Other choice: ${alternative.id} · ${alternative.title} · ${alternative.status}`);
  return out;
}

export function formatReport(r, g = { tidy: [], unplanned: [], notes: [] }) {
  if (!r.exists) return 'No roadmap here (optional). Start one with /kit:roadmap.';
  const out = [];
  if (r.check.broken.length) { out.push(`BROKEN (${r.check.broken.length}) - fix first:`); for (const f of r.check.broken) out.push(`  ${where(f)}: ${f.problem}`); out.push(''); }
  out.push('Milestones');
  const cps = new Map((r.marks ?? []).map(k => [k.id, k]));
  r.rows.forEach((x, i) => {
    const mark = x.id === r.current ? '  <- current' : '';
    const cp = cps.get(x.id);
    out.push(`  ${i + 1}. ${x.id} · ${x.title} · ${x.status}${x.total ? ` · ${x.done} of ${x.total} done` : ''}${cp ? ` · checkpoint after ${cp.after}${cp.reached ? ': reached' : ''}` : ''}${mark}`);
    if (!FINISHED.includes(x.status)) for (const t of x.left) out.push(`       [ ] T${t.n} ${t.text}`);
  });
  // Two or more tracks, or a reached checkpoint: show them side by side before Now (tracks D4).
  const tracks = r.tracks ?? [];
  if (tracks.length >= 2 || r.checkpoints?.length) {
    out.push('', ...formatTracks(tracks, r.alternative));
    for (const k of r.checkpoints ?? []) out.push(`  ${checkpointLine(k)}`);
  }
  out.push('', 'Now', ...(r.now.length ? r.now.map(l => `  ${l}`) : ['  (empty)']));
  out.push('', 'Waiting on you', `  Blocking now (${r.blocking.length})`);
  for (const w of r.blocking) out.push(`    ${w.milestone}  ${w.question}  proposed ${w.date}`);
  out.push(`  Later (${r.later.length})`);
  for (const w of r.later) out.push(`    ${w.milestone}  ${w.question}  proposed ${w.date}`);
  const tidy = [...r.check.tidy, ...g.tidy];
  if (tidy.length || g.unplanned.length) {
    out.push('');
    if (tidy.length) out.push(`Tidy-up (${tidy.length}): ${tidy.map(f => f.problem).join('; ')}`);
    if (g.unplanned.length) out.push(`Unplanned work: ${g.unplanned.map(u => u.change).join(', ')}`);
  }
  // loose-ends D7: a pointer only; the roadmap never lists them.
  if (r.loose?.unreadable) out.push('', "Loose ends: loose-ends.md can't be read (merge conflict or hand edit?): fix it from git");
  else if (r.loose?.open) out.push('', `Loose ends: ${r.loose.open} open (${r.loose.important} important): /kit:loose-ends`);
  return out.join('\n');
}

// ---------- CLI ----------

function parseArgs(argv) {
  const o = { cmd: argv[0], dir: process.cwd(), json: false, undo: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') o.json = true;
    else if (a === '--undo') o.undo = true;
    else if (a === '--clear') o.clear = true;
    else if (a === '--continue') o.continue = true;
    else if (a.startsWith('--')) o[a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[++i];
    else throw new Error(`unexpected argument ${a}`);
  }
  return o;
}

const csv = v => (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : []);

function run(o) {
  const dir = path.resolve(o.dir);
  const root = knowledgeDir(dir);
  switch (o.cmd) {
    case 'check': { const p = parseRoadmap(root); const c = checkRoadmap(p); const r = reportRoadmap(p, c, { archived: archivedNames(dir) }); return { ...c, checkpoints: r.checkpoints ?? [], git: gitFindings(dir, p) }; }
    case 'report': { const p = parseRoadmap(root); return { ...reportRoadmap(p, undefined, { archived: archivedNames(dir) }), git: gitFindings(dir, p), loose: looseSummary(dir) }; }
    case 'new': return newRoadmap(root);
    case 'add': return addMilestone(root, { title: o.title, goal: o.goal ?? '', id: o.id ?? null, after: o.after ?? null, before: o.before ?? null, notes: csv(o.notes) });
    case 'status': return setStatus(root, { id: o.id, to: o.to });
    case 'task': return addTask(root, { id: o.id, text: o.text });
    case 'tick': return tick(root, { id: o.id, task: o.task, undo: o.undo, date: o.date ?? today(), archived: archivedNames(dir) });
    case 'edit': return editMilestone(root, { id: o.id, title: o.title, goal: o.goal, date: o.date ?? today() });
    case 'checkpoint': return setCheckpoint(root, { id: o.id, after: o.after, archive: o.archive, clear: Boolean(o.clear), archived: archivedNames(dir) });
    case 'resume': return setResume(root, { id: o.id, text: o.text });
    case 'decide': return decide(root, { id: o.id, cont: Boolean(o.continue), switchTo: o.switchTo, why: o.why, resume: o.resume, date: o.date ?? today(), archived: archivedNames(dir) });
    case 'drop-task': return dropTask(root, { id: o.id, task: o.task, reason: o.reason, date: o.date ?? today() });
    case 'edit-task': return editTask(root, { id: o.id, task: o.task, text: o.text });
    case 'order': return setOrder(root, { ids: csv(o.ids) });
    case 'now': return setNow(root, { text: o.textFile ? fs.readFileSync(o.textFile, 'utf8') : o.text ?? '' });
    case 'wait': return addWaiting(root, { milestone: o.milestone, question: o.question, date: o.date ?? today() });
    case 'answer': return resolveWaiting(root, { match: o.match, answer: o.answer, by: o.by ?? 'user', date: o.date ?? today() });
    case 'link': return link(root, { id: o.id, kind: o.kind, value: o.value });
    case 'drift': return addDrift(root, { date: o.date ?? today(), what: o.what, why: o.why, alt: o.alt ?? '-', impact: o.impact ?? '-', by: o.by ?? 'user' });
    default: throw new Error(`unknown command "${o.cmd ?? ''}" (check, report, new, add, edit, status, task, tick, drop-task, edit-task, checkpoint, decide, resume, order, now, wait, answer, link, drift)`);
  }
}

function format(cmd, r) {
  if (cmd === 'check') return formatCheck(r, r.git);
  if (cmd === 'report') return formatReport(r, r.git);
  const head = {
    new: () => 'created roadmaps/ (roadmap.md, drift-log.md, milestones/, done/)',
    add: () => `added ${r.id}: ${r.file}`,
    status: () => `${r.id}: ${r.from ?? '(none)'} -> ${r.to}${r.folder === 'done' ? ' (moved to done/)' : ''}`,
    task: () => `${r.id}: added T${r.task}`,
    tick: () => `${r.id}: ${r.task} ${r.done ? 'ticked' : 'unticked'}${r.checkpoint ? `\n\nCheckpoint reached on ${r.id} (after ${r.checkpoint.after}). Continue or switch? (/kit:roadmap)\n${formatTracks(r.tracks, r.alternative).join('\n')}` : ''}`,
    edit: () => `${r.id}: ${r.renamed ? `renamed ${r.from} -> ${r.title} (recorded in drift-log.md)` : 'title unchanged'}${r.goal ? '; goal changed' : ''}`,
    checkpoint: () => (r.cleared ? `${r.id}: checkpoint cleared` : `${r.id}: checkpoint ${r.checkpoint}${r.reached ? ' (reached already: continue or switch? /kit:roadmap)' : ''}`),
    resume: () => `${r.id}: Resume: ${r.resume}`,
    decide: () => `${r.id}: ${r.choice === 'switch' ? `switched to ${r.to} (${r.id} paused${r.resume ? ', resume note saved' : ''})` : `continued ${r.id}`}; checkpoint cleared (recorded in drift-log.md)`,
    'drop-task': () => `${r.id}: ${r.task} dropped`,
    'edit-task': () => `${r.id}: ${r.task} text changed`,
    order: () => `order: ${r.order.join(', ')}`,
    now: () => 'Now updated',
    wait: () => `waiting on you: ${r.waiting} item(s)`,
    answer: () => `answered "${r.answered}" -> ${r.answer} (recorded in drift-log.md)`,
    link: () => `${r.id}: ${r.kind} = ${r[r.kind].join(', ')}`,
    drift: () => `drift entry added (${r.appended})`,
  }[cmd]?.() ?? JSON.stringify(r, null, 2);
  const broken = r.broken?.length ? `\nBROKEN after this write (${r.broken.length}):\n${r.broken.map(f => `  ${where(f)}: ${f.problem}. Fix: ${f.fix}`).join('\n')}` : '';
  return head + broken;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    const r = run(o);
    console.log(o.json ? JSON.stringify(r, null, 2) : format(o.cmd, r));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}
