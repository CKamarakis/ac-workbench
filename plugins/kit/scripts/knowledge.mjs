// knowledge/ helper for /kit:capture, /kit:prd and /kit:next (design D1-D4; specs: knowledge-capture,
// prd-authoring). Every exact step lives here: paths, frontmatter, slugs, moves, section writes.
// Zero dependencies.
// Usage: node knowledge.mjs <command> [--dir <project>] [--json] [options]
//   list
//   new-note    --title <t> [--body <text> | --body-file <f>] [--date YYYY-MM-DD] [--tags a,b] [--source <s>] [--topic <t>] [--asset <file>]
//   import      --file <path> [--title <t>] [--tags a,b] [--date YYYY-MM-DD] [--topic <t>]
//   citing      --note <path>
//   move        --from <path> --to archive|<folder>
//   section-get --file <path> --heading <h>
//   section-set --file <path> --heading <h> (--text <t> | --text-file <f>) --expect <hash>
//   new-prd     --title <t> [--sources a,b] [--slug <s>] [--part-of <parent slug>]
//   set-field   --file <path> --key status|change|title|shape|part-of --value <v>
//   prd-check   [--file <path>]
// Paths are relative to the knowledge folder. Exit codes: 0 ok, 1 error, 3 conflict (or a move waiting on unfinished parts).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { locate } from './locate.mjs';

// The PRD line a proposal carries (spec: skill-routing "Next-step suggestion uses PRD status"); used by next, ready and docs.
export const PRD_LINE = /PRD:\s*`?([^\s`@]+\.md)`?\s*@\s*`?([0-9a-f]{4,40}|uncommitted)`?/i;

// The parent line a proposal made from a PRD part carries next to its PRD line (prd-parts D7). It has no "PRD:"
// token, so PRD_LINE never matches it.
export const PRD_PARENT_LINE = /PRD parent:\s*`?([^\s`@]+\.md)`?\s*@\s*`?([0-9a-f]{4,40}|uncommitted)`?/i;

/** The PRD line of a proposal, plus `parent` when it also has a "PRD parent:" line; or null. */
export function prdLink(proposalText) {
  const m = PRD_LINE.exec(proposalText ?? '');
  if (!m) return null;
  const p = PRD_PARENT_LINE.exec(proposalText);
  return { path: m[1].replace(/\\/g, '/'), commit: m[2].toLowerCase(), ...(p ? { parent: { path: p[1].replace(/\\/g, '/'), commit: p[2].toLowerCase() } } : {}) };
}

export const DEFAULT_DIR = 'knowledge';
export const SUBDIRS = ['notes', 'prds', 'assets', 'archive'];
export const STATUSES = ['Draft', 'Review', 'Ready', 'Building', 'Shipped', 'Dropped'];
// A part counts as finished for its parent's Shipped check (prd-parts D3).
export const FINISHED = ['Shipped', 'Dropped'];

const posix = p => p.split(path.sep).join('/');
const norm = s => s.replace(/\r\n/g, '\n');
const read = p => { try { return norm(fs.readFileSync(p, 'utf8')); } catch { return null; } };

// ---------- location (D1) ----------

/** `knowledge_dir` from a `.claude/kit.json` stamp, tidied (trimmed, `/` separators, no trailing slash); `knowledge` when unset. */
export function stampKnowledgeDir(stamp) {
  const v = stamp?.knowledge_dir;
  return typeof v === 'string' && v.trim() ? v.trim().replace(/\\/g, '/').replace(/\/+$/, '') || DEFAULT_DIR : DEFAULT_DIR;
}

/** The project's knowledge folder: `.claude/kit.json` `knowledge_dir`, else `knowledge/`. */
export function knowledgeDir(projectDir) {
  let stamp = null;
  try { stamp = JSON.parse(fs.readFileSync(path.join(projectDir, '.claude', 'kit.json'), 'utf8')); } catch { /* no stamp: default */ }
  return path.resolve(projectDir, stampKnowledgeDir(stamp));
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

function walk(dir, ext = '.md') {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, ext));
    else if (e.name.toLowerCase().endsWith(ext)) out.push(p);
  }
  return out;
}

// ---------- last update (design D1, followups) ----------

const mtimeIso = file => fs.statSync(file).mtime.toISOString();

/**
 * file -> ISO time of its last update: the last commit touching it when the file is clean and
 * tracked, else its modification time (uncommitted edits, untracked file, or no git).
 */
