// Tracks and checkpoints (change roadmap-tracks-checkpoint): tick date, milestone edit, checkpoints, decide, resume.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';
import {
  parseRoadmap, checkRoadmap, reportRoadmap, formatReport, formatTracks, setStatus, tick, editTask,
  editMilestone, setCheckpoint, setResume, decide, archivedNames,
} from '../../plugins/kit/scripts/roadmap.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/kit/scripts/roadmap.mjs', import.meta.url));

function project({ order = [], milestones = {}, done = {} } = {}) {
  const d = tmpDir('kit-tracks-');
  const r = path.join(d, 'knowledge', 'roadmaps');
  fs.mkdirSync(path.join(r, 'milestones'), { recursive: true });
  fs.mkdirSync(path.join(r, 'done'), { recursive: true });
  fs.writeFileSync(path.join(r, 'roadmap.md'), ['# Roadmap', '', '## North star', '', 'Ship v1.', '', '## Principles', '', '- The user decides.', '', '## Order', '',
    ...order.map(id => `- ${id}`), '', '## Now', '', 'Building.', '', '## Waiting on you', '', ''].join('\n'));
  fs.writeFileSync(path.join(r, 'drift-log.md'), '# Drift log\n\n| Date | What changed | Why | On-plan alternative | Impact | Decided by |\n|---|---|---|---|---|---|\n');
  for (const [f, t] of Object.entries(milestones)) fs.writeFileSync(path.join(r, 'milestones', f), t);
  for (const [f, t] of Object.entries(done)) fs.writeFileSync(path.join(r, 'done', f), t);
  return d;
}
// A milestone with an optional checkpoint, change links and Notes lines.
const msx = (id, title, status, tasks = [], { checkpoint, changes, notes } = {}) =>
  `---\nid: ${id}\ntitle: ${title}\nstatus: ${status}\n${checkpoint ? `checkpoint: ${checkpoint}\n` : ''}${changes ? `changes:\n${changes.map(c => `  - ${c}`).join('\n')}\n` : ''}---\n\nA goal.\n\n## Tasks\n\n${tasks.join('\n')}\n${notes ? `\n## Notes\n\n${notes.join('\n')}\n` : ''}`;
const kroot = d => path.join(d, 'knowledge');
const check = d => checkRoadmap(parseRoadmap(kroot(d)));
const has = (list, re) => list.some(f => re.test(`${f.file} ${f.problem} ${f.fix}`));
const readR = (d, f) => fs.readFileSync(path.join(d, 'knowledge', 'roadmaps', f), 'utf8');
const driftRows = d => readR(d, 'drift-log.md').split('\n').filter(l => /^\| \d{4}/.test(l));
const cli = (d, ...a) => spawnSync(process.execPath, [SCRIPT, ...a, '--dir', d], { encoding: 'utf8' });
// Every roadmap file, to show a refused write changed nothing.
function snapshot(d) {
  const out = {};
  const walk = dir => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p); else out[p] = fs.readFileSync(p, 'utf8'); } };
  walk(path.join(d, 'knowledge', 'roadmaps'));
  return out;
}
// Feature A (M4, active, checkpoint after T3) and Feature B v1 (M1, paused part-way), with B v2 planned.
const two = (extra = {}) => project({
  order: ['M1', 'M2', 'M4'],
  milestones: {
    'm1-feature-b.md': msx('M1', 'Feature B v1', 'paused', ['- [x] T1 Import', '- [x] T2 Data import', '- [ ] T3 Scoring']),
    'm2-feature-b-v2.md': msx('M2', 'Feature B v2', 'planned', ['- [ ] T1 Later']),
    'm4-board.md': msx('M4', 'Board', 'active', ['- [x] T1 Model', '- [x] T2 Editor', '- [ ] T3 List view', '- [ ] T4 Save to the API', '- [ ] T5 Share'],
      { checkpoint: 'T3', changes: ['a-editor'], ...extra }),
  },
});

// ---------- tick date ----------

