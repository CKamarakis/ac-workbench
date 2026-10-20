import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggest, format } from '../../plugins/kit/scripts/next.mjs';
import { laneMap } from '../../plugins/kit/scripts/lanes.mjs';

const registry = {
  phases: ['brainstorm', 'artifacts', 'plan', 'build', 'verify', 'close', 'status'],
  tools: [
    { name: 'openspec', status: 'adopted', phases: ['brainstorm', 'artifacts', 'plan', 'build', 'verify', 'close'],
      skills: { brainstorm: '/opsx:explore', artifacts: '/opsx:propose', plan: '/opsx:continue', build: '/opsx:apply', verify: 'openspec validate --strict', close: '/opsx:archive' } },
    { name: 'kit-status', status: 'adopted', phases: ['status'], skills: { status: '/kit:status' } },
    { name: 'alt-flow', status: 'trial', overlaps: ['openspec'], skip_skills: ['x'], phases: ['build'], skills: { build: '/opsx:apply (worktree)' } },
  ],
};
const map = laneMap(registry);
const change = (name, done, total, lastModified = '2026-10-01T10:00:00Z') => ({ name, completedTasks: done, totalTasks: total, lastModified, status: 'in-progress' });
const status = arts => () => ({ artifacts: arts.map(([id, s]) => ({ id, status: s })) });

test('no OpenSpec in the folder -> /kit:start', () => {
  const s = suggest({ openspec: { root: null, changes: [] }, statusOf: () => null, map });
  assert.equal(s.use, '/kit:start');
});

test('no active change -> a message pointing to /kit:status (kit-status D6)', () => {
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map: kmap });
  assert.equal(s.phase, 'status');
  assert.equal(s.use, '/kit:status');
  assert.equal(s.reason, "Nothing open. Run /kit:status to see what's next, or /kit:roadmap to change the order.");
  // A phase with no owner is left out of the reason instead of being named by a hard-coded command (L17).
  assert.equal(suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map }).reason, "Nothing open. Run /kit:status to see what's next.");
});

test('nothing open, items left for later -> the count in the message', () => {
  const knowledge = K({ prds: [P('sidebar', 'Draft', { openQuestions: 1 })] });
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge, archived: { open: 2, oldest: '2026-10-12', changes: ['docs'] } });
  assert.equal(s.use, '/kit:status');
  assert.equal(s.reason, "Nothing open. 3 items left for later (2 from builds, 1 PRD question). Run /kit:status to see what's next, or /kit:roadmap to change the order.");
  assert.deepEqual(leftoverCount(knowledge, { open: 2 }), { builds: 2, prd: 1, loose: 0, total: 3 });
});

test('Ready PRD before status: no change and a Ready PRD -> propose it, not /kit:status', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K({ prds: [P('gift-cards', 'Ready')] }) });
  assert.equal(s.use, '/opsx:propose');
});

test('planning incomplete: proposal done, specs next -> continue, naming the next artifact', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 0)] }, statusOf: status([['proposal', 'done'], ['specs', 'ready'], ['design', 'ready'], ['tasks', 'blocked']]), map });
  assert.equal(s.phase, 'plan');
  assert.equal(s.use, '/opsx:continue');
  assert.equal(s.nextArtifact, 'specs');
  assert.match(format(s), /next artifact: specs/);
});

test('nothing written yet -> artifacts owner starts it', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 0)] }, statusOf: status([['proposal', 'ready'], ['specs', 'blocked']]), map });
  assert.equal(s.phase, 'artifacts');
  assert.equal(s.use, '/opsx:propose');
});

test('tasks ready -> build owner, with the alternative for big changes', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 3, 10)] }, statusOf: () => ({ isPlanningComplete: true }), map });
  assert.equal(s.phase, 'build');
  assert.equal(s.use, '/opsx:apply');
  assert.match(s.reason, /7 of 10 tasks are open/);
  assert.deepEqual(s.alternatives, [{ tool: 'alt-flow', use: '/opsx:apply (worktree)' }]);
  assert.match(format(s), /alternative: \/opsx:apply \(worktree\) \(alt-flow\)/);
});

test('all tasks done -> verify, then close', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 10, 10)] }, statusOf: () => ({ isPlanningComplete: true }), map });
  assert.equal(s.phase, 'verify');
  assert.equal(s.use, 'openspec validate --strict');
  assert.equal(s.then, '/opsx:archive');
});

