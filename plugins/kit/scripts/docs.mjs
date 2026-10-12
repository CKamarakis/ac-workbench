// /kit:docs: scan the project's living-docs sources and build the docs page (kit-docs design D1-D4, D9;
// spec: living-docs). Mechanical only; the skill drafts the curated notes. Zero dependencies.
// Usage: node docs.mjs <scan|build> --dir <project> [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
export function findSpecs(dir) {
  const root = path.join(dir, 'openspec', 'specs');
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
