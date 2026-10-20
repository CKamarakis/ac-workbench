// Decision record for one OpenSpec change (build-readiness design D1, D2; spec: build-readiness "Decision record").
// <change>/decisions.md is readable Markdown plus a data comment; the data is the source and the table is
// re-rendered on every write, so entries go through this script only. /kit:ready, the docs sync in /kit:verify,
// /kit:next and the archive gate all read it. Zero dependencies.
// Usage: node decisions.mjs <command> --dir <project> --change <name> [--json]
//   add --kind <kind> --text "..." --from "<where>" [--options "a|b|c" --recommended "a"]
//   decide --id D1 --answer "..." [--written <path>]
//   later --id D1
//   ready-done                       stamps that the readiness check ran (even with zero items)
//   list [--open]
//   status                           { exists, open, oldest, readyAt }
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const KINDS = ['gap', 'difference', 'confirm', 'new-tool', 'unplanned-tool', 'behavior', 'decision'];
const DATA = /<!-- kit-decisions-data (\{[\s\S]*?\}) -->/;
const today = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const isOpen = i => i.status === 'open' || i.status === 'later';

function changeFolder(dir, change, { archived = false } = {}) {
  if (!change || !/^[a-z0-9][a-z0-9-]*$/.test(change)) throw new Error('--change <name> is required (kebab-case)');
  const d = path.join(dir, 'openspec', 'changes', change);
  if (fs.existsSync(d)) return d;
  if (!archived) throw new Error(`change not found: openspec/changes/${change}`);
  // An archived change is still found by its name: decisions left for Later stay decidable (kit-followups D3).
  const arch = archivedFolders(dir).filter(a => a.change === change).at(-1);
  if (arch) return arch.path;
  throw new Error(`change not found: openspec/changes/${change} (or in the archive)`);
}

/** Archived change folders, oldest first: { folder, change, path }. */
function archivedFolders(dir) {
  const root = path.join(dir, 'openspec', 'changes', 'archive');
  let names = [];
  try { names = fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); } catch { /* no archive */ }
  return names.map(n => ({ folder: n, change: n.replace(/^\d{4}-\d{2}-\d{2}-/, ''), path: path.join(root, n) })).sort((a, b) => (a.folder < b.folder ? -1 : a.folder > b.folder ? 1 : 0));
}

/** Open and Later items left in archived changes, for the /kit:next reminder. */
export function archivedOpen(dir) {
  const items = [], changes = [];
  for (const a of archivedFolders(dir)) {
    const st = readDecisions(path.join(a.path, 'decisions.md'));
    const open = (st?.items ?? []).filter(isOpen);
    if (open.length) { items.push(...open); changes.push(a.change); }
  }
  return { open: items.length, oldest: items.length ? oldestOf(items) : null, changes };
}

/** One line for /kit:next, or null. */
export function archivedLine(a) {
  return a?.open ? `${a.open} decision${a.open === 1 ? '' : 's'} still open in archived changes (${a.changes.join(', ')})` : null;
}
// Only deciding and listing reach into the archive; adding or marking ready needs an active change (code review C3).
const fileOf = (dir, change, opts) => path.join(changeFolder(dir, change, opts), 'decisions.md');

export function readDecisions(file) {
  try { const m = DATA.exec(fs.readFileSync(file, 'utf8')); return m ? JSON.parse(m[1]) : null; } catch { return null; }
}

export function render(state) {
  const open = state.items.filter(isOpen);
  const dates = i => Object.entries(i.dates).map(([k, v]) => `${k} ${v}`).join(', ');
  const opts = i => (i.options ?? []).map(o => (o === i.recommended ? `**${o}** (recommended)` : o)).join(' / ');
  const L = [
    `# Decisions: ${state.change}`, '',
    'Written by the kit (`decisions.mjs`); edits to this table are overwritten.', '',
    `open: ${open.length}${open.length ? `  (oldest: ${oldestOf(open)})` : ''}`,
    `readiness check: ${state.readyAt ? `${state.readyAt.date} at ${state.readyAt.commit} (${state.readyAt.items} items)` : 'not run'}`, '',
    '| Id | Kind | Question or finding | From | Options | Status | Answer | Written to | Dates |',
    '|---|---|---|---|---|---|---|---|---|',
    ...state.items.map(i => `| ${i.id} | ${i.kind} | ${esc(i.text)} | ${esc(i.from)} | ${esc(opts(i))} | ${i.status} | ${esc(i.answer ?? '')} | ${esc(i.written ?? '')} | ${dates(i)} |`),
    // "-->" inside the JSON would end the comment early; > parses back to ">".
    '', `<!-- kit-decisions-data ${JSON.stringify(state).replace(/-->/g, '--\\u003e')} -->`, '',
  ];
  return L.join('\n');
}

function oldestOf(items) {
  return items.map(i => i.dates.later ?? i.dates.opened).sort()[0] ?? null;
}