test('tick date: tick writes (done <date>), the text stays clean, untick removes it', () => {
  const d = two();
  tick(kroot(d), { id: 'M4', task: 'T3', date: '2026-11-20' });
  assert.match(readR(d, 'milestones/m4-board.md'), /^- \[x\] T3 List view \(done 2026-11-20\)$/m);
  const t = parseRoadmap(kroot(d)).milestones.find(m => m.id === 'M4').tasks.find(x => x.n === 3);
  assert.deepEqual([t.text, t.doneDate, t.done], ['List view', '2026-11-20', true]);
  tick(kroot(d), { id: 'M4', task: 'T3', undo: true });
  assert.match(readR(d, 'milestones/m4-board.md'), /^- \[ \] T3 List view$/m);
});

test('tick date: last done is by date, not number; undated tasks fall back to the highest number', () => {
  const d = project({ order: ['M4', 'M1'], milestones: {
    'm4-a.md': msx('M4', 'Feature A', 'active', ['- [x] T3 List view (done 2026-11-20)', '- [x] T5 Share (done 2026-11-10)', '- [x] T6 Old', '- [ ] T7 Next']),
    'm1-b.md': msx('M1', 'Feature B v1', 'paused', ['- [x] T1 Import', '- [x] T2 Data import', '- [ ] T3 Scoring']),
  } });
  const r = reportRoadmap(parseRoadmap(kroot(d)));
  assert.deepEqual(r.tracks.map(t => [t.id, t.last.n, t.next.n]), [['M4', 3, 7], ['M1', 2, 3]]);
  assert.equal(check(d).good, true, 'undated done tasks need no finding');
});

test('tick date: edit-task keeps the date of a done task', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [x] T1 Old text (done 2026-11-01)']) } });
  editTask(kroot(d), { id: 'M1', task: 'T1', text: 'New text' });
  assert.match(readR(d, 'milestones/m1-a.md'), /^- \[x\] T1 New text \(done 2026-11-01\)$/m);
});

// ---------- edit a milestone ----------

test('edit: rename keeps the ID, file name, tasks and links, and logs the old title', () => {
  const d = two();
  const before = readR(d, 'milestones/m4-board.md');
  const r = editMilestone(kroot(d), { id: 'M4', title: 'Feature A', date: '2026-11-17' });
  assert.equal(r.renamed, true);
  const m = parseRoadmap(kroot(d)).milestones.find(x => x.id === 'M4');
  assert.deepEqual([m.id, m.title, m.file, m.tasks.length, m.links.changes, m.checkpoint.raw], ['M4', 'Feature A', 'milestones/m4-board.md', 5, ['a-editor'], 'T3']);
  assert.equal(readR(d, 'milestones/m4-board.md'), before.replace('title: Board', 'title: Feature A'));
  assert.match(driftRows(d).at(-1), /M4 renamed: Board -> Feature A/);
});

test('edit: goal only replaces the goal line, keeps the title and adds no drift entry', () => {
  const d = two();
  editMilestone(kroot(d), { id: 'M4', goal: 'Plan and share boards.' });
  const m = parseRoadmap(kroot(d)).milestones.find(x => x.id === 'M4');
  assert.deepEqual([m.goal, m.title], ['Plan and share boards.', 'Board']);
  assert.equal(driftRows(d).length, 0);
});

test('edit: nothing to edit, or an empty value, fails and writes nothing', () => {
  const d = two();
  const snap = snapshot(d);
  assert.throws(() => editMilestone(kroot(d), { id: 'M4' }), /--title, --goal/);
  assert.throws(() => editMilestone(kroot(d), { id: 'M4', title: '  ' }), /--title is empty/);
  assert.throws(() => editMilestone(kroot(d), { id: 'M4', goal: '' }), /--goal is empty/);
  assert.deepEqual(snapshot(d), snap);
});

// ---------- checkpoints ----------

test('checkpoint: after a task, after an archive, clear; the report shows it on the row', () => {
  const d = two({ checkpoint: undefined });
  setCheckpoint(kroot(d), { id: 'M4', after: 'T3' });
  assert.equal(parseRoadmap(kroot(d)).milestones.find(x => x.id === 'M4').checkpoint.raw, 'T3');
  assert.match(formatReport(reportRoadmap(parseRoadmap(kroot(d)))), /M4 · Board · active · 2 of 5 done · checkpoint after T3/);
  setCheckpoint(kroot(d), { id: 'M4', archive: 'a-editor' });
  assert.match(readR(d, 'milestones/m4-board.md'), /^checkpoint: archive a-editor$/m);
  setCheckpoint(kroot(d), { id: 'M4', clear: true });
  assert.doesNotMatch(readR(d, 'milestones/m4-board.md'), /checkpoint/);
  assert.equal(check(d).good, true);
});

