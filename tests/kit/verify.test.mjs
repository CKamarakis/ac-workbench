import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runVerify, addFinding, addOverride, verifyStatus, installPrepush, untestedFiles, changedFiles, readState } from '../../plugins/kit/scripts/verify.mjs';

const registry = {
  project_types: {
    'web-ui': { tests: [{ script: 'test', required: true }, { script: 'test:integration', required: false }], missing_required: 'hard', advisory: ['browser check'] },
    none: { tests: [{ script: 'test', required: false }], missing_required: 'advisory', advisory: [] },
  },
};
const g = (d, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
function project({ type = 'web-ui', scripts = { test: 'x' } } = {}) {
  const d = tmpDir('kit-verify-');
  w(d, '.claude/kit.json', JSON.stringify({ project_type: type }));
  w(d, 'package.json', JSON.stringify({ scripts }));
  w(d, 'openspec/changes/add-x/proposal.md', '# P\n');
  g(d, 'init', '-q', '-b', 'main'); g(d, 'add', '.'); g(d, 'commit', '-qm', 'base');
  return d;
}
const runner = results => cmd => ({ status: results[cmd.replace('npm run ', '')] ?? 0, out: `ran ${cmd}\nlast line` });

// 2.1
test('all green -> pass; report has header, tests and the data comment', () => {
  const d = project({ scripts: { test: 'x', 'test:integration': 'y' } });
  const s = runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  const md = fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md, /^# Verify: add-x\n\nresult: pass\ndate: \d{4}-\d\d-\d\d\ncommit: \w+\ntype: web-ui/);
  assert.match(md, /\| test \| yes \| pass \|/);
  assert.match(md, /## ADVISORY[\s\S]*policy check: browser check/);
  assert.deepEqual(readState(path.join(d, 'openspec/changes/add-x/verify.md')).tests.map(t => t.result), ['pass', 'pass']);
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  assert.equal(s.type, 'web-ui');
});

test('failing required test -> fail with command and output tail', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({ test: 1 }) });
  const st = verifyStatus({ dir: d, change: 'add-x' });
  assert.equal(st.status, 'fail');
  assert.match(st.hard[0], /npm run test failed \(exit 1\)/);
  assert.match(fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8'), /\| T:test \| npm run test failed \(exit 1\) \| ran npm run test \/ last line \|/);
});

test('missing required script: HARD for web-ui, advisory for none; failing optional is advisory', () => {
  const a = project({ scripts: {} });
  runVerify({ dir: a, change: 'add-x', registry, run: runner({}) });
  assert.equal(verifyStatus({ dir: a, change: 'add-x' }).status, 'fail');
  const b = project({ type: 'none', scripts: {} });
  runVerify({ dir: b, change: 'add-x', registry, run: runner({}) });
  assert.equal(verifyStatus({ dir: b, change: 'add-x' }).status, 'pass');
  const c = project({ scripts: { test: 'x', 'test:integration': 'y' } });
  runVerify({ dir: c, change: 'add-x', registry, run: runner({ 'test:integration': 3 }) });
  assert.equal(verifyStatus({ dir: c, change: 'add-x' }).status, 'pass');
});

test('unknown change and missing report are reported, not guessed', () => {
  const d = project();
  assert.throws(() => runVerify({ dir: d, change: 'nope', registry, run: runner({}) }), /change not found/);
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'missing');
});

// 2.2
test('changed source file without a test is advisory; a matching or changed test clears it; config and d.ts ignored', () => {
  const d = project();
  g(d, 'checkout', '-qb', 'feature');
  w(d, 'src/lib/price.ts', 'export const p = 1;\n');
  w(d, 'src/types.d.ts', 'declare const x: 1;\n');
  w(d, 'next.config.ts', 'export default {};\n');
  w(d, 'src/app.config.ts', 'export default {};\n');
  const changed = changedFiles(d, 'add-x');
  assert.ok(changed.includes('src/lib/price.ts'));
  assert.deepEqual(untestedFiles(d, changed), ['src/lib/price.ts']);
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.match(fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8'), /U:src\/lib\/price\.ts \| changed source file without a matching test/);
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'feature');
  w(d, 'tests/unit/price.test.ts', 'test');
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'test');
  assert.deepEqual(untestedFiles(d, changedFiles(d, 'add-x')), []);
  assert.deepEqual(untestedFiles(d, ['src/lib/other.ts', 'src/x.test.ts']), []);
});

