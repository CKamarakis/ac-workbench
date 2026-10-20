import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';
import {
  parseRoadmap, checkRoadmap, reportRoadmap, formatCheck, formatReport, gitFindings,
  newRoadmap, addMilestone, setStatus, addTask, tick, setOrder, setNow, addWaiting, resolveWaiting, link, addDrift,
  dropTask, editTask,
} from '../../plugins/kit/scripts/roadmap.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/kit/scripts/roadmap.mjs', import.meta.url));

// A project folder with knowledge/roadmaps/ written from parts.
function project({ order = [], now = ['Building the roadmap format.'], waiting = [], milestones = {}, done = {}, extra = '' } = {}) {
  const d = tmpDir('kit-roadmap-');
  const r = path.join(d, 'knowledge', 'roadmaps');
  fs.mkdirSync(path.join(r, 'milestones'), { recursive: true });
  fs.mkdirSync(path.join(r, 'done'), { recursive: true });
  const main = ['# Roadmap', '', '## North star', '', 'Ship v1.', '', ...(extra ? [extra, ''] : []), '## Principles', '', '- The user decides.', '', '## Order', '',
    ...order.map(id => `- ${id}`), '', '## Now', '', ...now, '', '## Waiting on you', '', ...waiting, ''].join('\n');
  fs.writeFileSync(path.join(r, 'roadmap.md'), main);
  fs.writeFileSync(path.join(r, 'drift-log.md'), '# Drift log\n\n| Date | What changed | Why | On-plan alternative | Impact | Decided by |\n|---|---|---|---|---|---|\n');
  for (const [f, t] of Object.entries(milestones)) fs.writeFileSync(path.join(r, 'milestones', f), t);
  for (const [f, t] of Object.entries(done)) fs.writeFileSync(path.join(r, 'done', f), t);
  return d;
}
const ms = (id, title, status, tasks = [], goal = 'A goal.') =>
  `---\nid: ${id}\ntitle: ${title}\nstatus: ${status}\n---\n\n${goal}\n\n## Tasks\n\n${tasks.join('\n')}\n`;
const kroot = d => path.join(d, 'knowledge');
const check = d => checkRoadmap(parseRoadmap(kroot(d)));
const has = (list, re) => list.some(f => re.test(`${f.file}${f.line ? `:${f.line}` : ''} ${f.problem} ${f.fix}`));

// ---------- parse ----------

test('parse: order, Now, waiting items, milestones, tasks and links', () => {
  const d = project({
    order: ['M12a', 'M12'], waiting: ['- [M12a] Where do finished milestones go? (proposed 2026-10-17)'],
    milestones: {
      'm12a-kit-workflow.md': '---\nid: M12a\ntitle: Kit workflow\nstatus: active\nchanges:\n  - roadmap-structure\n---\n\nRoadmap first.\n\n## Tasks\n\n- [x] T1 Roadmap format\n- [ ] T2 Skill\n',
      'm12-acme-proof.md': ms('M12', 'Acme proof', 'planned', ['- [ ] T1 Upgrade']),
    },
  });
  const p = parseRoadmap(kroot(d));
  assert.equal(p.exists, true);
  assert.deepEqual(p.order.map(o => o.id), ['M12a', 'M12']);
  assert.deepEqual(p.now, ['Building the roadmap format.']);
  assert.deepEqual(p.waiting.map(w => [w.milestone, w.question, w.date]), [['M12a', 'Where do finished milestones go?', '2026-10-17']]);
  const m = p.milestones.find(x => x.id === 'M12a');
  assert.equal(m.title, 'Kit workflow');
  assert.equal(m.goal, 'Roadmap first.');
  assert.deepEqual(m.links.changes, ['roadmap-structure']);
  assert.deepEqual(m.tasks.map(t => [t.n, t.done, t.text]), [[1, true, 'Roadmap format'], [2, false, 'Skill']]);
});

test('parse: no roadmap folder -> exists false', () => {
  const d = tmpDir('kit-roadmap-none-');
  assert.equal(parseRoadmap(path.join(d, 'knowledge')).exists, false);
});

// ---------- check: broken ----------

test('check: valid roadmap is in good condition', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 Do it']) } });
  const c = check(d);
  assert.equal(c.good, true);
  assert.match(formatCheck(c), /in good condition/);
});

test('check: missing status is broken, with the file and a fix (spec "Broken milestone")', () => {
  const d = project({ order: ['M13'], milestones: { 'm13-release-prep.md': '---\nid: M13\ntitle: Release prep\n---\n\nGoal.\n' } });
  const c = check(d);
  assert.ok(has(c.broken, /m13-release-prep\.md.*missing status/));
  assert.ok(c.broken.every(f => f.fix));
});

