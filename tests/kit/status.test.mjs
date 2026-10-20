import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';
import { projectStatus, format, cap, ageDays } from '../../plugins/kit/scripts/status.mjs';
import { locate } from '../../plugins/kit/scripts/locate.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/kit/scripts/status.mjs', import.meta.url));
const GIT = locate('git')?.path ?? 'git';
const NOW = Date.parse('2026-10-17T12:00:00Z');

// A project folder written from a map of relative paths to file contents.
function project(files = {}) {
  const d = tmpDir('kit-status-');
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true });
    fs.writeFileSync(path.join(d, rel), text);
  }
  fs.mkdirSync(path.join(d, 'openspec', 'changes'), { recursive: true });
  return d;
}
const spec = '# Spec\n\n## Purpose\n\nX.\n';
const roadmap = ({ order, now = ['Working.'], waiting = [] }) => ['# Roadmap', '', '## North star', '', 'V1.', '', '## Principles', '', '- The user decides.', '',
  '## Order', '', ...order.map(id => `- ${id}`), '', '## Now', '', ...now, '', '## Waiting on you', '', ...waiting, ''].join('\n');
const ms = (id, title, status, tasks, extra = '') => `---\nid: ${id}\ntitle: ${title}\nstatus: ${status}\n${extra}---\n\nA goal.\n\n## Tasks\n\n${tasks.join('\n')}\n`;
const prd = (title, status, extra = '') => `---\ntitle: ${title}\nstatus: ${status}\nsources: []\n${extra}---\n\n## Problem\n\nX.\n\n## Open questions\n\n- None.\n`;
const note = (title, date) => `---\ntitle: ${title}\ndate: ${date}\n---\n\nText.\n`;
const decisions = (change, items) => `# Decisions: ${change}\n\n<!-- kit-decisions-data ${JSON.stringify({ change, next: items.length + 1, items, readyAt: null })} -->\n`;
const run = (d, opts = {}) => projectStatus(d, { git: null, openspec: true, now: NOW, ...opts });

const withRoadmap = (extra = {}) => project({
  'PRODUCT.md': '# Acme\n',
  'knowledge/roadmaps/roadmap.md': roadmap({ order: ['M12a', 'M12', 'M13', 'M14'], ...extra.roadmap }),
  'knowledge/roadmaps/drift-log.md': '# Drift log\n',
  'knowledge/roadmaps/milestones/m12a-kit-workflow.md': ms('M12a', 'Kit workflow', 'active', ['- [x] T1 Roadmap', '- [ ] T2 Status', '- [ ] T3 Backlog'], extra.m12a ?? ''),
  'knowledge/roadmaps/milestones/m12-acme-proof.md': ms('M12', 'Acme proof', 'planned', ['- [ ] T1 Upgrade']),
  'knowledge/roadmaps/milestones/m13-release-prep.md': ms('M13', 'Release prep', 'planned', ['- [ ] T1 License']),
  'knowledge/roadmaps/milestones/m14-launch.md': ms('M14', 'Launch', 'planned', ['- [ ] T1 Post']),
  ...extra.files,
});

// ---------- 1.2 overview ----------

test('overview: built comes from main specs, newest-archived first; a Shipped PRD with no archive is not built', () => {
  const d = project({
    'PRODUCT.md': '# P\n',
    'openspec/specs/roadmap/spec.md': spec, 'openspec/specs/harness-review/spec.md': spec, 'openspec/specs/old/spec.md': spec,
    'openspec/changes/archive/2026-10-10-harness/specs/harness-review/spec.md': spec,
    'openspec/changes/archive/2026-10-17-roadmap-structure/specs/roadmap/spec.md': spec,
    'knowledge/prds/gift-cards.md': prd('Gift cards', 'Shipped', 'change: gift-cards\n'),
  });
  const s = run(d);
  assert.equal(s.overview.description.path, 'PRODUCT.md');
  assert.equal(s.overview.built.count, 3);
  assert.deepEqual(s.overview.built.newest, ['roadmap', 'harness-review', 'old']);
  assert.ok(!s.overview.built.newest.includes('gift-cards'));
  assert.deepEqual(s.overview.archived.map(a => a.change), ['roadmap-structure', 'harness']);
});

