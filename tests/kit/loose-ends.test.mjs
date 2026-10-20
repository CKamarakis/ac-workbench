import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';
import { readLooseEnds, looseSummary, add, important, block, seen, changeKind, done, drop, list, analysis } from '../../plugins/kit/scripts/loose-ends.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/kit/scripts/loose-ends.mjs', import.meta.url));

function project(files = {}) {
  const d = tmpDir('kit-loose-');
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true });
    fs.writeFileSync(path.join(d, rel), text);
  }
  return d;
}
const file = d => path.join(d, 'knowledge', 'loose-ends.md');
const one = (d, x = {}) => add(d, { text: 'openspec not on agent PATH', kind: 'friction', origin: 'chat', tags: 'windows', ...x }).added[0];

// ---------- 1.2 file, add, IDs, unreadable ----------

test('add to a project with no file: L1, open, today, source chat, readable table', () => {
  const d = project();
  assert.equal(readLooseEnds(d).exists, false);
  const it = one(d);
  assert.deepEqual([it.id, it.state, it.source, it.tags], ['L1', 'open', 'chat', ['windows']]);
  assert.equal(it.added, new Date().toISOString().slice(0, 10));
  const text = fs.readFileSync(file(d), 'utf8');
  assert.match(text, /\| L1 \| friction \| openspec not on agent PATH \|/);
  assert.match(text, /<!-- kit-loose-ends-data /);
});

test('IDs never reused: L3 after a dropped L2', () => {
  const d = project();
  one(d); one(d, { text: 'b' });
  drop(d, { id: 'L2', reason: 'out of scope' });
  assert.equal(one(d, { text: 'c' }).id, 'L3');
});

test('unknown kind or origin refused, nothing written', () => {
  const d = project();
  assert.throws(() => one(d, { kind: 'urgent' }), /--kind must be one of: check, friction, debt, idea, cleanup, accepted/);
  assert.throws(() => one(d, { origin: 'slack' }), /--origin must be one of/);
  assert.equal(fs.existsSync(file(d)), false);
});

