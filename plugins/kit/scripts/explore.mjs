// Explore record helper (explore-stage design D1-D3, D5; spec: explore-record). The only writer of
// <knowledge>/explore/<slug>.md: the notes an explore read, its decisions and its open questions.
// The state is derived, never stored. Saves only add; a record linked to a PRD is closed. Zero dependencies.
// Usage: node explore.mjs <command> [--dir <project>] [--json]
//   save     --slug <s> --file <record.json>   ({ title, sources, decisions, answers: { Q2: "..." }, questions })
//   undo     --slug <s>                        (drop the last save; a new record is removed)
//   link-prd --slug <s> --prd prds/<slug>.md
//   list
// Exit codes: 0 ok, 1 error.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { knowledgeDir, parseFrontmatter, writeFrontmatter } from './knowledge.mjs';

export const STATES = ['exploring', 'ready-for-prd', 'in-prd'];
export const OPEN = ['exploring', 'ready-for-prd'];
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const Q = /^Q(\d+)\s+(.+)$/;
const ANSWER = /^Q(\d+):\s/;
// The state before the last save, kept in the record itself so undo needs no temp file (verify S1, C2, C7).
const UNDO = /\n?<!-- kit-explore-undo (\{[\s\S]*?\}) -->\n?/;
const MANAGED = ['Decisions', 'Open questions'];
const norm = s => String(s ?? '').replace(/\r\n/g, '\n');
const posix = p => p.split(path.sep).join('/');

const root = dir => knowledgeDir(path.resolve(dir));
export const fileOf = (dir, slug) => path.join(root(dir), 'explore', `${slug}.md`);

/** Splits the body into its `## ` sections: [{ heading|null, text }] in order. */
function sections(body) {
  const out = [{ heading: null, text: '' }];
  for (const line of body.split('\n')) {
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) out.push({ heading: m[1], text: '' });
    else out[out.length - 1].text += `${line}\n`;
  }
  return out;
}

const bullets = text => text.split('\n').filter(l => /^\s*-\s+\S/.test(l)).map(l => l.replace(/^\s*-\s+/, '').trim());

/** Derived state (design D2): a PRD -> in-prd; any open question -> exploring; else ready-for-prd. */
export function stateOf(r) {
  if (r.prd) return 'in-prd';
  return r.questions.length ? 'exploring' : 'ready-for-prd';
}

export function readRecord(dir, slug) {
  const file = fileOf(dir, slug);
  if (!fs.existsSync(file)) return null;
  const raw = norm(fs.readFileSync(file, 'utf8'));
  const u = UNDO.exec(raw);
  let undoState = null;
  try { undoState = u ? JSON.parse(u[1]) : null; } catch { /* a broken undo copy only disables undo */ }
  const fm = parseFrontmatter(u ? raw.replace(UNDO, '\n') : raw);
  if (!fm.ok) throw new Error(`explore/${slug}.md can't be read: ${fm.error}`);
  const { title, sources, prd, ...data } = fm.data;
  const list = v => (Array.isArray(v) ? v : v ? [v] : []);
  const secs = sections(fm.body);
  const get = h => secs.find(s => s.heading?.toLowerCase() === h.toLowerCase())?.text ?? '';
  const questions = bullets(get('Open questions')).map(q => {
    const m = Q.exec(q);
    return m ? { id: `Q${m[1]}`, text: m[2] } : { id: null, text: q };
  });
  // Everything the script doesn't manage is kept as written (verify C4).
  const extra = secs.filter(s => s.heading && !MANAGED.some(h => h.toLowerCase() === s.heading.toLowerCase()))
    .map(s => `## ${s.heading}\n${s.text}`.trimEnd()).join('\n\n');
  const r = {
    slug, title: title ?? slug, sources: list(sources), prd: (Array.isArray(prd) ? prd[0] : prd) || null,
    decisions: bullets(get('Decisions')), questions, data, extra, undo: undoState, file: `explore/${slug}.md`,
  };
  return { ...r, state: stateOf(r) };
}

/** Every record, by slug. One that can't be read is listed as `unreadable` with its error, never hiding the rest (verify C1). */
export function listRecords(dir) {
  const d = path.join(root(dir), 'explore');
  let names = [];
  try { names = fs.readdirSync(d).filter(n => n.endsWith('.md')).sort(); } catch { /* none */ }
  return names.map(n => {
    const slug = n.slice(0, -3);
    try { return readRecord(dir, slug); } catch (e) { return { slug, title: slug, state: 'unreadable', error: e.message, questions: [], sources: [], decisions: [], file: `explore/${n}` }; }
  });
}

// A deep copy: the save goes on to change these arrays.
const snapshot = r => JSON.parse(JSON.stringify({ title: r.title, sources: r.sources, decisions: r.decisions, questions: r.questions }));

function render(r) {
  const body = [
    '', `# ${r.title}`, '',
    'Written by the kit (`explore.mjs`) at the end of `/opsx:explore`; saves only add.', '',
    '## Decisions', '', ...r.decisions.map(x => `- ${x}`), '',
    '## Open questions', '', ...r.questions.map(q => `- ${q.id} ${q.text}`), '',
    ...(r.extra ? [r.extra, ''] : []),
    // "-->" inside the JSON would end the comment early.
    ...(r.undo ? [`<!-- kit-explore-undo ${JSON.stringify(r.undo).replace(/-->/g, '--\\u003e')} -->`, ''] : []),
  ].join('\n');
  return writeFrontmatter({ title: r.title, sources: r.sources, ...(r.prd ? { prd: r.prd } : {}), ...r.data }, body);
}

function write(dir, r) {
  const file = fileOf(dir, r.slug);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, render(r));
}