test('overview: 15 capabilities -> the count and 5 names', () => {
  const files = { 'README.md': '# R\n' };
  for (let i = 1; i <= 15; i++) files[`openspec/specs/cap-${String(i).padStart(2, '0')}/spec.md`] = spec;
  const s = run(project(files));
  assert.equal(s.overview.built.count, 15);
  assert.equal(s.overview.built.newest.length, 5);
});

test('overview: description file order is PRODUCT.md, docs/project-context.md, README.md', () => {
  assert.equal(run(project({ 'README.md': 'r', 'docs/project-context.md': 'c' })).overview.description.path, 'docs/project-context.md');
  const none = run(project({}));
  assert.equal(none.overview.description.path, null);
  assert.equal(none.overview.description.fix, '/kit:start');
  assert.match(format(none), /no description found/);
});

// ---------- first-run-guidance (L25, L26) ----------
// Line endings normalised: git may check the template out with CRLF on Windows.
const TEMPLATE = fs.readFileSync(fileURLToPath(new URL('../../plugins/kit/templates/project-context.md', import.meta.url)), 'utf8')
  .replace(/\r\n/g, '\n').replace('{{project}}', 'demo').replace('{{date}}', '2026-10-19');
const OLD_TEMPLATE = '# demo: project context\n\nLiving context doc. OpenSpec reads it before every proposal (see `openspec/config.yaml`). Created by the kit on 2026-10-08; it\'s yours from now on and the kit never edits it.\n\n## Goal\n\nWhat this project is for, in two or three sentences.\n\n## Users and needs\n\nWho it\'s for and the problem it solves for them.\n\n## Constraints\n\nBudget, platform, deadlines, must-use or must-avoid tools.\n\n## Decided\n\nDecisions so far, each with a one-line reason.\n\n## Open questions\n\nWhat still needs a decision, and who decides.\n\n## Links\n\n- Repo:\n- Notes and PRDs: `knowledge/` (`/kit:capture`, `/kit:prd`)\n- Design (Figma / Miro):\n- Deployments:\n';

test('blank context doc and a README: the README describes the project (spec "Blank doc and a README")', () => {
  const s = run(project({ 'docs/project-context.md': TEMPLATE, 'README.md': '# Demo\n\nA notes app.\n' }));
  assert.equal(s.overview.description.path, 'README.md');
  assert.equal(run(project({ 'docs/project-context.md': OLD_TEMPLATE, 'README.md': 'r' })).overview.description.path, 'README.md', 'a doc from an older kit counts as blank too');
  const filled = TEMPLATE.replace('## Problem\n', '## Problem\n\nMy ideas are scattered.\n');
  assert.equal(run(project({ 'docs/project-context.md': filled, 'README.md': 'r' })).overview.description.path, 'docs/project-context.md', 'one line of the user makes it the description');
});

test('blank context doc and nothing else: "Project not described yet" (spec "Nothing describes the project")', () => {
  const s = run(project({ 'docs/project-context.md': TEMPLATE }));
  assert.equal(s.overview.description.path, null);
  assert.equal(s.overview.description.notDescribed, true);
  assert.match(s.overview.description.fix, /docs\/project-context\.md/);
  assert.match(format(s), /Project not described yet/);
});

