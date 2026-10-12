// /kit:verify: checks one OpenSpec change before archive (quality-gates design D1, D2; spec: quality-gates).
// HARD items block (failing required test, missing required test where the policy says so, high security
// finding); everything else is ADVISORY. The report is <change>/verify.md: readable Markdown plus a data
// comment the archive gate and /kit:next read. Zero dependencies.
// Usage: node verify.mjs <command> --dir <project> --change <name> [--json]
//   run                                      run the policy's tests + changed-files check, write the report
//   finding --source security|code --severity high|medium|low --text "..."
//   reviewed --source security|code --how ran|substitute|skipped [--note "why"]
//   browser --result pass|issues [--issue "..."]... [--shots a.png,b.png]   only when the user asks
//   override --item <id> --reason "..."      only when the user asks
//   docs-scan                                read-only: docs last updated, code commits since, receipt, deps
//   docs-sync --proposed N --written N --declined N --left-out N [--unplanned a,b]   record the docs-sync summary
//   status                                   missing | pass | fail | overridden
//   prepush --install                        opt-in git pre-push hook (never overwrites)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadRegistry } from './setup.mjs';
import { locate } from './locate.mjs';
import { decisionStatus, openLine } from './decisions.mjs';

const DATA = /<!-- kit-verify-data (\{[\s\S]*?\}) -->/;
const SEVERITIES = ['high', 'medium', 'low'];
const today = () => new Date().toISOString().slice(0, 10);
const posix = p => p.split(path.sep).join('/');

// ---------- inputs ----------

export function changeDir(dir, change) {
  if (!change || !/^[a-z0-9][a-z0-9-]*$/.test(change)) throw new Error('--change <name> is required (kebab-case)');
  const d = path.join(dir, 'openspec', 'changes', change);
  if (!fs.existsSync(d)) throw new Error(`change not found: openspec/changes/${change}`);
  return d;
}

export function projectType(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'kit.json'), 'utf8')).project_type || 'none'; } catch { return 'none'; }
}

export function policyFor(registry, type) {
  const all = registry.project_types ?? {};
  return all[type] ?? all.none ?? { tests: [{ script: 'test', required: false }], missing_required: 'advisory', advisory: [] };
}

const scriptsOf = dir => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).scripts ?? {}; } catch { return {}; } };

export const defaultRun = (cmd, cwd) => {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};

function git(dir, args) {
  const g = locate('git')?.path ?? 'git';
  const r = spawnSync(g, args, { cwd: dir, encoding: 'utf8', timeout: 30000 });
  return r.status === 0 ? r.stdout.trim() : null;
}

// ---------- changed files without tests (advisory, design D2) ----------

const SRC = /^(src|app)\/.*\.(ts|tsx|js|jsx)$/;
const isTest = f => /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f) || /(^|\/)(__tests__|tests?)\//.test(f);
const isSource = f => SRC.test(f) && !isTest(f) && !/\.d\.ts$/.test(f) && !/(^|\/)[^/]*\.config\.[^/]+$/.test(f);

/** The commit the change started from: merge-base with main/master, else the change folder's first commit. */
export function baseCommit(dir, change) {
  return git(dir, ['merge-base', 'HEAD', 'main']) ?? git(dir, ['merge-base', 'HEAD', 'master'])
    ?? ((git(dir, ['log', '--reverse', '--format=%H', '--', `openspec/changes/${change}`]) ?? '').split('\n')[0] || null);
}

export function changedFiles(dir, change) {
  const base = baseCommit(dir, change);
  const diff = base ? git(dir, ['diff', '--name-only', base]) : git(dir, ['diff', '--name-only', 'HEAD']);
  const untracked = git(dir, ['ls-files', '--others', '--exclude-standard']);
  return [...new Set([...(diff ?? '').split('\n'), ...(untracked ?? '').split('\n')].map(s => s.trim()).filter(Boolean))].sort();
}