test('checkpoint: an unknown or dropped task, or a finished milestone, is refused and nothing changes', () => {
  const d = project({ order: ['M3', 'M4'], milestones: {
    'm4-a.md': msx('M4', 'A', 'active', ['- [ ] T1 One', '- [-] T2 Two (dropped 2026-11-01: not needed)']),
  }, done: { 'm3-c.md': msx('M3', 'C', 'done', ['- [x] T1 One']) } });
  const snap = snapshot(d);
  assert.throws(() => setCheckpoint(kroot(d), { id: 'M4', after: 'T9' }), /no task T9/);
  assert.throws(() => setCheckpoint(kroot(d), { id: 'M4', after: 'T2' }), /T2 is dropped/);
  assert.throws(() => setCheckpoint(kroot(d), { id: 'M3', after: 'T1' }), /M3 is done/);
  assert.throws(() => setCheckpoint(kroot(d), { id: 'M4' }), /exactly one/);
  assert.deepEqual(snapshot(d), snap);
});

test('checkpoint: set after a task that is already done is reached at once', () => {
  const d = two({ checkpoint: undefined });
  assert.equal(setCheckpoint(kroot(d), { id: 'M4', after: 'T2' }).reached, true);
  assert.deepEqual(reportRoadmap(parseRoadmap(kroot(d))).checkpoints.map(c => c.id), ['M4']);
});

test('checkpoint: the check reports a malformed field or a missing task under broken', () => {
  const bad = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [ ] T1 One'], { checkpoint: 'soon' }) } });
  assert.ok(has(check(bad).broken, /checkpoint "soon" in the wrong shape/));
  const gone = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [ ] T1 One'], { checkpoint: 'T7' }) } });
  assert.ok(has(check(gone).broken, /checkpoint after T7, which this milestone doesn't have/));
});

test('checkpoint reached: the tick says so and shows both tracks with last and next task text; statuses stay', () => {
  const d = two();
  const r = tick(kroot(d), { id: 'M4', task: 'T3', date: '2026-11-20' });
  assert.deepEqual(r.checkpoint, { id: 'M4', after: 'T3', reached: true });
  const view = r.tracks.map(t => [t.id, t.status, `T${t.last.n} ${t.last.text}`, `T${t.next.n} ${t.next.text}`]);
  assert.deepEqual(view, [['M1', 'paused', 'T2 Data import', 'T3 Scoring'], ['M4', 'active', 'T3 List view', 'T4 Save to the API']]);
  const out = cli(d, 'report').stdout;
  assert.match(out, /Tracks\n/);
  assert.match(out, /last done: T3 List view/);
  assert.match(out, /Checkpoint reached: M4 Board after T3\. Continue or switch\? \(\/kit:roadmap\)/);
  // Untick: no longer reached.
  tick(kroot(d), { id: 'M4', task: 'T3', undo: true });
  assert.equal(reportRoadmap(parseRoadmap(kroot(d))).checkpoints.length, 0);
});

test('checkpoint reached: the tick output on the CLI shows the question and the tracks', () => {
  const d = two();
  const r = cli(d, 'tick', '--id', 'M4', '--task', 'T3');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Checkpoint reached on M4 \(after T3\)\. Continue or switch\?/);
  assert.match(r.stdout, /M1 · Feature B v1 · paused[\s\S]*last done: T2 Data import[\s\S]*next: +T3 Scoring/);
});

test('checkpoint reached: an archive reaches it, and the check says so without blocking', () => {
  const d = two({ checkpoint: 'archive a-editor' });
  assert.equal(archivedNames(d).size, 0);
  assert.doesNotMatch(cli(d, 'check').stdout, /Checkpoint reached/);
  fs.mkdirSync(path.join(d, 'openspec/changes/archive/2026-11-20-a-editor'), { recursive: true });
  const r = cli(d, 'check');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Checkpoint reached: M4 Board after the archive of a-editor/);
});

