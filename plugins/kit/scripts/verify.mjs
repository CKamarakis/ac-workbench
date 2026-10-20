// /kit:verify: checks one OpenSpec change before archive (quality-gates design D1, D2; spec: quality-gates).
// HARD items block (failing required test, missing required test where the policy says so, high security
// finding); everything else is ADVISORY. The report is <change>/verify.md: readable Markdown plus a data
// comment the archive gate and /kit:next read. Zero dependencies.
// Usage: node verify.mjs <command> --dir <project> --change <name> [--json]
//   run                                      run the policy's tests + changed-files check, write the report
//   finding --source security|code|spec|probe|ui [--severity high|medium|low] --text "..."   (severity required for security|code)
//   reviewed --source security|code|spec|ui --how ran|substitute|skipped [--note "why"]
//   scenarios                                read-only: the change's scenarios and which have a test
//   scenario --name "<capability>: <scenario>" (--test <path> | --by-hand --note "...")   record how a scenario is checked
//   ok [--note "..."]                        record the user's OK before merge (high-risk changes)
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
import { parseSafeguards, chose } from './safeguards-data.mjs';
import { webUi } from './project.mjs';

// Review sources (each has a row in the report) and finding sources a user can resolve; one list each.
const REVIEW_SOURCES = ['security', 'code', 'spec', 'ui'];
const RESOLVABLE = ['security', 'code', 'browser', 'spec', 'probe', 'ui'];

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

// ---------- browser-check hint (browser-check-hint D1-D3; spec: quality-gates "On-demand browser check") ----------

// A new page or route: Next.js app/**/page.* and pages/** (not _app, _document, api/), SvelteKit +page.svelte, src/routes/**.
// Not API routes, +server/+layout files, or files and folders starting with _ (helpers, _app, _document).
const PAGE = new RegExp([
  /(^|\/)app\/(.+\/)?page\.(tsx|jsx|ts|js)$/.source, // Next.js app router
  /^(src\/)?pages\/(?!api\/)(?:(?!_)[^/]+\/)*(?!_)[^/]+\.(tsx|jsx|js)$/.source, // Next.js pages router
  /(^|\/)\+page\.svelte$/.source, // SvelteKit
  /^(app|src)\/routes\/(?!api\/)(?:[^/]+\/)*[^/+_][^/]*\.(tsx|jsx|vue)$/.source, // Remix, TanStack and similar
].join('|'));
const UI_EXT = ['ts', 'tsx', 'js', 'jsx', 'vue', 'svelte'];
const UI_CODE = new RegExp(`\\.(${UI_EXT.join('|')})$`);
// Click and change handlers are left out on purpose: nearly every UI change has them (design D3).
const INPUT_FAMILY = 'Pointer|Touch|Key|Wheel|Gesture|Paste|Mouse|Drag|Drop';
// A handler named on<Family>... followed by = : or ( ; or addEventListener("<family>...").
const INPUT = new RegExp(`\\bon(?:${INPUT_FAMILY})[A-Za-z]*(?=\\s*[=:(])|addEventListener\\(\\s*["'\`]((?:${INPUT_FAMILY.toLowerCase()})[a-z]*)`);
const label = m => (m[1] ? `addEventListener("${m[1]}")` : m[0]);
// Paths as written (no octal quoting of non-ASCII names), so they can be read back.
const gitq = (dir, args) => git(dir, ['-c', 'core.quotePath=false', ...args]);
const lines_ = s => (s ?? '').split('\n').map(x => x.replace(/\t$/, '').trim()).filter(Boolean);