test('several active changes and none named -> list them to choose from (kit-status D6)', () => {
  const openspec = { root: {}, changes: [change('old', 1, 5, '2026-09-01T00:00:00Z'), change('new', 1, 5, '2026-10-01T00:00:00Z')] };
  const s = suggest({ openspec, statusOf: () => ({ isPlanningComplete: true }), map });
  assert.equal(s.phase, 'choose');
  assert.deepEqual(s.choose, ['new', 'old']);
  assert.match(format(s), /choose: new, old/);
  const picked = suggest({ openspec, statusOf: () => ({ isPlanningComplete: true }), map, change: 'old' });
  assert.equal(picked.change, 'old');
  assert.equal(picked.use, '/opsx:apply');
  assert.equal(picked.otherActive, undefined);
  assert.equal(suggest({ openspec, statusOf: () => null, map, change: 'nope' }).phase, 'choose');
});

test('owner comes from the lane map: changing the registry changes the suggestion', () => {
  const reg2 = { ...registry, tools: [{ ...registry.tools[0], skills: { ...registry.tools[0].skills, build: '/custom:build' } }] };
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 4)] }, statusOf: () => ({ isPlanningComplete: true }), map: laneMap(reg2) });
  assert.equal(s.use, '/custom:build');
});

test('unowned phase is said plainly, never guessed', () => {
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map: laneMap({ phases: ['status'], tools: [] }) });
  assert.match(s.use, /no owner yet for "status"/);
});

// ---------- prd-pipeline 6.1: PRD-aware suggestions ----------
import { prdSuggest, prdLink, leftoverCount } from '../../plugins/kit/scripts/next.mjs';

const kmap = laneMap({
  phases: ['capture', 'prd', 'roadmap', ...registry.phases],
  tools: [...registry.tools, { name: 'kit', status: 'adopted', phases: ['capture', 'prd', 'roadmap'], skills: { capture: '/kit:capture', prd: '/kit:prd', roadmap: '/kit:roadmap' } }],
});
const P = (slug, status, extra = {}) => ({ path: `prds/${slug}.md`, slug, title: slug, status, sources: [], change: null, valid: true, errors: [], ...extra });
const K = ({ notes = [], prds = [], invalid = [], changes = [] } = {}) => ({ dir: 'knowledge', list: { exists: true, notes, prds, invalid }, changes });
const os0 = { root: {}, changes: [] };

test('prdLink reads the proposal line, with or without backticks', () => {
  assert.deepEqual(prdLink('Source: `PRD: knowledge/prds/gift-cards.md @ a1b2c3d`'), { path: 'knowledge/prds/gift-cards.md', commit: 'a1b2c3d' });
  assert.deepEqual(prdLink('PRD: knowledge/prds/x.md @ uncommitted'), { path: 'knowledge/prds/x.md', commit: 'uncommitted' });
  assert.equal(prdLink('no link here'), null);
});

test('Ready PRD without a change -> /opsx:propose naming it', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K({ prds: [P('gift-cards', 'Ready'), P('later', 'Ready')] }) });
  assert.equal(s.use, '/opsx:propose');
  assert.equal(s.prd, 'knowledge/prds/gift-cards.md');
  assert.match(s.reason, /"gift-cards" is Ready/);
  assert.deepEqual(s.otherReady, ['later']);
  assert.match(format(s), /prd:   knowledge\/prds\/gift-cards\.md/);
});

test('Ready PRD already used by a change (proposal line) is not suggested again', () => {
  const k = K({ prds: [P('gift-cards', 'Ready')], changes: [{ name: 'gift-cards', archived: false, link: { path: 'knowledge/prds/gift-cards.md', commit: 'abc1234' } }] });
  const s = suggest({ openspec: { root: {}, changes: [change('gift-cards', 1, 5)] }, statusOf: () => ({ isPlanningComplete: true }), map: kmap, knowledge: k });
  assert.equal(s.phase, 'build');
});

test('PRD changed since planning -> review, naming the change', () => {
  const k = K({ prds: [P('gift-cards', 'Building', { change: 'gift-cards' })], changes: [{ name: 'gift-cards', archived: false, link: { path: 'knowledge/prds/gift-cards.md', commit: 'abc1234' } }] });
  const seen = [];
  const s = suggest({ openspec: { root: {}, changes: [change('gift-cards', 1, 5)] }, statusOf: () => ({ isPlanningComplete: true }), map: kmap, knowledge: k, changedSince: (p, c) => { seen.push([p, c]); return true; } });
  assert.deepEqual(seen, [['knowledge/prds/gift-cards.md', 'abc1234']]);
  assert.equal(s.phase, 'plan');
  assert.equal(s.change, 'gift-cards');
  assert.match(s.reason, /changed after change "gift-cards" was planned/);
});