// 2.3
test('findings: high security is HARD, medium is advisory; re-run keeps findings', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  addFinding({ dir: d, change: 'add-x', source: 'security', severity: 'medium', text: 'missing rate limit' });
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  addFinding({ dir: d, change: 'add-x', source: 'security', severity: 'high', text: 'SQL injection in /api/x' });
  addFinding({ dir: d, change: 'add-x', source: 'code', severity: 'high', text: 'off-by-one' });
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'fail');
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  const st = verifyStatus({ dir: d, change: 'add-x' });
  assert.equal(st.status, 'fail');
  assert.deepEqual(st.hard, ['security review (high)']);
  assert.throws(() => addFinding({ dir: d, change: 'add-x', source: 'security', severity: 'critical', text: 'x' }), /severity/);
});

test('override needs a reason, only for HARD items, and turns fail into overridden', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  addFinding({ dir: d, change: 'add-x', source: 'security', severity: 'high', text: 'false positive' });
  addFinding({ dir: d, change: 'add-x', source: 'code', severity: 'low', text: 'naming' });
  assert.throws(() => addOverride({ dir: d, change: 'add-x', item: 'S1', reason: ' ' }), /--reason is required/);
  assert.throws(() => addOverride({ dir: d, change: 'add-x', item: 'C1', reason: 'x' }), /advisory/);
  addOverride({ dir: d, change: 'add-x', item: 'S1', reason: 'known false positive: input is a constant' });
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'overridden');
  assert.match(fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8'), /\| S1 \| known false positive: input is a constant \| \d{4}-\d\d-\d\d \|/);
});

// 2.4
test('prepush: installs once, never overwrites', () => {
  const d = project();
  const r = installPrepush({ dir: d, registry });
  assert.equal(r.installed, true);
  assert.match(fs.readFileSync(path.join(d, '.git/hooks/pre-push'), 'utf8'), /npm run test \|\|/);
  fs.writeFileSync(path.join(d, '.git/hooks/pre-push'), 'mine');
  const again = installPrepush({ dir: d, registry });
  assert.equal(again.installed, false);
  assert.match(again.reason, /already exists; left untouched/);
  assert.equal(fs.readFileSync(path.join(d, '.git/hooks/pre-push'), 'utf8'), 'mine');
});

// trial follow-up: review status + readable failure detail
import { setReview, failureDetail } from '../../plugins/kit/scripts/verify.mjs';

test('a missing security review is visible (advisory); substitute needs a note; status lists reviews', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  const md = () => fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md(), /\| R:security \| security review not recorded \(did it run\?\) \|/);
  assert.match(md(), /## Reviews[\s\S]*\| security \| not recorded \|/);
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  assert.throws(() => setReview({ dir: d, change: 'add-x', source: 'security', how: 'substitute' }), /--note is required/);
  setReview({ dir: d, change: 'add-x', source: 'security', how: 'substitute', note: '/security-review could not run locally; agent reviewed the diff' });
  setReview({ dir: d, change: 'add-x', source: 'code', how: 'ran' });
  assert.doesNotMatch(md(), /R:security/);
  assert.match(md(), /\| security \| substitute \| \/security-review could not run locally; agent reviewed the diff \|/);
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).reviews.security.how, 'substitute');
  setReview({ dir: d, change: 'add-x', source: 'code', how: 'skipped', note: 'no diff' });
  assert.match(md(), /\| R:code \| code review skipped \| no diff \|/);
});

test('failure detail keeps readable error lines only, capped', () => {
  const out = "\x1b[31m FAIL \x1b[39m tests/a.test.ts\n  7| // comment\n  8| if (x) {\n     |  ^\n ⎯⎯⎯⎯⎯⎯⎯⎯[1/9]⎯\nError: Integration tests only run against the dev project (APP_ENV=development)\n> build\n";
  const d = failureDetail(out);
  assert.match(d, /Error: Integration tests only run against the dev project/);
  assert.doesNotMatch(d, /⎯|7\||\x1b/);
  assert.ok(failureDetail('x'.repeat(500)).length <= 200);
});

