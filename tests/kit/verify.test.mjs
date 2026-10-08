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
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-verify-'));
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