test('unchanged PRD -> normal OpenSpec suggestion; unknown -> warning, not a guess', () => {
  const k = K({ prds: [P('gift-cards', 'Building', { change: 'gift-cards' })], changes: [{ name: 'gift-cards', archived: false, link: { path: 'knowledge/prds/gift-cards.md', commit: 'abc1234' } }] });
  const base = { openspec: { root: {}, changes: [change('gift-cards', 1, 5)] }, statusOf: () => ({ isPlanningComplete: true }), map: kmap, knowledge: k };
  assert.equal(suggest({ ...base, changedSince: () => false }).phase, 'build');
  const s = suggest({ ...base, changedSince: () => null });
  assert.equal(s.phase, 'build');
  assert.match(s.warnings.join(), /could not check whether PRD "gift-cards" changed/);
});

test('archived change -> ask whether the PRD is done or continues; never advise Shipped (L1, nothing written)', () => {
  const k = K({ prds: [P('gift-cards', 'Building', { change: 'gift-cards' })], changes: [{ name: 'gift-cards', archived: true, link: null }] });
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: k });
  assert.equal(s.use, '/kit:prd');
  assert.match(s.reason, /archived: is PRD "gift-cards" done, or does it continue in another change\? Mark it Shipped, or link the next change \(only on your yes\)/);
});

test('explore-stage: notes alone never lead to a suggestion (no /kit:prd, nothing about notes)', () => {
  const notes = ['A', 'B', 'C'].map(t => ({ path: `notes/${t}.md`, title: t }));
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K({ notes }) });
  assert.notEqual(s.use, '/kit:prd');
  assert.doesNotMatch(s.reason, /note/i);
});

test('no knowledge folder -> same suggestion as before', () => {
  const without = suggest({ openspec: os0, statusOf: () => null, map: kmap });
  const missing = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: { dir: 'knowledge', list: { exists: false, notes: [], prds: [], invalid: [] }, changes: [] } });
  assert.deepEqual(missing, without);
  assert.equal(without.use, '/kit:status');
});

test('invalid PRDs are reported as warnings', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K({ invalid: [{ path: 'prds/bad.md', errors: ['invalid status "Done"'] }] }) });
  assert.match(format(s), /WARNING invalid: prds\/bad\.md: invalid status "Done"/);
});

test('6.2 readKnowledge + gitChangedSince on a real temp repo', async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { readKnowledge, gitChangedSince } = await import('../../plugins/kit/scripts/next.mjs');
  const d = tmpDir('kit-next-');
  const w = (rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
  const g = (...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
  w('knowledge/prds/gift-cards.md', '---\ntitle: G\nstatus: Building\nsources: []\nchange: gift-cards\n---\n\n## Scope\n\nS\n');
  g('init', '-q'); g('add', '.'); g('commit', '-qm', 'one');
  const c1 = g('rev-parse', '--short', 'HEAD').stdout.trim();
  w('openspec/changes/gift-cards/proposal.md', `# P\n\nPRD: \`knowledge/prds/gift-cards.md @ ${c1}\`\n`);
  w('openspec/changes/archive/2026-10-01-old/proposal.md', '# Old\n');
  w('openspec/changes/archive/2026-10-01-old/design.md', 'From note `knowledge/notes/2026-09-30-idea.md`.\n');
  w('knowledge/notes/2026-09-30-idea.md', '---\ntitle: Idea\n---\n\nI\n');
  w('knowledge/notes/2026-09-30-other.md', '---\ntitle: Other\n---\n\nO\n');
  const k = readKnowledge(d);
  assert.equal(k.dir, 'knowledge');
  assert.deepEqual(k.changes.find(c => c.name === 'gift-cards'), { name: 'gift-cards', archived: false, link: { path: 'knowledge/prds/gift-cards.md', commit: c1 } });
  assert.deepEqual(k.changes.find(c => c.name === 'old'), { name: 'old', archived: true, link: null });
  const since = gitChangedSince(d);
  assert.equal(since('knowledge/prds/gift-cards.md', c1), false);
  w('knowledge/prds/gift-cards.md', fs.readFileSync(path.join(d, 'knowledge/prds/gift-cards.md'), 'utf8') + 'edit\n');
  assert.equal(since('knowledge/prds/gift-cards.md', c1), true);
  g('commit', '-qam', 'two');
  assert.equal(since('knowledge/prds/gift-cards.md', c1), true);
  assert.equal(since('knowledge/prds/gift-cards.md', 'deadbeef'), null);
});

test('followups 4.3: two Ready PRDs on a real repo -> the newer one is named, the other listed', async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { readKnowledge } = await import('../../plugins/kit/scripts/next.mjs');
  const d = tmpDir('kit-next-order-');
  const w = (rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
  const ready = '---\ntitle: T\nstatus: Ready\nsources: []\n---\n';
  w('knowledge/prds/alpha.md', ready);
  w('knowledge/prds/zulu.md', ready);
  spawnSync('git', ['init', '-q'], { cwd: d });
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '.'], { cwd: d });
  spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'old'], { cwd: d, env: { ...process.env, GIT_COMMITTER_DATE: '2020-01-01T00:00:00Z', GIT_AUTHOR_DATE: '2020-01-01T00:00:00Z' } });
  fs.appendFileSync(path.join(d, 'knowledge/prds/zulu.md'), '\nedited today\n');
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map: kmap, knowledge: readKnowledge(d) });
  assert.equal(s.prd, 'knowledge/prds/zulu.md');
  assert.deepEqual(s.otherReady, ['alpha']);
});