// design-trial 1.1-1.2: no browser reminder by default; on-request browser check
import { setBrowser } from '../../plugins/kit/scripts/verify.mjs';

test('default web-ui verify lists no browser item (registry policy)', async () => {
  const { loadRegistry } = await import('../../plugins/kit/scripts/setup.mjs');
  const d = project();
  const s = runVerify({ dir: d, change: 'add-x', registry: loadRegistry(), run: runner({}) });
  assert.ok(!s.items.some(i => /browser/i.test(`${i.what} ${i.detail ?? ''}`)));
  assert.doesNotMatch(fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8'), /Browser check/);
});

test('browser check: pass, issues (advisory, ordered), shots, replaced on re-run, kept across run', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  setBrowser({ dir: d, change: 'add-x', result: 'pass', shots: 'browser/a.png,browser/b.png' });
  let md = fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md, /## Browser check \(on request\)\n\nresult: pass  \(date: \d{4}-\d\d-\d\d\)\n\nScreenshots:\n- browser\/a\.png\n- browser\/b\.png/);
  setBrowser({ dir: d, change: 'add-x', result: 'issues', issues: ['close button overlaps image', 'no focus trap'] });
  md = fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md, /\| B1 \| browser check \| close button overlaps image \|[\s\S]*\| B2 \| browser check \| no focus trap \|/);
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  setBrowser({ dir: d, change: 'add-x', result: 'pass' });
  assert.doesNotMatch(fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8'), /\| B1 \|/);
  setBrowser({ dir: d, change: 'add-x', result: 'issues', issues: ['x'] });
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.match(fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8'), /\| B1 \| browser check \| x \|/);
  assert.throws(() => setBrowser({ dir: d, change: 'add-x', result: 'issues' }), /needs at least one --issue/);
  assert.throws(() => setBrowser({ dir: d, change: 'add-x', result: 'meh' }), /pass or issues/);
});

// build-readiness 4.1: docs-scan
import { docsScan, receiptItems, setDocsSync, namedIn } from '../../plugins/kit/scripts/verify.mjs';
import { addDecision, later } from '../../plugins/kit/scripts/decisions.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

function docsProject() {
  const d = project();
  w(d, 'package.json', JSON.stringify({ scripts: { test: 'x' }, devDependencies: { vitest: '^3' } }));
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'pkg');
  g(d, 'switch', '-qc', 'feat');
  w(d, 'openspec/changes/add-x/design.md', '# Design\n\nUse Playwright for the speed test.\n');
  w(d, 'openspec/changes/add-x/specs/a/spec.md', '## ADDED Requirements\n');
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'docs');
  return d;
}
const commit = (d, rel, text, msg) => { w(d, rel, text); g(d, 'add', '.'); g(d, 'commit', '-qm', msg); };

test('docs-scan: artifacts committed, then 3 code commits -> codeCommitsSince 3', () => {
  const d = docsProject();
  for (const n of [1, 2, 3]) commit(d, `src/f${n}.ts`, 'x', `code ${n}`);
  commit(d, 'README.md', 'docs only', 'readme');
  const s = docsScan({ dir: d, change: 'add-x' });
  assert.match(s.docsUpdated.date, /^\d{4}-\d\d-\d\d$/);
  assert.equal(s.codeCommitsSince, 3);
});

test('docs-scan: verify.md, decisions.md and ticked tasks are not doc updates', () => {
  const d = docsProject();
  const before = docsScan({ dir: d, change: 'add-x' }).docsUpdated.commit;
  commit(d, 'src/a.ts', 'x', 'code');
  commit(d, 'openspec/changes/add-x/verify.md', 'v', 'verify');
  commit(d, 'openspec/changes/add-x/decisions.md', 'd', 'decisions');
  commit(d, 'openspec/changes/add-x/tasks.md', '- [x] 1.1\n', 'tick');
  const s = docsScan({ dir: d, change: 'add-x' });
  assert.equal(s.docsUpdated.commit, before);
  assert.equal(s.codeCommitsSince, 1);
});

