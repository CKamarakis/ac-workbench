// knowledge/ helper for /kit:capture, /kit:prd and /kit:next (design D1-D4; specs: knowledge-capture,
// prd-authoring). Every exact step lives here: paths, frontmatter, slugs, moves, section writes.
// Zero dependencies.
// Usage: node knowledge.mjs <command> [--dir <project>] [--json] [options]
//   list
//   new-note    --title <t> [--body <text> | --body-file <f>] [--date YYYY-MM-DD] [--tags a,b] [--source <s>] [--topic <t>] [--asset <file>]
//   citing      --note <path>
//   move        --from <path> --to archive|<folder>
//   section-get --file <path> --heading <h>
//   section-set --file <path> --heading <h> (--text <t> | --text-file <f>) --expect <hash>
//   new-prd     --title <t> [--sources a,b] [--slug <s>]
//   set-field   --file <path> --key status|change|title --value <v>
//   prd-check   [--file <path>]
// Paths are relative to the knowledge folder. Exit codes: 0 ok, 1 error, 3 conflict.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DEFAULT_DIR = 'knowledge';
export const SUBDIRS = ['notes', 'prds', 'assets', 'archive'];
export const STATUSES = ['Draft', 'Review', 'Ready', 'Building', 'Shipped'];

const posix = p => p.split(path.sep).join('/');
const norm = s => s.replace(/\r\n/g, '\n');
const read = p => { try { return norm(fs.readFileSync(p, 'utf8')); } catch { return null; } };

// ---------- location (D1) ----------

/** The project's knowledge folder: `.claude/kit.json` `knowledge_dir`, else `knowledge/`. */
export function knowledgeDir(projectDir) {
  let rel = DEFAULT_DIR;
  try {
    const stamp = JSON.parse(fs.readFileSync(path.join(projectDir, '.claude', 'kit.json'), 'utf8'));
    if (typeof stamp.knowledge_dir === 'string' && stamp.knowledge_dir.trim()) rel = stamp.knowledge_dir.trim();
  } catch { /* no stamp: default */ }
  return path.resolve(projectDir, rel);
}

// ---------- frontmatter subset (D3) ----------