test('quality-gates 5.3: tasks done -> verify owner; pass -> close; fail -> verify again', () => {
  const reg = { phases: ['verify', 'close'], tools: [
    { name: 'openspec', status: 'adopted', phases: ['verify', 'close'], overlaps: ['kit'], skills: { verify: 'openspec validate', close: '/opsx:archive' } },
    { name: 'kit', status: 'adopted', phases: ['verify'], skills: { verify: '/kit:verify' } },
  ] };
  const m = laneMap(reg);
  const base = { openspec: { root: {}, changes: [change('add-x', 5, 5)] }, statusOf: () => ({ isPlanningComplete: true }), map: m };
  const none = suggest({ ...base, verifyOf: () => 'missing' });
  assert.equal(none.use, '/kit:verify');
  assert.equal(none.then, '/opsx:archive');
  const ok = suggest({ ...base, verifyOf: () => 'pass' });
  assert.equal(ok.use, '/opsx:archive');
  assert.match(ok.reason, /verify passed: close the change/);
  const bad = suggest({ ...base, verifyOf: () => 'fail' });
  assert.equal(bad.use, '/kit:verify');
  assert.match(bad.reason, /Verify failed for "add-x"/);
});

test('quality-gates 5.3 fix: a change openspec reports as "complete" (all tasks ticked) is still active', () => {
  const c = { ...change('add-x', 3, 3), status: 'complete' };
  const s = suggest({ openspec: { root: {}, changes: [c] }, statusOf: () => ({ isPlanningComplete: true }), map, verifyOf: () => 'missing' });
  assert.equal(s.phase, 'verify');
  assert.equal(s.change, 'add-x');
});

// build-readiness 5.3
const regReady = { ...registry, phases: ['brainstorm', 'artifacts', 'plan', 'ready', 'build', 'verify', 'close'],
  tools: [...registry.tools, { name: 'kit', status: 'adopted', phases: ['ready'], skills: { ready: '/kit:ready' } }] };
const mapReady = laneMap(regReady);
const planned = () => ({ isPlanningComplete: true });

test('build-readiness 5.3: planning complete, no task checked, no readiness check -> /kit:ready, then apply', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 8)] }, statusOf: planned, map: mapReady, decisionsOf: () => ({ exists: false, open: 0, oldest: null, readyAt: null }) });
  assert.equal(s.phase, 'ready');
  assert.equal(s.use, '/kit:ready');
  assert.equal(s.then, '/opsx:apply');
  assert.match(s.reason, /warns, never blocks/);
});

test('build-readiness 5.3: build once readyAt is set, or a task is checked', () => {
  const ran = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 8)] }, statusOf: planned, map: mapReady, decisionsOf: () => ({ exists: true, open: 0, oldest: null, readyAt: { date: '2026-10-12' } }) });
  assert.equal(ran.phase, 'build');
  const started = suggest({ openspec: { root: {}, changes: [change('add-x', 1, 8)] }, statusOf: planned, map: mapReady });
  assert.equal(started.phase, 'build');
  const oldRegistry = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 8)] }, statusOf: planned, map });
  assert.equal(oldRegistry.phase, 'build', 'no ready owner in the lane map -> unchanged behavior');
});