export function untestedFiles(dir, changed) {
  if (changed.some(isTest)) return [];
  const all = new Set([...(git(dir, ['ls-files']) ?? '').split('\n'), ...(git(dir, ['ls-files', '--others', '--exclude-standard']) ?? '').split('\n')].filter(Boolean));
  const testNames = new Set([...all].filter(isTest).map(f => path.posix.basename(f).replace(/\.(test|spec)\.[^.]+$/, '')));
  return changed.filter(isSource).filter(f => !testNames.has(path.posix.basename(f).replace(/\.[^.]+$/, '')));
}

// Keep only readable error lines from a failing command: no ANSI codes, box drawing or code excerpts.
export function failureDetail(out) {
  const lines = String(out ?? '').replace(/\x1b\[[0-9;]*m/g, '').split(/\r?\n/).map(l => l.trim())
    .filter(l => l && !/^[\u2500-\u257f\u23af|^~\s]+$/.test(l) && !/^\d+\|/.test(l) && !/^\|/.test(l) && !/^>/.test(l));
  const pick = lines.filter(l => /(error|fail|throw|expected|cannot|not )/i.test(l));
  const text = (pick.length ? pick : lines).slice(-3).join(' / ');
  return text.length > 200 ? text.slice(0, 197) + '...' : text;
}

// ---------- docs sync (build-readiness design D5; spec: docs-sync) ----------

const PLANNING = ['proposal.md', 'design.md', 'tasks.md', 'specs'];
// The docs themselves: ticking boxes in tasks.md is progress, not a docs update.
const DOCS = ['proposal.md', 'design.md', 'specs'];

/** List items under apply-receipt headings about rulings, visible changes or decisions. */
export function receiptItems(text) {
  const items = [];
  let on = false;
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const h = /^#{1,4}\s+(.+)$/.exec(raw);
    if (h) { on = /ruling|visible change|decision/i.test(h[1]); continue; }
    const m = on && /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(raw);
    if (m && !/^\s{2,}/.test(raw)) items.push(m[1].replace(/\*\*/g, '').trim());
  }
  return items;
}

function depsAt(text) {
  try { const p = JSON.parse(text); return { ...(p.dependencies ?? {}), ...(p.devDependencies ?? {}) }; } catch { return null; }
}

/** Read-only signals for the docs sync: when the docs stopped, what the build recorded, dependency changes. */
export function docsScan({ dir, change }) {
  const cdir = changeDir(dir, change);
  const rel = `openspec/changes/${change}`;
  const last = git(dir, ['log', '-1', '--format=%h %cs', '--', ...DOCS.map(p => `${rel}/${p}`)]);
  const [hash, date] = last ? last.split(' ') : [null, null];
  const since = hash ? git(dir, ['log', '--format=%h', `${hash}..HEAD`, '--', '.', ':(exclude)openspec', ':(exclude,glob)**/*.md']) : null;
  let receipt = null;
  try { receipt = receiptItems(fs.readFileSync(path.join(cdir, 'apply.md'), 'utf8')); } catch { /* no receipt */ }

  const base = baseCommit(dir, change);
  const before = (base && depsAt(git(dir, ['show', `${base}:package.json`]) ?? '')) ?? {};
  let now = null;
  try { now = depsAt(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); } catch { /* no package.json */ }
  let deps = null;
  if (now) {
    const plan = PLANNING.flatMap(p => {
      const f = path.join(cdir, p);
      try { return fs.statSync(f).isDirectory() ? fs.readdirSync(f, { recursive: true }).filter(x => String(x).endsWith('.md')).map(x => fs.readFileSync(path.join(f, String(x)), 'utf8')) : [fs.readFileSync(f, 'utf8')]; } catch { return []; }
    }).join('\n').toLowerCase();
    const added = Object.keys(now).filter(k => !(k in before)).sort();
    deps = {
      added: added.map(name => ({ name, planned: plan.includes(name.toLowerCase()) })),
      removed: Object.keys(before).filter(k => !(k in now)).sort(),
    };
  }
  return {
    change,
    docsUpdated: hash ? { commit: hash, date } : null,
    codeCommitsSince: since == null ? null : since.split('\n').filter(Boolean).length,
    receipt,
    deps,
  };
}