const unquote = v => (/^(['"]).*\1$/.test(v) ? v.slice(1, -1) : v);
const inlineList = v => v.slice(1, -1).split(',').map(s => unquote(s.trim())).filter(Boolean);

/**
 * Parses `key: scalar`, `key: [a, b]` and `key:` + `  - item` lines. Anything else is invalid.
 * Returns { ok, data, body, error, hasFrontmatter }.
 */
export function parseFrontmatter(text) {
  const t = norm(text ?? '');
  if (!t.startsWith('---\n')) return { ok: true, data: {}, body: t, hasFrontmatter: false };
  const end = t.indexOf('\n---', 4);
  if (end < 0 || (t[end + 4] !== undefined && t[end + 4] !== '\n')) return { ok: false, error: 'frontmatter has no closing ---', data: {}, body: t, hasFrontmatter: true };
  const lines = t.slice(4, end).split('\n');
  const body = t.slice(end + 5);
  const data = {};
  let listKey = null;
  for (const [i, line] of lines.entries()) {
    if (!line.trim()) { listKey = null; continue; }
    const item = /^\s+-\s*(.*)$/.exec(line);
    if (item && listKey) { data[listKey].push(unquote(item[1].trim())); continue; }
    const kv = /^([A-Za-z_][\w-]*):(?:\s+(.*))?$/.exec(line);
    if (!kv) return { ok: false, error: `unsupported frontmatter on line ${i + 2}: ${line.trim()}`, data, body, hasFrontmatter: true };
    const [, key, raw = ''] = kv;
    const v = raw.trim();
    if (v === '') { data[key] = []; listKey = key; continue; }
    listKey = null;
    if (v.startsWith('[')) {
      if (!v.endsWith(']')) return { ok: false, error: `unclosed list for "${key}"`, data, body, hasFrontmatter: true };
      data[key] = inlineList(v);
    } else if (/^[{|>&*!]/.test(v)) {
      return { ok: false, error: `unsupported value for "${key}": ${v}`, data, body, hasFrontmatter: true };
    } else data[key] = unquote(v);
  }
  return { ok: true, data, body, hasFrontmatter: true };
}

const needsQuote = s => s === '' || /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(s) || /:\s|\s#|\s$/.test(s);
const scalar = s => (needsQuote(String(s)) ? JSON.stringify(String(s)) : String(s));

/** Writes frontmatter in the shape parseFrontmatter reads. Lists become block lists; empty lists `[]`. */
export function writeFrontmatter(data, body = '') {
  const out = ['---'];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (!v.length) out.push(`${k}: []`);
      else { out.push(`${k}:`); for (const x of v) out.push(`  - ${scalar(x)}`); }
    } else out.push(`${k}: ${scalar(v)}`);
  }
  out.push('---');
  const b = norm(body);
  return out.join('\n') + '\n' + (b.startsWith('\n') || !b ? b : '\n' + b);
}

// ---------- names ----------

export function slugify(title) {
  const s = String(title).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return s || 'note';
}

/** First free path: `<base><ext>`, then `<base>-2<ext>`, `-3`, ... */
export function freePath(dir, base, ext) {
  let p = path.join(dir, base + ext);
  for (let n = 2; fs.existsSync(p); n++) p = path.join(dir, `${base}-${n}${ext}`);
  return p;
}

const inside = (root, p) => { const r = path.relative(root, p); return r && !r.startsWith('..') && !path.isAbsolute(r); };
function resolveIn(root, rel) {
  const p = path.resolve(root, rel);
  if (!inside(root, p)) throw new Error(`path is outside the knowledge folder: ${rel}`);
  return p;
}

// ---------- listing ----------

function walk(dir, skip = () => false) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!skip(p)) out.push(...walk(p, skip)); }
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const firstHeading = body => /^#\s+(.+)$/m.exec(body)?.[1]?.trim() ?? null;
const dateFromName = name => /^(\d{4}-\d{2}-\d{2})-/.exec(name)?.[1] ?? null;

function readNote(root, file) {
  const rel = posix(path.relative(root, file));
  const fm = parseFrontmatter(read(file));
  if (!fm.ok) return { path: rel, valid: false, errors: [fm.error] };
  const name = path.basename(file, '.md');
  const tags = fm.data.tags;
  return {
    path: rel,
    title: fm.data.title || firstHeading(fm.body) || name,
    date: fm.data.date || dateFromName(name),
    tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
    source: fm.data.source ?? null,
    valid: true,
  };
}

/** Validates one PRD file. Returns { path, slug, title, status, sources, change, valid, errors }. */
export function readPrd(root, file) {
  const rel = posix(path.relative(root, file));
  const slug = path.basename(file, '.md');
  const fm = parseFrontmatter(read(file));
  if (!fm.ok) return { path: rel, slug, valid: false, errors: [fm.error] };
  const d = fm.data;
  const errors = [];
  const sources = Array.isArray(d.sources) ? d.sources : d.sources ? [d.sources] : [];
  if (!fm.hasFrontmatter) errors.push('no frontmatter');
  if (!d.title) errors.push('missing title');
  if (!STATUSES.includes(d.status)) errors.push(`invalid status "${d.status ?? ''}" (expected one of ${STATUSES.join(', ')})`);
  for (const s of sources) if (!fs.existsSync(path.resolve(root, s))) errors.push(`source not found: ${s}`);
  if (['Building', 'Shipped'].includes(d.status) && !d.change) errors.push(`status ${d.status} needs a "change"`);
  return { path: rel, slug, title: d.title ?? slug, status: d.status ?? null, sources, change: d.change || null, valid: !errors.length, errors };
}

/** Notes (recursive, never archive/) and PRDs. */
export function listKnowledge(root) {
  const exists = fs.existsSync(root);
  const notes = walk(path.join(root, 'notes')).map(f => readNote(root, f));
  const prds = walk(path.join(root, 'prds')).map(f => readPrd(root, f));
  return {
    root: posix(root),
    exists,
    notes: notes.filter(n => n.valid),
    prds,
    invalid: [...notes.filter(n => !n.valid), ...prds.filter(p => !p.valid)].map(x => ({ path: x.path, errors: x.errors })),
  };
}

