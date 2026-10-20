// /kit:loose-ends helper (loose-ends design D1-D11; spec: loose-ends). The only writer of <knowledge>/loose-ends.md:
// things left behind while building that have no other owner. Readable table plus a data comment; the data is the
// source and the table is re-rendered on every write. Importance and blockers, never rank or time. Zero dependencies.
// Usage: node loose-ends.mjs <command> [--dir <project>] [--json] [options]
//   add       --text <t> --kind <k> --origin <o> [--tags a,b] [--source <s>] [--blocks <target>]
//             [--important --by user|agent [--reason <r>]]
//   add       --batch <file.json>          (an array of the same fields; all or nothing)
//   important --id L1 (--on [--by user|agent] [--reason <r>] | --off)
//   block     --id L1 (--target <milestone|change|L#> | --clear)
//   seen      --id L1
//   kind      --id L1 --to <kind> --reason <r>
//   done      --id L1 --reason <r>
//   drop      --id L1 --reason <r>
//   list | analysis
// Exit codes: 0 ok, 1 error.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { knowledgeDir, parseFrontmatter, today } from './knowledge.mjs';

export const KINDS = ['check', 'friction', 'debt', 'idea', 'cleanup', 'accepted'];
export const ORIGINS = ['chat', 'build', 'review', 'verify', 'note'];
export const GROUPS = [
  { name: 'must look at', kinds: ['check', 'friction'] },
  { name: 'will do anyway', kinds: ['debt'] },
  { name: 'might do', kinds: ['idea', 'cleanup'] },
  { name: 'nothing to do', kinds: ['accepted'] },
];
const DATA = /<!-- kit-loose-ends-data (\{[\s\S]*?\}) -->/;
const ID = /^L\d+$/;
const esc = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export const fileOf = dir => path.join(knowledgeDir(path.resolve(dir)), 'loose-ends.md');

// ---------- read (spec "Loose ends file") ----------

/** { exists, items }; an unreadable file throws (it must never be replaced by an empty one). */
export function readLooseEnds(dir) {
  const file = fileOf(dir);
  if (!fs.existsSync(file)) return { exists: false, file, state: { next: 1, items: [] }, items: [] };
  const m = DATA.exec(fs.readFileSync(file, 'utf8'));
  let state = null;
  try { state = m ? JSON.parse(m[1]) : null; } catch { /* below */ }
  if (!state || !Array.isArray(state.items)) throw new Error(`${path.basename(path.dirname(file))}/loose-ends.md exists but its data can't be read (merge conflict or hand edit?): fix it from git, then re-run`);
  return { exists: true, file, state, items: state.items };
}

export const isOpen = i => i.state === 'open';

/** Counts for other readers (status, next, roadmap report). Accepted items aren't "left to do". */
export function looseSummary(dir) {
  let r;
  try { r = readLooseEnds(dir); } catch { return { exists: true, unreadable: true, open: 0, toDo: 0, important: 0 }; }
  const open = r.items.filter(isOpen);
  return { exists: r.exists, open: open.length, toDo: open.filter(i => i.kind !== 'accepted').length, important: open.filter(i => i.important).length };
}

// ---------- write ----------

export function render(state) {
  const open = state.items.filter(isOpen);
  const L = [
    '# Loose ends', '',
    'Things left behind while building that have no other owner. Written by the kit (`loose-ends.mjs`, `/kit:loose-ends`); edits to this table are overwritten.', '',
    `open: ${open.length}  (important: ${open.filter(i => i.important).length})`, '',
    '| Id | Kind | Text | Important | Blocks | Seen | Origin | Tags | State | Source | Added |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...state.items.map(i => `| ${i.id} | ${i.kind} | ${esc(i.text)} | ${i.important ? `yes (${i.important.by}${i.important.reason ? `: ${esc(i.important.reason)}` : ''})` : ''} | ${i.blocks ?? ''} | ${i.seen.length} | ${i.origin} | ${esc(i.tags.join(', '))} | ${i.state}${i.closed ? ` (${esc(i.closed.reason)})` : ''} | ${esc(i.source)} | ${i.added} |`),
    // "-->" inside the JSON would end the comment early.
    '', `<!-- kit-loose-ends-data ${JSON.stringify(state).replace(/-->/g, '--\\u003e')} -->`, '',
  ];
  return L.join('\n');
}

function save(dir, state) {
  const file = fileOf(dir);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // Temp file then rename: a write cut off halfway never leaves unreadable data behind (verify C4).
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, render(state));
  fs.renameSync(tmp, file);
}

function find(state, id) {
  const it = state.items.find(i => i.id === id);
  if (!it) throw new Error(`no loose end "${id}"`);
  return it;
}
const needOpen = it => { if (!isOpen(it)) throw new Error(`${it.id} is ${it.state}`); };
const needReason = r => { if (!r || !String(r).trim()) throw new Error('--reason is required'); return String(r).trim(); };