function load(dir, change, opts) {
  const file = fileOf(dir, change, opts);
  const state = readDecisions(file);
  // An unreadable record (merge conflict, hand edit) must never be replaced by an empty one.
  if (!state && fs.existsSync(file)) throw new Error(`openspec/changes/${change}/decisions.md exists but its data can't be read (merge conflict or hand edit?): fix it from git, then re-run`);
  return { file, state: state ?? { change, next: 1, items: [], readyAt: null } };
}
const save = (file, state) => { fs.writeFileSync(file, render(state)); return state; };
const find = (state, id) => {
  const it = state.items.find(i => i.id === id);
  if (!it) throw new Error(`no decision "${id}" in this change`);
  return it;
};

export function addDecision({ dir, change, kind, text, from, options, recommended }) {
  if (!KINDS.includes(kind)) throw new Error(`--kind must be one of: ${KINDS.join(', ')}`);
  if (!text || !String(text).trim()) throw new Error('--text is required');
  if (!from || !String(from).trim()) throw new Error('--from is required: say where it was found');
  const list = (Array.isArray(options) ? options : String(options ?? '').split('|')).map(s => String(s).trim()).filter(Boolean);
  if (recommended && !list.includes(String(recommended).trim())) throw new Error('--recommended must be one of --options');
  const { file, state } = load(dir, change);
  const item = { id: `D${state.next}`, kind, text: String(text).trim(), from: String(from).trim(), status: 'open', dates: { opened: today() } };
  if (list.length) { item.options = list; if (recommended) item.recommended = String(recommended).trim(); }
  state.next += 1;
  state.items.push(item);
  save(file, state);
  return item;
}

export function decide({ dir, change, id, answer, written }) {
  if (!answer || !String(answer).trim()) throw new Error('--answer is required');
  const { file, state } = load(dir, change, { archived: true });
  const it = find(state, id);
  Object.assign(it, { status: 'decided', answer: String(answer).trim(), written: written ? String(written).trim() : 'not written' });
  it.dates.decided = today();
  save(file, state);
  return it;
}

export function later({ dir, change, id }) {
  const { file, state } = load(dir, change);
  const it = find(state, id);
  if (it.status === 'decided') throw new Error(`"${id}" is already decided`);
  it.status = 'later';
  it.dates.later = today();
  save(file, state);
  return it;
}

function git(dir, args) {
  const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8', timeout: 30000 });
  return r.status === 0 ? r.stdout.trim() : null;
}

export function readyDone({ dir, change }) {
  const { file, state } = load(dir, change);
  state.readyAt = { date: today(), commit: git(dir, ['rev-parse', '--short', 'HEAD']) ?? 'none', items: state.items.length };
  return save(file, state);
}

export function listDecisions({ dir, change, open = false }) {
  const { state } = load(dir, change, { archived: true });
  return open ? state.items.filter(isOpen) : state.items;
}

/** For /kit:next, verify and the archive gate. Never throws for a missing record. */
export function decisionStatus({ dir, change }) {
  const state = readDecisions(path.join(dir, 'openspec', 'changes', change ?? '', 'decisions.md'));
  if (!state) return { exists: false, open: 0, oldest: null, readyAt: null };
  const open = state.items.filter(isOpen);
  return { exists: true, open: open.length, oldest: oldestOf(open), readyAt: state.readyAt ?? null };
}

/** One line for reminders, or null when nothing is open. */
export function openLine(st) {
  return st?.open ? `${st.open} decision${st.open === 1 ? '' : 's'} still open since ${st.oldest}` : null;
}

// ---------- CLI ----------

function parseArgs(argv) {
  const o = { cmd: argv[0], dir: process.cwd(), json: false, open: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json' || a === '--open') o[a.slice(2)] = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else throw new Error(`unexpected argument ${a}`);
  }
  o.dir = path.resolve(o.dir);
  return o;
}

const line = i => `${i.id}  ${i.status.padEnd(7)} ${i.kind.padEnd(14)} ${i.text}${i.answer ? `  -> ${i.answer}` : ''}`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    let out;
    if (o.cmd === 'add') { const i = addDecision(o); out = o.json ? i : `added ${line(i)}`; }
    else if (o.cmd === 'decide') { const i = decide(o); out = o.json ? i : `decided ${line(i)}`; }
    else if (o.cmd === 'later') { const i = later(o); out = o.json ? i : `later ${line(i)}`; }
    else if (o.cmd === 'ready-done') { const s = readyDone(o); const st = decisionStatus(o); out = o.json ? st : `readiness recorded (${s.readyAt.items} items). ${openLine(st) ?? 'No decisions open.'}`; }
    else if (o.cmd === 'list') { const l = listDecisions(o); out = o.json ? l : (l.length ? l.map(line).join('\n') : 'no decisions'); }
    else if (o.cmd === 'status') { changeFolder(o.dir, o.change); const st = decisionStatus(o); out = o.json ? st : (openLine(st) ?? 'no decisions open'); }
    else throw new Error('commands: add, decide, later, ready-done, list, status');
    console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
  }
}
