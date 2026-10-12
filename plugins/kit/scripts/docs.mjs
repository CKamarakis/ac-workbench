// /kit:docs: scan the project's living-docs sources and build the docs page (kit-docs design D1-D4, D9;
// spec: living-docs). Mechanical only; the skill drafts the curated notes. Zero dependencies.
// Usage: node docs.mjs <scan|build> --dir <project> [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readDecisions } from './decisions.mjs';
import { prdLink } from './knowledge.mjs';
import { renderPage } from './docs-page.mjs';

const posix = p => p.split(path.sep).join('/');
const lines = text => String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
const KW = /^\s*-\s+\*\*(GIVEN|WHEN|THEN|AND)\*\*\s*(.*)$/;

/** One spec.md: purpose, requirements (names kept; `openspec show --json` drops them) and scenario rows. */
export function parseSpec(text) {
  const out = { purpose: '', requirements: [], warnings: [] };
  let section = null, req = null, sc = null;
  const body = [];
  // Text before the first scenario; a later flush (no body collected) must not overwrite it.
  const flushReq = () => { const t = body.splice(0).join('\n').trim(); if (req && t) req.text = t; };
  for (const line of lines(text)) {
    let m;
    if ((m = /^##\s+(.*)$/.exec(line)) && !line.startsWith('###')) {
      flushReq(); req = null; sc = null; section = m[1].trim(); continue;
    }
    if ((m = /^###\s+Requirement:\s*(.*)$/.exec(line))) {
      flushReq(); sc = null;
      const name = m[1].trim();
      if (!name) { out.warnings.push('a requirement heading has no name'); req = null; continue; }
      req = { name, text: '', scenarios: [] };
      out.requirements.push(req);
      continue;
    }
    if ((m = /^####\s+Scenario:\s*(.*)$/.exec(line))) {
      if (!req) { out.warnings.push(`scenario "${m[1].trim()}" is outside a requirement`); sc = null; continue; }
      if (!sc) flushReq();
      sc = { name: m[1].trim(), rows: [] };
      req.scenarios.push(sc);
      continue;
    }
    if (sc) {
      if ((m = KW.exec(line))) sc.rows.push({ kw: m[1], text: m[2].trim() });
      else if (line.trim() && sc.rows.length) sc.rows[sc.rows.length - 1].text += ` ${line.trim()}`;
      continue;
    }
    if (req) body.push(line);
    else if (section === 'Purpose' && line.trim()) out.purpose += (out.purpose ? '\n' : '') + line.trim();
  }
  flushReq();
  for (const r of out.requirements) for (const s of r.scenarios) {
    if (!s.rows.length) out.warnings.push(`scenario "${s.name}" in "${r.name}" has no GIVEN/WHEN/THEN lines`);
  }
  return out;
}

/** Every openspec/specs/<path>/spec.md, sorted by path (POSIX). */
export function findSpecs(dir, root = path.join(dir, 'openspec', 'specs')) {
  const found = [];
  const walk = d => {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'spec.md' && d !== root) found.push({ path: posix(path.relative(root, d)), file: p });
    }
  };
  walk(root);
  return found.sort((a, b) => a.path.localeCompare(b.path));
}

/** `moving-around` -> `Moving around`. */
export const segmentName = seg => { const s = seg.replace(/[-_]+/g, ' ').trim(); return s.charAt(0).toUpperCase() + s.slice(1); };

/** Tree of products and sub-features from the spec folder paths. */
export function specTree(specs) {
  const roots = [];
  const nodes = new Map();
  const nodeFor = p => {
    if (nodes.has(p)) return nodes.get(p);
    const segs = p.split('/');
    const node = { name: segmentName(segs.at(-1)), path: p, hasSpec: false, children: [] };
    nodes.set(p, node);
    (segs.length > 1 ? nodeFor(segs.slice(0, -1).join('/')).children : roots).push(node);
    return node;
  };
  for (const s of specs) nodeFor(s.path).hasSpec = true;
  const sort = list => { list.sort((a, b) => a.path.localeCompare(b.path)); list.forEach(n => sort(n.children)); return list; };
  return sort(roots);
}

const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const list = d => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } };

/** Section bodies of a Markdown file by `## ` heading. */
function sections(text) {
  const out = {};
  let cur = null;
  for (const line of lines(text)) {
    const m = /^##\s+(.*)$/.exec(line);
    if (m && !line.startsWith('###')) { cur = m[1].trim(); out[cur] = []; continue; }
    if (cur) out[cur].push(line);
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n').trim()]));
}

/** Archived changes, newest first (dated folders by date, then undated by name). History is read, never stored (D9).
 *  `requirements` maps each touched spec path to the requirement names its delta names. */
export function archivedChanges(dir) {
  const root = path.join(dir, 'openspec', 'changes', 'archive');
  return list(root).filter(e => e.isDirectory()).map(e => {
    const m = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(e.name);
    const why = (sections(read(path.join(root, e.name, 'proposal.md')) ?? '').Why ?? '').split('\n').find(l => l.trim()) ?? '';
    const specs = findSpecs(dir, path.join(root, e.name, 'specs'));
    const requirements = Object.fromEntries(specs.map(sp => [sp.path, parseSpec(read(sp.file)).requirements.map(r => r.name)]));
    return { folder: e.name, date: m ? m[1] : null, change: m ? m[2] : e.name, why: why.trim(), specPaths: specs.map(sp => sp.path), requirements };
  }).sort((a, b) => (a.date && b.date ? b.folder.localeCompare(a.folder) : a.date ? -1 : b.date ? 1 : a.folder.localeCompare(b.folder)));
}

/** The newest archived change whose delta for `specPath` names the requirement, or null. */
export function lastChangedBy(archives, specPath, reqName) {
  return archives.find(a => (a.requirements?.[specPath] ?? []).includes(reqName)) ?? null;
}

/** Capability note: optional "How it works, roughly" and "Why" entries (`- **<requirement>**: text`, `[[card]]` links). */
export function parseNote(text) {
  const s = sections(text);
  const why = [];
  for (const line of lines(s.Why ?? '')) {
    const m = /^\s*-\s+\*\*(.+?)\*\*:?\s*(.*)$/.exec(line);
    if (m) why.push({ requirement: m[1].trim(), text: m[2].trim(), cards: [] });
    else if (line.trim() && why.length) why.at(-1).text += ` ${line.trim()}`;
  }
  for (const e of why) e.cards = [...e.text.matchAll(/\[\[([^\]]+)\]\]/g)].map(m => m[1].trim());
  return { how: s['How it works, roughly'] || null, why };
}