test('a new project ends with the first steps; a project with history does not (spec "Empty project")', () => {
  const fresh = run(project({ 'docs/project-context.md': TEMPLATE, 'knowledge/notes/.gitkeep': '' }));
  assert.equal(fresh.handoff.fresh, true);
  assert.match(format(fresh), /\/kit:capture.*\/opsx:explore/);
  assert.equal(run(project({ 'docs/project-context.md': TEMPLATE })).handoff.fresh, false, 'no knowledge folder: not a project the kit set up');
  // Same test as /kit:next (design D1, S3): main specs alone don't make it a project with history.
  assert.equal(run(project({ 'knowledge/notes/.gitkeep': '', 'openspec/specs/a/spec.md': spec })).handoff.fresh, true);
  // A raw note not imported yet counts as a note (C4).
  assert.equal(run(project({ 'knowledge/notes/voice.txt': 'an idea' })).handoff.fresh, false);
});

test('a heading the user added makes the context doc not blank (C6)', () => {
  const s = run(project({ 'docs/project-context.md': TEMPLATE + '\n## Offline only\n', 'README.md': 'r' }));
  assert.equal(s.overview.description.path, 'docs/project-context.md');
  const old = run(project({ 'openspec/changes/archive/2026-10-01-a/proposal.md': '# P\n' }));
  assert.equal(old.handoff.fresh, false);
  assert.doesNotMatch(format(old), /\/opsx:explore/);
  // spec "Nothing under way and nothing queued" (a project with history): capture or roadmap, as before.
  assert.match(format(old), /-> Nothing under way and nothing queued\. Capture an idea \(\/kit:capture\) or plan one \(\/kit:roadmap\)\./);
});

test('missing: roadmap reported (not the backlog any more); openspec CLI and git reported when absent', () => {
  const s = run(project({}), { openspec: false });
  const m = s.missing.map(x => x.source);
  assert.ok(m.includes('roadmap') && !m.includes('backlog') && m.includes('openspec CLI') && m.includes('git'));
});

// ---------- 1.3 sections ----------

test('sections with a roadmap: Now by title with Left and Source; Next and After in roadmap order', () => {
  const s = run(withRoadmap());
  const now = s.sections.now.rows[0];
  assert.equal(now.item, 'Kit workflow');
  assert.deepEqual(now.left, ['T2 Status', 'T3 Backlog']);
  assert.equal(now.source, 'knowledge/roadmaps/milestones/m12a-kit-workflow.md');
  assert.deepEqual(s.sections.next.rows.map(r => r.item), ['Acme proof']);
  assert.deepEqual(s.sections.after.rows.map(r => r.item), ['Release prep', 'Launch']);
  assert.equal(s.sections.loose.note, 'none yet; /kit:loose-ends adds them');
});

test('milestone and its linked change are two rows in Now, each with its own Left and Source', () => {
  const d = withRoadmap({ m12a: 'changes:\n  - kit-status\n', files: {
    'openspec/changes/kit-status/proposal.md': '# Proposal\n\nPRD: `knowledge/prds/kit-status.md @ abc1234`\n',
    'openspec/changes/kit-status/tasks.md': '- [x] 1.1 a\n- [ ] 1.2 b\n- [ ] 1.3 c\n',
    'knowledge/prds/kit-status.md': prd('Kit status', 'Building', 'change: kit-status\n'),
  } });
  const rows = run(d).sections.now.rows;
  assert.equal(rows.length, 2);
  assert.equal(rows[0].kind, 'milestone');
  assert.deepEqual([rows[1].item, rows[1].left, rows[1].source], ['Kit status', '2 of 3 tasks open', 'openspec/changes/kit-status/']);
});

test('several items under way: Now lists every active change', () => {
  const d = project({ 'openspec/changes/notes-search/tasks.md': '- [ ] 1.1 a\n', 'openspec/changes/task-board/tasks.md': '- [x] 1.1 a\n- [ ] 1.2 b\n' });
  const s = run(d);
  assert.deepEqual(s.sections.now.rows.map(r => [r.item, r.left]), [['notes search', '1 of 1 tasks open'], ['task board', '1 of 2 tasks open']]);
  assert.equal(s.handoff.underWay.length, 2);
  assert.match(format(s), /it asks which one/);
});