export function setDocsSync({ dir, change, proposed = 0, written = 0, declined = 0, leftOut = 0, unplanned = [] }) {
  const n = v => { const x = Number(v ?? 0); if (!Number.isInteger(x) || x < 0) throw new Error('counts must be whole numbers ≥ 0'); return x; };
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  const s = docsScan({ dir, change });
  const sorted = n(proposed) + n(leftOut);
  if (s.receipt && sorted < s.receipt.length) {
    throw new Error(`the apply receipt has ${s.receipt.length} items but proposed + left out = ${sorted}: sort every item (a visible change is a behavior, never left out), then re-run`);
  }
  state.docsSync = {
    date: today(), docsUpdated: s.docsUpdated, codeCommitsSince: s.codeCommitsSince, receipt: s.receipt != null,
    proposed: n(proposed), written: n(written), declined: n(declined), leftOut: n(leftOut),
    unplanned: (Array.isArray(unplanned) ? unplanned : String(unplanned ?? '').split(',')).map(x => String(x).trim()).filter(Boolean),
  };
  return save(file, state);
}

// ---------- report state ----------

export function readState(file) {
  try { const m = DATA.exec(fs.readFileSync(file, 'utf8')); return m ? JSON.parse(m[1]) : null; } catch { return null; }
}

export function result(state) {
  const hard = state.items.filter(i => i.level === 'HARD');
  if (!hard.length) return 'pass';
  return hard.every(i => state.overrides.some(o => o.item === i.id)) ? 'overridden' : 'fail';
}

const esc = s => String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

export const REVIEW_HOW = ['ran', 'substitute', 'skipped'];

/** Review rows for the report, plus advisory items when a review is missing or skipped (never HARD). */
export function reviewItems(state) {
  const out = [];
  for (const src of ['security', 'code']) {
    const r = state.reviews?.[src];
    if (!r) out.push({ id: `R:${src}`, level: 'ADVISORY', what: `${src} review not recorded (did it run?)`, source: 'review' });
    else if (r.how === 'skipped') out.push({ id: `R:${src}`, level: 'ADVISORY', what: `${src} review skipped`, detail: r.note, source: 'review' });
  }
  return out;
}

function docsSection(d) {
  if (!d) return ['## Docs sync', '', 'Not run yet.', ''];
  return [
    '## Docs sync', '',
    `docs last updated: ${d.docsUpdated ? `${d.docsUpdated.date} (${d.docsUpdated.commit})` : 'never committed'}; code commits since: ${d.codeCommitsSince ?? 'unknown'}${d.receipt ? '' : '; no apply receipt'}  (date: ${d.date})`, '',
    '| Proposed | Written | Declined | Left out |', '|---|---|---|---|', `| ${d.proposed} | ${d.written} | ${d.declined} | ${d.leftOut} |`, '',
    `unplanned dependencies: ${d.unplanned.length ? d.unplanned.join(', ') : 'none'}`, '',
  ];
}

export function render(state) {
  state.result = result(state);
  const hard = state.items.filter(i => i.level === 'HARD');
  const adv = [...reviewItems(state), ...state.items.filter(i => i.level === 'ADVISORY')];
  const rv = src => { const r = state.reviews?.[src]; return `| ${src} | ${r ? r.how : 'not recorded'} | ${esc(r?.note ?? '')} |`; };
  const row = i => `| ${i.id} | ${esc(i.what)} | ${esc(i.detail ?? '')} |`;
  const L = [
    `# Verify: ${state.change}`, '',
    `result: ${state.result}`, `date: ${state.date}`, `commit: ${state.commit}`, `type: ${state.type}`, '',
    '## Tests', '', '| Script | Required | Result |', '|---|---|---|',
    ...(state.tests.length ? state.tests.map(t => `| ${t.script} | ${t.required ? 'yes' : 'no'} | ${t.result} |`) : ['| - | - | no test commands in the policy |']), '',
    '## Reviews', '', '| Review | How | Note |', '|---|---|---|', rv('security'), rv('code'), '',
    ...(state.browser ? ['## Browser check (on request)', '', `result: ${state.browser.result}  (date: ${state.browser.date})`, '', ...(state.browser.shots.length ? ['Screenshots:', ...state.browser.shots.map(s => `- ${s}`), ''] : [])] : []),
    ...docsSection(state.docsSync),
    '## HARD (blocks archive)', '', ...(hard.length ? ['| Id | Item | Detail |', '|---|---|---|', ...hard.map(row)] : ['None.']), '',
    '## ADVISORY (your call)', '', ...(adv.length ? ['| Id | Item | Detail |', '|---|---|---|', ...adv.map(row)] : ['None.']), '',
    '## Overrides', '', ...(state.overrides.length ? ['| Item | Reason | Date |', '|---|---|---|', ...state.overrides.map(o => `| ${o.item} | ${esc(o.reason)} | ${o.date} |`)] : ['None.']), '',
    `<!-- kit-verify-data ${JSON.stringify(state)} -->`, '',
  ];
  return L.join('\n');
}