test('check: unknown status, duplicate ID, task shape, active without tasks', () => {
  const d = project({
    order: ['M1', 'M2', 'M3'],
    milestones: {
      'm1-a.md': ms('M1', 'A', 'doing'),
      'm2-b.md': ms('M2', 'B', 'planned', ['- [ ] fix the thing', '- [ ] T1 ok', '- [x] T1 dup']),
      'm2-copy.md': ms('M2', 'B copy', 'planned'),
      'm3-c.md': ms('M3', 'C', 'active'),
    },
  });
  const c = check(d);
  assert.ok(has(c.broken, /m1-a\.md.*unknown status "doing"/));
  assert.ok(has(c.broken, /duplicate ID M2/));
  assert.ok(has(c.broken, /m2-b\.md:\d+ .*task line/));
  assert.ok(has(c.broken, /m2-b\.md.*T1 used twice/));
  assert.ok(has(c.broken, /m3-c\.md.*active.*no tasks/));
});

test('check: order vs files, both directions', () => {
  const d = project({ order: ['M1', 'M9'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned'), 'm2-b.md': ms('M2', 'B', 'planned') } });
  const c = check(d);
  assert.ok(has(c.broken, /M9.*no milestone file/));
  assert.ok(has(c.broken, /m2-b\.md.*not in the order/));
});

test('check: waiting item in the wrong shape or naming an unknown milestone is broken', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') }, waiting: ['- should we?', '- [M7] Who? (proposed 2026-10-17)'] });
  const c = check(d);
  assert.ok(has(c.broken, /roadmap\.md:\d+ .*waiting item/));
  assert.ok(has(c.broken, /unknown milestone M7/));
});

// ---------- check: tidy-up ----------

test('check: long line, over 150 lines, Now over 5 lines (spec "Long row")', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') }, now: ['1', '2', '3', '4', '5', '6'], extra: 'x'.repeat(420) + '\n' + 'filler\n'.repeat(150) });
  const c = check(d);
  assert.equal(c.broken.length, 0);
  assert.ok(has(c.tidy, /roadmap\.md:\d+ .*420 characters.*300/));
  assert.ok(has(c.tidy, /roadmap\.md .*\d+ lines.*150/));
  assert.ok(has(c.tidy, /Now has 6 lines.*5/));
});

test('check: finished milestone still in milestones/ (spec "Finished milestone not moved")', () => {
  const d = project({ order: ['M11'], milestones: { 'm11-harness-review.md': ms('M11', 'Harness review', 'done', ['- [x] T1 Review']) } });
  assert.ok(has(check(d).tidy, /m11-harness-review\.md.*move.*done\//));
});

test('check never blocks: CLI exits 0 even with broken findings', () => {
  const d = project({ order: ['M13'], milestones: { 'm13-release-prep.md': '---\nid: M13\ntitle: Release prep\n---\n' } });
  const r = spawnSync(process.execPath, [SCRIPT, 'check', '--dir', d], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /BROKEN/);
  assert.match(r.stdout, /missing status/);
});

// ---------- stale Now and unplanned work (git) ----------

const env = date => ({ ...process.env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_DATE: date });
function gitProject(opts) {
  const d = project(opts);
  // Everything up to the merge or archive under test is dated 2026-10-14, the roadmap's last update.
  const g = (...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8', env: env('2026-10-14T10:00:00Z') });
  g('init', '-q', '-b', 'main');
  g('add', '.'); g('commit', '-qm', 'roadmap');
  return { d, g };
}

test('stale Now: an archive after the last roadmap update is reported; ordinary commits are not', () => {
  const { d } = gitProject({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  const run = (...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8', env: env(a.includes('archive') ? '2026-10-17T10:00:00Z' : '2026-10-15T10:00:00Z') });
  fs.writeFileSync(path.join(d, 'code.txt'), 'x'); run('add', '.'); run('commit', '-qm', 'ordinary');
  let f = gitFindings(d, parseRoadmap(kroot(d)));
  assert.equal(f.tidy.filter(x => /stale/i.test(x.problem)).length, 0, 'ordinary commits only');
  fs.mkdirSync(path.join(d, 'openspec/changes/archive/2026-10-17-gift-cards'), { recursive: true });
  fs.writeFileSync(path.join(d, 'openspec/changes/archive/2026-10-17-gift-cards/proposal.md'), '# P\n');
  run('add', '.'); run('commit', '-qm', 'archive');
  f = gitFindings(d, parseRoadmap(kroot(d)));
  assert.ok(has(f.tidy, /Now may be stale: roadmap last updated 2026-10-14, then change gift-cards was archived 2026-10-17/));
});

test('stale Now: a merge after the last roadmap update is reported', () => {
  const { d, g } = gitProject({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  g('checkout', '-qb', 'feature'); fs.writeFileSync(path.join(d, 'f.txt'), 'f'); g('add', '.'); g('commit', '-qm', 'feature');
  g('checkout', '-q', 'main'); fs.writeFileSync(path.join(d, 'm.txt'), 'm'); g('add', '.'); g('commit', '-qm', 'main work');
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'merge', '-q', '--no-ff', '-m', 'Merge feature', 'feature'], { cwd: d, env: env('2026-10-18T10:00:00Z') });
  assert.ok(has(gitFindings(d, parseRoadmap(kroot(d))).tidy, /Now may be stale.*merge/i));
});

test('unplanned work: active change with no milestone is listed; branches are not', () => {
  const { d, g } = gitProject({ order: ['M1'], milestones: { 'm1-a.md': '---\nid: M1\ntitle: A\nstatus: active\nchanges: [roadmap-structure]\n---\n\nG.\n\n- [ ] T1 x\n' } });
  for (const c of ['kanban-board', 'roadmap-structure']) fs.mkdirSync(path.join(d, 'openspec/changes', c), { recursive: true });
  g('branch', 'kit-status');
  const f = gitFindings(d, parseRoadmap(kroot(d)));
  assert.deepEqual(f.unplanned.map(u => u.change), ['kanban-board']);
  assert.match(f.unplanned[0].fix, /link .*milestone|drift entry/);
  assert.ok(!JSON.stringify(f).includes('kit-status'));
});

test('stale Now: git unavailable -> skipped with a note, never guessed', () => {
  const d = project({ order: [] });
  const f = gitFindings(d, parseRoadmap(kroot(d)));
  assert.equal(f.tidy.length, 0);
  // In plain words (spec "Roadmap not committed yet", L27).
  assert.deepEqual(f.notes, ["can't check whether Now is out of date until roadmap.md is committed"]);
});

// ---------- report ----------

const reportOf = d => reportRoadmap(parseRoadmap(kroot(d)));
const three = (order, statuses, waiting) => project({
  order, waiting,
  milestones: Object.fromEntries(order.map((id, i) => [`${id.toLowerCase()}-x.md`, ms(id, `Title ${id}`, statuses[i], ['- [ ] T1 a'])])),
});

test('report: row shows ID, title, status, tasks left and n of m done (spec "Report")', () => {
  const d = project({ order: ['M12'], milestones: { 'm12-acme-proof.md': ms('M12', 'Acme proof', 'planned',
    ['- [x] T1 Upgrade', '- [ ] T2 Feature', '- [ ] T3 Docs', '- [ ] T4 Verdict', '- [ ] T5 Browser limits']) } });
  const r = reportOf(d);
  assert.deepEqual(r.rows[0].left.map(t => t.n), [2, 3, 4, 5]);
  const out = formatReport(r);
  assert.match(out, /M12 · Acme proof · planned/);
  assert.match(out, /1 of 5 done/);
});

test('report: Blocking now = current and next milestone plus general; others counted Later (spec "Blocking now")', () => {
  const d = three(['M12a', 'M12', 'M13'], ['active', 'planned', 'planned'],
    ['- [M12a] A? (proposed 2026-10-17)', '- [M13] C? (proposed 2026-10-17)', '- [general] G? (proposed 2026-10-17)']);
  const r = reportOf(d);
  assert.equal(r.current, 'M12a');
  assert.deepEqual(r.blocking.map(w => w.question), ['A?', 'G?']);
  assert.deepEqual(r.later.map(w => w.question), ['C?']);
});

test('report: reorder moves a decision into Blocking now (spec "Reorder moves decisions")', () => {
  const d = three(['M12a', 'M13', 'M12'], ['active', 'planned', 'planned'], ['- [M13] C? (proposed 2026-10-17)']);
  assert.deepEqual(reportOf(d).blocking.map(w => w.question), ['C?']);
});

test('report: no active milestone -> first not-done one is current (spec "No active milestone")', () => {
  const d = three(['M11', 'M12', 'M13', 'M14'], ['done', 'planned', 'planned', 'planned'],
    ['- [M12] B? (proposed 2026-10-17)', '- [M14] D? (proposed 2026-10-17)']);
  const r = reportOf(d);
  assert.equal(r.current, 'M12');
  assert.deepEqual(r.blocking.map(w => w.question), ['B?']);
  assert.deepEqual(r.later.map(w => w.question), ['D?']);
});

test('report: a 40-day-old decision is listed with its date and not marked old', () => {
  const d = three(['M1', 'M2', 'M3'], ['active', 'planned', 'planned'], ['- [M3] Which database? (proposed 2026-09-07)']);
  const out = formatReport(reportOf(d));
  assert.match(out, /Later \(1\)/);
  assert.match(out, /Which database\? .*proposed 2026-09-07/);
  assert.doesNotMatch(out, /\bold\b|stale|overdue/i);
});

test('report: broken findings are listed at the top', () => {
  const d = project({ order: ['M13'], milestones: { 'm13-release-prep.md': '---\nid: M13\ntitle: Release prep\n---\n' } });
  const out = formatReport(reportOf(d));
  assert.ok(out.indexOf('BROKEN') < out.indexOf('M13 ·'));
});

// ---------- writes ----------

test('new: creates the roadmap from the templates; refuses when one exists', () => {
  const d = tmpDir('kit-roadmap-new-');
  const r = newRoadmap(kroot(d));
  for (const f of ['roadmap.md', 'drift-log.md']) assert.ok(fs.existsSync(path.join(d, 'knowledge/roadmaps', f)), f);
  for (const f of ['milestones', 'done']) assert.ok(fs.statSync(path.join(d, 'knowledge/roadmaps', f)).isDirectory(), f);
  assert.equal(r.broken.length, 0);
  assert.throws(() => newRoadmap(kroot(d)), /already exists/);
});

test('add: next free ID, planned, goal, file name, position in the order (spec "Milestone file shape")', () => {
  const d = project({ order: ['M11', 'M13'], milestones: { 'm11-a.md': ms('M11', 'A', 'planned'), 'm13-b.md': ms('M13', 'B', 'planned') } });
  const r = addMilestone(kroot(d), { title: 'Acme proof', goal: 'Prove the kit on a real project.', after: 'M11', notes: ['notes/a.md'] });
  assert.equal(r.id, 'M14');
  const file = path.join(d, 'knowledge/roadmaps/milestones/m14-acme-proof.md');
  const t = fs.readFileSync(file, 'utf8');
  assert.match(t, /^---\nid: M14\ntitle: Acme proof\nstatus: planned\nnotes:\n {2}- notes\/a\.md\n---/);
  assert.match(t, /Prove the kit on a real project\./);
  assert.deepEqual(parseRoadmap(kroot(d)).order.map(o => o.id), ['M11', 'M14', 'M13']);
});

test('add: an explicit ID already used is refused; IDs are never reused after a drop', () => {
  const d = project({ order: ['M1', 'M2'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned'), 'm2-b.md': ms('M2', 'B', 'planned') } });
  setStatus(kroot(d), { id: 'M2', to: 'dropped' });
  assert.throws(() => addMilestone(kroot(d), { title: 'X', id: 'M2' }), /M2 is already used/);
  assert.equal(addMilestone(kroot(d), { title: 'Next' }).id, 'M3');
});

test('status: done moves the file to done/ and keeps the ID in the order (spec "Finish a milestone"); reopening moves it back', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [x] T1 a']) } });
  setStatus(kroot(d), { id: 'M1', to: 'done' });
  assert.ok(fs.existsSync(path.join(d, 'knowledge/roadmaps/done/m1-a.md')));
  assert.ok(!fs.existsSync(path.join(d, 'knowledge/roadmaps/milestones/m1-a.md')));
  assert.deepEqual(parseRoadmap(kroot(d)).order.map(o => o.id), ['M1']);
  assert.equal(check(d).good, true);
  setStatus(kroot(d), { id: 'M1', to: 'active' });
  assert.ok(fs.existsSync(path.join(d, 'knowledge/roadmaps/milestones/m1-a.md')));
  assert.throws(() => setStatus(kroot(d), { id: 'M1', to: 'doing' }), /status must be one of/);
});

test('task and tick: adds T<n> lines and ticks one; unknown task refused', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  assert.equal(addTask(kroot(d), { id: 'M1', text: 'First' }).task, 1);
  assert.equal(addTask(kroot(d), { id: 'M1', text: 'Second' }).task, 2);
  tick(kroot(d), { id: 'M1', task: 'T2' });
  const m = parseRoadmap(kroot(d)).milestones[0];
  assert.deepEqual(m.tasks.map(t => [t.n, t.done]), [[1, false], [2, true]]);
  assert.throws(() => tick(kroot(d), { id: 'M1', task: 'T9' }), /no task T9/);
});

test('order: only reorders; adding or removing IDs is refused (spec "Reorder keeps IDs")', () => {
  const d = project({ order: ['M12', 'M13'], milestones: { 'm12-a.md': ms('M12', 'A', 'planned'), 'm13-b.md': ms('M13', 'B', 'planned') } });
  const before = fs.readdirSync(path.join(d, 'knowledge/roadmaps/milestones')).sort();
  setOrder(kroot(d), { ids: ['M13', 'M12'] });
  assert.deepEqual(parseRoadmap(kroot(d)).order.map(o => o.id), ['M13', 'M12']);
  assert.deepEqual(fs.readdirSync(path.join(d, 'knowledge/roadmaps/milestones')).sort(), before);
  assert.throws(() => setOrder(kroot(d), { ids: ['M13'] }), /same IDs/);
});

test('now: replaces the Now lines; the rest of roadmap.md is untouched', () => {
  const d = project({ order: [], extra: 'My own paragraph.' });
  setNow(kroot(d), { text: 'Line one\nLine two' });
  const t = fs.readFileSync(path.join(d, 'knowledge/roadmaps/roadmap.md'), 'utf8');
  assert.deepEqual(parseRoadmap(kroot(d)).now, ['Line one', 'Line two']);
  assert.match(t, /My own paragraph\./);
  assert.match(t, /## North star\n\nShip v1\./);
});

test('wait: an answered decision leaves roadmap.md and is recorded in the drift log (spec "Decision answered")', () => {
  const d = project({ order: ['M12a'], milestones: { 'm12a-a.md': ms('M12a', 'A', 'active', ['- [ ] T1 a']) } });
  addWaiting(kroot(d), { milestone: 'M12a', question: 'Where do finished milestones go?', date: '2026-10-17' });
  assert.equal(parseRoadmap(kroot(d)).waiting.length, 1);
  resolveWaiting(kroot(d), { match: 'finished milestones', answer: 'done/', by: 'user', date: '2026-10-18' });
  const p = parseRoadmap(kroot(d));
  assert.equal(p.waiting.length, 0);
  assert.match(p.drift.at(-1).raw, /2026-10-18.*Where do finished milestones go\?.*done\/.*user/);
  assert.throws(() => resolveWaiting(kroot(d), { match: 'nothing like this', answer: 'x' }), /no waiting item/);
});

// A line of the user's own text under ## Order, above the IDs.
function withOrderNote(d, note) {
  const f = path.join(d, 'knowledge/roadmaps/roadmap.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('## Order\n\n', `## Order\n\n${note}\n`));
  return f;
}

test('add: a line of the user\'s text under Order survives (spec "A note under Order survives an add")', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  const f = withOrderNote(d, 'This order is my priority list');
  addMilestone(kroot(d), { title: 'Beta' });
  const t = fs.readFileSync(f, 'utf8');
  assert.match(t, /## Order\n\nThis order is my priority list\n- M1\n- M2\n/);
  assert.doesNotMatch(t, /- null/);
  assert.deepEqual(parseRoadmap(kroot(d)).order.filter(o => o.id).map(o => o.id), ['M1', 'M2']);
});

test('order: a line of the user\'s text under Order survives a reorder (spec "A note under Order survives a reorder")', () => {
  const d = project({ order: ['M1', 'M2'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned'), 'm2-b.md': ms('M2', 'B', 'planned') } });
  const f = withOrderNote(d, 'Keep this note');
  setOrder(kroot(d), { ids: ['M2', 'M1'] });
  const t = fs.readFileSync(f, 'utf8');
  assert.match(t, /## Order\n\nKeep this note\n- M2\n- M1\n/);
  assert.doesNotMatch(t, /- null/);
});

test('answer: without an answer it fails and changes no file (spec "Answer without an answer")', () => {
  const d = project({ order: [] });
  addWaiting(kroot(d), { milestone: 'general', question: 'Pick a database engine', date: '2026-10-19' });
  const main = path.join(d, 'knowledge/roadmaps/roadmap.md');
  const log = path.join(d, 'knowledge/roadmaps/drift-log.md');
  const before = [fs.readFileSync(main, 'utf8'), fs.readFileSync(log, 'utf8')];
  for (const answer of [undefined, '', '   ']) {
    assert.throws(() => resolveWaiting(kroot(d), { match: 'database', answer }), /--answer/);
  }
  assert.deepEqual([fs.readFileSync(main, 'utf8'), fs.readFileSync(log, 'utf8')], before);
});

test('check: text under Order is told to move out, not to become an ID (spec "Text under Order", L23)', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  withOrderNote(d, 'This order is my priority list');
  const f = check(d).broken.find(x => /This order is my priority list/.test(x.problem));
  assert.ok(f, 'the line is reported under broken');
  assert.match(f.fix, /move this text out of ## Order/);
  assert.doesNotMatch(f.fix, /write it as/);
  // A bullet with a bad ID keeps the shape fix.
  const d2 = project({ order: ['M1', '1bad'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  assert.match(check(d2).broken.find(x => /1bad/.test(x.problem)).fix, /write it as "- <ID>"/);
});

// ---------- drop or edit a task (kit-debt-fixes, L18) ----------

const m12 = () => project({ order: ['M12'], milestones: { 'm12-proof.md': ms('M12', 'Proof', 'active', ['- [x] T1 Upgrade', '- [ ] T2 One feature', '- [ ] T4 Old verdict']) } });
const m12file = d => path.join(d, 'knowledge/roadmaps/milestones/m12-proof.md');

test('drop-task: the line keeps its number and reason; not left, not done (spec "Drop a task")', () => {
  const d = m12();
  dropTask(kroot(d), { id: 'M12', task: 'T4', reason: 'replaced by test A', date: '2026-10-19' });
  assert.match(fs.readFileSync(m12file(d), 'utf8'), /^- \[-\] T4 Old verdict \(dropped 2026-10-19: replaced by test A\)$/m);
  const row = reportRoadmap(parseRoadmap(kroot(d))).rows.find(r => r.id === 'M12');
  assert.deepEqual(row.left.map(t => t.n), [2]);
  assert.equal(row.done, 1);
  assert.equal(row.total, 2);
  assert.equal(check(d).broken.length, 0);
  assert.throws(() => dropTask(kroot(d), { id: 'M12', task: 'T2', reason: '' }), /--reason/);
});

test('tick: a dropped task fails and the file is unchanged (spec "Tick a dropped task")', () => {
  const d = m12();
  dropTask(kroot(d), { id: 'M12', task: 'T4', reason: 'gone', date: '2026-10-19' });
  const before = fs.readFileSync(m12file(d), 'utf8');
  assert.throws(() => tick(kroot(d), { id: 'M12', task: 'T4' }), /T4 is dropped/);
  assert.equal(fs.readFileSync(m12file(d), 'utf8'), before);
});

test('edit-task: new text, same number and state (spec "Edit a task\'s text")', () => {
  const d = project({ order: ['M15'], milestones: { 'm15-a.md': ms('M15', 'A', 'active', ['- [x] T1 T1 PRD for the kit', '- [ ] T2 Next']) } });
  editTask(kroot(d), { id: 'M15', task: 'T1', text: 'PRD for the kit' });
  const t = fs.readFileSync(path.join(d, 'knowledge/roadmaps/milestones/m15-a.md'), 'utf8');
  assert.match(t, /^- \[x\] T1 PRD for the kit$/m);
  assert.match(t, /^- \[ \] T2 Next$/m);
});

test('task and edit-task: text starting with the task\'s own number is refused; other T-words are kept (spec "Task text with a number", C4)', () => {
  const d = m12();
  const before = fs.readFileSync(m12file(d), 'utf8');
  assert.throws(() => addTask(kroot(d), { id: 'M12', text: 'T5 Docs' }), /without the task number/);
  assert.throws(() => editTask(kroot(d), { id: 'M12', task: 'T2', text: 't2 Docs' }), /without the task number/);
  assert.equal(fs.readFileSync(m12file(d), 'utf8'), before);
  addTask(kroot(d), { id: 'M12', text: 'T3 stack spike' });
  editTask(kroot(d), { id: 'M12', task: 'T2', text: 't2.micro instance sizing' });
  const t = fs.readFileSync(m12file(d), 'utf8');
  assert.match(t, /^- \[ \] T5 T3 stack spike$/m);
  assert.match(t, /^- \[ \] T2 t2\.micro instance sizing$/m);
});

test('tick --undo reopens a dropped task and removes its drop note (C3)', () => {
  const d = m12();
  dropTask(kroot(d), { id: 'M12', task: 'T4', reason: 'by mistake', date: '2026-10-19' });
  tick(kroot(d), { id: 'M12', task: 'T4', undo: true });
  assert.match(fs.readFileSync(m12file(d), 'utf8'), /^- \[ \] T4 Old verdict$/m);
  assert.deepEqual(reportRoadmap(parseRoadmap(kroot(d))).rows[0].left.map(t => t.n), [2, 4]);
});

test('check: an active milestone whose every task is dropped is a tidy-up, not stuck (C2)', () => {
  const d = project({ order: ['M5'], milestones: { 'm5-a.md': ms('M5', 'A', 'active', ['- [-] T1 a (dropped 2026-10-19: x)', '- [-] T2 b (dropped 2026-10-19: y)']) } });
  const c = check(d);
  assert.equal(c.broken.length, 0);
  assert.ok(has(c.tidy, /every task is dropped/));
  assert.equal(reportRoadmap(parseRoadmap(kroot(d))).rows[0].dropped, 2);
});

test('check: a dropped task line without its date and reason is in the wrong shape (V1)', () => {
  const d = project({ order: ['M5'], milestones: { 'm5-a.md': ms('M5', 'A', 'active', ['- [ ] T1 a', '- [-] T2 typed by hand']) } });
  const f = check(d).broken.find(x => /T2/.test(x.problem));
  assert.ok(f, 'reported under broken');
  assert.match(f.fix, /dropped <YYYY-MM-DD>: <reason>/);
  assert.equal(check(project({ order: ['M5'], milestones: { 'm5-a.md': ms('M5', 'A', 'active', ['- [ ] T1 a', '- [-] T2 b (dropped 2026-10-19: why)']) } })).broken.length, 0);
});

test('an unknown command lists drop-task and edit-task (C5)', () => {
  const r = spawnSync(process.execPath, [SCRIPT, 'drop-tasks', '--dir', tmpDir('kit-roadmap-cmd-')], { encoding: 'utf8' });
  assert.match(r.stderr, /drop-task/);
  assert.match(r.stderr, /edit-task/);
});

test('drift: rows are appended; earlier rows never change; pipes are escaped', () => {
  const d = project({ order: [] });
  addDrift(kroot(d), { date: '2026-10-17', what: 'A | B', why: 'why', alt: 'alt', impact: 'impact', by: 'user' });
  const first = parseRoadmap(kroot(d)).drift[0].raw;
  addDrift(kroot(d), { date: '2026-10-18', what: 'C', why: 'w', alt: '-', impact: '-', by: 'user' });
  const p = parseRoadmap(kroot(d));
  assert.equal(p.drift.length, 2);
  assert.equal(p.drift[0].raw, first);
  assert.match(first, /A \\\| B/);
});

test('link: adds notes, prd, changes or branches without duplicates', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  link(kroot(d), { id: 'M1', kind: 'changes', value: 'roadmap-structure' });
  link(kroot(d), { id: 'M1', kind: 'changes', value: 'roadmap-structure' });
  link(kroot(d), { id: 'M1', kind: 'prd', value: 'prds/roadmap-structure.md' });
  const m = parseRoadmap(kroot(d)).milestones[0];
  assert.deepEqual(m.links.changes, ['roadmap-structure']);
  assert.deepEqual(m.links.prd, ['prds/roadmap-structure.md']);
  assert.throws(() => link(kroot(d), { id: 'M1', kind: 'tickets', value: 'x' }), /kind must be one of/);
});

test('every write returns the broken findings of the check after it', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  const r = setStatus(kroot(d), { id: 'M1', to: 'active' });
  assert.ok(has(r.broken, /active.*no tasks/));
});

// ---------- CLI ----------

test('CLI: report and --json; error: on bad input with exit 1', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 a']) } });
  const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a, '--dir', d], { encoding: 'utf8' });
  assert.match(run('report').stdout, /M1 · A · active/);
  assert.equal(JSON.parse(run('check', '--json').stdout).good, true);
  const bad = run('status', '--id', 'M1', '--to', 'doing');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /^error: status must be one of/);
  const none = spawnSync(process.execPath, [SCRIPT, 'check', '--dir', tmpDir('kit-roadmap-empty-')], { encoding: 'utf8' });
  assert.equal(none.status, 0);
  assert.match(none.stdout, /No roadmap here/);
});

// ---------- verify findings C1-C10 (code review 2026-10-17) ----------

test('C1: finishing into an existing done/ file changes nothing', () => {
  const d = project({ order: ['M3'], milestones: { 'm3-foo.md': ms('M3', 'Foo', 'active', ['- [x] T1 a']) }, done: { 'm3-foo.md': ms('M3', 'Foo old', 'done') } });
  const before = fs.readFileSync(path.join(d, 'knowledge/roadmaps/milestones/m3-foo.md'), 'utf8');
  assert.throws(() => setStatus(kroot(d), { id: 'M3', to: 'done' }), /already exists/);
  assert.equal(fs.readFileSync(path.join(d, 'knowledge/roadmaps/milestones/m3-foo.md'), 'utf8'), before);
});

test('C2: a bad --after anchor writes no file and uses up no ID', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  assert.throws(() => addMilestone(kroot(d), { title: 'X', after: 'M99' }), /M99 is not in the order/);
  assert.deepEqual(fs.readdirSync(path.join(d, 'knowledge/roadmaps/milestones')), ['m1-a.md']);
  assert.equal(addMilestone(kroot(d), { title: 'Y' }).id, 'M2');
});

test('C3: an ID used in another case, or an existing file, is never overwritten', () => {
  const d = project({ order: ['M5'], milestones: { 'm5-docs.md': ms('M5', 'Docs', 'planned', ['- [ ] T1 keep me']) } });
  assert.throws(() => addMilestone(kroot(d), { title: 'Docs', id: 'm5' }), /already used/);
  assert.match(fs.readFileSync(path.join(d, 'knowledge/roadmaps/milestones/m5-docs.md'), 'utf8'), /keep me/);
});

test('C4: the merge that brings in the roadmap update is not "stale"', () => {
  const { d, g } = gitProject({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  g('checkout', '-qb', 'feature');
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'x', '--allow-empty'], { cwd: d, env: env('2026-10-15T10:00:00Z') });
  setNow(kroot(d), { text: 'Updated on the branch.' });
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'roadmap now'], { cwd: d, env: env('2026-10-16T10:00:00Z') });
  g('checkout', '-q', 'main'); fs.writeFileSync(path.join(d, 'm.txt'), 'm'); g('add', '.'); g('commit', '-qm', 'main work');
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'merge', '-q', '--no-ff', '-m', 'Merge feature', 'feature'], { cwd: d, env: env('2026-10-18T10:00:00Z') });
  assert.equal(gitFindings(d, parseRoadmap(kroot(d))).tidy.length, 0);
});

test('L13: one batched check keeps each merge apart (roadmap merge quiet, later plain merge reported)', () => {
  const { d, g } = gitProject({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  const at = (date, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, env: env(date) });
  g('checkout', '-qb', 'feature');
  setNow(kroot(d), { text: 'Updated on the branch.' });
  at('2026-10-16T10:00:00Z', 'commit', '-qam', 'roadmap now');
  g('checkout', '-q', 'main'); fs.writeFileSync(path.join(d, 'm.txt'), 'm'); g('add', '.'); g('commit', '-qm', 'main work');
  at('2026-10-18T10:00:00Z', 'merge', '-q', '--no-ff', '-m', 'Merge feature', 'feature');
  g('checkout', '-qb', 'other'); fs.writeFileSync(path.join(d, 'o.txt'), 'o'); g('add', '.'); at('2026-10-19T09:00:00Z', 'commit', '-qm', 'other work');
  g('checkout', '-q', 'main');
  at('2026-10-19T10:00:00Z', 'merge', '-q', '--no-ff', '-m', 'Merge other', 'other');
  const stale = gitFindings(d, parseRoadmap(kroot(d))).tidy.filter(x => /merge/i.test(x.problem));
  assert.deepEqual(stale.map(x => /merge "([^"]+)"/.exec(x.problem)?.[1]), ['Merge other']);
});

test('C5: editing an old archived change is not a new archive', () => {
  const { d, g } = gitProject({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  const old = path.join(d, 'openspec/changes/archive/2026-09-01-old');
  fs.mkdirSync(old, { recursive: true }); fs.writeFileSync(path.join(old, 'proposal.md'), '# P\n');
  g('add', '.'); g('commit', '-qm', 'old archive');
  setNow(kroot(d), { text: 'Fresh.' }); g('commit', '-qam', 'roadmap');
  fs.writeFileSync(path.join(old, 'proposal.md'), '# P typo fixed\n');
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qam', 'typo'], { cwd: d, env: env('2026-10-20T10:00:00Z') });
  assert.equal(gitFindings(d, parseRoadmap(kroot(d))).tidy.length, 0);
});

test('C6: now without text is refused and Now stays', () => {
  const d = project({ order: [] });
  assert.throws(() => setNow(kroot(d), { text: '' }), /--text/);
  assert.deepEqual(parseRoadmap(kroot(d)).now, ['Building the roadmap format.']);
  const r = spawnSync(process.execPath, [SCRIPT, 'now', '--dir', d], { encoding: 'utf8' });
  assert.equal(r.status, 1);
});

test("C7: a goal with $& or $' is written literally", () => {
  const d = project({ order: [] });
  const { file } = addMilestone(kroot(d), { title: 'Pricing', goal: "Charge $' per seat and $& more" });
  assert.match(fs.readFileSync(path.join(d, 'knowledge', file), 'utf8'), /Charge \$' per seat and \$& more/);
});

test('C8: link trims before checking for duplicates', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'planned') } });
  link(kroot(d), { id: 'M1', kind: 'changes', value: ' foo' });
  link(kroot(d), { id: 'M1', kind: 'changes', value: ' foo' });
  assert.deepEqual(parseRoadmap(kroot(d)).milestones[0].links.changes, ['foo']);
});

// loose-ends 3.3 (spec roadmap "Roadmap report": loose ends pointer)
test('report: ends with a loose ends pointer when there are open ones; none otherwise', async () => {
  const { add, important } = await import('../../plugins/kit/scripts/loose-ends.mjs');
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  const report = () => spawnSync(process.execPath, [SCRIPT, 'report', '--dir', d], { encoding: 'utf8' }).stdout.trimEnd();
  assert.doesNotMatch(report(), /Loose ends/);
  for (let n = 1; n <= 7; n++) add(d, { text: `t${n}`, kind: 'idea', origin: 'chat' });
  important(d, { id: 'L1', on: true }); important(d, { id: 'L2', on: true });
  assert.match(report(), /\nLoose ends: 7 open \(2 important\): \/kit:loose-ends$/);
});

test('loose-ends verify C2: the report says when loose-ends.md is unreadable', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': ms('M1', 'A', 'active', ['- [ ] T1 x']) } });
  fs.writeFileSync(path.join(d, 'knowledge', 'loose-ends.md'), '# Loose ends\n\n<!-- kit-loose-ends-data {broken -->\n');
  const out = spawnSync(process.execPath, [SCRIPT, 'report', '--dir', d], { encoding: 'utf8' }).stdout;
  assert.match(out, /Loose ends: loose-ends.md can't be read .*fix it from git/);
});