/** Milestones (with their status), changes (active or archived) and loose ends a `blocks` value can name (design D3). */
export function targets(dir, items = []) {
  dir = path.resolve(dir);
  const milestones = new Map();
  const rdir = path.join(knowledgeDir(dir), 'roadmaps');
  for (const folder of ['milestones', 'done']) {
    let names = [];
    try { names = fs.readdirSync(path.join(rdir, folder)).filter(n => n.endsWith('.md')); } catch { /* none */ }
    for (const n of names) {
      const fm = parseFrontmatter(fs.readFileSync(path.join(rdir, folder, n), 'utf8'));
      if (fm.ok && fm.data.id) milestones.set(String(fm.data.id), { status: fm.data.status ?? null, file: `roadmaps/${folder}/${n}` });
    }
  }
  const dirs = d => { try { return fs.readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); } catch { return []; } };
  const changesRoot = path.join(dir, 'openspec', 'changes');
  const active = new Set(dirs(changesRoot).filter(n => n !== 'archive'));
  const archived = new Set(dirs(path.join(changesRoot, 'archive')).map(n => n.replace(/^\d{4}-\d{2}-\d{2}-/, '')));
  const loose = new Map(items.map(i => [i.id, i]));
  return { milestones, active, archived, loose };
}

function checkTarget(dir, state, target, self = null) {
  const t = String(target ?? '').trim();
  if (!t) throw new Error('--target is required (a milestone ID, a change name or a loose end ID)');
  if (t === self) throw new Error(`${self} can't block itself`);
  const k = targets(dir, state.items);
  // Only open work can be blocked; finished targets would show as a mismatch at once (verify C1).
  const m = k.milestones.get(t), l = k.loose.get(t);
  if (m && ['done', 'dropped'].includes(m.status)) throw new Error(`block target "${t}" is ${m.status}: only open work can be blocked`);
  if (!m && !k.active.has(t) && k.archived.has(t)) throw new Error(`block target "${t}" is archived: only open work can be blocked`);
  if (l && !isOpen(l)) throw new Error(`block target "${t}" is ${l.state}: only open work can be blocked`);
  if (m || k.active.has(t) || l) return t;
  throw new Error(`block target "${t}" not found: no milestone, change or loose end has that name`);
}

function newItem(dir, state, o) {
  const text = String(o.text ?? '').trim();
  if (!text) throw new Error('--text is required');
  if (!KINDS.includes(o.kind)) throw new Error(`--kind must be one of: ${KINDS.join(', ')}`);
  if (!ORIGINS.includes(o.origin)) throw new Error(`--origin must be one of: ${ORIGINS.join(', ')}`);
  const tags = (Array.isArray(o.tags) ? o.tags : String(o.tags ?? '').split(',')).map(s => String(s).trim()).filter(Boolean);
  const item = {
    id: `L${state.next}`, text, kind: o.kind, origin: o.origin, tags, important: null, blocks: null,
    source: String(o.source ?? '').trim() || o.origin, added: o.date ?? today(), seen: [o.date ?? today()], state: 'open', closed: null, history: [],
  };
  if (o.blocks) item.blocks = checkTarget(dir, state, o.blocks);
  if (o.important) {
    if (item.kind === 'accepted') throw new Error("an accepted item can't be important: change its kind first");
    item.important = { by: o.by === 'agent' ? 'agent' : 'user', reason: o.reason ? String(o.reason).trim() : null, date: item.added };
  }
  state.next += 1;
  state.items.push(item);
  return item;
}

/** One item, or a batch where every item must be valid before anything is written (spec "One batch at the end of a step"). */
export function add(dir, o) {
  const { state } = readLooseEnds(dir);
  const list = o.batch ? JSON.parse(fs.readFileSync(o.batch, 'utf8')) : [o];
  if (!Array.isArray(list) || !list.length) throw new Error('--batch must be a JSON array with at least one item');
  const added = list.map((x, n) => { try { return newItem(dir, state, x); } catch (e) { throw new Error(list.length > 1 ? `item ${n + 1}: ${e.message}` : e.message); } });
  save(dir, state);
  return { added };
}

function update(dir, id, fn) {
  const { state } = readLooseEnds(dir);
  if (!ID.test(String(id ?? ''))) throw new Error('--id L<n> is required');
  const it = find(state, id);
  const r = fn(it, state);
  save(dir, state);
  return r ?? it;
}

export const important = (dir, { id, on, by = 'user', reason = null, date = today() }) => update(dir, id, it => {
  needOpen(it);
  if (on && it.kind === 'accepted') throw new Error("an accepted item can't be important: change its kind first");
  it.important = on ? { by: by === 'agent' ? 'agent' : 'user', reason: reason ? String(reason).trim() : null, date } : null;
});

export const block = (dir, { id, target = null, clear = false }) => update(dir, id, (it, state) => {
  needOpen(it);
  it.blocks = clear ? null : checkTarget(dir, state, target, it.id);
});