export function gitUpdatedOf(root) {
  const git = locate('git')?.path ?? 'git';
  const run = (args, cwd) => spawnSync(git, args, { cwd, encoding: 'utf8', timeout: 10000 });
  return file => {
    const cwd = path.dirname(file);
    const st = run(['status', '--porcelain', '--', path.basename(file)], cwd);
    if (st.status !== 0 || st.stdout.trim()) return mtimeIso(file);
    const log = run(['log', '-1', '--format=%cI', '--', path.basename(file)], cwd);
    const t = log.status === 0 ? log.stdout.trim() : '';
    return t ? new Date(t).toISOString() : mtimeIso(file);
  };
}

/** Newest first; ties by slug. */
export const byUpdated = (a, b) => String(b.updated).localeCompare(String(a.updated)) || a.slug.localeCompare(b.slug);

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

/** The items of a PRD's "Open questions" section ("None" and "N/A" don't count). */
export function openQuestions(text) {
  const m = /^##\s+Open questions\s*\n([\s\S]*?)(?=^##\s|$(?![\s\S]))/im.exec(String(text ?? ''));
  return m ? m[1].split('\n').filter(l => /^\s*[-*]\s*\S/.test(l) && !/^\s*[-*]\s*(none|n\/a)\.?\s*$/i.test(l)).map(l => l.replace(/^\s*[-*]\s*/, '').trim()) : [];
}

const PART_KEY = 'part-of';
const partOfField = d => (typeof d[PART_KEY] === 'string' && d[PART_KEY].trim() ? d[PART_KEY].trim() : null);

/**
 * The parts of a top-level PRD `prds/<slug>.md` (prd-parts D1): files in `prds/<slug>/` whose `part-of` is
 * that slug. Each is { name, path, title, status }. Any other PRD has none.
 */
export function partsOf(root, rel) {
  const m = /^prds\/([^/]+)\.md$/.exec(rel);
  if (!m) return [];
  const dir = path.join(root, 'prds', m[1]);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!e.isFile() || !e.name.toLowerCase().endsWith('.md')) continue;
    const fm = parseFrontmatter(read(path.join(dir, e.name)));
    if (!fm.ok || partOfField(fm.data) !== m[1]) continue;
    const name = `${m[1]}/${path.basename(e.name, '.md')}`;
    out.push({ name, path: `prds/${name}.md`, title: fm.data.title ?? name, status: fm.data.status ?? null });
  }
  return out;
}

/**
 * Validates one PRD file. Returns { path, slug, name, partOf, label, title, status, sources, change, parts,
 * openQuestions, valid, errors, warnings }. A part (a file with `part-of`, prd-parts D1) is named
 * `<parent>/<file name>` and labelled "<parent title> › <part title>"; anything else keeps its file name.
 */
export function readPrd(root, file) {
  const rel = posix(path.relative(root, file));
  const slug = path.basename(file, '.md');
  const raw = read(file);
  const fm = parseFrontmatter(raw);
  if (!fm.ok) return { path: rel, slug, name: slug, valid: false, errors: [fm.error], warnings: [] };
  const d = fm.data;
  const errors = [];
  const warnings = [];
  const sources = Array.isArray(d.sources) ? d.sources : d.sources ? [d.sources] : [];
  const partOf = partOfField(d);
  const title = d.title ?? slug;
  let name = slug, label = title, parts = [];
  if (!fm.hasFrontmatter) errors.push('no frontmatter');
  if (!d.title) errors.push('missing title');
  if (!STATUSES.includes(d.status)) errors.push(`invalid status "${d.status ?? ''}" (expected one of ${STATUSES.join(', ')})`);
  for (const s of sources) if (!fs.existsSync(path.resolve(root, s))) errors.push(`source not found: ${s}`);
  if (partOf) {
    name = `${partOf}/${slug}`;
    const parentRel = `prds/${partOf}.md`;
    // The folder check comes first, so a crafted part-of never reads a file outside prds/.
    const parentText = posix(path.dirname(rel)) === `prds/${partOf}` ? read(path.join(root, parentRel)) : undefined;
    const parent = parentText ? parseFrontmatter(parentText) : null;
    if (parentText === undefined) errors.push(`part-of "${partOf}" doesn't match its folder: a part of ${partOf} belongs in prds/${partOf}/`);
    else if (parentText == null) errors.push(`parent not found: ${parentRel}`);
    else if (parent.ok && partOfField(parent.data)) errors.push(`parent ${partOf} is itself a part; a part can't have parts`);
    else if (parent.ok && parent.data.title) label = `${parent.data.title} › ${title}`;
  } else {
    parts = partsOf(root, rel);
    if (d.status === 'Shipped' && parts.length) {
      const open = parts.filter(p => !FINISHED.includes(p.status));
      if (open.length) warnings.push(`${slug} is Shipped while ${open.map(p => `${p.name} is ${p.status ?? 'without a status'}`).join(', ')}`);
    }
  }
  // A parent with parts is built through its parts, so it needs no change of its own (prd-parts D4).
  if (['Building', 'Shipped'].includes(d.status) && !d.change && !parts.length) errors.push(`status ${d.status} needs a "change"`);
  return { path: rel, slug, name, partOf, label, title, status: d.status ?? null, sources, change: d.change || null, parts: parts.map(p => p.name), openQuestions: openQuestions(raw).length, valid: !errors.length, errors, warnings };
}