const reportPath = (dir, change) => path.join(changeDir(dir, change), 'verify.md');
const save = (file, state) => { fs.writeFileSync(file, render(state)); return state; };

// ---------- commands ----------

/** A verify.md the kit didn't write (e.g. SuperSpec's) is renamed, never overwritten. Returns its new path or null. */
function keepForeignReport(file) {
  if (!fs.existsSync(file) || readState(file)) return null;
  let n = 1, to;
  do to = file.replace(/verify\.md$/, n === 1 ? 'verify-earlier.md' : `verify-earlier-${n}.md`), n++;
  while (fs.existsSync(to));
  fs.renameSync(file, to);
  return to;
}

export function runVerify({ dir, change, registry = loadRegistry(), run = defaultRun }) {
  const file = reportPath(dir, change);
  const kept = keepForeignReport(file);
  const prev = readState(file);
  const type = projectType(dir);
  const policy = policyFor(registry, type);
  const scripts = scriptsOf(dir);
  const items = [], tests = [];
  for (const t of policy.tests ?? []) {
    const id = `T:${t.script}`;
    if (!(t.script in scripts)) {
      tests.push({ script: t.script, required: !!t.required, result: 'missing' });
      if (t.required) items.push({ id, level: policy.missing_required === 'hard' ? 'HARD' : 'ADVISORY', what: `required test script "${t.script}" is missing from package.json`, source: 'tests' });
      continue;
    }
    const r = run(`npm run ${t.script}`, dir);
    const ok = r.status === 0;
    tests.push({ script: t.script, required: !!t.required, result: ok ? 'pass' : `fail (exit ${r.status})` });
    if (!ok) items.push({ id, level: t.required ? 'HARD' : 'ADVISORY', what: `npm run ${t.script} failed (exit ${r.status})`, detail: failureDetail(r.out), source: 'tests' });
  }
  for (const f of untestedFiles(dir, changedFiles(dir, change))) items.push({ id: `U:${f}`, level: 'ADVISORY', what: 'changed source file without a matching test', detail: f, source: 'untested' });
  (policy.advisory ?? []).forEach((a, n) => items.push({ id: `P${n + 1}`, level: 'ADVISORY', what: `policy check: ${a}`, source: 'policy' }));
  const open = openLine(decisionStatus({ dir, change }));
  if (open) items.push({ id: 'O:decisions', level: 'ADVISORY', what: open, detail: `openspec/changes/${change}/decisions.md`, source: 'decisions' });
  const earlier = kept ? posix(path.relative(dir, kept)) : prev?.earlier;
  if (earlier) items.push({ id: 'E:report', level: 'ADVISORY', what: 'an earlier verify report (not the kit\'s) was kept; read it for open items', detail: earlier, source: 'earlier' });
  const findings = (prev?.items ?? []).filter(i => i.source === 'security' || i.source === 'code' || i.source === 'browser');
  const all = [...items, ...findings];
  const overrides = (prev?.overrides ?? []).filter(o => all.some(i => i.id === o.item));
  return save(file, { change, date: today(), commit: git(dir, ['rev-parse', '--short', 'HEAD']) ?? 'none', type, tests, items: all, overrides, reviews: prev?.reviews ?? {}, ...(earlier ? { earlier } : {}), ...(prev?.browser ? { browser: prev.browser } : {}), ...(prev?.docsSync ? { docsSync: prev.docsSync } : {}) });
}