/** Tools inventory: `## group`, `### tool`, bullets packages / for / used by / added by / dev. */
export function parseTools(text) {
  const groups = [];
  let tool = null;
  for (const line of lines(text)) {
    let m;
    if ((m = /^##\s+(.*)$/.exec(line)) && !line.startsWith('###')) { groups.push({ group: m[1].trim(), tools: [] }); tool = null; continue; }
    if ((m = /^###\s+(.*)$/.exec(line))) {
      if (!groups.length) groups.push({ group: 'Other', tools: [] });
      tool = { name: m[1].trim(), packages: [], purpose: '', usedBy: '', addedBy: '', dev: false };
      groups.at(-1).tools.push(tool);
      continue;
    }
    if (tool && (m = /^\s*-\s+(packages|for|used by|added by|dev):\s*(.*)$/i.exec(line))) {
      const [k, v] = [m[1].toLowerCase(), m[2].trim()];
      if (k === 'packages') tool.packages = v.split(',').map(x => x.trim()).filter(Boolean);
      else if (k === 'for') tool.purpose = v;
      else if (k === 'used by') tool.usedBy = v;
      else if (k === 'added by') tool.addedBy = v;
      else tool.dev = /^(yes|true)$/i.test(v);
    }
  }
  for (const g of groups) for (const t of g.tools) if (!t.packages.length) t.packages = [t.name];
  return groups;
}

/** Foundation card: frontmatter (title, status, replaced_by) and `## ` sections. `rel` is relative to knowledge/foundations. */
export function parseCard(text, rel) {
  const { fm, body } = frontmatter(text);
  const segs = posix(rel).replace(/\.md$/, '').split('/');
  const slug = segs.at(-1);
  return {
    slug, product: segs.length > 1 ? segs[0] : null, title: fm.title || slug,
    status: fm.status === 'replaced' ? 'replaced' : 'current', replacedBy: fm.replaced_by || null,
    sections: sections(body),
  };
}

/** Simple `key: value` frontmatter (cards, PRDs) and the body after it. */
function frontmatter(text) {
  const t = lines(text).join('\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(t);
  const fm = {};
  if (m) for (const l of m[1].split('\n')) { const kv = /^([\w-]+):\s*(.*)$/.exec(l); if (kv) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, ''); }
  return { fm, body: m ? t.slice(m[0].length) : t };
}

export const PAGE_MARK = 'kit-docs-archive';
export const PAGE = ['knowledge', 'docs', 'index.html'];
const today = () => new Date().toISOString().slice(0, 10);

/** Last commit date of a file (git), else its modified date; null when missing. */
function fileDate(dir, file) {
  if (!fs.existsSync(file)) return null;
  const r = spawnSync('git', ['log', '-1', '--format=%cs', '--', file], { cwd: dir, encoding: 'utf8' });
  const d = r.status === 0 ? r.stdout.trim() : '';
  return d || fs.statSync(file).mtime.toISOString().slice(0, 10);
}

/** Every foundation card path (relative to knowledge/foundations, POSIX), sorted. */
export function findCards(dir) {
  const root = path.join(dir, 'knowledge', 'foundations');
  const out = [];
  const walk = d => { for (const e of list(d)) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md')) out.push(posix(path.relative(root, p))); } };
  walk(root);
  return out.sort();
}

export function readPackages(dir) {
  const t = read(path.join(dir, 'package.json'));
  if (t == null) return null;
  try { const j = JSON.parse(t); return { runtime: Object.keys(j.dependencies ?? {}), dev: Object.keys(j.devDependencies ?? {}) }; } catch { return null; }
}

/** What's missing or stale for the living docs (spec: living-docs "Docs scan"). Missing sources are reported, never errors. */
export function scan({ dir }) {
  const specs = findSpecs(dir);
  const archives = archivedChanges(dir);
  const notes = { missing: [], stale: [] };
  for (const s of specs) {
    const file = path.join(dir, 'knowledge', 'docs', ...s.path.split('/')) + '.md';
    const date = fileDate(dir, file);
    if (!date) { notes.missing.push(s.path); continue; }
    const newer = archives.find(a => a.date && a.specPaths.includes(s.path));
    if (newer && newer.date > date) notes.stale.push({ path: s.path, since: newer.folder });
  }
  const pkgs = readPackages(dir);
  let tools = null;
  if (pkgs) {
    const inv = parseTools(read(path.join(dir, 'knowledge', 'docs', 'tools.md')) ?? '').flatMap(g => g.tools);
    const all = [...pkgs.runtime, ...pkgs.dev];
    const listed = new Set(inv.flatMap(t => t.packages));
    tools = { unlisted: all.filter(p => !listed.has(p)).sort(), gone: inv.filter(t => !t.packages.some(p => all.includes(p))).map(t => t.name) };
  }
  const html = read(path.join(dir, ...PAGE));
  const builtFrom = html ? (new RegExp(`<meta name="${PAGE_MARK}" content="([^"]*)"`).exec(html)?.[1] || null) : null;
  const newest = archives[0]?.folder ?? null;
  return {
    specs: specs.map(s => ({ path: s.path, requirements: parseSpec(read(s.file)).requirements.length })),
    notes, tools, cards: findCards(dir).map(c => c.replace(/\.md$/, '')),
    page: { exists: html != null, builtFrom, stale: html != null && newest != null && builtFrom !== newest },
  };
}


/** Open and later items of every active change's decision record, mapped to a spec path when `from` names one. */
export function undecided(dir, specPaths = findSpecs(dir).map(s => s.path), warnings = []) {
  const root = path.join(dir, 'openspec', 'changes');
  const out = [];
  for (const e of list(root).filter(e => e.isDirectory() && e.name !== 'archive').sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(root, e.name, 'decisions.md');
    if (!fs.existsSync(file)) continue;
    const state = readDecisions(file);
    if (!state) { warnings.push(`openspec/changes/${e.name}/decisions.md could not be read`); continue; }
    for (const i of state.items ?? []) {
      if (i.status !== 'open' && i.status !== 'later') continue;
      const from = posix(String(i.from ?? ''));
      const specPath = specPaths.filter(sp => from.includes(`specs/${sp}/`)).sort((a, b) => b.length - a.length)[0] ?? null;
      out.push({ change: e.name, id: i.id, text: i.text, date: i.dates?.later ?? i.dates?.opened ?? '', status: i.status, specPath });
    }
  }
  return out;
}

/** Title and status of the PRD the newest archived change touching `specPath` names, or null. */
function prdFor(dir, archives, specPath) {
  for (const a of archives) {
    if (!a.specPaths.includes(specPath)) continue;
    const link = prdLink(read(path.join(dir, 'openspec', 'changes', 'archive', a.folder, 'proposal.md')));
    if (!link) continue;
    const text = read(path.join(dir, ...link.path.split('/')));
    // A PRD file that's gone still links by its path; its status is unknown.
    const { fm } = frontmatter(text ?? '');
    return { title: fm.title || link.path, status: fm.status || 'unknown', path: link.path };
  }
  return null;
}

/** Everything the page shows (spec: living-docs "Docs page build", "Open decisions on the page", "Missing sources degrade"). */
export function buildModel({ dir }) {
  const warnings = [];
  const specs = findSpecs(dir);
  const archives = archivedChanges(dir);
  const und = undecided(dir, specs.map(s => s.path), warnings);
  const pages = {};
  for (const s of specs) {
    const spec = parseSpec(read(s.file));
    const note = parseNote(read(path.join(dir, 'knowledge', 'docs', ...s.path.split('/')) + '.md') ?? '');
    const names = new Set(spec.requirements.map(r => r.name));
    const touched = archives.filter(a => a.specPaths.includes(s.path));
    pages[s.path] = {
      title: segmentName(s.path.split('/').at(-1)), crumb: s.path.split('/').map(segmentName), purpose: spec.purpose,
      prd: prdFor(dir, archives, s.path), how: note.how,
      requirements: spec.requirements.map(r => {
        const a = lastChangedBy(archives, s.path, r.name);
        return { ...r, why: note.why.filter(w => w.requirement === r.name).map(({ text, cards }) => ({ text, cards })), change: a ? { folder: a.folder, date: a.date, change: a.change } : null };
      }),
      orphanWhy: note.why.filter(w => !names.has(w.requirement)).map(({ requirement, text }) => ({ requirement, text })),
      history: touched.map(({ folder, date, change, why }) => ({ folder, date, change, why })),
      undecided: und.filter(u => u.specPath === s.path).map(({ specPath, ...u }) => u),
      warnings: spec.warnings,
      created: touched.map(a => a.date).filter(Boolean).sort()[0] ?? null,
      updated: touched.map(a => a.date).filter(Boolean).sort().at(-1) ?? null,
    };
  }
  const dated = nodes => nodes.map(n => {
    const children = dated(n.children);
    const own = pages[n.path];
    const all = [own, ...children].filter(Boolean);
    const created = all.map(x => x.created).filter(Boolean).sort()[0] ?? null;
    const updated = all.map(x => x.updated).filter(Boolean).sort().at(-1) ?? null;
    const count = (own?.undecided.length ?? 0) + children.reduce((t, c) => t + c.undecided, 0);
    return { ...n, created, updated, undecided: count, children };
  });
  const tree = dated(specTree(specs));
  for (const pg of Object.values(pages)) { delete pg.created; delete pg.updated; }
  const pkgs = readPackages(dir);
  const pkgName = (() => { try { return JSON.parse(read(path.join(dir, 'package.json'))).name; } catch { return null; } })();
  const undecidedByChange = {};
  for (const u of und.filter(u => !u.specPath)) (undecidedByChange[u.change] ??= []).push((({ specPath, ...x }) => x)(u));
  return {
    title: pkgName || path.basename(path.resolve(dir)), builtFrom: archives[0]?.folder ?? null, empty: specs.length === 0, warnings,
    tree, pages,
    cards: findCards(dir).map(c => parseCard(read(path.join(dir, 'knowledge', 'foundations', ...c.split('/'))), c)),
    tools: pkgs ? parseTools(read(path.join(dir, 'knowledge', 'docs', 'tools.md')) ?? '') : null,
    toolsNote: pkgs ? null : 'No package.json in this project.',
    undecidedByChange,
  };
}

/** Writes knowledge/docs/index.html. Same sources -> same bytes. */
export function build({ dir }) {
  const m = buildModel({ dir });
  const file = path.join(dir, ...PAGE);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, renderPage(m));
  const pages = Object.values(m.pages);
  return {
    file,
    counts: { specs: pages.length, requirements: pages.reduce((t, p) => t + p.requirements.length, 0), cards: m.cards.length, tools: (m.tools ?? []).reduce((t, g) => t + g.tools.length, 0), undecided: pages.reduce((t, p) => t + p.undecided.length, 0) + Object.values(m.undecidedByChange).reduce((t, l) => t + l.length, 0) },
    warnings: [...m.warnings, ...Object.entries(m.pages).flatMap(([p, pg]) => pg.warnings.map(w => `${p}: ${w}`))],
  };
}

function scanSummary(s) {
  const L = [`specs: ${s.specs.length}`, `notes missing: ${s.notes.missing.length ? s.notes.missing.join(', ') : 'none'}`,
    `notes stale: ${s.notes.stale.length ? s.notes.stale.map(n => `${n.path} (since ${n.since})`).join(', ') : 'none'}`,
    s.tools ? `tools not in inventory: ${s.tools.unlisted.join(', ') || 'none'}; gone: ${s.tools.gone.join(', ') || 'none'}` : 'tools: no package.json',
    `cards: ${s.cards.length}`, `page: ${s.page.exists ? (s.page.stale ? `stale (built from ${s.page.builtFrom ?? 'unknown'})` : 'up to date') : 'not built'}`];
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const dir = path.resolve(opt('--dir') ?? '.');
  try {
    if (args[0] === 'build') { const r = build({ dir }); console.log(`wrote ${path.relative(dir, r.file)}: ${r.counts.specs} specs, ${r.counts.requirements} requirements, ${r.counts.cards} cards, ${r.counts.tools} tools, ${r.counts.undecided} undecided`); for (const w of r.warnings) console.log(`warning: ${w}`); }
    else if (args[0] === 'scan') { const s = scan({ dir }); console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : scanSummary(s)); }
    else throw new Error('usage: docs.mjs <scan|build> --dir <project> [--json]');
  } catch (e) { console.error(`error: ${e.message}`); process.exitCode = 1; }
}