/** Parents and single PRDs newest first (a parent's time is the newest of itself and its parts), each part right after its parent. */
function orderPrds(prds) {
  // Group exactly the parts each parent lists (partsOf), valid or not, so the list indents the same set.
  const listed = new Set(prds.flatMap(p => p.parts ?? []));
  const partsOfParent = new Map();
  const top = [];
  for (const p of prds) {
    const parent = p.partOf ? `prds/${p.partOf}.md` : null;
    if (parent && listed.has(p.name)) (partsOfParent.get(parent) ?? partsOfParent.set(parent, []).get(parent)).push(p);
    else top.push(p);
  }
  const groupTime = p => [p, ...(partsOfParent.get(p.path) ?? [])].map(x => String(x.updated)).sort().pop();
  const keyed = top.map(p => ({ p, updated: groupTime(p), slug: p.name }));
  return keyed.sort(byUpdated).flatMap(({ p }) => [p, ...(partsOfParent.get(p.path) ?? []).sort(byUpdated)]);
}

/** Notes (recursive, never archive/), PRDs newest-updated first, and .txt files not imported yet. */
export function listKnowledge(root, { updatedOf = null } = {}) {
  const exists = fs.existsSync(root);
  const notes = walk(path.join(root, 'notes')).map(f => readNote(root, f));
  const prdFiles = walk(path.join(root, 'prds'));
  const upd = prdFiles.length ? (updatedOf ?? gitUpdatedOf(root)) : null;
  const prds = orderPrds(prdFiles.map(f => ({ ...readPrd(root, f), updated: upd(f) })));
  return {
    root: posix(root),
    exists,
    notes: notes.filter(n => n.valid),
    prds,
    unimported: walk(path.join(root, 'notes'), '.txt').map(f => posix(path.relative(root, f))),
    invalid: [...notes.filter(n => !n.valid), ...prds.filter(p => !p.valid)].map(x => ({ path: x.path, errors: x.errors })),
    warnings: prds.flatMap(p => p.warnings ?? []),
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

/**
 * Imports a .txt or .md file as a note (followups D4). The text is kept as is; an existing
 * frontmatter's title, date and other keys are kept unless overridden. A file under notes/ is
 * replaced (removed only after the new note is verified); a file elsewhere is left in place.
 */
export function importNote(root, { file, title = null, tags = null, date = null, topic = null }) {
  if (!file) throw new Error('--file is required');
  const src = path.resolve(file);
  const ext = path.extname(src).toLowerCase();
  if (!['.txt', '.md'].includes(ext)) throw new Error(`only .txt and .md can be imported, got "${ext || 'no extension'}"`);
  const raw = read(src);
  if (raw == null) throw new Error(`not found: ${file}`);
  let data = {}, body = raw;
  if (ext === '.md') {
    const fm = parseFrontmatter(raw);
    if (!fm.ok) throw new Error(`${path.basename(src)}: ${fm.error}`);
    data = fm.data;
    body = fm.hasFrontmatter ? fm.body.replace(/^\n/, '') : raw;
  }
  const t = (title ?? data.title ?? '').toString().trim();
  if (!t) throw new Error('a note needs a title (pass --title)');
  const d = date ?? data.date ?? today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d))) throw new Error(`date must be YYYY-MM-DD, got "${d}"`);
  const notesDir = path.join(root, 'notes');
  const inNotes = inside(notesDir, src);
  const dir = topic ? resolveIn(root, path.join('notes', topic)) : inNotes ? path.dirname(src) : notesDir;
  fs.mkdirSync(dir, { recursive: true });
  const base = `${d}-${slugify(t)}`;
  const dest = path.join(dir, base + '.md') === src ? src : freePath(dir, base, '.md');
  const { title: _t, date: _d, tags: oldTags, source: _s, ...rest } = data;
  const meta = { title: t, date: String(d) };
  const tg = tags ?? (Array.isArray(oldTags) ? oldTags : oldTags ? [oldTags] : []);
  if (tg.length) meta.tags = tg;
  meta.source = path.basename(src);
  const out = writeFrontmatter({ ...meta, ...rest }, '') + '\n' + body;
  fs.writeFileSync(dest, out);
  const check = parseFrontmatter(read(dest));
  if (!check.ok || check.body.replace(/^\n/, '') !== body) throw new Error(`import check failed for ${posix(path.relative(root, dest))}; the original was kept`);
  let removed = null;
  if (inNotes && dest !== src) { fs.unlinkSync(src); removed = posix(path.relative(root, src)); }
  return { path: posix(path.relative(root, dest)), removed, kept: inNotes ? null : src };
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
export function move(root, fromRel, to, { projectDir = null } = {}) {
  const src = resolveIn(root, fromRel);
  if (!fs.existsSync(src)) throw new Error(`not found: ${fromRel}`);
  const from = posix(path.relative(root, src));
  if (from.startsWith('archive/')) throw new Error(`already archived: ${from}`);
  const destDir = to === 'archive' ? path.dirname(resolveIn(root, path.join('archive', from))) : resolveIn(root, to);
  const dest = path.join(destDir, path.basename(src));
  if (fs.existsSync(dest)) throw new Error(`target exists, nothing moved: ${posix(path.relative(root, dest))}`);
  // A parent with parts (prd-parts D8): unfinished parts are the user's call, one by one; finished ones move along.
  const parts = partsOf(root, from);
  const unfinished = parts.filter(p => !FINISHED.includes(p.status));
  const partsDir = parts.length ? path.join(path.dirname(src), path.basename(src, '.md')) : null;
  // The folder moves whole, so anything in it that isn't a part of this parent (a detached part, broken
  // frontmatter, a nested PRD of its own, any other file) would go along unseen: name it and move nothing.
  const partFiles = new Set(parts.map(p => path.basename(p.path)));
  const others = partsDir ? fs.readdirSync(partsDir).filter(n => !partFiles.has(n)).sort().map(n => posix(path.relative(root, path.join(partsDir, n)))) : [];
  if (unfinished.length || others.length) return { from, moved: false, unfinished, others, updated: [], proposals: [] };
  const partsDest = partsDir ? path.join(destDir, path.basename(partsDir)) : null;
  if (partsDest && fs.existsSync(partsDest)) throw new Error(`target exists, nothing moved: ${posix(path.relative(root, partsDest))}`);
  const toRel = posix(path.relative(root, dest));
  const cited = citing(root, from);
  // Only a PRD can be named in a proposal's PRD lines.
  const proposals = projectDir && from.startsWith('prds/') ? proposalsCiting(projectDir, root, [from, ...parts.map(p => p.path)]) : [];
  fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(src, dest);
  if (partsDir) fs.renameSync(partsDir, partsDest);
  for (const p of cited) rewriteSources(root, p, from, toRel);
  return { from, to: toRel, moved: true, parts: parts.map(p => p.name), updated: cited, proposals };
}