export function setReview({ dir, change, source, how, note }) {
  if (!['security', 'code'].includes(source)) throw new Error('--source must be security or code');
  if (!REVIEW_HOW.includes(how)) throw new Error('--how must be ran, substitute or skipped');
  if (how !== 'ran' && (!note || !String(note).trim())) throw new Error('--note is required for substitute or skipped: say why');
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  state.reviews = { ...(state.reviews ?? {}), [source]: { how, note: note ? String(note).trim() : '', date: today() } };
  return save(file, state);
}

/** Records an on-request browser check (design-trial D5). Issues are ADVISORY (B1…); a re-run replaces the last one. */
export function setBrowser({ dir, change, result: res, issues = [], shots = [] }) {
  if (!['pass', 'issues'].includes(res)) throw new Error('--result must be pass or issues');
  const list = (Array.isArray(issues) ? issues : [issues]).map(s => String(s).trim()).filter(Boolean);
  if (res === 'issues' && !list.length) throw new Error('--result issues needs at least one --issue "..."');
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  state.items = state.items.filter(i => i.source !== 'browser');
  list.forEach((text, n) => state.items.push({ id: `B${n + 1}`, level: 'ADVISORY', what: 'browser check', detail: text, source: 'browser' }));
  state.browser = { result: res, date: today(), shots: (Array.isArray(shots) ? shots : String(shots ?? '').split(',')).map(s => String(s).trim()).filter(Boolean) };
  return save(file, state);
}

export function addFinding({ dir, change, source, severity, text }) {
  if (!['security', 'code'].includes(source)) throw new Error('--source must be security or code');
  if (!SEVERITIES.includes(severity)) throw new Error('--severity must be high, medium or low');
  if (!text || !String(text).trim()) throw new Error('--text is required');
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  const n = state.items.filter(i => i.source === source).length + 1;
  const id = `${source === 'security' ? 'S' : 'C'}${n}`;
  state.items.push({ id, level: source === 'security' && severity === 'high' ? 'HARD' : 'ADVISORY', what: `${source} review (${severity})`, detail: String(text).trim(), source, severity });
  return save(file, state);
}

export function addOverride({ dir, change, item, reason }) {
  if (!reason || !String(reason).trim()) throw new Error('--reason is required: an override records why');
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  const it = state.items.find(i => i.id === item);
  if (!it) throw new Error(`no item "${item}" in the report`);
  if (it.level !== 'HARD') throw new Error(`"${item}" is advisory; only HARD items need an override`);
  state.overrides = state.overrides.filter(o => o.item !== item);
  state.overrides.push({ item, reason: String(reason).trim(), date: today() });
  return save(file, state);
}

export function verifyStatus({ dir, change }) {
  const file = path.join(dir, 'openspec', 'changes', change, 'verify.md');
  const state = readState(file);
  if (!state) return { change, status: 'missing' };
  return { change, status: result(state), reviews: state.reviews ?? {}, hard: state.items.filter(i => i.level === 'HARD' && !state.overrides.some(o => o.item === i.id)).map(i => i.what) };
}

export function installPrepush({ dir, registry = loadRegistry() }) {
  const hooksDir = git(dir, ['rev-parse', '--git-path', 'hooks']);
  if (!hooksDir) throw new Error('not a git repository');
  const file = path.resolve(dir, hooksDir, 'pre-push');
  if (fs.existsSync(file)) return { installed: false, path: posix(file), reason: 'a pre-push hook already exists; left untouched' };
  const policy = policyFor(registry, projectType(dir));
  const scripts = scriptsOf(dir);
  const t = (policy.tests ?? []).find(x => x.required && x.script in scripts) ?? (policy.tests ?? []).find(x => x.script in scripts);
  if (!t) throw new Error('no test script from the policy exists in package.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `#!/bin/sh\n# Installed by /kit:verify (opt-in): run the tests before every push.\nnpm run ${t.script} || { echo "pre-push: npm run ${t.script} failed; push stopped" >&2; exit 1; }\n`, { mode: 0o755 });
  return { installed: true, path: posix(file), script: t.script };
}

// ---------- CLI ----------

function parseArgs(argv) {
  const o = { cmd: argv[0], dir: process.cwd(), json: false };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json' || a === '--install') o[a.slice(2)] = true;
    else if (a === '--issue') (o.issues ??= []).push(argv[++i]);
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else throw new Error(`unexpected argument ${a}`);
  }
  o.dir = path.resolve(o.dir);
  return o;
}