test('build-readiness 5.3: open decisions add a line to any suggestion; absent at zero', () => {
  const dec = open => () => ({ exists: true, open, oldest: '2026-10-12', readyAt: { date: '2026-10-12' } });
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 2, 8)] }, statusOf: planned, map: mapReady, decisionsOf: dec(2) });
  assert.equal(s.open, '2 decisions still open since 2026-10-12');
  assert.match(format(s), /open:  2 decisions still open since 2026-10-12/);
  const v = suggest({ openspec: { root: {}, changes: [change('add-x', 8, 8)] }, statusOf: planned, map: mapReady, decisionsOf: dec(1), verifyOf: () => 'missing' });
  assert.equal(v.phase, 'verify');
  assert.equal(v.open, '1 decision still open since 2026-10-12');
  assert.equal(suggest({ openspec: { root: {}, changes: [change('add-x', 2, 8)] }, statusOf: planned, map: mapReady, decisionsOf: dec(0) }).open, undefined);
});

test('build-readiness 5.3: applyRequires done = planning complete, even with an optional design unwritten', () => {
  const st = () => ({ isPlanningComplete: false, applyRequires: ['tasks'], artifacts: [{ id: 'proposal', status: 'done' }, { id: 'specs', status: 'done' }, { id: 'design', status: 'ready' }, { id: 'tasks', status: 'done' }] });
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 2, 8)] }, statusOf: st, map });
  assert.equal(s.phase, 'build');
});

// verify C1: OpenSpec's applyRequires plus the files check
test('applyRequires done but the files check says specs are missing -> still planning, next artifact specs', () => {
  const statusOf = () => ({ applyRequires: ['tasks'], artifacts: [{ id: 'proposal', status: 'done' }, { id: 'tasks', status: 'done' }], files: { complete: false, nextArtifact: 'specs' } });
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 8)] }, statusOf, map: mapReady });
  assert.equal(s.phase, 'plan');
  assert.equal(s.nextArtifact, 'specs');
  const ok = () => ({ applyRequires: ['tasks'], artifacts: [{ id: 'tasks', status: 'done' }, { id: 'design', status: 'ready' }], files: { complete: true, nextArtifact: null } });
  assert.equal(suggest({ openspec: { root: {}, changes: [change('add-x', 0, 8)] }, statusOf: ok, map: mapReady }).phase, 'ready');
});

// build-readiness 6.2: PRD open questions put off for later ride along as a reminder
import { questionsLine } from '../../plugins/kit/scripts/next.mjs';
test('6.2: a Draft PRD with open questions adds a reminder to any suggestion; Ready or none -> no line', () => {
  const k = K({ prds: [P('sidebar', 'Draft', { openQuestions: 4 }), P('old', 'Review', { openQuestions: 1 }), P('done', 'Ready', { openQuestions: 2 })] });
  assert.equal(questionsLine(k), 'PRD "sidebar" has 4 open question(s) to answer before Ready (/kit:prd); 1 more PRD(s) with open questions');
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: k });
  assert.equal(s.questions, questionsLine(k));
  assert.match(format(s), /\n  later: PRD "sidebar" has 4 open question/);
  assert.equal(questionsLine(K({ prds: [P('a', 'Draft', { openQuestions: 0 }), P('b', 'Ready', { openQuestions: 3 })] })), null);
  assert.equal(suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K() }).questions, undefined);
});

// kit-docs 5.2: stale docs page reminder (never the next step)
import { docsLine } from '../../plugins/kit/scripts/next.mjs';
import { tmpDir } from '../../tools/test-root.mjs';
test('kit-docs: a stale docs page adds a reminder line; no page -> none; the step is unchanged', () => {
  assert.equal(docsLine({ exists: true, stale: true }), 'docs page is older than the last archive; run /kit:docs');
  assert.equal(docsLine({ exists: true, stale: false }), null);
  assert.equal(docsLine({ exists: false, stale: false }), null);
  assert.equal(docsLine(null), null);
  const line = docsLine({ exists: true, stale: true });
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map, docs: line });
  assert.equal(s.phase, 'status');
  assert.equal(s.docs, line);
  assert.match(format(s), /\n  docs:  docs page is older than the last archive; run \/kit:docs/);
  assert.equal(suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map }).docs, undefined);
});