// ---------- notes ----------

export const today = () => new Date().toISOString().slice(0, 10);

/** Writes a note; never overwrites (collision suffix). Copies an optional asset into assets/. */
export function newNote(root, { title, body = '', date = today(), tags = [], source = null, topic = null, asset = null }) {
  if (!title || !String(title).trim()) throw new Error('a note needs a title');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`date must be YYYY-MM-DD, got "${date}"`);
  const dir = topic ? resolveIn(root, path.join('notes', topic)) : path.join(root, 'notes');
  fs.mkdirSync(dir, { recursive: true });
  const file = freePath(dir, `${date}-${slugify(title)}`, '.md');
  let text = norm(body).trim();
  let assetRel = null;
  if (asset) {
    if (!fs.existsSync(asset)) throw new Error(`asset not found: ${asset}`);
    const adir = path.join(root, 'assets');
    fs.mkdirSync(adir, { recursive: true });
    const ext = path.extname(asset);
    const dest = freePath(adir, slugify(path.basename(asset, ext)), ext.toLowerCase());
    fs.copyFileSync(asset, dest);
    assetRel = posix(path.relative(root, dest));
    const link = posix(path.relative(dir, dest));
    text += `${text ? '\n\n' : ''}![${path.basename(dest)}](${link})`;
  }
  const data = { title: String(title).trim(), date };
  if (tags.length) data.tags = tags;
  if (source) data.source = source;
  fs.writeFileSync(file, writeFrontmatter(data, text ? text + '\n' : ''));
  return { path: posix(path.relative(root, file)), asset: assetRel };
}

/** PRDs whose `sources` cite this note. */
export function citing(root, noteRel) {
  const target = posix(path.normalize(noteRel));
  return walk(path.join(root, 'prds')).map(f => readPrd(root, f))
    .filter(p => p.sources?.some(s => posix(path.normalize(s)) === target)).map(p => p.path);
}

function rewriteSources(root, prdRel, from, to) {
  const file = path.join(root, prdRel);
  const fm = parseFrontmatter(read(file));
  if (!fm.ok) throw new Error(`${prdRel}: ${fm.error}`);
  const list = Array.isArray(fm.data.sources) ? fm.data.sources : [fm.data.sources];
  fm.data.sources = list.map(s => (posix(path.normalize(s)) === from ? to : s));
  fs.writeFileSync(file, writeFrontmatter(fm.data, fm.body));
}

/**
 * Moves a note or PRD on request. `to` = "archive" (mirrors the path under archive/) or a folder
 * under the knowledge root (e.g. "notes/checkout"). Never overwrites, never deletes.
 * Citing PRDs get their `sources` rewritten to the new path.
 */
export function move(root, fromRel, to) {
  const src = resolveIn(root, fromRel);
  if (!fs.existsSync(src)) throw new Error(`not found: ${fromRel}`);
  const from = posix(path.relative(root, src));
  if (from.startsWith('archive/')) throw new Error(`already archived: ${from}`);
  const destDir = to === 'archive' ? path.dirname(resolveIn(root, path.join('archive', from))) : resolveIn(root, to);
  const dest = path.join(destDir, path.basename(src));
  if (fs.existsSync(dest)) throw new Error(`target exists, nothing moved: ${posix(path.relative(root, dest))}`);
  const toRel = posix(path.relative(root, dest));
  const cited = citing(root, from);
  fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(src, dest);
  for (const p of cited) rewriteSources(root, p, from, toRel);
  return { from, to: toRel, updated: cited };
}

