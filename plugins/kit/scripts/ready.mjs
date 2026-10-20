// /kit:ready: the mechanical input for the readiness check (build-readiness design D1, D4; spec: build-readiness).
// The skill does the judgment (gaps, differences, points to confirm, new tools, safeguard ratings); `scan` (read-only)
// finds the files, the linked PRD, vague wording, scenario counts and the project's dependencies; `safeguards` writes
// the Safeguards section of design.md; `importers` lists who imports a module. Zero dependencies.
// Usage: node ready.mjs scan --dir <project> --change <name> [--json]
//        node ready.mjs safeguards --dir <project> --change <name> --reach <l> --reach-why "..." --undo <l> --undo-why "..." --safety <l> --safety-why "..." [--choice a,b] [--subagents-why "..."] [--ui-why "<UI files>"]
//        node ready.mjs importers --dir <project> --file <path>
//        node ready.mjs web-ui --dir <project>        is this a web-ui project? (shape offer, ui-review, UI gaps)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prdLink, openspecJson, specFiles, planningFromFiles, planningState } from './next.mjs';
import { parseSafeguards, dataComment } from './safeguards-data.mjs';
import { webUi } from './project.mjs';

// Design "Open Questions": start list, tuned from the trials.
export const VAGUE = [
  ['TBD', /\bTBD\b/],
  ['TODO', /\bTODO\b/],
  ['etc.', /\betc\b\.?/i],
  ['fast', /\bfast\b/i],
  ['nice', /\bnice\b/i],
  ['simple', /\bsimple\b/i],
  ['should probably', /\bshould probably\b/i],
];
const posix = p => p.split(path.sep).join('/');
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };


/** Vague-word hits, skipping code fences and inline code. A "?" counts only on a requirement line of a spec. */
export function vagueHits(rel, text, { spec = false } = {}) {
  const hits = [];
  let fence = false, inReq = false;
  String(text ?? '').split(/\r?\n/).forEach((raw, n) => {
    if (/^\s*```/.test(raw)) { fence = !fence; return; }
    if (fence) return;
    const heading = /^#/.test(raw);
    if (heading) inReq = /^### Requirement:/.test(raw);
    const line = raw.replace(/`[^`]*`/g, '').replace(/"[^"]*"|“[^”]*”/g, ''); // mentions, not wording
    const words = VAGUE.filter(([, re]) => re.test(line)).map(([w]) => w);
    if (spec && inReq && !heading && !/^\s*- \*\*/.test(raw) && line.includes('?')) words.push('?');
    if (words.length) hits.push({ at: `${rel}:${n + 1}`, words, text: raw.trim().slice(0, 160) });
  });
  return hits;
}

/** Requirements and their scenario counts, from a (delta) spec. */
export function requirements(rel, text) {
  const reqs = [];
  let cur = null;
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const m = /^### Requirement:\s*(.+)$/.exec(raw);
    if (m) { cur = { spec: rel, name: m[1].trim(), scenarios: 0, given: 0 }; reqs.push(cur); continue; }
    if (/^#{1,3} /.test(raw)) { cur = null; continue; }
    if (cur && /^#### Scenario:/.test(raw)) cur.scenarios += 1;
    if (cur && /^\s*- \*\*GIVEN\*\*/.test(raw)) cur.given += 1;
  }
  return reqs;
}

export function dependencies(dir) {
  const t = read(path.join(dir, 'package.json'));
  if (t == null) return null;
  try {
    const p = JSON.parse(t);
    return { dependencies: p.dependencies ?? {}, devDependencies: p.devDependencies ?? {} };
  } catch { return null; }
}

export { planningFromFiles };

export function scan({ dir, change, statusOf = null }) {
  if (!change || !/^[a-z0-9][a-z0-9-]*$/.test(change)) throw new Error('--change <name> is required (kebab-case)');
  const cdir = path.join(dir, 'openspec', 'changes', change);
  if (!fs.existsSync(cdir)) throw new Error(`change not found: openspec/changes/${change}`);
  const rel = f => posix(path.relative(dir, f));

  const fromFiles = planningFromFiles(cdir);
  const st = statusOf?.(change);
  const planning = st?.artifacts ? planningState(st, fromFiles) : fromFiles;

  const files = ['proposal.md', 'design.md', 'tasks.md'].map(f => path.join(cdir, f)).filter(f => fs.existsSync(f));
  const specs = specFiles(path.join(cdir, 'specs'));
  const proposal = read(path.join(cdir, 'proposal.md'));
  const link = prdLink(proposal);
  const prdAbs = link ? path.join(dir, link.path) : null;
  const prd = link ? { path: link.path, commit: link.commit, exists: !!(prdAbs && fs.existsSync(prdAbs)) } : null;

  const vague = [];
  for (const f of files) vague.push(...vagueHits(rel(f), read(f)));
  for (const f of specs) vague.push(...vagueHits(rel(f), read(f), { spec: true }));
  if (prd?.exists) vague.push(...vagueHits(prd.path, read(prdAbs)));

  return {
    change,
    planningComplete: planning.complete,
    nextArtifact: planning.nextArtifact,
    artifacts: { files: files.map(rel), specs: specs.map(rel) },
    prd,
    vague,
    requirements: specs.flatMap(f => requirements(rel(f), read(f))),
    dependencies: dependencies(dir),
  };
}

// Safeguards (build-safeguards design D1, D2; spec: build-readiness "Safeguards picked per change"). The agent rates
// reach, undo and safety with a reason each; the script checks the values, computes the recommendation and writes
// the `## Safeguards` section of design.md, whose data comment verify.mjs and the routing rule read.
export const DIMENSIONS = ['reach', 'undo', 'safety'];
export const LEVELS = ['low', 'medium', 'high'];
export const SAFEGUARDS = {
  'scenario-check': 'scenario-to-test check',
  worktree: 'worktree for the build',
  'spec-review': 'review against the spec',
  probes: 'edge-case probes',
  'security-weighted': 'medium security findings block',
  'user-ok': 'your OK before merge',
  subagents: 'build with subagents',
  'ui-review': 'UI review (Impeccable critique + audit)',
};

/** The recommended safeguards for the ratings ({ reach: 'low', ... }). Subagents and the UI review only with a
 *  stated reason (the UI review: the UI files the plan names, in a web-ui project; ui-flow-with-impeccable D2). */
export function recommend(ratings, { subagentsWhy = '', uiWhy = '' } = {}) {
  const levels = DIMENSIONS.map(d => ratings[d]);
  const out = ['scenario-check'];
  if (levels.some(l => l === 'medium' || l === 'high')) out.push('worktree', 'spec-review');
  if (levels.includes('high')) out.push('probes', 'security-weighted', 'user-ok');
  if (String(subagentsWhy).trim()) out.push('subagents');
  if (String(uiWhy).trim()) out.push('ui-review');
  return out;
}

const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const names = ids => ids.map(id => SAFEGUARDS[id]).join(', ');

export function renderSafeguards(data) {
  return [
    '## Safeguards',
    '',
    `Written by \`/kit:ready\` (\`ready.mjs safeguards\`) on ${data.date}. Re-run the readiness check to change it.`,
    '',
    '| Dimension | Rating | Why |',
    '|---|---|---|',
    ...DIMENSIONS.map(d => `| ${d[0].toUpperCase()}${d.slice(1)} | ${data.ratings[d].level} | ${cell(data.ratings[d].why)} |`),
    '',
    `- **Recommended:** ${names(data.recommended)}`,
    `- **Chosen:** ${names(data.chosen)}`,
    ...(data.subagentsWhy ? [`- **Subagents because:** ${cell(data.subagentsWhy)}`] : []),
    ...(data.uiWhy ? [`- **UI review because:** ${cell(data.uiWhy)}`] : []),
    '',
    dataComment(data),
    '',
  ].join('\n');
}

/** The Safeguards data of a design.md, or null when it has none. */
export function readSafeguards(file) {
  return parseSafeguards(read(file));
}

/** Writes or replaces the `## Safeguards` section of the change's design.md, which must exist (no stub: OpenSpec would count it as done). */
export function writeSafeguards({ dir, change, ratings, chosen = null, subagentsWhy = '', uiWhy = '', date = new Date().toISOString().slice(0, 10) }) {
  if (!change || !/^[a-z0-9][a-z0-9-]*$/.test(change)) throw new Error('--change <name> is required (kebab-case)');
  const cdir = path.join(dir, 'openspec', 'changes', change);
  if (!fs.existsSync(cdir)) throw new Error(`change not found: openspec/changes/${change}`);
  for (const d of DIMENSIONS) {
    const r = ratings[d];
    if (!r || !LEVELS.includes(r.level)) throw new Error(`--${d} must be one of ${LEVELS.join(', ')}`);
    if (!String(r.why ?? '').trim()) throw new Error(`--${d}-why is required: every rating needs its reason`);
  }
  const recommended = recommend(Object.fromEntries(DIMENSIONS.map(d => [d, ratings[d].level])), { subagentsWhy, uiWhy });
  const picked = chosen ?? recommended;
  const unknown = picked.filter(id => !SAFEGUARDS[id]);
  if (unknown.length) throw new Error(`unknown safeguard: ${unknown.join(', ')} (one of ${Object.keys(SAFEGUARDS).join(', ')})`);
  if (picked.includes('subagents') && !String(subagentsWhy).trim()) throw new Error('--subagents-why is required to choose subagents');
  // The web-ui check and the reason only matter for a UI review that's actually chosen (code review at verify).
  const ui = picked.includes('ui-review');
  if (ui && !String(uiWhy).trim()) throw new Error('--ui-why is required to choose ui-review: name the UI files the plan touches');
  if (ui) { const w = webUi(dir); if (!w.webUi) throw new Error(`ui-review is for web-ui projects only (${w.why})`); }
  const data = { date, ratings, recommended, chosen: picked, ...(subagentsWhy ? { subagentsWhy } : {}), ...(ui ? { uiWhy } : {}) };
  const file = path.join(cdir, 'design.md');
  const text = read(file);
  if (text == null) throw new Error(`openspec/changes/${change}/design.md doesn't exist: write the design first (openspec instructions design --change ${change}), then record the safeguards`);
  const crlf = text.includes('\r\n');
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex(l => /^## Safeguards\s*$/.test(l));
  const section = renderSafeguards(data).replace(/\n*$/, '');
  // Only the section is rewritten; the rest of design.md keeps its bytes (blank lines included).
  let body;
  if (start < 0) body = `${lines.join('\n').replace(/\n*$/, '')}\n\n${section}\n`;
  else {
    let end = lines.findIndex((l, i) => i > start && /^## /.test(l));
    if (end < 0) end = lines.length;
    const before = lines.slice(0, start).join('\n'), after = lines.slice(end).join('\n');
    body = `${before}${before ? '\n' : ''}${section}\n${after ? `\n${after}` : ''}`;
  }
  fs.writeFileSync(file, crlf ? body.replace(/\n/g, '\r\n') : body);
  return { file: posix(path.relative(dir, file)), ...data };
}

const SOURCE = /\.(m?js|cjs|jsx?|tsx?)$/;
function sourceFiles(dir) {
  const out = [];
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(r);
      else if (SOURCE.test(e.name)) out.push(r);
    }
  };
  walk('');
  return out.sort();
}

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g;
const noExt = p => p.replace(SOURCE, '').replace(/\/index$/, '');

/** Files that import or require the given module: relative specifiers resolved against the importing file, so only
 *  that module counts (text search, no parser). Who depends on it, for rating reach. */
export function importers({ dir, file }) {
  if (!file) throw new Error('--file <path> is required');
  const target = noExt(posix(file).replace(/^\.\//, ''));
  return sourceFiles(dir).filter(f => {
    if (noExt(f) === target) return false;
    for (const m of (read(path.join(dir, f)) ?? '').matchAll(SPECIFIER)) {
      if (!m[1].startsWith('.')) continue;
      if (noExt(path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]))) === target) return true;
    }
    return false;
  });
}

function summary(s) {
  if (!s.planningComplete) return `ready ${s.change}: planning isn't complete; next artifact: ${s.nextArtifact}. Nothing checked.`;
  const deps = s.dependencies ? Object.keys(s.dependencies.dependencies).length + Object.keys(s.dependencies.devDependencies).length : null;
  const L = [
    `ready ${s.change}: scan`,
    `  files:        ${[...s.artifacts.files, ...s.artifacts.specs].join(', ')}`,
    `  prd:          ${s.prd ? `${s.prd.path} @ ${s.prd.commit}${s.prd.exists ? '' : ' (missing)'}` : 'none linked'}`,
    `  requirements: ${s.requirements.length} (${s.requirements.filter(r => r.scenarios === 0).length} without scenarios)`,
    `  dependencies: ${deps == null ? 'no package.json - tool check skipped' : deps}`,
    `  vague:        ${s.vague.length}`,
    ...s.vague.map(v => `    ${v.at}  [${v.words.join(', ')}]  ${v.text}`),
  ];
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const argv = process.argv.slice(2);
    const o = { cmd: argv[0], dir: process.cwd(), json: false };
    for (let i = 1; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--json') o.json = true;
      else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
      else throw new Error(`unexpected argument ${a}`);
    }
    o.dir = path.resolve(o.dir);
    if (o.cmd === 'scan') {
      const s = scan({ ...o, statusOf: name => openspecJson(`status --change "${name}" --json`, o.dir) });
      console.log(o.json ? JSON.stringify(s, null, 2) : summary(s));
    } else if (o.cmd === 'safeguards') {
      const ratings = Object.fromEntries(DIMENSIONS.map(d => [d, { level: o[d], why: o[`${d}-why`] }]));
      const chosen = o.choice ? o.choice.split(',').map(x => x.trim()).filter(Boolean) : null;
      const r = writeSafeguards({ dir: o.dir, change: o.change, ratings, chosen, subagentsWhy: o['subagents-why'] ?? '', uiWhy: o['ui-why'] ?? '' });
      console.log(o.json ? JSON.stringify(r, null, 2) : [
        `safeguards written to ${r.file}`,
        ...DIMENSIONS.map(d => `  ${d.padEnd(7)} ${r.ratings[d].level.padEnd(7)} ${r.ratings[d].why}`),
        `  recommended: ${names(r.recommended)}`,
        `  chosen:      ${names(r.chosen)}`,
      ].join('\n'));
    } else if (o.cmd === 'importers') {
      const list = importers({ dir: o.dir, file: o.file });
      console.log(o.json ? JSON.stringify(list) : list.length ? `${list.length} file(s) import ${o.file}:\n${list.map(f => `  ${f}`).join('\n')}` : `nothing imports ${o.file}`);
    } else if (o.cmd === 'web-ui') {
      const w = webUi(o.dir);
      console.log(o.json ? JSON.stringify(w) : `${w.webUi ? 'web-ui' : 'not web-ui'}: ${w.why}`);
    } else throw new Error('commands: scan, safeguards, importers, web-ui');
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
  }
}