test('no roadmap: Next from Ready PRDs (newest first) then notes no PRD or change uses; nothing created', () => {
  const d = project({
    'PRODUCT.md': '# P\n',
    'knowledge/prds/a.md': prd('Alpha', 'Ready'), 'knowledge/prds/b.md': prd('Beta', 'Draft', ''),
    'knowledge/notes/2026-10-01-idea.md': note('An idea', '2026-10-01'),
    'knowledge/notes/2026-10-02-used.md': note('Used note', '2026-10-02'),
    'knowledge/prds/c.md': prd('Gamma', 'Draft').replace('sources: []', 'sources:\n  - notes/2026-10-02-used.md'),
  });
  const before = fs.readdirSync(d, { recursive: true }).sort();
  const s = run(d);
  assert.equal(s.roadmap, false);
  // Notes are never rows; flexible-handoffs D7: a plain count of all notes, no call to action.
  assert.deepEqual(s.sections.next.rows.map(r => [r.item, r.kind]), [['Alpha', 'prd']]);
  assert.equal(s.sections.next.noteCount, 2);
  assert.match(format(s), /\+ 2 notes\n/);
  assert.doesNotMatch(format(s), /nothing has read|start an explore/);
  assert.equal(s.sections.now.rows.length, 0);
  assert.ok(s.missing.some(m => m.source === 'roadmap' && /\/kit:roadmap/.test(m.fix)));
  assert.equal(s.handoff.candidates[0].item, 'Alpha');
  assert.deepEqual(fs.readdirSync(d, { recursive: true }).sort(), before);
});

test("We said we'd do: waiting items, PRD questions and open decisions (active and archived), with source and answering command", () => {
  const d = withRoadmap({
    roadmap: { waiting: ['- [general] Keep notes manageable? (proposed 2026-10-07)'] },
    files: {
      'knowledge/prds/sidebar.md': prd('Sidebar', 'Draft').replace('- None.', '- Q1?\n- Q2?'),
      'openspec/changes/archive/2026-10-14-docs/decisions.md': decisions('docs', [
        { id: 'D1', kind: 'gap', text: 'Cap the page size?', status: 'later', dates: { opened: '2026-10-12', later: '2026-10-12' } },
        { id: 'D2', kind: 'gap', text: 'Done one', status: 'decided', dates: { opened: '2026-10-12' } }]),
    },
  });
  const rows = run(d).sections.said.rows;
  assert.deepEqual(rows.map(r => [r.kind, r.answer]), [['roadmap', '/kit:roadmap'], ['prd', '/kit:prd'], ['decision', '/kit:ready']]);
  assert.equal(rows[1].item, 'PRD "Sidebar": 2 open question(s)');
  assert.equal(rows[2].source, 'openspec/changes/archive/2026-10-14-docs/decisions.md');
  assert.match(rows[2].status, /archived change/);
});

test('section cap: 8 waiting items -> 5 rows and 3 more', () => {
  const waiting = Array.from({ length: 8 }, (_, i) => `- [general] Question ${i + 1}? (proposed 2026-10-0${i + 1})`);
  const s = run(withRoadmap({ roadmap: { waiting } }));
  assert.equal(s.sections.said.rows.length, 5);
  assert.equal(s.sections.said.more, 3);
  assert.equal(s.sections.said.rows[0].item, 'Question 1?', 'oldest first');
  assert.match(format(s), /\+3 more/);
  assert.deepEqual(cap([1, 2]), { rows: [1, 2], more: 0 });
  assert.equal(ageDays('2026-10-10', NOW), 7);
});

// ---------- 1.4 mismatches ----------