function docsScanText(s) {
  const L = [`docs-scan ${s.change}`,
    `  docs last updated: ${s.docsUpdated ? `${s.docsUpdated.date} (${s.docsUpdated.commit})` : 'never committed'}; code commits since: ${s.codeCommitsSince ?? 'unknown'}`,
    `  apply receipt:     ${s.receipt ? `${s.receipt.length} items` : 'none'}`,
    ...(s.receipt ?? []).map((x, i) => `    ${i + 1}. ${x}`),
    `  dependencies:      ${s.deps ? `added ${s.deps.added.map(d => `${d.name}${d.planned ? '' : ' (unplanned)'}`).join(', ') || 'none'}; removed ${s.deps.removed.join(', ') || 'none'}` : 'no package.json'}`];
  return L.join('\n');
}

function summary(s) {
  const r = result(s);
  const hard = s.items.filter(i => i.level === 'HARD');
  const L = [`verify ${s.change}: ${r.toUpperCase()}  (report: openspec/changes/${s.change}/verify.md)`];
  for (const t of s.tests) L.push(`  test     ${t.script.padEnd(18)} ${t.result}`);
  for (const i of hard) L.push(`  HARD     ${i.id}: ${i.what}${s.overrides.some(o => o.item === i.id) ? ' (overridden)' : ''}`);
  for (const i of [...reviewItems(s), ...s.items.filter(x => x.level === 'ADVISORY')]) L.push(`  advisory ${i.id}: ${i.what}${i.detail && i.source !== 'tests' ? ` - ${i.detail}` : ''}`);
  for (const src of ['security', 'code']) if (s.reviews?.[src]) L.push(`  review   ${src}: ${s.reviews[src].how}${s.reviews[src].note ? ` (${s.reviews[src].note})` : ''}`);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2));
    let out, code = 0;
    if (o.cmd === 'run') { const s = runVerify(o); out = o.json ? s : summary(s); code = result(s) === 'fail' ? 1 : 0; }
    else if (o.cmd === 'finding') { const s = addFinding(o); out = o.json ? s : summary(s); }
    else if (o.cmd === 'browser') { const s = setBrowser({ ...o, result: o.result, shots: o.shots ?? [] }); out = o.json ? s : summary(s); }
    else if (o.cmd === 'reviewed') { const s = setReview(o); out = o.json ? s : summary(s); }
    else if (o.cmd === 'override') { const s = addOverride(o); out = o.json ? s : summary(s); }
    else if (o.cmd === 'docs-scan') { const s = docsScan(o); out = o.json ? s : docsScanText(s); }
    else if (o.cmd === 'docs-sync') { const s = setDocsSync({ ...o, leftOut: o['left-out'] }); out = o.json ? s : summary(s); }
    else if (o.cmd === 'status') { const s = verifyStatus(o); out = o.json ? s : `${s.change}: ${s.status}${s.hard?.length ? `\n  ${s.hard.join('\n  ')}` : ''}`; }
    else if (o.cmd === 'prepush' && o.install) { const r = installPrepush(o); out = o.json ? r : r.installed ? `installed ${r.path} (runs npm run ${r.script})` : `not installed: ${r.reason} (${r.path})`; }
    else throw new Error('commands: run, finding, reviewed, browser, override, docs-scan, docs-sync, status, prepush --install');
    console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    process.exitCode = code;
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
  }
}
