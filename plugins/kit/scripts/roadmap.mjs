// /kit:roadmap helper (roadmap-structure design D1-D7; spec: roadmap). The only writer of a project's
// roadmap, and its check: one file per milestone under <knowledge>/roadmaps/. Warns, never blocks.
// Zero dependencies.
// Usage: node roadmap.mjs <command> [--dir <project>] [--json] [options]
//   check | report
//   new
//   add      --title <t> [--goal <g>] [--id <ID>] [--after <ID> | --before <ID>] [--notes a,b]
//   status   --id <ID> --to planned|active|paused|done|dropped
//   task     --id <ID> --text <t>
//   tick     --id <ID> --task T<n> [--undo]
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
  let goal = null;
  fm.body.split('\n').forEach((l, k) => {
    const line = offset + k + 1;
    const t = TASK.exec(l);
    // A dropped task (`- [-]`) is neither done nor left (kit-debt-fixes D1).
    if (t) tasks.push({ n: Number(t[2]), done: /[xX]/.test(t[1]), dropped: t[1] === '-', text: t[3], line });
    else if (/^\s*- \[/.test(l)) badTasks.push({ text: l, line });
    else if (!goal && l.trim() && !/^#/.test(l) && !isComment(l)) goal = l.trim();
  });
  const d = fm.data ?? {};
  const list = v => (Array.isArray(v) ? v : v ? [v] : []);
  return {
    file: `${folder}/${path.basename(file)}`, folder, ok: fm.ok, error: fm.error ?? null,
    id: d.id ?? null, title: d.title ?? null, status: d.status ?? null, goal,
    links: Object.fromEntries(LINK_KINDS.map(k => [k, list(d[k])])), tasks, badTasks, data: d, body: fm.body,
  };
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
export function reportRoadmap(p, check = checkRoadmap(p)) {
  if (!p.exists) return { exists: false };
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

export function tick(root, { id, task, undo = false }) {
  const p = need(root);
  const m = milestoneOf(p, id);
  // --undo also reopens a dropped task and removes its drop note; ticking a dropped task fails (C3).
  const t = taskOf(m, id, task, { dropped: undo });
  writeTask(root, m, t, undo ? ' ' : 'x', t.dropped ? t.text.replace(DROP_NOTE, '') : t.text);
  return { id, task: `T${t.n}`, done: !undo, ...after(root) };
}

/** Drops a task: it keeps its number and line, with the date and reason (kit-debt-fixes D1). */
export function dropTask(root, { id, task, reason, date = today() }) {
  if (!String(reason ?? '').trim()) throw new Error('--reason is required');
  const p = need(root);
  const m = milestoneOf(p, id);
  const t = taskOf(m, id, task);
  if (t.done) throw new Error(`T${t.n} is done; only an open task can be dropped`);
  writeTask(root, m, t, '-', `${t.text} (dropped ${date}: ${String(reason).trim().replace(/\r?\n/g, ' ')})`);
  return { id, task: `T${t.n}`, dropped: true, ...after(root) };
}

/** New text for an open or done task; its number and state stay. */
export function editTask(root, { id, task, text }) {
  if (!text?.trim()) throw new Error('--text is required');
  const p = need(root);
  const m = milestoneOf(p, id);
  const t = taskOf(m, id, task);
  if (ownNumber(text, t.n)) throw new Error(`pass the task text without the task number (T${t.n} stays)`);
  writeTask(root, m, t, t.done ? 'x' : ' ', text.trim().replace(/\r?\n/g, ' '));
  return { id, task: `T${t.n}`, edited: true, ...after(root) };
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
  if (!c.broken.length && !tidy.length && !g.unplanned.length) out.unshift('Roadmap is in good condition.');
  return out.join('\n');
}

export function formatReport(r, g = { tidy: [], unplanned: [], notes: [] }) {
  if (!r.exists) return 'No roadmap here (optional). Start one with /kit:roadmap.';
  const out = [];
  if (r.check.broken.length) { out.push(`BROKEN (${r.check.broken.length}) - fix first:`); for (const f of r.check.broken) out.push(`  ${where(f)}: ${f.problem}`); out.push(''); }
  out.push('Milestones');
  r.rows.forEach((x, i) => {
    const mark = x.id === r.current ? '  <- current' : '';
    out.push(`  ${i + 1}. ${x.id} · ${x.title} · ${x.status}${x.total ? ` · ${x.done} of ${x.total} done` : ''}${mark}`);
    if (!FINISHED.includes(x.status)) for (const t of x.left) out.push(`       [ ] T${t.n} ${t.text}`);
  });
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
    case 'check': { const p = parseRoadmap(root); const c = checkRoadmap(p); return { ...c, git: gitFindings(dir, p) }; }
    case 'report': { const p = parseRoadmap(root); return { ...reportRoadmap(p), git: gitFindings(dir, p), loose: looseSummary(dir) }; }
    case 'new': return newRoadmap(root);
    case 'add': return addMilestone(root, { title: o.title, goal: o.goal ?? '', id: o.id ?? null, after: o.after ?? null, before: o.before ?? null, notes: csv(o.notes) });
    case 'status': return setStatus(root, { id: o.id, to: o.to });
    case 'task': return addTask(root, { id: o.id, text: o.text });
    case 'tick': return tick(root, { id: o.id, task: o.task, undo: o.undo });
    case 'drop-task': return dropTask(root, { id: o.id, task: o.task, reason: o.reason, date: o.date ?? today() });
    case 'edit-task': return editTask(root, { id: o.id, task: o.task, text: o.text });
    case 'order': return setOrder(root, { ids: csv(o.ids) });
    case 'now': return setNow(root, { text: o.textFile ? fs.readFileSync(o.textFile, 'utf8') : o.text ?? '' });
    case 'wait': return addWaiting(root, { milestone: o.milestone, question: o.question, date: o.date ?? today() });
    case 'answer': return resolveWaiting(root, { match: o.match, answer: o.answer, by: o.by ?? 'user', date: o.date ?? today() });
    case 'link': return link(root, { id: o.id, kind: o.kind, value: o.value });
    case 'drift': return addDrift(root, { date: o.date ?? today(), what: o.what, why: o.why, alt: o.alt ?? '-', impact: o.impact ?? '-', by: o.by ?? 'user' });
    default: throw new Error(`unknown command "${o.cmd ?? ''}" (check, report, new, add, status, task, tick, drop-task, edit-task, order, now, wait, answer, link, drift)`);
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
    tick: () => `${r.id}: ${r.task} ${r.done ? 'ticked' : 'unticked'}`,
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