test('checkpoint reached: with no other track, the next planned milestone is the other choice', () => {
  const d = project({ order: ['M4', 'M5'], milestones: {
    'm4-a.md': msx('M4', 'Feature A', 'active', ['- [x] T1 One', '- [ ] T2 Two'], { checkpoint: 'T1' }),
    'm5-b.md': msx('M5', 'Feature C', 'planned', ['- [ ] T1 One']),
  } });
  const r = reportRoadmap(parseRoadmap(kroot(d)));
  assert.deepEqual([r.tracks.length, r.alternative.id], [1, 'M5']);
  assert.match(formatTracks(r.tracks, r.alternative).join('\n'), /Other choice: M5 · Feature C · planned/);
});

test('more than two active milestones: one tidy-up line, and starting a third still works', () => {
  const d = project({ order: ['M1', 'M4', 'M5'], milestones: {
    'm1-a.md': msx('M1', 'A', 'active', ['- [ ] T1 One']), 'm4-b.md': msx('M4', 'B', 'active', ['- [ ] T1 One']), 'm5-c.md': msx('M5', 'C', 'planned', ['- [ ] T1 One']),
  } });
  assert.equal(check(d).tidy.length, 0);
  setStatus(kroot(d), { id: 'M5', to: 'active' });
  const lines = check(d).tidy.filter(f => /milestones are active/.test(f.problem));
  assert.equal(lines.length, 1);
  assert.match(lines[0].problem, /3 milestones are active \(M1, M4, M5\)/);
});

// ---------- decide and resume ----------

test('decide: continue logs the answer, clears the checkpoint and keeps both statuses', () => {
  const d = two();
  tick(kroot(d), { id: 'M4', task: 'T3' });
  decide(kroot(d), { id: 'M4', cont: true, why: 'almost there', date: '2026-11-20' });
  const p = parseRoadmap(kroot(d));
  assert.deepEqual(p.milestones.map(m => [m.id, m.status, m.checkpoint]).sort(), [['M1', 'paused', null], ['M2', 'planned', null], ['M4', 'active', null]]);
  assert.match(driftRows(d).at(-1), /\| 2026-11-20 \| Checkpoint M4 after T3: continued M4 \| almost there \|/);
});

test('decide: switch pauses one, starts the other, saves the resume note and logs it', () => {
  const d = two();
  tick(kroot(d), { id: 'M4', task: 'T3' });
  decide(kroot(d), { id: 'M4', switchTo: 'M1', why: 'B is blocking a demo', resume: 'stopped after T3 List view; next T4 Save to the API; open change a-api' });
  const by = id => parseRoadmap(kroot(d)).milestones.find(m => m.id === id);
  assert.deepEqual([by('M4').status, by('M1').status, by('M4').checkpoint], ['paused', 'active', null]);
  assert.equal(by('M4').resume, 'stopped after T3 List view; next T4 Save to the API; open change a-api');
  assert.match(driftRows(d).at(-1), /Checkpoint M4 after T3: switched to M1 \| B is blocking a demo/);
});