// kit-followups 2.3: a Ready PRD waits while a change is active
test('Ready PRD waits for the active change: suggestion stays on the change, with a waiting line', () => {
  const allDone = status([['proposal', 'done'], ['specs', 'done'], ['design', 'done'], ['tasks', 'done']]);
  const s = suggest({ openspec: { root: {}, changes: [change('acme-canvas', 2, 5)] }, statusOf: allDone, map: kmap, knowledge: K({ prds: [P('gift-cards', 'Ready')] }) });
  assert.equal(s.use, '/opsx:apply');
  assert.equal(s.change, 'acme-canvas');
  assert.match(s.waiting, /PRD gift-cards is Ready; it waits until acme-canvas is done/);
  assert.match(format(s), /PRD gift-cards is Ready; it waits until acme-canvas is done/);
});

// kit-followups 4.3: decisions left open in archived changes ride along, never replacing the step
test('archived open decisions add one line; the suggested step is unchanged', () => {
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map, archived: { open: 2, oldest: '2026-10-12', changes: ['acme-canvas'] } });
  assert.match(s.reason, /^Nothing open\. 2 items left for later/);
  assert.match(s.archived, /^2 decisions still open in archived changes \(acme-canvas\)/);
  assert.match(format(s), /2 decisions still open in archived changes/);
  assert.equal(suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map }).archived, undefined);
});

// ---------- kit-status verify C1-C3 ----------

test('verify C1: with --change B, a PRD step about change A does not win', () => {
  const openspec = { root: {}, changes: [change('a', 1, 5, '2026-10-02T00:00:00Z'), change('b', 1, 5, '2026-10-01T00:00:00Z')] };
  const knowledge = K({ prds: [P('pa', 'Building', { change: 'a' })], changes: [{ name: 'a', archived: false, link: { path: 'knowledge/prds/pa.md', commit: 'abc1234' } }] });
  const changedSince = () => true;
  const unnamed = suggest({ openspec, statusOf: () => ({ isPlanningComplete: true }), map: kmap, knowledge, changedSince });
  assert.equal(unnamed.change, 'a', 'PRD changed since planning: review a');
  const s = suggest({ openspec, statusOf: () => ({ isPlanningComplete: true }), map: kmap, knowledge, changedSince, change: 'b' });
  assert.equal(s.change, 'b');
  assert.equal(s.use, '/opsx:apply');
});

test('verify C2: the waiting reminder names the picked change', () => {
  const openspec = { root: {}, changes: [change('a', 1, 5, '2026-10-02T00:00:00Z'), change('b', 1, 5, '2026-10-01T00:00:00Z')] };
  const s = suggest({ openspec, statusOf: () => ({ isPlanningComplete: true }), map: kmap, knowledge: K({ prds: [P('gift', 'Ready')] }), change: 'b' });
  assert.match(s.waiting, /until b is done/);
});

test('verify C3: --change with nothing active -> "Nothing open", not an empty choice', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map, change: 'foo' });
  assert.equal(s.use, '/kit:status');
  assert.equal(s.choose, undefined);
});

// ---------- loose-ends 3.2 (spec skill-routing "Next-step suggestion") ----------
const L = (id, kind, extra = {}) => ({ id, text: `t ${id}`, kind, state: 'open', blocks: null, ...extra });

test('loose ends count in "Nothing open" (accepted excluded)', () => {
  const loose = [L('L1', 'check'), L('L2', 'idea'), L('L3', 'cleanup'), L('L4', 'accepted'), L('L5', 'idea', { state: 'done' })];
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, loose });
  assert.equal(s.reason, "Nothing open. 3 items left for later (3 loose ends). Run /kit:status to see what's next, or /kit:roadmap to change the order.");
});

test('a loose end blocking the change rides along as a reminder; the step is unchanged', () => {
  const loose = [L('L3', 'check', { text: 'Check paste from Word', blocks: 'tables-in-notes' }), L('L4', 'check', { blocks: 'other' })];
  const s = suggest({ openspec: { root: {}, changes: [change('tables-in-notes', 2, 5)] }, statusOf: () => ({ isPlanningComplete: true }), map, loose });
  assert.equal(s.use, '/opsx:apply');
  assert.deepEqual(s.blocked, ['L3 Check paste from Word']);
  assert.match(format(s), /\n  blocked by: L3 Check paste from Word \(\/kit:loose-ends\)/);
});