export const seen = (dir, { id, date = today() }) => update(dir, id, it => { needOpen(it); it.seen.push(date); });

export const changeKind = (dir, { id, to, reason, date = today() }) => update(dir, id, it => {
  needOpen(it);
  if (!KINDS.includes(to)) throw new Error(`--to must be one of: ${KINDS.join(', ')}`);
  const why = needReason(reason);
  if (to === 'accepted' && it.important) throw new Error("an important item can't become accepted: remove the important mark first");
  it.history.push({ date, what: `kind ${it.kind} -> ${to}`, reason: why });
  it.kind = to;
});

const close = st => (dir, { id, reason, date = today() }) => update(dir, id, it => { needOpen(it); it.state = st; it.closed = { date, reason: needReason(reason) }; });
export const done = close('done');
export const drop = close('dropped');

// ---------- views (spec "List and analysis") ----------

/** Open items by group, important first; seen counts and blockers kept. */
export function list(dir) {
  const r = readLooseEnds(dir);
  const open = r.items.filter(isOpen);
  return {
    exists: r.exists,
    groups: GROUPS.map(g => ({ name: g.name, items: open.filter(i => g.kinds.includes(i.kind)).sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0) || Number(a.id.slice(1)) - Number(b.id.slice(1))) })),
  };
}

export function analysis(dir) {
  const { items } = readLooseEnds(dir);
  const count = (xs, key) => xs.reduce((m, i) => { for (const v of [].concat(key(i))) m[v] = (m[v] ?? 0) + 1; return m; }, {});
  const open = items.filter(isOpen);
  return {
    total: items.length,
    byState: count(items, i => i.state),
    byKind: count(items, i => i.kind),
    byOrigin: count(items, i => i.origin),
    byTag: count(items, i => i.tags),
    importantShare: open.length ? Math.round((open.filter(i => i.important).length / open.length) * 100) : 0,
    seenAgain: items.filter(i => i.seen.length > 1).map(i => ({ id: i.id, text: i.text, seen: i.seen.length })),
  };
}

// ---------- CLI ----------

const line = i => `  ${i.important ? '!' : ' '} ${i.id} [${i.kind}] ${i.text}${i.blocks ? `  (blocks ${i.blocks})` : ''}${i.seen.length > 1 ? `  (seen ${i.seen.length}x)` : ''}  ${i.source}`;

function format(cmd, r) {
  if (cmd === 'list') {
    if (!r.exists) return 'No loose ends yet. Add them with /kit:loose-ends.';
    const out = [];
    for (const g of r.groups) if (g.items.length) out.push(`${g.name} (${g.items.length})`, ...g.items.map(line));
    return out.length ? out.join('\n') : 'No open loose ends.';
  }
  if (cmd === 'analysis') {
    const kv = o => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(', ') || '-';
    return [`${r.total} loose ends`, `  state:  ${kv(r.byState)}`, `  kind:   ${kv(r.byKind)}`, `  origin: ${kv(r.byOrigin)}`, `  tags:   ${kv(r.byTag)}`,
      `  important: ${r.importantShare}% of open`, ...(r.seenAgain.length ? [`  seen again: ${r.seenAgain.map(s => `${s.id} (${s.seen}x)`).join(', ')}`] : [])].join('\n');
  }
  if (cmd === 'add') return r.added.map(i => `added ${i.id} [${i.kind}] ${i.text}${i.important ? ' (important)' : ''}`).join('\n');
  return `${r.id} [${r.kind}] ${r.state}${r.important ? ', important' : ''}${r.blocks ? `, blocks ${r.blocks}` : ''}, seen ${r.seen.length}x`;
}

function parseArgs(argv) {
  const flags = ['--json', '--important', '--on', '--off', '--clear'];
  const o = { cmd: argv[0], dir: process.cwd() };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (flags.includes(a)) o[a.slice(2)] = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else throw new Error(`unexpected argument ${a}`);
  }
  return o;
}

export function run(o) {
  const d = o.dir;
  switch (o.cmd) {
    case 'add': return add(d, o);
    case 'important':
      if (!o.on && !o.off) throw new Error('important needs --on or --off');
      return important(d, { id: o.id, on: Boolean(o.on), by: o.by, reason: o.reason });
    case 'block': return block(d, { id: o.id, target: o.target, clear: Boolean(o.clear) });
    case 'seen': return seen(d, { id: o.id });
    case 'kind': return changeKind(d, { id: o.id, to: o.to, reason: o.reason });
    case 'done': return done(d, { id: o.id, reason: o.reason });
    case 'drop': return drop(d, { id: o.id, reason: o.reason });
    case 'list': return list(d);
    case 'analysis': return analysis(d);
    default: throw new Error(`unknown command "${o.cmd ?? ''}" (add, important, block, seen, kind, done, drop, list, analysis)`);
  }
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