test('decide: not reached, a finished or the same milestone, or a resume note on continue is refused; nothing changes', () => {
  const d = two();
  const snap = snapshot(d);
  assert.throws(() => decide(kroot(d), { id: 'M4', cont: true, why: 'x' }), /isn't reached yet/);
  assert.deepEqual(snapshot(d), snap);
  tick(kroot(d), { id: 'M4', task: 'T3' });
  setStatus(kroot(d), { id: 'M2', to: 'done' });
  const snap2 = snapshot(d);
  assert.throws(() => decide(kroot(d), { id: 'M4', switchTo: 'M2', why: 'x' }), /M2 is done; set its status first/);
  assert.throws(() => decide(kroot(d), { id: 'M4', switchTo: 'M4', why: 'x' }), /to itself/);
  assert.throws(() => decide(kroot(d), { id: 'M4', switchTo: 'M1' }), /--why is required/);
  assert.throws(() => decide(kroot(d), { id: 'M4', cont: true, why: 'x', resume: 'note' }), /--resume goes with --switch-to/);
  assert.throws(() => decide(kroot(d), { id: 'M1', cont: true, why: 'x' }), /M1 has no checkpoint/);
  assert.deepEqual(snapshot(d), snap2);
});

test('resume: one Resume line under Notes, replacing an older one; other notes stay; Notes made when missing', () => {
  const d = project({ order: ['M1', 'M2'], milestones: {
    'm1-a.md': msx('M1', 'A', 'paused', ['- [x] T1 One'], { notes: ['My own note.', 'Resume: old note'] }),
    'm2-b.md': msx('M2', 'B', 'paused', ['- [x] T1 One']),
  } });
  setResume(kroot(d), { id: 'M1', text: 'scoring weights still open' });
  const f = readR(d, 'milestones/m1-a.md');
  assert.equal(f.match(/^Resume:/gm).length, 1);
  assert.match(f, /^Resume: scoring weights still open$/m);
  assert.match(f, /^My own note\.$/m);
  setResume(kroot(d), { id: 'M2', text: 'Resume: next is T2' });
  assert.match(readR(d, 'milestones/m2-b.md'), /## Notes\n\nResume: next is T2\n$/);
  assert.throws(() => setResume(kroot(d), { id: 'M2', text: ' ' }), /--text is required/);
  assert.equal(check(d).good, true);
});

test('CLI: edit, checkpoint, decide and resume run end to end', () => {
  const d = two({ checkpoint: undefined });
  assert.match(cli(d, 'edit', '--id', 'M4', '--title', 'Feature A').stdout, /M4: renamed Board -> Feature A/);
  assert.match(cli(d, 'checkpoint', '--id', 'M4', '--after', 'T2').stdout, /M4: checkpoint T2 \(reached already/);
  assert.match(cli(d, 'decide', '--id', 'M4', '--switch-to', 'M1', '--why', 'demo', '--resume', 'next T3').stdout, /M4: switched to M1 \(M4 paused, resume note saved\)/);
  assert.match(cli(d, 'resume', '--id', 'M1', '--text', 'back soon').stdout, /M1: Resume: back soon/);
  assert.match(cli(d, 'checkpoint', '--id', 'M1', '--clear').stdout, /M1: checkpoint cleared/);
  const bad = cli(d, 'decide', '--id', 'M1', '--continue', '--why', 'x');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr + bad.stdout, /no checkpoint/);
});

// ---------- verify findings (fixed) ----------

test('verify fix: edit --goal on a milestone with no goal line adds one and keeps notes, links and comments', () => {
  const body = '---\nid: M3\ntitle: C\nstatus: planned\n---\n\n<!--\nkept comment\n-->\n## Tasks\n\n- [ ] T1 a\n\n## Notes\n\n- talk to the designer\n- notes/a.md\n';
  const d = project({ order: ['M3'], milestones: { 'm3-c.md': body } });
  assert.equal(parseRoadmap(kroot(d)).milestones[0].goal, null);
  editMilestone(kroot(d), { id: 'M3', goal: 'Ship X' });
  const f = readR(d, 'milestones/m3-c.md');
  assert.match(f, /Ship X\n\n## Tasks/);
  assert.match(f, /- talk to the designer\n- notes\/a\.md\n$/);
  assert.match(f, /<!--\nkept comment\n-->/);
  assert.equal(parseRoadmap(kroot(d)).milestones[0].goal, 'Ship X');
});

test('verify fix: tick --date must be YYYY-MM-DD; a "(done ...)" already in an open task is not written twice', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [ ] T1 Save (done 2026-11-01)', '- [ ] T2 Other']) } });
  const snap = snapshot(d);
  assert.throws(() => tick(kroot(d), { id: 'M1', task: 'T2', date: '17/11/2026' }), /--date must be YYYY-MM-DD/);
  assert.deepEqual(snapshot(d), snap);
  tick(kroot(d), { id: 'M1', task: 'T1', date: '2026-11-20' });
  assert.match(readR(d, 'milestones/m1-a.md'), /^- \[x\] T1 Save \(done 2026-11-20\)$/m);
});

test('verify fix: ticking a done task again changes nothing and does not ask the checkpoint question again', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [x] T1 Old', '- [ ] T2 Two'], { checkpoint: 'T1' }) } });
  const snap = snapshot(d);
  const r = tick(kroot(d), { id: 'M1', task: 'T1' });
  assert.equal(r.already, true);
  assert.equal(r.checkpoint, undefined);
  assert.deepEqual(snapshot(d), snap, 'an undated done task stays undated');
});

test('verify fix: decide refuses a target with no tasks, and a finished source, before writing', () => {
  const d = project({ order: ['M1', 'M2', 'M3'], milestones: {
    'm1-a.md': msx('M1', 'A', 'active', ['- [x] T1 One', '- [ ] T2 Two'], { checkpoint: 'T1' }),
    'm2-b.md': '---\nid: M2\ntitle: B\nstatus: planned\n---\n\nGoal.\n',
  }, done: { 'm3-c.md': msx('M3', 'C', 'done', ['- [x] T1 One'], { checkpoint: 'T1' }) } });
  const snap = snapshot(d);
  assert.throws(() => decide(kroot(d), { id: 'M1', switchTo: 'M2', why: 'x' }), /M2 has no tasks yet/);
  assert.throws(() => decide(kroot(d), { id: 'M3', cont: true, why: 'x' }), /M3 is done; its checkpoint no longer applies/);
  assert.deepEqual(snapshot(d), snap);
});

test('verify fix: a switch from a planned milestone (archive checkpoint) leaves it planned', () => {
  const d = project({ order: ['M5', 'M6'], milestones: {
    'm5-a.md': msx('M5', 'A', 'planned', ['- [ ] T1 One'], { checkpoint: 'archive a-api' }),
    'm6-b.md': msx('M6', 'B', 'planned', ['- [ ] T1 One']),
  } });
  fs.mkdirSync(path.join(d, 'openspec/changes/archive/2026-11-20-a-api'), { recursive: true });
  decide(kroot(d), { id: 'M5', switchTo: 'M6', why: 'api done', archived: archivedNames(d) });
  const by = id => parseRoadmap(kroot(d)).milestones.find(m => m.id === id);
  assert.deepEqual([by('M5').status, by('M6').status, by('M5').checkpoint], ['planned', 'active', null]);
  assert.match(driftRows(d).at(-1), /M5 stays planned, M6 active/);
});

test('verify fix: resume touches only the Notes section; a "Resume:" line elsewhere and spacing elsewhere stay', () => {
  const body = '---\nid: M1\ntitle: A\nstatus: paused\n---\n\nGoal.\n\n## Tasks\n\n- [x] T1 One\n\n\n## Log\n\nResume: check with design team\n\n## Notes\n\nMy note.\nResume: old\n';
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': body } });
  setResume(kroot(d), { id: 'M1', text: 'new note' });
  const f = readR(d, 'milestones/m1-a.md');
  assert.match(f, /- \[x\] T1 One\n\n\n## Log\n\nResume: check with design team\n/);
  assert.match(f, /## Notes\n\nResume: new note\n\nMy note\.\n$/);
  assert.equal(parseRoadmap(kroot(d)).milestones[0].resume, 'new note');
});

test('verify fix: checkpoint T0 is a task checkpoint, labelled T0, and reached when T0 is ticked', () => {
  const d = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [x] T0 Setup', '- [ ] T1 One'], { checkpoint: 'T0' }) } });
  const r = reportRoadmap(parseRoadmap(kroot(d)));
  assert.deepEqual(r.checkpoints.map(c => c.after), ['T0']);
  const gone = project({ order: ['M1'], milestones: { 'm1-a.md': msx('M1', 'A', 'active', ['- [ ] T1 One'], { checkpoint: 'T0' }) } });
  assert.ok(has(check(gone).broken, /checkpoint after T0, which this milestone doesn't have/));
});

test('verify fix: a planned milestone shows its checkpoint on its row; the other choice is the next planned one after the track', () => {
  const d = project({ order: ['M2', 'M4', 'M5'], milestones: {
    'm2-x.md': msx('M2', 'Before', 'planned', ['- [ ] T1 One'], { checkpoint: 'archive a-api' }),
    'm4-a.md': msx('M4', 'Feature A', 'active', ['- [x] T1 One', '- [ ] T2 Two'], { checkpoint: 'T1' }),
    'm5-b.md': msx('M5', 'After', 'planned', ['- [ ] T1 One']),
  } });
  const r = reportRoadmap(parseRoadmap(kroot(d)));
  assert.match(formatReport(r), /M2 · Before · planned · 0 of 1 done · checkpoint after the archive of a-api/);
  assert.equal(r.alternative.id, 'M5');
});