/** Signals that a browser check is worth it: pages added and input handling added since the change's base. */
export function browserSignals(dir, change) {
  const base = baseCommit(dir, change) ?? 'HEAD';
  const untracked = lines_(gitq(dir, ['ls-files', '--others', '--exclude-standard']));
  const added = [...lines_(gitq(dir, ['diff', '--name-only', '--diff-filter=A', base])), ...untracked];
  const pages = [...new Set(added.filter(f => PAGE.test(f) && !isTest(f)))].sort();
  const found = new Map();
  const note = (file, text) => { const m = INPUT.exec(text); if (m && !found.has(file)) found.set(file, label(m)); };
  // Only UI source files (a pathspec keeps big lockfiles and assets out of the buffer); headers only before the first @@.
  let file = null, header = false;
  for (const l of (gitq(dir, ['diff', '-U0', base, '--', ...UI_EXT.map(e => `*.${e}`)]) ?? '').split('\n')) {
    if (l.startsWith('diff --git ')) { header = true; file = null; continue; }
    if (header && l.startsWith('+++ ')) { file = l.slice(4).replace(/\t$/, '').replace(/^b\//, ''); continue; }
    if (l.startsWith('@@')) { header = false; continue; }
    if (!header && file && l.startsWith('+') && UI_CODE.test(file) && !isTest(file)) note(file, l.slice(1));
  }
  for (const f of untracked.filter(f => UI_CODE.test(f) && !isTest(f))) {
    let text = '';
    try { text = fs.readFileSync(path.join(dir, f), 'utf8'); } catch { continue; } // a dangling link or unreadable file: skip it
    for (const l of text.split('\n')) note(f, l);
  }
  return { pages, input: [...found].map(([f, what]) => ({ file: f, what })).sort((a, b) => a.file.localeCompare(b.file)) };
}

function browserHint(sig) {
  if (!sig.pages.length && !sig.input.length) return null;
  const parts = [...sig.pages.slice(0, 3).map(p => `new page: ${p}`), ...sig.input.slice(0, 3).map(x => `input handling: ${x.file} (${x.what})`)];
  const more = sig.pages.length + sig.input.length - parts.length;
  return { id: 'H:browser', level: 'ADVISORY', what: 'a browser check is worth it (new screen or input handling); it runs only if you ask', detail: parts.join('; ') + (more > 0 ? `; +${more} more` : ''), source: 'browser-hint' };
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

/** A package name as a whole word in lowercased text: "ms" isn't named by "items", nor "react" by "reaction". */
export function namedIn(text, name) {
  const n = name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![a-z0-9@/._-])${n}(?![a-z0-9/_-])`).test(text);
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

  // Working on main makes the merge-base HEAD itself; then compare with the commit that first added the change.
  let base = baseCommit(dir, change);
  if (base && base === git(dir, ['rev-parse', 'HEAD'])) base = (git(dir, ['log', '--reverse', '--format=%H', '--', `openspec/changes/${change}`]) ?? '').split('\n')[0] || null;
  const before = base ? (depsAt(git(dir, ['show', `${base}:package.json`]) ?? '') ?? {}) : null;
  let now = null;
  try { now = depsAt(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); } catch { /* no package.json */ }
  let deps = null;
  if (now && before) {
    const plan = PLANNING.flatMap(p => {
      const f = path.join(cdir, p);
      try { return fs.statSync(f).isDirectory() ? fs.readdirSync(f, { recursive: true }).filter(x => String(x).endsWith('.md')).map(x => fs.readFileSync(path.join(f, String(x)), 'utf8')) : [fs.readFileSync(f, 'utf8')]; } catch { return []; }
    }).join('\n').toLowerCase();
    const added = Object.keys(now).filter(k => !(k in before)).sort();
    deps = {
      added: added.map(name => ({ name, planned: namedIn(plan, name) })),
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

// ---------- safeguards and scenarios (build-safeguards design D6, D7) ----------


/** The change's Safeguards (design.md), or null when there is no section. */
export function safeguardsOf(dir, change) {
  try {
    return parseSafeguards(fs.readFileSync(path.join(changeDir(dir, change), 'design.md'), 'utf8'));
  } catch { return null; }
}
// Verify follows the user's choice in design.md, not the ratings (decided at verify, 2026-10-18).
const weighted = sg => chose(sg, 'security-weighted');
const wantsOk = sg => chose(sg, 'user-ok');

function specFilesUnder(root, rel = '') {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e => {
    const r = rel ? `${rel}/${e.name}` : e.name;
    return e.isDirectory() ? specFilesUnder(root, r) : e.name === 'spec.md' ? [r] : [];
  });
}

/** Scenarios of the change's delta specs (ADDED and MODIFIED), as "<capability>: <scenario>". */
export function deltaScenarios(dir, change) {
  const root = path.join(changeDir(dir, change), 'specs');
  const out = [];
  for (const rel of specFilesUnder(root)) {
    const cap = path.posix.dirname(rel);
    let removed = false;
    for (const line of fs.readFileSync(path.join(root, rel), 'utf8').split(/\r?\n/)) {
      const h = /^## (ADDED|MODIFIED|REMOVED|RENAMED) Requirements/.exec(line);
      if (h) { removed = h[1] === 'REMOVED' || h[1] === 'RENAMED'; continue; }
      const m = /^#### Scenario:\s*(.+?)\s*$/.exec(line);
      if (m && !removed) out.push({ capability: cap, scenario: m[1], name: `${cap}: ${m[1]}` });
    }
  }
  return out;
}

/** Each scenario with how it's checked: a test that names it, a recorded test or hand check, or missing. */
export function scenarioCheck(dir, change, recorded = {}) {
  const tracked = [...(git(dir, ['ls-files']) ?? '').split('\n'), ...(git(dir, ['ls-files', '--others', '--exclude-standard']) ?? '').split('\n')].filter(Boolean);
  // Only real test files count (*.test.*, *.spec.*), not fixtures or data under tests/.
  const tests = [...new Set(tracked)].filter(f => /\.(test|spec)\.[cm]?[jt]sx?$/.test(f)).filter(f => !f.startsWith('openspec/'))
    .map(f => { try { return [f, fs.readFileSync(path.join(dir, f), 'utf8').toLowerCase()]; } catch { return [f, '']; } });
  return deltaScenarios(dir, change).map(sc => {
    const rec = recorded[sc.name];
    if (rec) return { ...sc, status: rec.byHand ? 'by-hand' : 'recorded', test: rec.test ?? null, note: rec.note ?? '' };
    const hit = tests.find(([, text]) => text.includes(sc.scenario.toLowerCase()));
    return { ...sc, status: hit ? 'named' : 'missing', test: hit ? hit[0] : null };
  });
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
  for (const src of ['security', 'code', ...(chose(state.safeguards, 'spec-review') ? ['spec'] : []), ...(chose(state.safeguards, 'ui-review') ? ['ui'] : [])]) {
    const r = state.reviews?.[src];
    if (!r) out.push({ id: `R:${src}`, level: 'ADVISORY', what: `${src} review not recorded (did it run?)`, source: 'review' });
    else if (r.how === 'skipped') out.push({ id: `R:${src}`, level: 'ADVISORY', what: `${src} review skipped`, detail: r.note, source: 'review' });
  }
  return out;
}

function safeguardsSection(state) {
  const sg = state.safeguards;
  // "ui review: not chosen" only where a UI review could apply (a web-ui project).
  if (!sg) return ['## Safeguards', '', 'None chosen (no Safeguards section in design.md): verify as usual.', '', 'review against the spec: not chosen', '', ...(state.webUi ? ['ui review: not chosen', ''] : [])];
  const r = sg.ratings ?? {};
  return ['## Safeguards', '',
    `reach ${r.reach?.level ?? '?'}, undo ${r.undo?.level ?? '?'}, safety ${r.safety?.level ?? '?'}; chosen: ${(sg.chosen ?? []).join(', ') || 'none'}`,
    ...(chose(sg, 'spec-review') ? [] : ['', 'review against the spec: not chosen']),
    ...(chose(sg, 'ui-review') || !state.webUi ? [] : ['', 'ui review: not chosen']),
    ...(wantsOk(sg) ? ['', `your OK before merge: ${state.ok ? `given ${state.ok.date}${state.ok.note ? ` (${esc(state.ok.note)})` : ''}` : 'not yet'}`] : []), ''];
}

function scenariosSection(list) {
  if (!list) return [];
  const n = k => list.filter(x => x.status === k).length;
  return ['## Scenarios', '', `${list.length} scenario(s): ${n('named') + n('recorded')} with a test, ${n('by-hand')} checked by hand, ${n('missing')} without a test`, '',
    ...(list.length ? ['| Scenario | Checked by |', '|---|---|', ...list.map(x => `| ${esc(x.name)} | ${x.status === 'missing' ? 'no test' : x.status === 'by-hand' ? `by hand: ${esc(x.note)}` : x.test} |`), ''] : [])];
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
    '## Reviews', '', '| Review | How | Note |', '|---|---|---|', rv('security'), rv('code'), ...(chose(state.safeguards, 'spec-review') ? [rv('spec')] : []), ...(chose(state.safeguards, 'ui-review') ? [rv('ui')] : []), '',
    ...safeguardsSection(state),
    ...scenariosSection(state.scenarioCheck),
    ...(state.browser ? ['## Browser check (on request)', '', `result: ${state.browser.result}  (date: ${state.browser.date})`, '', ...(state.browser.shots.length ? ['Screenshots:', ...state.browser.shots.map(s => `- ${s}`), ''] : [])] : []),
    ...docsSection(state.docsSync),
    '## HARD (blocks archive)', '', ...(hard.length ? ['| Id | Item | Detail |', '|---|---|---|', ...hard.map(row)] : ['None.']), '',
    '## ADVISORY (your call)', '', ...(adv.length ? ['| Id | Item | Detail |', '|---|---|---|', ...adv.map(row)] : ['None.']), '',
    '## Overrides', '', ...(state.overrides.length ? ['| Item | Reason | Date |', '|---|---|---|', ...state.overrides.map(o => `| ${o.item} | ${esc(o.reason)} | ${o.date} |`)] : ['None.']), '',
    ...(state.resolved?.length ? ['## Resolved', '', '| Id | Item | Note | Date |', '|---|---|---|---|', ...state.resolved.map(r => `| ${r.item} | ${esc(r.what)}${r.detail ? ` - ${esc(r.detail)}` : ''} | ${esc(r.note)} | ${r.date} |`), ''] : []),
    `<!-- kit-verify-data ${JSON.stringify(state).replace(/-->/g, '--\\u003e')} -->`, '',
  ];
  return L.join('\n');
}

const reportPath = (dir, change) => path.join(changeDir(dir, change), 'verify.md');
const save = (file, state) => { fs.writeFileSync(file, render(state)); return state; };

// ---------- commands ----------

/** A verify.md the kit didn't write (e.g. another tool's) is renamed, never overwritten. Returns its new path or null. */
function keepForeignReport(file) {
  if (!fs.existsSync(file) || readState(file)) return null;
  // The kit's own report with broken data (merge conflict, hand edit) isn't foreign: stop rather than drop its overrides.
  if (fs.readFileSync(file, 'utf8').includes('<!-- kit-verify-data')) throw new Error(`${posix(file)} is a kit report but its data can't be read (merge conflict or hand edit?): fix it from git, then re-run`);
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
  const safeguards = safeguardsOf(dir, change);
  const scenarios = prev?.scenarios ?? {};
  const check = scenarioCheck(dir, change, scenarios);
  for (const x of check.filter(c => c.status === 'missing')) items.push({ id: `N:${x.name}`, level: 'ADVISORY', what: 'scenario without a test', detail: x.name, source: 'scenarios' });
  // The UI review judges against the project's design context: name what's missing and the command that writes it.
  if (chose(safeguards, 'ui-review')) {
    for (const [file, cmd] of [['PRODUCT.md', '/impeccable init'], ['DESIGN.md', '/impeccable document']]) {
      if (!fs.existsSync(path.join(dir, file))) items.push({ id: `M:${file}`, level: 'ADVISORY', what: `${file} is missing for the UI review: offer ${cmd} first`, source: 'ui-context' });
    }
  }
  // Recommend, never run (browser-check-hint D4): web-ui only, and not once a browser check is recorded.
  // A check counts for the commit it was recorded at (older reports have none: they still count).
  const checked = prev?.browser && (!prev.browser.commit || prev.browser.commit === git(dir, ['rev-parse', '--short', 'HEAD']));
  if (webUi(dir).webUi && !checked) { const h = browserHint(browserSignals(dir, change)); if (h) items.push(h); }
  const ok = prev?.ok;
  if (wantsOk(safeguards) && !ok) items.push({ id: 'K:ok', level: 'ADVISORY', what: 'your OK before merge (high-risk change): not given yet', source: 'ok' });
  // Findings stay; a medium security finding is HARD when the change is high-risk (it may have become high since).
  const findings = (prev?.items ?? []).filter(i => RESOLVABLE.includes(i.source))
    .map(i => (i.source === 'security' && i.severity === 'medium' ? { ...i, level: weighted(safeguards) ? 'HARD' : 'ADVISORY' } : i));
  const all = [...items, ...findings];
  const overrides = (prev?.overrides ?? []).filter(o => all.some(i => i.id === o.item));
  return save(file, { change, date: today(), commit: git(dir, ['rev-parse', '--short', 'HEAD']) ?? 'none', type, tests, items: all, overrides, reviews: prev?.reviews ?? {}, scenarioCheck: check, webUi: webUi(dir).webUi, ...(Object.keys(scenarios).length ? { scenarios } : {}), ...(safeguards ? { safeguards } : {}), ...(ok ? { ok } : {}), ...(earlier ? { earlier } : {}), ...(prev?.browser ? { browser: prev.browser } : {}), ...(prev?.docsSync ? { docsSync: prev.docsSync } : {}), ...(prev?.resolved?.length ? { resolved: prev.resolved } : {}) });
}

export function setReview({ dir, change, source, how, note }) {
  if (!REVIEW_SOURCES.includes(source)) throw new Error(`--source must be one of ${REVIEW_SOURCES.join(', ')}`);
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
  state.items = state.items.filter(i => i.source !== 'browser' && i.source !== 'browser-hint');
  list.forEach((text, n) => state.items.push({ id: `B${n + 1}`, level: 'ADVISORY', what: 'browser check', detail: text, source: 'browser' }));
  state.browser = { result: res, date: today(), commit: git(dir, ['rev-parse', '--short', 'HEAD']) ?? null, shots: (Array.isArray(shots) ? shots : String(shots ?? '').split(',')).map(s => String(s).trim()).filter(Boolean) };
  return save(file, state);
}

export const FINDING_SOURCES = { security: 'S', code: 'C', spec: 'V', probe: 'X', ui: 'I' };

export function addFinding({ dir, change, source, severity, text }) {
  if (!FINDING_SOURCES[source]) throw new Error(`--source must be one of ${Object.keys(FINDING_SOURCES).join(', ')}`);
  if ((source === 'security' || source === 'code' || severity != null) && !SEVERITIES.includes(severity)) throw new Error('--severity must be high, medium or low');
  if (!text || !String(text).trim()) throw new Error('--text is required');
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  // Ids are never reused, even after a resolve (code review C1): next number after the highest ever used.
  const prefix = FINDING_SOURCES[source];
  const used = [...state.items.map(i => i.id), ...(state.resolved ?? []).map(r => r.item)]
    .filter(x => x.length > 1 && x[0] === prefix && /^\d+$/.test(x.slice(1))).map(x => Number(x.slice(1)));
  const id = `${prefix}${Math.max(0, ...used) + 1}`;
  // High security findings block; medium ones too on a high-risk change (quality-gates "Hard failures and overrides").
  const hard = source === 'security' && (severity === 'high' || (severity === 'medium' && weighted(safeguardsOf(dir, change))));
  const what = source === 'spec' ? 'review against the spec' : source === 'probe' ? 'edge-case probe' : source === 'ui' ? 'UI review (Impeccable)' : `${source} review (${severity})`;
  state.items.push({ id, level: hard ? 'HARD' : 'ADVISORY', what: severity && (source === 'spec' || source === 'probe' || source === 'ui') ? `${what} (${severity})` : what, detail: String(text).trim(), source, ...(severity ? { severity } : {}) });
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

/** A fixed advisory finding leaves the open list for "Resolved", with a note (kit-followups D2; spec: quality-gates). */
export function resolveFinding({ dir, change, item, note }) {
  if (!note || !String(note).trim()) throw new Error('--note is required: say how it was fixed (e.g. the commit)');
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  const it = state.items.find(i => i.id === item);
  if (!it) throw new Error(`no item "${item}" in the report`);
  // Generated items come back on every run; only review findings can be resolved (code review C2). A fixed HARD
  // review finding is resolved the same way, then the re-run passes (quality-gates "Hard failures"; L19).
  if (!RESOLVABLE.includes(it.source)) throw new Error(`"${item}" is generated by every run; only review findings can be resolved`);
  state.items = state.items.filter(i => i.id !== item);
  state.resolved = [...(state.resolved ?? []).filter(r => r.item !== item), { item, what: it.what, detail: it.detail ?? '', note: String(note).trim(), date: today() }];
  return save(file, state);
}

/** Records how one scenario is checked: a test file, or by hand with a note (quality-gates "Scenario-to-test check"). */
export function setScenario({ dir, change, name, test: testFile, byHand = false, note }) {
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  const known = deltaScenarios(dir, change).map(x => x.name);
  if (!known.includes(name)) throw new Error(`no scenario "${name}" in the change's specs (use "<capability>: <scenario>")`);
  if (byHand ? !String(note ?? '').trim() : !testFile) throw new Error(byHand ? '--note is required with --by-hand: say how it was checked' : 'pass --test <path> or --by-hand --note "..."');
  if (!byHand && !fs.existsSync(path.join(dir, testFile))) throw new Error(`test file not found: ${testFile}`);
  state.scenarios = { ...(state.scenarios ?? {}), [name]: byHand ? { byHand: true, note: String(note).trim(), date: today() } : { test: posix(testFile), date: today() } };
  state.scenarioCheck = scenarioCheck(dir, change, state.scenarios);
  state.items = state.items.filter(i => i.id !== `N:${name}`);
  return save(file, state);
}

/** Records the user's OK before merge on a high-risk change. Never a gate (quality-gates "User's OK before merge"). */
export function setOk({ dir, change, note }) {
  const file = reportPath(dir, change);
  const state = readState(file);
  if (!state) throw new Error('no report yet: run "verify.mjs run" first');
  state.ok = { date: today(), ...(note ? { note: String(note).trim() } : {}) };
  state.items = state.items.filter(i => i.id !== 'K:ok');
  return save(file, state);
}

export function verifyStatus({ dir, change }) {
  const file = path.join(dir, 'openspec', 'changes', change, 'verify.md');
  const state = readState(file);
  if (!state) return { change, status: 'missing' };
  return { change, status: result(state), reviews: state.reviews ?? {}, hard: state.items.filter(i => i.level === 'HARD' && !state.overrides.some(o => o.item === i.id)).map(i => i.what), okPending: state.items.some(i => i.id === 'K:ok') };
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
    else if (a === '--by-hand') o.byHand = true;
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
    `  dependencies:      ${s.deps ? `added ${s.deps.added.map(d => `${d.name}${d.planned ? '' : ' (unplanned)'}`).join(', ') || 'none'}; removed ${s.deps.removed.join(', ') || 'none'}` : 'not checked (no package.json, or no base commit to compare with)'}`];
  return L.join('\n');
}

function summary(s) {
  const r = result(s);
  const hard = s.items.filter(i => i.level === 'HARD');
  const L = [`verify ${s.change}: ${r.toUpperCase()}  (report: openspec/changes/${s.change}/verify.md)`];
  for (const t of s.tests) L.push(`  test     ${t.script.padEnd(18)} ${t.result}`);
  for (const i of hard) L.push(`  HARD     ${i.id}: ${i.what}${s.overrides.some(o => o.item === i.id) ? ' (overridden)' : ''}`);
  for (const i of [...reviewItems(s), ...s.items.filter(x => x.level === 'ADVISORY')]) L.push(`  advisory ${i.id}: ${i.what}${i.detail && i.source !== 'tests' ? ` - ${i.detail}` : ''}`);
  for (const r of s.resolved ?? []) L.push(`  resolved ${r.item}: ${r.note}`);
  if (s.scenarioCheck) L.push(`  scenarios ${s.scenarioCheck.length}: ${s.scenarioCheck.filter(x => x.status === 'missing').length} without a test`);
  for (const src of REVIEW_SOURCES) if (s.reviews?.[src]) L.push(`  review   ${src}: ${s.reviews[src].how}${s.reviews[src].note ? ` (${s.reviews[src].note})` : ''}`);
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
    else if (o.cmd === 'resolve') { const s = resolveFinding(o); out = o.json ? s : summary(s); }
    else if (o.cmd === 'docs-scan') { const s = docsScan(o); out = o.json ? s : docsScanText(s); }
    else if (o.cmd === 'docs-sync') { const s = setDocsSync({ ...o, leftOut: o['left-out'] }); out = o.json ? s : summary(s); }
    else if (o.cmd === 'scenarios') { const list = scenarioCheck(o.dir, o.change, readState(reportPath(o.dir, o.change))?.scenarios ?? {}); out = o.json ? list : list.length ? list.map(x => `  ${x.status.padEnd(8)} ${x.name}${x.test ? `  (${x.test})` : ''}`).join('\n') : "no scenarios in the change's specs"; }
    else if (o.cmd === 'scenario') { const s = setScenario(o); out = o.json ? s : summary(s); }
    else if (o.cmd === 'ok') { const s = setOk(o); out = o.json ? s : summary(s); }
    else if (o.cmd === 'status') { const s = verifyStatus(o); out = o.json ? s : `${s.change}: ${s.status}${s.hard?.length ? `\n  ${s.hard.join('\n  ')}` : ''}`; }
    else if (o.cmd === 'prepush' && o.install) { const r = installPrepush(o); out = o.json ? r : r.installed ? `installed ${r.path} (runs npm run ${r.script})` : `not installed: ${r.reason} (${r.path})`; }
    else throw new Error('commands: run, finding, reviewed, scenarios, scenario, ok, browser, override, resolve, docs-scan, docs-sync, status, prepush --install');
    console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 2));
    process.exitCode = code;
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
  }
}
