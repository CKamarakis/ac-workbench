import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { addDecision, decide, later, readyDone, listDecisions, decisionStatus, openLine, readDecisions } from '../../plugins/kit/scripts/decisions.mjs';

const SCRIPT = path.resolve('plugins/kit/scripts/decisions.mjs');
function project() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-decisions-'));
  fs.mkdirSync(path.join(d, 'openspec/changes/add-x'), { recursive: true });
  return d;
}
const file = d => path.join(d, 'openspec/changes/add-x/decisions.md');
const base = { change: 'add-x' };

// 2.1
test('first add creates decisions.md with the item open', () => {
  const d = project();
  assert.equal(fs.existsSync(file(d)), false);
  const i = addDecision({ dir: d, ...base, kind: 'gap', text: 'What shows when an upload fails?', from: 'specs/upload/spec.md', options: 'Broken-image tile|Error toast', recommended: 'Broken-image tile' });
  assert.equal(i.id, 'D1');
  assert.equal(i.status, 'open');
  const md = fs.readFileSync(file(d), 'utf8');
  assert.match(md, /^# Decisions: add-x/);
  assert.match(md, /\| D1 \| gap \| What shows when an upload fails\? \| specs\/upload\/spec.md \| \*\*Broken-image tile\*\* \(recommended\) \/ Error toast \| open \|/);
  assert.match(md, /open: 1/);
  assert.match(md, /readiness check: not run/);
});

test('ids run D1, D2... and are never reused', () => {
  const d = project();
  for (let n = 0; n < 3; n++) addDecision({ dir: d, ...base, kind: 'confirm', text: `q${n}`, from: 'design.md' });
  decide({ dir: d, ...base, id: 'D2', answer: 'yes' });
  assert.equal(addDecision({ dir: d, ...base, kind: 'gap', text: 'q3', from: 'x' }).id, 'D4');
  assert.deepEqual(listDecisions({ dir: d, ...base }).map(i => i.id), ['D1', 'D2', 'D3', 'D4']);
});

test('decide records the answer, where it was written, and the date', () => {
  const d = project();
  addDecision({ dir: d, ...base, kind: 'gap', text: 'q', from: 'x' });
  const i = decide({ dir: d, ...base, id: 'D1', answer: 'Broken-image tile', written: 'specs/upload/spec.md' });
  assert.equal(i.status, 'decided');
  assert.equal(i.written, 'specs/upload/spec.md');
  assert.match(i.dates.decided, /^\d{4}-\d\d-\d\d$/);
  assert.equal(decide({ dir: d, ...base, id: 'D1', answer: 'not documented' }).written, 'not written');
});

test('later keeps the item counted as open, and can be decided afterwards', () => {
  const d = project();
  addDecision({ dir: d, ...base, kind: 'confirm', text: 'q', from: 'x' });
  later({ dir: d, ...base, id: 'D1' });
  assert.equal(decisionStatus({ dir: d, ...base }).open, 1);
  assert.equal(listDecisions({ dir: d, ...base, open: true }).length, 1);
  const i = decide({ dir: d, ...base, id: 'D1', answer: 'keep' });
  assert.ok(i.dates.later && i.dates.decided && i.dates.opened);
  assert.equal(decisionStatus({ dir: d, ...base }).open, 0);
  assert.throws(() => later({ dir: d, ...base, id: 'D1' }), /already decided/);
});

test('a hand-edited table is re-rendered from the data block', () => {
  const d = project();
  addDecision({ dir: d, ...base, kind: 'gap', text: 'real question', from: 'x' });
  fs.writeFileSync(file(d), fs.readFileSync(file(d), 'utf8').replace('| D1 | gap | real question', '| D1 | gap | HAND EDIT'));
  addDecision({ dir: d, ...base, kind: 'gap', text: 'second', from: 'x' });
  const md = fs.readFileSync(file(d), 'utf8');
  assert.doesNotMatch(md, /HAND EDIT/);
  assert.match(md, /real question/);
});

test('bad input is rejected with error:', () => {
  const d = project();
  assert.throws(() => addDecision({ dir: d, ...base, kind: 'wish', text: 'q', from: 'x' }), /--kind must be one of/);
  assert.throws(() => addDecision({ dir: d, ...base, kind: 'gap', text: 'q' }), /--from is required/);
  assert.throws(() => addDecision({ dir: d, ...base, kind: 'gap', text: 'q', from: 'x', options: 'a|b', recommended: 'c' }), /--recommended/);
  assert.throws(() => decide({ dir: d, ...base, id: 'D9', answer: 'x' }), /no decision "D9"/);
  const r = spawnSync(process.execPath, [SCRIPT, 'add', '--dir', d, '--change', 'add-x', '--kind', 'wish', '--text', 'q', '--from', 'x'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^error: --kind must be one of/);
});

// 2.2
test('decisionStatus: no file -> exists false, open 0', () => {
  assert.deepEqual(decisionStatus({ dir: project(), ...base }), { exists: false, open: 0, oldest: null, readyAt: null });
});

test('decisionStatus: one later item -> open 1 with its date as oldest', () => {
  const d = project();
  addDecision({ dir: d, ...base, kind: 'confirm', text: 'q', from: 'x' });
  later({ dir: d, ...base, id: 'D1' });
  const s = readDecisions(file(d));
  s.items[0].dates.later = '2026-10-12';
  fs.writeFileSync(file(d), `<!-- kit-decisions-data ${JSON.stringify(s)} -->`);
  const st = decisionStatus({ dir: d, ...base });
  assert.equal(st.open, 1);
  assert.equal(st.oldest, '2026-10-12');
  assert.equal(openLine(st), '1 decision still open since 2026-10-12');
  assert.equal(openLine({ open: 0 }), null);
});

test('ready-done with zero items still sets readyAt', () => {
  const d = project();
  readyDone({ dir: d, ...base });
  const st = decisionStatus({ dir: d, ...base });
  assert.equal(st.exists, true);
  assert.equal(st.readyAt.items, 0);
  assert.match(st.readyAt.date, /^\d{4}-\d\d-\d\d$/);
  assert.match(fs.readFileSync(file(d), 'utf8'), /readiness check: \d{4}-\d\d-\d\d at \S+ \(0 items\)/);
});