/** Active changes whose proposal names one of these PRD files (knowledge-relative) in its PRD or PRD parent line. */
function proposalsCiting(projectDir, root, rels) {
  const want = new Set(rels.map(r => posix(path.relative(projectDir, path.join(root, r)))));
  const base = path.join(projectDir, 'openspec', 'changes');
  let entries = [];
  try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch { return []; }
  return entries.filter(e => e.isDirectory() && e.name !== 'archive').filter(e => {
    const link = prdLink(read(path.join(base, e.name, 'proposal.md')));
    return link && (want.has(link.path) || (link.parent && want.has(link.parent.path)));
  }).map(e => `openspec/changes/${e.name}/proposal.md`).sort();
}

// ---------- PRDs ----------

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Creates prds/<slug>.md from the kit template, or with `partOf` a part prds/<parent>/<slug>.md from the part
 * template plus a row in the parent's Parts section (prd-parts D5). Refuses to overwrite; sources must exist.
 */
export function newPrd(root, { title, sources = [], slug = null, partOf = null }) {
  if (!title || !String(title).trim()) throw new Error('a PRD needs a title');
  for (const s of sources) if (!fs.existsSync(resolveIn(root, s))) throw new Error(`source not found: ${s}`);
  let dir = path.join(root, 'prds');
  let parentFile = null;
  if (partOf != null) {
    if (!String(partOf).trim()) throw new Error('--part-of needs the parent PRD\'s slug (prds/<slug>.md). Nothing written.');
    if (partOf.includes('/')) throw new Error(`"${partOf}" is a part; a part can't have parts. Nothing written.`);
    // Exact file name only: no "..", no backslash, no other case (Windows would still find the file), so the
    // part always lands in prds/<parent>/ and its part-of matches the parent (security finding S1).
    const names = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    if (/[\\]|^\.+$/.test(partOf) || !names.includes(`${partOf}.md`)) {
      const near = names.find(n => n.toLowerCase() === `${partOf}.md`.toLowerCase());
      throw new Error(`parent PRD not found: prds/${partOf}.md${near ? ` (did you mean ${path.basename(near, '.md')}?)` : ''}. Nothing written.`);
    }
    parentFile = path.join(dir, `${partOf}.md`);
    const parent = read(parentFile);
    const pfm = parseFrontmatter(parent);
    if (pfm.ok && partOfField(pfm.data)) throw new Error(`"${partOf}" is a part of ${partOfField(pfm.data)}; a part can't have parts. Nothing written.`);
    dir = path.join(dir, partOf);
  }
  const name = slugify(slug ?? title);
  const file = path.join(dir, `${name}.md`);
  if (fs.existsSync(file)) throw new Error(`PRD exists, nothing written: ${posix(path.relative(root, file))}`);
  const tpl = parseFrontmatter(read(path.join(KIT, 'templates', parentFile ? 'prd-part.md' : 'prd.md')));
  fs.mkdirSync(dir, { recursive: true });
  const data = { title: String(title).trim(), status: 'Draft', ...(parentFile ? { [PART_KEY]: partOf } : {}), sources: sources.map(s => posix(path.normalize(s))) };
  fs.writeFileSync(file, writeFrontmatter(data, tpl.body));
  if (parentFile) addPartRow(parentFile, `${partOf}/${name}`, data.title);
  return { path: posix(path.relative(root, file)), ...(parentFile ? { parent: `prds/${partOf}.md` } : {}) };
}

