import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gate, reminder } from '../../plugins/kit/hooks/archive-gate.mjs';
import { addDecision, later } from '../../plugins/kit/scripts/decisions.mjs';
import { runVerify, addFinding, addOverride } from '../../plugins/kit/scripts/verify.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

const hooks = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'kit', 'hooks');
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
function kitProject(kit = true) {
  const d = tmpDir('kit-hooks-');
  if (kit) w(d, '.claude/kit.json', '{"project_type":"none"}');
  w(d, 'openspec/changes/add-x/proposal.md', '# P\n');
  w(d, 'package.json', '{"scripts":{}}');
  return d;
}
const reg = { project_types: { none: { tests: [{ script: 'test', required: false }], missing_required: 'advisory', advisory: [] } } };
const bash = command => ({ tool_name: 'Bash', tool_input: { command } });

// 3.1 archive gate
test('archive without verify is blocked with the fix', () => {
  const d = kitProject();
  assert.match(gate(bash('openspec archive add-x --yes'), d), /has no verify report\. Run \/kit:verify first/);
  assert.match(gate(bash('"$(npm prefix -g)/openspec" archive --yes add-x'), d), /Run \/kit:verify first/);
});

test('archive after pass or override is allowed; fail is blocked with the items', () => {
  const d = kitProject();
  runVerify({ dir: d, change: 'add-x', registry: reg, run: () => ({ status: 0, out: '' }) });
  assert.equal(gate(bash('openspec archive add-x'), d), null);
  addFinding({ dir: d, change: 'add-x', source: 'security', severity: 'high', text: 'x' });
  assert.match(gate(bash('openspec archive add-x'), d), /verify failed for "add-x" \(security review \(high\)\)/);
  addOverride({ dir: d, change: 'add-x', item: 'S1', reason: 'accepted risk' });
  assert.equal(gate(bash('openspec archive add-x'), d), null);
});

test('gate does nothing outside kit projects or for other commands', () => {
  assert.equal(gate(bash('openspec archive add-x'), kitProject(false)), null);
  const d = kitProject();
  assert.equal(gate(bash('openspec status --change add-x'), d), null);
  assert.equal(gate(bash('openspec archive'), d), null);
  assert.equal(gate({ tool_name: 'Edit', tool_input: { command: 'openspec archive add-x' } }, d), null);
  assert.equal(gate(bash('openspec archive unknown-change'), d), null);
});

test('gate script end to end: deny JSON on stdout', () => {
  const d = kitProject();
  const r = spawnSync(process.execPath, [path.join(hooks, 'archive-gate.mjs')], { input: JSON.stringify(bash('openspec archive add-x')), env: { ...process.env, CLAUDE_PROJECT_DIR: d }, encoding: 'utf8' });
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /\/kit:verify/);
});

// build-readiness 5.4: reminder about open decisions on an allowed archive
test('pass + 2 open decisions -> allowed, with a reminder; pass + 0 open -> no output; no verify -> still denied', () => {
  const d = kitProject();
  assert.match(gate(bash('openspec archive add-x'), d), /Run \/kit:verify first/);
  assert.equal(reminder(bash('openspec archive add-x'), d), null, 'denied archives get no reminder');
  runVerify({ dir: d, change: 'add-x', registry: reg, run: () => ({ status: 0, out: '' }) });
  assert.equal(gate(bash('openspec archive add-x'), d), null);
  assert.equal(reminder(bash('openspec archive add-x'), d), null);
  for (const t of ['a', 'b']) addDecision({ dir: d, change: 'add-x', kind: 'confirm', text: t, from: 'x' });
  later({ dir: d, change: 'add-x', id: 'D1' });
  assert.equal(gate(bash('openspec archive add-x'), d), null, 'open decisions never block');
  assert.match(reminder(bash('openspec archive add-x'), d), /2 decisions still open since \d{4}-\d\d-\d\d .*the archive is not blocked/);
  assert.equal(reminder(bash('openspec list'), d), null);
  const out = spawnSync(process.execPath, [path.join(hooks, 'archive-gate.mjs')], { input: JSON.stringify({ ...bash('openspec archive add-x'), cwd: d }), encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: d } });
  const j = JSON.parse(out.stdout);
  assert.equal(j.hookSpecificOutput.permissionDecision, undefined);
  assert.match(j.hookSpecificOutput.additionalContext, /2 decisions still open/);
});