test('hand-edited file: the script stops and leaves it unchanged', () => {
  const d = project({ 'knowledge/loose-ends.md': '# Loose ends\n\n<!-- kit-loose-ends-data {broken -->\n' });
  const before = fs.readFileSync(file(d), 'utf8');
  assert.throws(() => one(d), /can't be read .*fix it from git/);
  assert.equal(fs.readFileSync(file(d), 'utf8'), before);
  assert.equal(looseSummary(d).unreadable, true);
});

// ---------- 1.3 batch, important, block, seen, kind, done, drop ----------

test('batch: all or nothing', () => {
  const d = project();
  const b = path.join(d, 'batch.json');
  fs.writeFileSync(b, JSON.stringify([{ text: 'a', kind: 'check', origin: 'verify' }, { text: 'b', kind: 'nope', origin: 'chat' }]));
  assert.throws(() => add(d, { batch: b }), /item 2: --kind/);
  assert.equal(fs.existsSync(file(d)), false);
  fs.writeFileSync(b, JSON.stringify([{ text: 'a', kind: 'check', origin: 'verify' }, { text: 'b', kind: 'cleanup', origin: 'chat' }]));
  assert.deepEqual(add(d, { batch: b }).added.map(i => i.id), ['L1', 'L2']);
});

test("important: the agent's mark is stored with by and reason; removable; accepted refused", () => {
  const d = project();
  one(d);
  important(d, { id: 'L1', on: true, by: 'agent', reason: 'costs time every session' });
  assert.deepEqual(readLooseEnds(d).items[0].important.by, 'agent');
  assert.equal(readLooseEnds(d).items[0].important.reason, 'costs time every session');
  important(d, { id: 'L1', on: false });
  assert.equal(readLooseEnds(d).items[0].important, null);
  one(d, { text: 'C9', kind: 'accepted', origin: 'review' });
  assert.throws(() => important(d, { id: 'L2', on: true }), /accepted item can't be important: change its kind first/);
  assert.throws(() => one(d, { text: 'x', kind: 'accepted', important: true }), /can't be important/);
});

test('block: milestone, change (active or archived) and loose end accepted; unknown refused', () => {
  const d = project({
    'knowledge/roadmaps/milestones/m12.md': '---\nid: M12\ntitle: Proof\nstatus: planned\n---\n',
    'openspec/changes/tables/proposal.md': '# P\n',
    'openspec/changes/archive/2026-10-17-kit-status/proposal.md': '# P\n',
  });
  one(d); one(d, { text: 'b' });
  for (const t of ['M12', 'tables', 'L2']) assert.equal(block(d, { id: 'L1', target: t }).blocks, t);
  assert.throws(() => block(d, { id: 'L1', target: 'kit-status' }), /is archived: only open work can be blocked/, 'verify C1');
  assert.throws(() => block(d, { id: 'L1', target: 'M99' }), /block target "M99" not found/);
  assert.throws(() => block(d, { id: 'L1', target: 'L1' }), /can't block itself/);
  assert.equal(block(d, { id: 'L1', clear: true }).blocks, null);
});

test('seen again: count 2 with both dates', () => {
  const d = project();
  one(d, { date: '2026-10-17' });
  seen(d, { id: 'L1', date: '2026-10-18' });
  assert.deepEqual(readLooseEnds(d).items[0].seen, ['2026-10-17', '2026-10-18']);
  assert.deepEqual(analysis(d).seenAgain, [{ id: 'L1', text: 'openspec not on agent PATH', seen: 2 }]);
});

test('kind change with its reason; then it can be important', () => {
  const d = project();
  one(d, { text: 'C9', kind: 'accepted', origin: 'review' });
  assert.throws(() => changeKind(d, { id: 'L1', to: 'debt' }), /--reason is required/);
  changeKind(d, { id: 'L1', to: 'debt', reason: 'it started to hurt', date: '2026-10-20' });
  const it = readLooseEnds(d).items[0];
  assert.equal(it.kind, 'debt');
  assert.deepEqual(it.history, [{ date: '2026-10-20', what: 'kind accepted -> debt', reason: 'it started to hurt' }]);
  important(d, { id: 'L1', on: true });
});

test('done and dropped: reason and date kept; gone from the list; closed items refuse changes', () => {
  const d = project();
  one(d); one(d, { text: 'b', kind: 'idea' });
  drop(d, { id: 'L2', reason: 'out of scope', date: '2026-10-18' });
  done(d, { id: 'L1', reason: 'PATH fixed' });
  const items = readLooseEnds(d).items;
  assert.deepEqual(items[1].closed, { date: '2026-10-18', reason: 'out of scope' });
  assert.equal(items[1].state, 'dropped');
  assert.equal(list(d).groups.flatMap(g => g.items).length, 0);
  assert.throws(() => seen(d, { id: 'L1' }), /L1 is done/);
  assert.throws(() => drop(d, { id: 'L1' }), /L1 is done/);
});

// ---------- 1.4 list, analysis, CLI ----------

test('list: grouped, important first within a group', () => {
  const d = project();
  one(d, { text: 'friction', kind: 'friction' });
  one(d, { text: 'check', kind: 'check' });
  important(d, { id: 'L2', on: true });
  one(d, { text: 'i1', kind: 'idea' }); one(d, { text: 'i2', kind: 'idea' });
  one(d, { text: 'acc', kind: 'accepted', origin: 'review' });
  const g = Object.fromEntries(list(d).groups.map(x => [x.name, x.items.map(i => i.id)]));
  assert.deepEqual(g, { 'must look at': ['L2', 'L1'], 'will do anyway': [], 'might do': ['L3', 'L4'], 'nothing to do': ['L5'] });
});

test('analysis: counts by state, kind, origin, tag; important share', () => {
  const d = project();
  for (let n = 1; n <= 10; n++) one(d, { text: `t${n}`, kind: n <= 5 ? 'idea' : 'check', origin: n <= 4 ? 'chat' : 'build', tags: n % 2 ? 'ui' : '' });
  for (const id of ['L1', 'L2', 'L3']) done(d, { id, reason: 'done' });
  drop(d, { id: 'L4', reason: 'no' });
  important(d, { id: 'L5', on: true }); important(d, { id: 'L6', on: true });
  const a = analysis(d);
  assert.deepEqual(a.byState, { done: 3, dropped: 1, open: 6 });
  assert.equal(a.byOrigin.chat, 4);
  assert.deepEqual(a.byKind, { idea: 5, check: 5 });
  assert.equal(a.byTag.ui, 5);
  assert.equal(a.importantShare, 33);
});

test('CLI: add, list --json, analysis; error: on bad input with exit 1', () => {
  const d = project();
  const cli = (...a) => spawnSync(process.execPath, [SCRIPT, ...a, '--dir', d], { encoding: 'utf8' });
  let r = cli('add', '--text', 'Delete the temp clone', '--kind', 'cleanup', '--origin', 'chat');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /added L1 \[cleanup\] Delete the temp clone/);
  r = cli('list', '--json');
  assert.equal(JSON.parse(r.stdout).groups.find(g => g.name === 'might do').items[0].id, 'L1');
  assert.match(cli('analysis').stdout, /1 loose ends/);
  r = cli('add', '--text', 'x', '--kind', 'urgent', '--origin', 'chat');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^error: --kind must be one of/);
  assert.match(cli('list').stdout, /might do \(1\)\n  {3}L1 \[cleanup\] Delete the temp clone/);
});

// ---------- verify C1, C4 ----------

test('verify C1: finished targets refused (done milestone, closed loose end)', () => {
  const d = project({ 'knowledge/roadmaps/done/m11.md': '---\nid: M11\ntitle: Done one\nstatus: done\n---\n' });
  one(d); one(d, { text: 'b' });
  drop(d, { id: 'L2', reason: 'no' });
  assert.throws(() => block(d, { id: 'L1', target: 'M11' }), /"M11" is done: only open work/);
  assert.throws(() => block(d, { id: 'L1', target: 'L2' }), /"L2" is dropped: only open work/);
});

test('verify C4: writes go through a temp file; none is left behind', () => {
  const d = project();
  one(d); one(d, { text: 'b' });
  assert.deepEqual(fs.readdirSync(path.join(d, 'knowledge')).filter(n => n.includes('.tmp')), []);
});