test('docs-scan: an apply.md with rulings returns its items; none -> null', () => {
  const d = docsProject();
  assert.equal(docsScan({ dir: d, change: 'add-x' }).receipt, null);
  w(d, 'openspec/changes/add-x/apply.md', '# Apply\n\n## Rulings made during apply\n\n1. Corrupt body loads empty.\n2. **Port** 3101 for the speed test.\n   - nested detail\n\n## Evidence\n\n- 514 tests\n\n## Visible changes worth knowing\n\n- Shadows only at 50% zoom.\n');
  assert.deepEqual(docsScan({ dir: d, change: 'add-x' }).receipt, ['Corrupt body loads empty.', 'Port 3101 for the speed test.', 'Shadows only at 50% zoom.']);
  assert.deepEqual(receiptItems('## Notes\n- x\n'), []);
});

test('docs-scan: an added devDependency appears, planned when an artifact names it (any case)', () => {
  const d = docsProject();
  commit(d, 'package.json', JSON.stringify({ scripts: { test: 'x' }, devDependencies: { 'fake-indexeddb': '^6', playwright: '^1' } }), 'deps');
  const s = docsScan({ dir: d, change: 'add-x' });
  assert.deepEqual(s.deps.added, [{ name: 'fake-indexeddb', planned: false }, { name: 'playwright', planned: true }]);
  assert.deepEqual(s.deps.removed, ['vitest']);
});

// build-readiness 4.2: docs-sync summary and open decisions in the report
test('docs-sync section appears with its counts; open decisions are advisory and the result stays pass', () => {
  const d = docsProject();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  const md0 = fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md0, /## Docs sync\n\nNot run yet\./);
  setDocsSync({ dir: d, change: 'add-x', proposed: 6, written: 5, declined: 1, leftOut: 10, unplanned: 'fake-indexeddb' });
  addDecision({ dir: d, change: 'add-x', kind: 'confirm', text: 'Corrupt board loads empty?', from: 'apply.md' });
  later({ dir: d, change: 'add-x', id: 'D1' });
  const s = runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  const md = fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md, /## Docs sync\n\ndocs last updated: \d{4}-\d\d-\d\d \(\w+\); code commits since: 0/);
  assert.match(md, /\| 6 \| 5 \| 1 \| 10 \|/);
  assert.match(md, /unplanned dependencies: fake-indexeddb/);
  assert.match(md, /\| O:decisions \| 1 decision still open since \d{4}-\d\d-\d\d \|/);
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  assert.equal(s.items.find(i => i.id === 'O:decisions').level, 'ADVISORY');
  assert.throws(() => setDocsSync({ dir: d, change: 'add-x', proposed: -1 }), /whole numbers/);
});

test('docs-scan: no base commit to compare with -> deps unknown (null), not "everything added"', () => {
  const d = tmpDir('kit-verify-nobase-');
  w(d, 'package.json', JSON.stringify({ dependencies: { react: '^19' } }));
  g(d, 'init', '-q', '-b', 'dev'); g(d, 'add', '.'); g(d, 'commit', '-qm', 'base');
  w(d, 'openspec/changes/add-x/proposal.md', '# P\n');
  assert.equal(docsScan({ dir: d, change: 'add-x' }).deps, null);
});

// verify C4, C5
test('namedIn: whole package names only', () => {
  assert.equal(namedIn('use playwright for the speed test', 'Playwright'), true);
  assert.equal(namedIn('render the items', 'ms'), false);
  assert.equal(namedIn('a quick reaction', 'react'), false);
  assert.equal(namedIn('add `@dnd-kit/core` for drag', '@dnd-kit/core'), true);
  assert.equal(namedIn('uses @dnd-kit/core-utils', '@dnd-kit/core'), false);
});

