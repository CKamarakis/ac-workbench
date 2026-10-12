// /kit:ready scan: the mechanical input for the readiness check (build-readiness design D1, D4; spec: build-readiness).
// Read-only. The skill does the judgment (gaps, differences, points to confirm, new tools); this script finds the
// files, the linked PRD, vague wording, scenario counts and the project's dependencies. Zero dependencies.
// Usage: node ready.mjs scan --dir <project> --change <name> [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prdLink, openspecJson, specFiles, planningFromFiles, planningState } from './next.mjs';

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
    if (/^### Requirement:/.test(raw)) { inReq = true; return; }
    if (/^#/.test(raw)) { inReq = false; return; }
    const line = raw.replace(/`[^`]*`/g, '').replace(/"[^"]*"|“[^”]*”/g, ''); // mentions, not wording
    const words = VAGUE.filter(([, re]) => re.test(line)).map(([w]) => w);
    if (spec && inReq && !/^\s*- \*\*/.test(raw) && line.includes('?')) words.push('?');
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
    if (o.cmd !== 'scan') throw new Error('commands: scan');
    const s = scan({ ...o, statusOf: name => openspecJson(`status --change "${name}" --json`, o.dir) });
    console.log(o.json ? JSON.stringify(s, null, 2) : summary(s));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
  }
}