// ---------- PRDs ----------

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Creates prds/<slug>.md from the kit template. Refuses to overwrite; sources must exist. */
export function newPrd(root, { title, sources = [], slug = null }) {
  if (!title || !String(title).trim()) throw new Error('a PRD needs a title');
  for (const s of sources) if (!fs.existsSync(resolveIn(root, s))) throw new Error(`source not found: ${s}`);
  const dir = path.join(root, 'prds');
  const file = path.join(dir, `${slugify(slug ?? title)}.md`);
  if (fs.existsSync(file)) throw new Error(`PRD exists, nothing written: ${posix(path.relative(root, file))}`);
  const tpl = parseFrontmatter(read(path.join(KIT, 'templates', 'prd.md')));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, writeFrontmatter({ title: String(title).trim(), status: 'Draft', sources: sources.map(s => posix(path.normalize(s))) }, tpl.body));
  return { path: posix(path.relative(root, file)) };
}

const FIELDS = { status: v => STATUSES.includes(v) || `status must be one of ${STATUSES.join(', ')}`, change: v => /^[a-z0-9][a-z0-9-]*$/.test(v) || 'change must be a kebab-case change name', title: v => !!v.trim() || 'title cannot be empty' };

/** Sets one frontmatter field of a PRD (status, change or title). The body is untouched. */
export function setField(root, rel, key, value) {
  const check = FIELDS[key];
  if (!check) throw new Error(`only ${Object.keys(FIELDS).join(', ')} can be set`);
  const ok = check(String(value ?? ''));
  if (ok !== true) throw new Error(ok);
  const file = resolveIn(root, rel);
  const fm = parseFrontmatter(read(file));
  if (read(file) == null) throw new Error(`not found: ${rel}`);
  if (!fm.ok) throw new Error(`${rel}: ${fm.error}`);
  const before = fm.data[key] ?? null;
  fm.data[key] = String(value);
  fs.writeFileSync(file, writeFrontmatter(fm.data, fm.body));
  return { path: posix(path.relative(root, file)), key, from: before, to: String(value) };
}

// ---------- sections (D4) ----------

export const hash = s => crypto.createHash('sha256').update(norm(s).replace(/\s+$/, '')).digest('hex').slice(0, 12);