test('a kit report with broken data stops run instead of being renamed; "-->" in a finding round-trips', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  addFinding({ dir: d, change: 'add-x', source: 'code', severity: 'low', text: 'parser stops at } --> in text' });
  assert.equal(readState(path.join(d, 'openspec/changes/add-x/verify.md')).items.at(-1).detail, 'parser stops at } --> in text');
  const f = path.join(d, 'openspec/changes/add-x/verify.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('"change":', '<<<<<<< HEAD'));
  assert.throws(() => runVerify({ dir: d, change: 'add-x', registry, run: runner({}) }), /kit report but its data can't be read/);
  assert.equal(fs.existsSync(path.join(d, 'openspec/changes/add-x/verify-earlier.md')), false);
});

// 7.1 trial follow-ups
test('docs-sync: proposed + left out must cover every receipt item', () => {
  const d = docsProject();
  w(d, 'openspec/changes/add-x/apply.md', '# Apply\n\n## Rulings made during apply\n\n1. Port 3101.\n2. Deletes first.\n\n## Visible changes worth knowing\n\n- Fit zooms to 350%.\n');
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.throws(() => setDocsSync({ dir: d, change: 'add-x', proposed: 1, written: 1, leftOut: 1 }), /receipt has 3 items but proposed \+ left out = 2/);
  assert.equal(setDocsSync({ dir: d, change: 'add-x', proposed: 2, written: 2, leftOut: 1 }).docsSync.proposed, 2);
});

test('a verify.md the kit did not write is kept as verify-earlier.md and listed (advisory), never overwritten', () => {
  const d = project();
  const dir = path.join(d, 'openspec/changes/add-x');
  w(d, 'openspec/changes/add-x/verify.md', '# Verification Report\n\nTask 10.4 open.\n');
  const s = runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.equal(fs.readFileSync(path.join(dir, 'verify-earlier.md'), 'utf8'), '# Verification Report\n\nTask 10.4 open.\n');
  const e = s.items.find(i => i.id === 'E:report');
  assert.equal(e.level, 'ADVISORY');
  assert.equal(e.detail, 'openspec/changes/add-x/verify-earlier.md');
  assert.equal(verifyStatus({ dir: d, change: 'add-x' }).status, 'pass');
  // a re-run keeps the pointer and renames nothing else
  const again = runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.equal(again.items.find(i => i.id === 'E:report').detail, 'openspec/changes/add-x/verify-earlier.md');
  assert.equal(fs.existsSync(path.join(dir, 'verify-earlier-2.md')), false);
});

// kit-followups 3.1: fixed advisory findings are resolved with a note
import { resolveFinding } from '../../plugins/kit/scripts/verify.mjs';
test('resolve: an advisory finding moves to Resolved with its note and date, and stays resolved after run', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  addFinding({ dir: d, change: 'add-x', source: 'code', severity: 'low', text: 'off-by-one in paging' });
  const s = resolveFinding({ dir: d, change: 'add-x', item: 'C1', note: 'fixed in 76fbaaa' });
  assert.ok(!s.items.some(i => i.id === 'C1'));
  assert.equal(s.resolved[0].item, 'C1');
  const md = fs.readFileSync(path.join(d, 'openspec/changes/add-x/verify.md'), 'utf8');
  assert.match(md, /## Resolved[\s\S]*\| C1 \| code review \(low\) - off-by-one in paging \| fixed in 76fbaaa \| \d{4}-\d\d-\d\d \|/);
  assert.doesNotMatch(md.split('## Resolved')[0], /off-by-one/);
  const again = runVerify({ dir: d, change: 'add-x', registry, run: runner({}) });
  assert.ok(!again.items.some(i => i.id === 'C1'));
  assert.equal(again.resolved.length, 1);
});

test('resolve: refuses HARD items, unknown items, and a missing note', () => {
  const d = project();
  runVerify({ dir: d, change: 'add-x', registry, run: runner({ test: 1 }) });
  const hard = readState(path.join(d, 'openspec/changes/add-x/verify.md')).items.find(i => i.level === 'HARD');
  assert.throws(() => resolveFinding({ dir: d, change: 'add-x', item: hard.id, note: 'x' }), /HARD item needs a passing re-run or the user's override/);
  assert.throws(() => resolveFinding({ dir: d, change: 'add-x', item: 'C9', note: 'x' }), /no item "C9"/);
  addFinding({ dir: d, change: 'add-x', source: 'code', severity: 'low', text: 'y' });
  assert.throws(() => resolveFinding({ dir: d, change: 'add-x', item: 'C1' }), /--note is required/);
});