/** Appends `| name | title |` to the parent's `## Parts` section; adds the section or the table header when missing. Other lines stay as they are. */
function addPartRow(parentFile, name, title) {
  const row = `| ${name} | ${title.replace(/\|/g, '\\|')} |`;
  const header = ['| Part | Title |', '|---|---|'];
  const text = read(parentFile);
  // Keep the file's own line endings (read() normalises to LF).
  const crlf = fs.readFileSync(parentFile, 'utf8').includes('\r\n');
  const s = findSection(text, 'Parts');
  let out;
  if (s.start < 0) out = text.replace(/\s*$/, '\n') + `\n## Parts\n\n${[...header, row].join('\n')}\n`;
  else {
    const body = s.lines.slice(s.start + 1, s.end);
    const at = (pred) => body.reduce((n, l, i) => (pred(l) ? i : n), -1);
    const lastTable = at(l => /^\s*\|/.test(l));
    const last = at(l => l.trim());
    let next;
    if (lastTable >= 0) next = [...body.slice(0, lastTable + 1), row, ...body.slice(lastTable + 1)];
    else if (last >= 0) next = [...body.slice(0, last + 1), '', ...header, row, ...body.slice(last + 1)];
    else next = ['', ...header, row, ''];
    const after = s.lines.slice(s.end);
    if (!after.length && next[next.length - 1] !== '') next.push('');
    out = [...s.lines.slice(0, s.start + 1), ...next, ...after].join('\n');
  }
  fs.writeFileSync(parentFile, crlf ? out.replace(/\n/g, '\r\n') : out);
}