const needSlug = slug => { if (!SLUG.test(String(slug ?? ''))) throw new Error('--slug <kebab-case> is required'); return slug; };
// One line each: a newline would split an item on read-back (verify C5).
const strings = v => (Array.isArray(v) ? v : v == null ? [] : [v]).map(s => String(s).replace(/\s*\r?\n\s*/g, ' ').trim()).filter(Boolean);

/** Create or append (spec "Record updated, never rewritten"). Nothing is written on any error. */
export function save(dir, { slug, title = null, sources = [], decisions = [], answers = {}, questions = [] }) {
  needSlug(slug);
  const kroot = root(dir);
  const found = readRecord(dir, slug);
  if (found?.prd) throw new Error(`explore/${slug}.md is already in PRD ${found.prd}: update the PRD with /kit:prd`);
  if (!found && !String(title ?? '').trim()) throw new Error('a new record needs a title');
  const r = found ?? { slug, title: String(title).trim(), sources: [], prd: null, decisions: [], questions: [], data: {}, extra: '' };
  r.undo = found ? snapshot(found) : { new: true };
  for (const s of strings(sources)) {
    const rel = posix(path.normalize(s)).replace(/^\.\//, '');
    if (!rel.startsWith('notes/') || !fs.existsSync(path.join(kroot, rel))) throw new Error(`source not found: ${s} (a note under ${posix(path.relative(path.resolve(dir), kroot)) || '.'}/notes/)`);
    if (!r.sources.includes(rel)) r.sources.push(rel);
  }
  r.decisions.push(...strings(decisions));
  for (const [id, answer] of Object.entries(answers ?? {})) {
    const i = r.questions.findIndex(q => q.id === id);
    if (i < 0) throw new Error(`no open question ${id} in explore/${slug}.md`);
    const [text] = strings(answer);
    if (!text) throw new Error(`the answer to ${id} is empty`);
    r.questions.splice(i, 1);
    r.decisions.push(`${id}: ${text}`);
  }
  // IDs never reused: the next one is above every Q seen, open or answered. A question written without an ID gets one (verify C3).
  const seen = [...r.questions.map(q => Number(q.id?.slice(1) ?? 0)), ...r.decisions.map(d => Number(ANSWER.exec(d)?.[1] ?? 0))];
  let next = Math.max(0, ...seen) + 1;
  for (const q of r.questions) if (!q.id) q.id = `Q${next++}`;
  for (const q of strings(questions)) r.questions.push({ id: `Q${next++}`, text: q });
  write(dir, r);
  return readRecord(dir, slug);
}

/** Drop the last save (spec "Saved at the end of an explore": the user says not to keep it). A new record is removed. */
export function undo(dir, { slug }) {
  needSlug(slug);
  const r = readRecord(dir, slug);
  if (!r) throw new Error(`no explore record ${slug}`);
  if (r.prd) throw new Error(`explore/${slug}.md is already in PRD ${r.prd}: nothing to undo`);
  if (!r.undo) throw new Error(`nothing to undo for explore/${slug}.md`);
  if (r.undo.new) { fs.rmSync(fileOf(dir, slug), { force: true }); return { slug, removed: true, record: null }; }
  write(dir, { ...r, ...r.undo, undo: null });
  return { slug, removed: false, record: readRecord(dir, slug) };
}

/** Link the PRD drafted from this record (spec "Record linked to its PRD"); it is then closed and can't be undone. */
export function linkPrd(dir, { slug, prd }) {
  needSlug(slug);
  const r = readRecord(dir, slug);
  if (!r) throw new Error(`no explore record ${slug}`);
  const rel = posix(path.normalize(String(prd ?? ''))).replace(/^\.\//, '');
  if (!/^prds\/[^/]+\.md$/.test(rel) || !fs.existsSync(path.join(root(dir), rel))) throw new Error(`PRD not found: ${prd} (prds/<slug>.md)`);
  if (r.prd && r.prd !== rel) throw new Error(`explore/${slug}.md is already in PRD ${r.prd}`);
  write(dir, { ...r, prd: rel, undo: null });
  return readRecord(dir, slug);
}

// ---------- CLI ----------

function format(cmd, r) {
  if (cmd === 'undo') return r.removed ? `explore/${r.slug}.md removed` : `explore/${r.slug}.md: last save dropped`;
  if (cmd === 'list') return r.length ? r.map(x => x.error ? `${x.slug}  unreadable  ${x.error}` : `${x.slug}  ${x.state}  ${x.title}${x.questions.length ? `  (${x.questions.map(q => q.id).join(', ')} open)` : ''}${x.prd ? `  -> ${x.prd}` : ''}`).join('\n') : 'No explore records yet.';
  return `explore/${r.slug}.md: ${r.state}; ${r.decisions.length} decision(s), ${r.questions.length} open question(s)${r.prd ? `, PRD ${r.prd}` : ''}`;
}

function parseArgs(argv) {
  const o = { cmd: argv[0], dir: process.cwd() };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') o.json = true;
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else throw new Error(`unexpected argument ${a}`);
  }
  return o;
}

export function run(o) {
  switch (o.cmd) {
    case 'save': {
      if (!o.file) throw new Error('save needs --file <record.json>');
      return save(o.dir, { slug: o.slug, ...JSON.parse(fs.readFileSync(o.file, 'utf8')) });
    }
    case 'undo': return undo(o.dir, { slug: o.slug });
    case 'link-prd': return linkPrd(o.dir, { slug: o.slug, prd: o.prd });
    case 'list': return listRecords(o.dir);
    default: throw new Error(`unknown command "${o.cmd ?? ''}" (save, undo, link-prd, list)`);
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