// ---------- loose-ends verify C2 ----------
test('verify C2: an unreadable loose-ends.md is a warning in next, not silence', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map, looseWarning: "knowledge/loose-ends.md exists but its data can't be read" });
  assert.match(format(s), /WARNING knowledge\/loose-ends\.md exists but its data can't be read/);
});

// ---------- explore-stage 2.1 (spec skill-routing "Next-step suggestion") ----------
import { outsideChange } from '../../plugins/kit/scripts/next.mjs';
const xmap = laneMap({
  phases: ['capture', 'prd', 'roadmap', ...registry.phases],
  tools: [...registry.tools, { name: 'kit', status: 'adopted', phases: ['capture', 'prd', 'roadmap'], skills: { capture: '/kit:capture', prd: '/kit:prd', roadmap: '/kit:roadmap' } }],
});
const rec = (slug, questions = [], prd = null) => ({ slug, title: slug.replace(/-/g, ' '), file: `explore/${slug}.md`, questions, prd, state: prd ? 'in-prd' : questions.length ? 'exploring' : 'ready-for-prd' });
const RM = (rows, current, next = null) => ({ exists: true, current, next, rows });
const row = (id, title, status, left, total = left.length + 1) => ({ id, title, status, total, done: total - left.length, left: left.map((text, i) => ({ n: i + 2, text })) });

test('explore with open questions -> /opsx:explore naming them', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, explores: [rec('kit-status', [{ id: 'Q1', text: 'one command or two' }, { id: 'Q2', text: 'status vs roadmap report' }])] });
  assert.equal(s.use, '/opsx:explore');
  assert.match(s.reason, /Explore "kit status" still has open questions: Q1 one command or two; Q2 status vs roadmap report/);
  assert.match(format(s), /record: explore\/kit-status\.md/);
});

test('explore ready for a PRD -> /kit:prd naming it; an explore in a PRD is not open', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, explores: [rec('kit-status'), rec('old', [], 'prds/old.md')] });
  assert.equal(s.use, '/kit:prd');
  assert.match(s.reason, /Explore "kit status" has no open questions: write the PRD from it/);
});

test('several open explores -> choose; --explore picks one', () => {
  const explores = [rec('a-one', [{ id: 'Q1', text: 'x' }]), rec('b-two')];
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, explores });
  assert.equal(s.phase, 'choose');
  assert.deepEqual(s.choose, ['a-one', 'b-two']);
  assert.equal(suggest({ openspec: os0, statusOf: () => null, map: xmap, explores, explore: 'b-two' }).use, '/kit:prd');
});

test('an active change wins over open explores', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 1, 4)] }, statusOf: () => ({ isPlanningComplete: true }), map: xmap, explores: [rec('kit-status')] });
  assert.equal(s.use, '/opsx:apply');
});

test('nothing in a flow, roadmap -> the next open task; start with /opsx:explore', () => {
  const roadmap = RM([row('M12a', 'Kit workflow', 'active', ['/kit:next offers explore or PRD'], 4)], 'M12a');
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, roadmap });
  assert.equal(s.use, '/opsx:explore');
  assert.match(s.reason, /^Next on the roadmap: M12a T2 \/kit:next offers explore or PRD \(Kit workflow\)\. Start with \/opsx:explore\./);
});

test('current milestone all done -> says so, names the next one, points to /kit:roadmap; writes nothing', () => {
  const roadmap = RM([row('M12a', 'Kit workflow', 'active', [], 4), row('M12', 'Acme proof', 'planned', ['x'])], 'M12a', 'M12');
  const s = outsideChange({ map: xmap, roadmap, leftover: { total: 0 } });
  assert.equal(s.use, '/kit:roadmap');
  assert.equal(s.reason, 'M12a Kit workflow is done. Next: M12 Acme proof. Mark M12a done with /kit:roadmap, then start with /opsx:explore.');
});