const FIELDS = { status: v => STATUSES.includes(v) || `status must be one of ${STATUSES.join(', ')}`,
  // Empty removes it, e.g. a parent's old change after a split (rc.2 feedback).
  change: v => v === '' || /^[a-z0-9][a-z0-9-]*$/.test(v) || 'change must be a kebab-case change name, or empty to remove it', title: v => !!v.trim() || 'title cannot be empty',
  // The /impeccable shape offer's answer, so it's made once per PRD (ui-flow-with-impeccable design D4).
  shape: v => ['done', 'declined'].includes(v) || 'shape must be done or declined',
  // A part's parent slug, or empty to make the part a PRD of its own (prd-parts D8).
  [PART_KEY]: v => v === '' || /^[a-z0-9][a-z0-9-]*$/.test(v) || 'part-of must be a parent PRD slug (no folders), or empty to remove it' };

/** Sets one frontmatter field of a PRD (status, change, title, shape or part-of; an empty change or part-of removes it). The body is untouched. */
export function setField(root, rel, key, value) {
  // PowerShell 5.1 drops an empty "" argument, so a missing --value for change or part-of means "remove it".
  const removable = key === PART_KEY || key === 'change';
  if (removable && value == null) value = '';
  const check = FIELDS[key];
  if (!check) throw new Error(`only ${Object.keys(FIELDS).join(', ')} can be set`);
  const ok = check(String(value ?? ''));
  if (ok !== true) throw new Error(ok);
  const file = resolveIn(root, rel);
  const fm = parseFrontmatter(read(file));
  if (read(file) == null) throw new Error(`not found: ${rel}`);
  if (!fm.ok) throw new Error(`${rel}: ${fm.error}`);
  const before = fm.data[key] ?? null;
  if (removable && value === '') delete fm.data[key];
  else fm.data[key] = String(value);
  fs.writeFileSync(file, writeFrontmatter(fm.data, fm.body));
  // A parent marked Shipped with open parts gets the warning, also when a part under a Shipped parent is
  // reopened; the write stands (prd-parts D6).
  let warnings = [];
  if (key === 'status') {
    const r = readPrd(root, file);
    const parentFile = r.partOf ? path.join(root, 'prds', `${r.partOf}.md`) : null;
    const parentOk = parentFile && posix(path.dirname(r.path)) === `prds/${r.partOf}` && fs.existsSync(parentFile);
    warnings = [...(r.warnings ?? []), ...(parentOk ? readPrd(root, parentFile).warnings ?? [] : [])];
  }
  return { path: posix(path.relative(root, file)), key, from: before, to: removable && value === '' ? null : String(value), warnings };
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
/** The text without its `## heading` section (heading line included), line endings normalised and trailing space trimmed. */
export function withoutSection(text, heading) {
  const s = findSection(text ?? '', heading);
  const lines = s.start < 0 ? s.lines : [...s.lines.slice(0, s.start), ...s.lines.slice(s.end)];
  return lines.map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

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
    // A flag right after a flag means the first one had no value (PowerShell 5.1 drops an empty "" argument).
    else if (a.startsWith('--')) o[a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[i + 1]?.startsWith('--') ? undefined : argv[++i];
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
    case 'import': return importNote(root, { file: o.file, title: o.title ?? null, date: o.date ?? null, topic: o.topic ?? null, tags: o.tags ? o.tags.split(',').map(s => s.trim()).filter(Boolean) : null });
    case 'citing': return { note: o.note, citedBy: citing(root, o.note) };
    case 'move': return move(root, o.from, o.to, { projectDir: path.resolve(o.dir) });
    case 'section-get': return sectionGet(at(o.file), o.heading);
    case 'section-set': return sectionSet(at(o.file), o.heading, o.textFile ? fs.readFileSync(o.textFile, 'utf8') : o.text ?? '', o.expect);
    // A --part-of given with no value is an error, never a quiet top-level PRD.
    case 'new-prd': return newPrd(root, { title: o.title, slug: o.slug ?? null, partOf: 'partOf' in o ? (o.partOf ?? '') : null, sources: o.sources ? o.sources.split(',').map(s => s.trim()).filter(Boolean) : [] });
    case 'set-field': return setField(root, o.file, o.key, o.value);
    case 'prd-check': {
      const files = o.file ? [at(o.file)] : walk(path.join(root, 'prds'));
      const results = files.map(f => readPrd(root, f));
      return { valid: results.every(r => r.valid), results, warnings: results.flatMap(r => r.warnings ?? []) };
    }
    default: throw new Error(`unknown command "${o.cmd ?? ''}" (list, new-note, import, citing, move, new-prd, set-field, section-get, section-set, prd-check)`);
  }
}

function format(cmd, r) {
  if (cmd === 'list') {
    const lines = [`Knowledge: ${r.root}${r.exists ? '' : ' (missing)'}`, `Notes (${r.notes.length}):`];
    for (const n of r.notes) lines.push(`  ${n.path}  - ${n.title}${n.tags.length ? `  [${n.tags.join(', ')}]` : ''}`);
    lines.push(`PRDs (${r.prds.length}):`);
    // Parts sit right after their parent in the list (orderPrds); indent them under it.
    const grouped = new Set(r.prds.filter(p => p.parts?.length).flatMap(p => p.parts));
    for (const p of r.prds) lines.push(`${grouped.has(p.name) ? '    ' : '  '}${p.path}  ${p.status ?? '?'}  - ${p.title ?? p.slug}${p.change ? `  (change: ${p.change})` : ''}  (updated ${String(p.updated).slice(0, 16).replace('T', ' ')})`);
    if (r.unimported.length) { lines.push(`Not imported yet (${r.unimported.length}):`); for (const u of r.unimported) lines.push(`  ${u}`); }
    for (const x of r.invalid) lines.push(`INVALID ${x.path}: ${x.errors.join('; ')}`);
    for (const w of r.warnings ?? []) lines.push(`WARNING ${w}`);
    return lines.join('\n');
  }
  if (cmd === 'section-set') return r.conflict
    ? `CONFLICT: "${r.heading}" changed since it was read (expected ${r.expected}, now ${r.actual}). Nothing written.`
    : `wrote "${r.heading}" (hash ${r.hash})`;
  if (cmd === 'prd-check') return [...r.results.map(x => `${x.valid ? 'ok     ' : 'INVALID'} ${x.path}${x.errors.length ? `: ${x.errors.join('; ')}` : ''}`), ...r.warnings.map(w => `WARNING ${w}`)].join('\n') || 'No PRDs.';
  if (cmd === 'move' && !r.moved) return [
    ...(r.unfinished.length ? [`WARNING: ${r.from} has unfinished parts; nothing moved. Decide each one first:`,
      ...r.unfinished.map(p => `  ${p.name}  ${p.status ?? '?'}  - ${p.title}`),
      'For each: drop it (set-field --key status --value Dropped), put it under another parent (set-field --key part-of --value <parent>, then move --to prds/<parent>),',
      'or make it a PRD of its own (set-field --key part-of --value "", then move --to prds).'] : []),
    ...(r.others.length ? [`WARNING: ${r.from}'s folder also holds files that aren't its parts; nothing moved. Move them out first (or fix a part's frontmatter):`,
      ...r.others.map(p => `  ${p}`)] : []),
    'Then move the parent again.'].join('\n');
  if (cmd === 'move') return `moved ${r.from} -> ${r.to}${r.parts?.length ? `\nmoved its parts: ${r.parts.join(', ')}` : ''}${r.updated.length ? `\nupdated sources in: ${r.updated.join(', ')}` : ''}${r.proposals?.length ? `\nthese proposals cite the old path: ${r.proposals.join(', ')}` : ''}`;
  if (cmd === 'citing') return r.citedBy.length ? `${r.note} is cited by: ${r.citedBy.join(', ')}` : `${r.note} is not cited by any PRD`;
  if (cmd === 'new-prd') return `created ${r.path} (status Draft)${r.parent ? `\nadded a row to the Parts section of ${r.parent}` : ''}`;
  if (cmd === 'set-field') return [`${r.path}: ${r.key} ${r.from ?? '(none)'} -> ${r.to ?? '(removed)'}`, ...r.warnings.map(w => `WARNING ${w}`)].join('\n');
  if (cmd === 'import') return `created ${r.path}${r.removed ? `
replaced ${r.removed}` : ''}${r.kept ? `
original kept at ${r.kept}` : ''}`;
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
    if (r?.conflict || (o.cmd === 'move' && !r.moved)) process.exitCode = 3;
    else if (o.cmd === 'prd-check' && !r.valid) process.exitCode = 1;
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}