// kit-docs 5.1: docs page rebuild reminder at archive
const passing = () => { const d = kitProject(); runVerify({ dir: d, change: 'add-x', registry: reg, run: () => ({ status: 0, out: '' }) }); return d; };
test('kit-docs: pass + knowledge/docs present -> reminder names the docs page rebuild', () => {
  const d = passing();
  w(d, 'knowledge/docs/index.html', '<html></html>');
  const r = reminder(bash('openspec archive add-x'), d);
  assert.match(r, /docs page/);
  assert.match(r, /docs\.mjs" build --dir \./);
  assert.match(r, /knowledge\/docs\/index\.html in the archive commit/);
});

test('kit-docs: pass + no knowledge/docs -> no docs text', () => {
  const d = passing();
  assert.equal(reminder(bash('openspec archive add-x'), d), null);
});

test('kit-docs: pass + 2 open decisions + knowledge/docs -> both texts', () => {
  const d = passing();
  fs.mkdirSync(path.join(d, 'knowledge', 'docs'), { recursive: true });
  for (const t of ['a', 'b']) addDecision({ dir: d, change: 'add-x', kind: 'confirm', text: t, from: 'x' });
  const r = reminder(bash('openspec archive add-x'), d);
  assert.match(r, /2 decisions still open/);
  assert.match(r, /docs page/);
});

test('C8: the archive reminder says the project uses the living docs, not that a page exists', () => {
  const d = passing();
  w(d, 'knowledge/docs/tools.md', '## x\n');
  const r = reminder(bash('openspec archive add-x'), d);
  assert.match(r, /uses the living docs/);
  assert.doesNotMatch(r, /has a docs page/);
});

// ---------- explore-stage 3.3: reminder hook (spec explore-record "Reminder when the next stage starts") ----------
import { reminder as exploreReminder } from '../../plugins/kit/hooks/explore-reminder.mjs';
import { isKitProject, projectDir } from '../../plugins/kit/hooks/kit-project.mjs';

test('L17: one shared "kit project" check and project-dir lookup for the hooks', () => {
  const d = tmpDir('kit-hooks-shared-');
  assert.equal(isKitProject(d), false);
  assert.equal(isKitProject(null), false);
  fs.mkdirSync(path.join(d, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(d, '.claude', 'kit.json'), '{}');
  assert.equal(isKitProject(d), true);
  assert.equal(projectDir({ cwd: '/from/event' }, { CLAUDE_PROJECT_DIR: '/from/env' }), '/from/env');
  assert.equal(projectDir({ cwd: '/from/event' }, {}), '/from/event');
  assert.equal(projectDir({}, {}), process.cwd());
  for (const f of ['archive-gate.mjs', 'explore-reminder.mjs', 'tool-review-reminder.mjs']) {
    const src = fs.readFileSync(path.join(hooks, f), 'utf8');
    assert.doesNotMatch(src, /CLAUDE_PROJECT_DIR \|\|/, `${f} uses projectDir()`);
    assert.doesNotMatch(src, /'kit\.json'/, `${f} uses isKitProject()`);
  }
});

test('explore reminder: next-stage prompts in a kit project get one line; others and non-kit folders get nothing', () => {
  const kit = tmpDir('kit-hooks-explore-');
  fs.mkdirSync(path.join(kit, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(kit, '.claude', 'kit.json'), '{}');
  for (const p of ['/kit:prd', '/opsx:propose loose-ends', '  /kit:next --change x']) assert.match(exploreReminder({ prompt: p }, kit), /^Kit reminder: if this session explored something/);
  assert.equal(exploreReminder({ prompt: 'what does this function do?' }, kit), null);
  assert.equal(exploreReminder({ prompt: '/kit:prdx' }, kit), null);
  assert.equal(exploreReminder({ prompt: '/kit:prd' }, tmpDir('kit-hooks-plain-')), null);
  const run = (input, dir) => spawnSync(process.execPath, [path.join(hooks, 'explore-reminder.mjs')], { input, env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: 'utf8' });
  let r = run(JSON.stringify({ hook_event_name: 'UserPromptSubmit', prompt: '/kit:prd' }), kit);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /\/kit:explore-record/);
  r = run('not json', kit);
  assert.equal(r.status, 0, 'never blocks on bad input');
  assert.equal(r.stdout, '');
});

// build-safeguards 3.1: a high-risk change without the user's OK gets a reminder at archive, never a block
test('archive of a high-risk change without the OK: allowed, with an OK reminder', async () => {
  const { writeSafeguards } = await import('../../plugins/kit/scripts/ready.mjs');
  const { setOk } = await import('../../plugins/kit/scripts/verify.mjs');
  const d = kitProject();
  fs.writeFileSync(path.join(d, 'openspec/changes/add-x/design.md'), '# Design\n');
  writeSafeguards({ dir: d, change: 'add-x', ratings: { reach: { level: 'high', why: 'r' }, undo: { level: 'low', why: 'u' }, safety: { level: 'low', why: 's' } } });
  runVerify({ dir: d, change: 'add-x', registry: reg, run: () => ({ status: 0, out: '' }) });
  assert.equal(gate(bash('openspec archive add-x'), d), null);
  assert.match(reminder(bash('openspec archive add-x'), d), /OK before merge isn't recorded yet .*the archive is not blocked/);
  setOk({ dir: d, change: 'add-x' });
  assert.equal(reminder(bash('openspec archive add-x'), d), null);
});

// build-safeguards 4.3 (spec: tool-review "Review reminder at session start")
test('tool review reminder: Review due, Not due, Other project; exit 0 always', async () => {
  const { reminder: toolReminder } = await import('../../plugins/kit/hooks/tool-review-reminder.mjs');
  const yaml = date => `tools:\n  - name: superpowers\n    status: trial\n    reviewed_on: ${date}\n  - name: old\n    status: dropped\n    reviewed_on: 2020-01-01\n`;
  const now = Date.parse('2026-10-18');
  const due = tmpDir('kit-trr-');
  fs.writeFileSync(path.join(due, 'toolkit.yaml'), yaml('2026-09-06'));
  assert.equal(toolReminder(due, now), 'Kit reminder: tell the user in one line: "Tool review due (oldest: superpowers, 42 days): run /kit:tool-review".');
  const fresh = tmpDir('kit-trr-');
  fs.writeFileSync(path.join(fresh, 'toolkit.yaml'), yaml('2026-10-01'));
  assert.equal(toolReminder(fresh, now), null, 'Not due: within 30 days; the dropped tool is ignored');
  assert.equal(toolReminder(tmpDir('kit-trr-'), now), null, 'Other project: no toolkit.yaml');
  const run = (dir, input) => spawnSync(process.execPath, [path.join(hooks, 'tool-review-reminder.mjs')], { input, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir } });
  const r = run(due, JSON.stringify({ hook_event_name: 'SessionStart' }));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Tool review due \(oldest: superpowers, \d+ days\)/);
  assert.equal(run(due, 'not json').status, 0, 'a bad event never fails the session');
  assert.equal(run(tmpDir('kit-trr-'), '{}').stdout, '');
});