test('L17: reasons name the lane owner from the lane map, not hard-coded commands', () => {
  const ymap = laneMap({
    phases: ['capture', 'prd', 'roadmap', ...registry.phases],
    tools: [
      ...registry.tools.map(t => (t.name === 'openspec' ? { ...t, phases: t.phases.filter(p => p !== 'brainstorm') } : t)),
      { name: 'kit', status: 'adopted', phases: ['capture', 'prd', 'roadmap'], skills: { capture: '/kit:capture', prd: '/kit:prd', roadmap: '/kit:plan-order' } },
      { name: 'thinker', status: 'adopted', phases: ['brainstorm'], skills: { brainstorm: '/thinker:explore' } },
    ],
  });
  const next = outsideChange({ map: ymap, roadmap: RM([row('M1', 'One', 'active', ['x'], 2)], 'M1') });
  assert.match(next.reason, /Start with \/thinker:explore\./);
  assert.doesNotMatch(next.reason, /\/opsx:explore/);
  const done = outsideChange({ map: ymap, roadmap: RM([row('M1', 'One', 'active', [], 2), row('M2', 'Two', 'planned', ['y'])], 'M1', 'M2') });
  assert.match(done.reason, /Mark M1 done with \/kit:plan-order, then start with \/thinker:explore\./);
});

test('new project: /kit:capture, and the reason names /opsx:explore (spec "Empty project after setup")', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, knowledge: K({}) });
  assert.equal(s.use, '/kit:capture');
  assert.equal(s.reason, 'Nothing here yet. Start with /kit:capture to save ideas and notes, or /opsx:explore to explore an idea you already have.');
  // Open loose ends are counted on a new project too (S4).
  const withLoose = suggest({ openspec: os0, statusOf: () => null, map: xmap, knowledge: K({}), loose: [L('L1', 'idea')] });
  assert.equal(withLoose.reason, 'Nothing here yet. 1 item left for later (1 loose end). Start with /kit:capture to save ideas and notes, or /opsx:explore to explore an idea you already have.');
  // Without a knowledge folder the project isn't one the kit set up: the suggestion stays as before.
  assert.equal(suggest({ openspec: os0, statusOf: () => null, map: xmap, knowledge: null }).use, '/kit:status');
});

test('project with history: "Nothing open" as before (spec "Project with history")', () => {
  const k = K({ changes: [{ name: 'gift-cards', archived: true, link: null, notes: [] }] });
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: k });
  assert.equal(s.use, '/kit:status');
  assert.match(s.reason, /^Nothing open\./);
  // A note, a PRD or an explore record also count as history.
  assert.equal(suggest({ openspec: os0, statusOf: () => null, map: xmap, knowledge: K({ notes: [{ path: 'notes/a.md' }] }) }).use, '/kit:status');
});

test('C1: an active milestone whose every task is dropped is reported as done', () => {
  const allDropped = { id: 'M5', title: 'Five', status: 'active', total: 0, done: 0, dropped: 2, left: [] };
  const s = outsideChange({ map: xmap, roadmap: RM([allDropped, row('M6', 'Six', 'planned', ['x'])], 'M5', 'M6') });
  assert.equal(s.use, '/kit:roadmap');
  assert.match(s.reason, /^M5 Five is done\. Next: M6 Six\./);
});

test('C9: a lane owner without a command is left out, never named by its bare tool name', () => {
  const zmap = laneMap({
    phases: ['roadmap', ...registry.phases],
    tools: [...registry.tools.map(t => (t.name === 'openspec' ? { ...t, phases: t.phases.filter(p => p !== 'brainstorm') } : t)),
      { name: 'kit', status: 'adopted', phases: ['roadmap'], skills: { roadmap: '/kit:roadmap' } },
      { name: 'plainTool', status: 'adopted', phases: ['brainstorm'] }],
  });
  const s = outsideChange({ map: zmap, roadmap: RM([row('M1', 'One', 'active', ['x'], 2)], 'M1') });
  assert.doesNotMatch(s.reason, /plainTool/);
  assert.doesNotMatch(s.reason, /Start with/);
});

test('nothing in a flow and no roadmap -> "Nothing open" (status)', () => {
  assert.equal(outsideChange({ map, roadmap: null }).use, '/kit:status');
});

// ---------- explore-stage verify C1, C6 ----------
test('verify C6: --explore with an unknown name says so, even with one open explore', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, explores: [rec('kit-status')], explore: 'board-phon' });
  assert.equal(s.phase, 'choose');
  assert.match(s.reason, /No open explore named "board-phon"/);
});

test('verify C1: an unreadable record is a warning and never counts as open', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: xmap, explores: [{ slug: 'bad', state: 'unreadable', error: "explore/bad.md can't be read: x", questions: [] }, rec('good')] });
  assert.equal(s.use, '/kit:prd');
  assert.match(format(s), /WARNING explore\/bad\.md can't be read/);
});