function gitInit(d) {
  const g = (...a) => spawnSync(GIT, ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
  g('init', '-q', '-b', 'main'); g('add', '.'); g('commit', '-qm', 'start');
  return g;
}

test('mismatch (a): active milestone with tasks left, no change and no branch', () => {
  const d = withRoadmap();
  gitInit(d);
  const s = run(d, { git: GIT });
  assert.equal(s.mismatches.length, 1);
  assert.match(s.mismatches[0].what, /"Kit workflow" \(M12a\) is active with 2 task\(s\) left, but no change is active/);
  assert.match(s.mismatches[0].fix, /propose a change for it, or update Now/);
  assert.match(format(s), /Doesn't match \(1\)/);
});

test('mismatch (a) not raised when a milestone branch exists', () => {
  const d = withRoadmap({ m12a: 'branches:\n  - m12a-status\n' });
  const g = gitInit(d);
  g('branch', 'm12a-status');
  assert.equal(run(d, { git: GIT }).mismatches.length, 0);
});

test('mismatch (b): Building PRD whose change is archived asks, never advises Shipped (L1)', () => {
  const d = project({ 'knowledge/prds/roadmap-structure.md': prd('Roadmap structure', 'Building', 'change: roadmap-structure\n'), 'openspec/changes/archive/2026-10-17-roadmap-structure/proposal.md': '# P\n' });
  const m = run(d).mismatches;
  assert.equal(m.length, 1);
  assert.match(m[0].what, /done, or does it continue in another change\?/);
  assert.match(m[0].fix, /\/kit:prd: mark it Shipped, or link the next change \(on your yes\)/);
});

test('mismatch (c): roadmap stale Now and unplanned work passed through', () => {
  const d = withRoadmap({ m12a: 'changes:\n  - kit-status\n', files: { 'openspec/changes/kit-status/tasks.md': '- [ ] 1.1 a\n' } });
  const g = gitInit(d);
  fs.mkdirSync(path.join(d, 'openspec/changes/archive/2026-10-18-gift-cards'), { recursive: true });
  fs.writeFileSync(path.join(d, 'openspec/changes/archive/2026-10-18-gift-cards/proposal.md'), '# P\n');
  fs.mkdirSync(path.join(d, 'openspec/changes/stray'), { recursive: true });
  fs.writeFileSync(path.join(d, 'openspec/changes/stray/tasks.md'), '- [ ] 1.1 a\n');
  spawnSync(GIT, ['add', '.'], { cwd: d });
  spawnSync(GIT, ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'archive'], { cwd: d, env: { ...process.env, GIT_COMMITTER_DATE: '2030-01-01T10:00:00Z', GIT_AUTHOR_DATE: '2030-01-01T10:00:00Z' } });
  const m = run(d, { git: GIT }).mismatches.map(x => x.what);
  assert.ok(m.some(w => /Now may be stale/.test(w)), m.join('\n'));
  assert.ok(m.some(w => /change stray is under way but no milestone links it/.test(w)));
  void g;
});

test('everything agrees: no mismatches and no "Doesn\'t match" section', () => {
  const d = project({ 'PRODUCT.md': '# P\n' });
  const s = run(d);
  assert.deepEqual(s.mismatches, []);
  assert.doesNotMatch(format(s), /Doesn't match/);
});

// ---------- 1.5 handoff and CLI ----------

test('handoff: one item under way names it and /kit:next', () => {
  const s = run(project({ 'openspec/changes/kit-status/tasks.md': '- [ ] 1.1 a\n' }));
  assert.deepEqual(s.handoff, { underWay: [{ item: 'kit status', change: 'kit-status' }], command: '/kit:next' });
  assert.match(format(s), /-> Working on: kit status\. Run \/kit:next\./);
});

test('CLI: --json, exit 0, and git status unchanged after a run', () => {
  const d = withRoadmap();
  gitInit(d);
  const before = spawnSync(GIT, ['status', '--porcelain'], { cwd: d, encoding: 'utf8' }).stdout;
  const r = spawnSync(process.execPath, [SCRIPT, '--dir', d, '--json'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(JSON.parse(r.stdout).sections.now.rows[0].item, 'Kit workflow');
  assert.equal(spawnSync(GIT, ['status', '--porcelain'], { cwd: d, encoding: 'utf8' }).stdout, before);
  const plain = spawnSync(process.execPath, [SCRIPT, '--dir', d], { encoding: 'utf8' });
  assert.equal(plain.status, 0);
  assert.match(plain.stdout, /^Project {3}PRODUCT\.md/);
});

test('OpenSpec CLI not found: the rest is still filled and the skip is reported', () => {
  const s = run(withRoadmap(), { openspec: false });
  assert.equal(s.sections.now.rows[0].item, 'Kit workflow');
  assert.ok(s.missing.some(m => m.source === 'openspec CLI' && /\/kit:setup/.test(m.fix)));
});

// ---------- verify C4, C5, C7 ----------

test('verify C4: link bullets in tasks.md are not tasks; "- [ x]" counts as done', () => {
  const s = run(project({ 'openspec/changes/a/tasks.md': '- [design](design.md)\n- [see spec](specs/x/spec.md)\n- [x] 1.1 a\n- [ x] 1.2 b\n- [ ] 1.3 c\n' }));
  assert.equal(s.sections.now.rows[0].left, '1 of 3 tasks open');
});

test('verify C5: the handoff lists every active change, past the section cap', () => {
  const files = {};
  for (const n of ['a', 'b', 'c', 'd', 'e', 'f']) files[`openspec/changes/${n}/tasks.md`] = '- [ ] 1.1 x\n';
  const s = run(withRoadmap({ files }));
  assert.equal(s.sections.now.rows.length, 5);
  assert.equal(s.handoff.underWay.length, 6);
});

// ---------- loose-ends 3.1 (spec project-status "Facts from their owners", "Mismatches shown, never resolved") ----------
import { add as looseAdd, important as looseImportant, block as looseBlock } from '../../plugins/kit/scripts/loose-ends.mjs';

test('Loose ends: important and blocking-current as rows, the rest as counts, accepted hidden', () => {
  const d = withRoadmap();
  const a = (text, kind) => looseAdd(d, { text, kind, origin: 'chat' });
  a('Canvas v1 mismatch', 'check'); a('PATH friction', 'friction'); a('idea one', 'idea'); a('idea two', 'idea'); a('C9 kept', 'accepted'); a('blocks M12 only', 'debt');
  looseImportant(d, { id: 'L1', on: true });
  looseBlock(d, { id: 'L2', target: 'M12a' });
  looseBlock(d, { id: 'L6', target: 'M12' });
  const sec = run(d).sections.loose;
  assert.deepEqual(sec.rows.map(r => [r.item, r.status, r.answer]), [['Canvas v1 mismatch', 'important', '/kit:loose-ends'], ['PATH friction', 'blocks M12a', '/kit:loose-ends']]);
  assert.deepEqual(sec.counts, [{ kind: 'idea', n: 2 }, { kind: 'debt', n: 1 }]);
  assert.match(format(run(d)), /\nLoose ends\n  Canvas v1 mismatch \| check \| important \| knowledge\/loose-ends\.md \(L1\)[\s\S]*\+ 2 idea, 1 debt \(\/kit:loose-ends\)/);
});

test('mismatch (d): a loose end blocking a done milestone, an archived change, or a dropped loose end', () => {
  // Blocked while open (verify C1 refuses finished targets), then the work finishes.
  const d = withRoadmap({ files: { 'openspec/changes/kit-status/proposal.md': '# P\n' } });
  const a = text => looseAdd(d, { text, kind: 'check', origin: 'chat' });
  a('x'); a('y'); a('z'); a('target');
  looseBlock(d, { id: 'L1', target: 'M12' });
  looseBlock(d, { id: 'L2', target: 'kit-status' });
  looseBlock(d, { id: 'L3', target: 'L4' });
  assert.equal(run(d).mismatches.filter(m => /^L\d blocks/.test(m.what)).length, 0, 'nothing finished yet');
  fs.mkdirSync(path.join(d, 'openspec/changes/archive'), { recursive: true });
  fs.renameSync(path.join(d, 'openspec/changes/kit-status'), path.join(d, 'openspec/changes/archive/2026-10-17-kit-status'));
  fs.writeFileSync(path.join(d, 'knowledge/roadmaps/milestones/m12-acme-proof.md'), ms('M12', 'Acme proof', 'done', ['- [x] T1 Upgrade']));
  spawnSync(process.execPath, [fileURLToPath(new URL('../../plugins/kit/scripts/loose-ends.mjs', import.meta.url)), 'drop', '--id', 'L4', '--reason', 'no', '--dir', d]);
  const m = run(d).mismatches.map(x => x.what);
  assert.ok(m.includes('L1 blocks M12, but M12 is done'), m.join('\n'));
  assert.ok(m.includes('L2 blocks kit-status, but change kit-status is archived'));
  assert.ok(m.includes('L3 blocks L4, but L4 is dropped'));
});

test('loose-ends verify C3: an unreadable loose-ends.md keeps its real path', () => {
  const d = project({ 'knowledge/loose-ends.md': '# Loose ends\n\n<!-- kit-loose-ends-data {broken -->\n' });
  const s = run(d);
  assert.match(s.sections.loose.note, /can't be read/);
  const m = projectStatus(d, { git: null, openspec: true, now: NOW });
  assert.deepEqual(m.mismatches, []);
});

// ---------- explore-stage 2.2 (spec project-status "Facts from their owners", "Status without a roadmap") ----------
import { save as exploreSave } from '../../plugins/kit/scripts/explore.mjs';

test('explore under way: a Now row with its open questions; the handoff names it', () => {
  const d = project({ 'knowledge/notes/a.md': note('A', '2026-10-01') });
  exploreSave(d, { slug: 'kit-status', title: 'Kit status', sources: ['notes/a.md'], questions: ['one command or two', 'status vs roadmap report'] });
  const s = run(d);
  const r = s.sections.now.rows.find(x => x.kind === 'explore');
  assert.deepEqual([r.item, r.left, r.status, r.source], ['Kit status', ['Q1 one command or two', 'Q2 status vs roadmap report'], 'exploring', 'knowledge/explore/kit-status.md']);
  assert.deepEqual(s.handoff.underWay, [{ item: 'Kit status', explore: 'kit-status' }]);
});

test('project-status: Unused notes as one line (a plain count; notes an explore read count too)', () => {
  const d = project({
    'knowledge/prds/p.md': prd('Ready one', 'Ready'),
    ...Object.fromEntries([1, 2, 3, 4, 5].map(n => [`knowledge/notes/n${n}.md`, note(`N${n}`, '2026-10-01')])),
  });
  exploreSave(d, { slug: 'x', title: 'X', sources: ['notes/n5.md'], questions: ['q'] });
  const s = run(d);
  assert.deepEqual(s.sections.next.rows.map(r => r.item), ['Ready one']);
  assert.equal(s.sections.next.noteCount, 5);
  assert.match(format(s), /\+ 5 notes\n/);
});

test('explore-stage verify C8: with a roadmap, notes are still one count line', () => {
  const d = withRoadmap({ files: { 'knowledge/notes/n1.md': note('N1', '2026-10-01'), 'knowledge/notes/n2.md': note('N2', '2026-10-01') } });
  const s = run(d);
  assert.equal(s.sections.next.noteCount, 2);
  assert.equal(s.sections.next.rows[0].item, 'Acme proof');
});

test('explore-stage verify C1: an unreadable explore record is a note, not a row', () => {
  const d = project({ 'knowledge/explore/bad.md': '---\ntitle: [broken\n---\n' });
  const s = run(d);
  assert.equal(s.sections.now.rows.length, 0);
  assert.ok(s.notes.some(n => /explore\/bad\.md can't be read/.test(n)));
});