function findSection(text, heading) {
  const lines = norm(text).split('\n');
  const want = heading.trim().toLowerCase();
  const start = lines.findIndex(l => /^##\s+/.test(l) && l.replace(/^##\s+/, '').trim().toLowerCase() === want);
  if (start < 0) return { lines, start: -1 };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (/^#{1,2}\s/.test(lines[i])) { end = i; break; }
  return { lines, start, end };
}

/** Section body under `## heading` (without the heading line) and its hash. */
export function sectionGet(file, heading) {
  const text = read(file);
  if (text == null) throw new Error(`not found: ${file}`);
  const s = findSection(text, heading);
  if (s.start < 0) return { heading, missing: true, text: '', hash: hash('') };
  const body = s.lines.slice(s.start + 1, s.end).join('\n');
  return { heading, missing: false, text: body, hash: hash(body) };
}

/** Writes a section only if its current hash equals `expect`; a missing section is appended. */
export function sectionSet(file, heading, newText, expect) {
  if (!expect) throw new Error('--expect <hash> is required (from section-get)');
  const text = read(file);
  if (text == null) throw new Error(`not found: ${file}`);
  const cur = sectionGet(file, heading);
  if (cur.hash !== expect) return { conflict: true, heading, expected: expect, actual: cur.hash, current: cur.text };
  const body = norm(newText).replace(/^\n+|\s+$/g, '');
  const s = findSection(text, heading);
  let out;
  if (s.start < 0) out = text.replace(/\s*$/, '\n') + `\n## ${heading}\n\n${body}\n`;
  else {
    const after = s.lines.slice(s.end);
    out = [...s.lines.slice(0, s.start + 1), '', body, ...(after.length ? [''] : []), ...after].join('\n');
    if (!after.length) out += '\n';
  }
  fs.writeFileSync(file, out);
  return { conflict: false, heading, hash: hash(body) };
}

// ---------- CLI ----------

function parseArgs(argv) {
  const o = { cmd: argv[0], dir: process.cwd(), json: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') o.json = true;
    else if (a.startsWith('--')) o[a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[++i];
    else throw new Error(`unexpected argument ${a}`);
  }
  return o;
}

function run(o) {
  const root = knowledgeDir(o.dir);
  const at = rel => resolveIn(root, rel);
  switch (o.cmd) {
    case 'list': return listKnowledge(root);
    case 'new-note': return newNote(root, {
      title: o.title,
      body: o.bodyFile ? fs.readFileSync(o.bodyFile, 'utf8') : o.body ?? '',
      date: o.date ?? today(),
      tags: o.tags ? o.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
      source: o.source ?? null, topic: o.topic ?? null, asset: o.asset ?? null,
    });
    case 'citing': return { note: o.note, citedBy: citing(root, o.note) };
    case 'move': return move(root, o.from, o.to);
    case 'section-get': return sectionGet(at(o.file), o.heading);
    case 'section-set': return sectionSet(at(o.file), o.heading, o.textFile ? fs.readFileSync(o.textFile, 'utf8') : o.text ?? '', o.expect);
    case 'new-prd': return newPrd(root, { title: o.title, slug: o.slug ?? null, sources: o.sources ? o.sources.split(',').map(s => s.trim()).filter(Boolean) : [] });
    case 'set-field': return setField(root, o.file, o.key, o.value);
    case 'prd-check': {
      const files = o.file ? [at(o.file)] : walk(path.join(root, 'prds'));
      const results = files.map(f => readPrd(root, f));
      return { valid: results.every(r => r.valid), results };
    }
    default: throw new Error(`unknown command "${o.cmd ?? ''}" (list, new-note, citing, move, new-prd, set-field, section-get, section-set, prd-check)`);
  }
}

function format(cmd, r) {
  if (cmd === 'list') {
    const lines = [`Knowledge: ${r.root}${r.exists ? '' : ' (missing)'}`, `Notes (${r.notes.length}):`];
    for (const n of r.notes) lines.push(`  ${n.path}  - ${n.title}${n.tags.length ? `  [${n.tags.join(', ')}]` : ''}`);
    lines.push(`PRDs (${r.prds.length}):`);
    for (const p of r.prds) lines.push(`  ${p.path}  ${p.status ?? '?'}  - ${p.title ?? p.slug}${p.change ? `  (change: ${p.change})` : ''}`);
    for (const x of r.invalid) lines.push(`INVALID ${x.path}: ${x.errors.join('; ')}`);
    return lines.join('\n');
  }
  if (cmd === 'section-set') return r.conflict
    ? `CONFLICT: "${r.heading}" changed since it was read (expected ${r.expected}, now ${r.actual}). Nothing written.`
    : `wrote "${r.heading}" (hash ${r.hash})`;
  if (cmd === 'prd-check') return r.results.map(x => `${x.valid ? 'ok     ' : 'INVALID'} ${x.path}${x.errors.length ? `: ${x.errors.join('; ')}` : ''}`).join('\n') || 'No PRDs.';
  if (cmd === 'move') return `moved ${r.from} -> ${r.to}${r.updated.length ? `\nupdated sources in: ${r.updated.join(', ')}` : ''}`;
  if (cmd === 'citing') return r.citedBy.length ? `${r.note} is cited by: ${r.citedBy.join(', ')}` : `${r.note} is not cited by any PRD`;
  if (cmd === 'new-prd') return `created ${r.path} (status Draft)`;
  if (cmd === 'set-field') return `${r.path}: ${r.key} ${r.from ?? '(none)'} -> ${r.to}`;
  if (cmd === 'new-note') return `created ${r.path}${r.asset ? `\nasset ${r.asset}` : ''}`;
  if (cmd === 'section-get') return `hash: ${r.hash}${r.missing ? ' (section missing)' : ''}\n${r.text}`;
  return JSON.stringify(r, null, 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let o;
  try {
    o = parseArgs(process.argv.slice(2));
    const r = run(o);
    console.log(o.json ? JSON.stringify(r, null, 2) : format(o.cmd, r));
    if (r?.conflict) process.exitCode = 3;
    else if (o.cmd === 'prd-check' && !r.valid) process.exitCode = 1;
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}
