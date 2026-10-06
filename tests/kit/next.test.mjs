import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggest, format } from '../../plugins/kit/scripts/next.mjs';
import { laneMap } from '../../plugins/kit/scripts/lanes.mjs';

const registry = {
  phases: ['brainstorm', 'artifacts', 'plan', 'build', 'verify', 'close'],
  tools: [
    { name: 'openspec', status: 'adopted', phases: ['brainstorm', 'artifacts', 'plan', 'build', 'verify', 'close'],
      skills: { brainstorm: '/opsx:explore', artifacts: '/opsx:propose', plan: '/opsx:continue', build: '/opsx:apply', verify: 'openspec validate --strict', close: '/opsx:archive' } },
    { name: 'superspec', status: 'trial', overlaps: ['openspec'], skip_skills: ['x'], phases: ['build'], skills: { build: '/opsx:apply (worktree)' } },
  ],
};
const map = laneMap(registry);
const change = (name, done, total, lastModified = '2026-10-01T10:00:00Z') => ({ name, completedTasks: done, totalTasks: total, lastModified, status: 'in-progress' });
const status = arts => () => ({ artifacts: arts.map(([id, s]) => ({ id, status: s })) });

test('no OpenSpec in the folder -> /kit:start', () => {
  const s = suggest({ openspec: { root: null, changes: [] }, statusOf: () => null, map });
  assert.equal(s.use, '/kit:start');
});

test('no active change -> brainstorm owner (e.g. /opsx:explore)', () => {
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map });
  assert.equal(s.phase, 'brainstorm');
  assert.equal(s.use, '/opsx:explore');
  assert.equal(s.owner, 'openspec');
  assert.match(s.reason, /No active change/);
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
  assert.deepEqual(s.alternatives, [{ tool: 'superspec', use: '/opsx:apply (worktree)' }]);
  assert.match(format(s), /alternative: \/opsx:apply \(worktree\) \(superspec\)/);
});

test('all tasks done -> verify, then close', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 10, 10)] }, statusOf: () => ({ isPlanningComplete: true }), map });
  assert.equal(s.phase, 'verify');
  assert.equal(s.use, 'openspec validate --strict');
  assert.equal(s.then, '/opsx:archive');
});

test('several active changes: the most recently modified one, others listed', () => {
  const s = suggest({ openspec: { root: {}, changes: [change('old', 1, 5, '2026-09-01T00:00:00Z'), change('new', 1, 5, '2026-10-01T00:00:00Z')] }, statusOf: () => ({ isPlanningComplete: true }), map });
  assert.equal(s.change, 'new');
  assert.deepEqual(s.otherActive, ['old']);
});

test('owner comes from the lane map: changing the registry changes the suggestion', () => {
  const reg2 = { ...registry, tools: [{ ...registry.tools[0], skills: { ...registry.tools[0].skills, build: '/custom:build' } }] };
  const s = suggest({ openspec: { root: {}, changes: [change('add-x', 0, 4)] }, statusOf: () => ({ isPlanningComplete: true }), map: laneMap(reg2) });
  assert.equal(s.use, '/custom:build');
});

test('unowned phase is said plainly, never guessed', () => {
  const s = suggest({ openspec: { root: {}, changes: [] }, statusOf: () => null, map: laneMap({ phases: ['brainstorm'], tools: [] }) });
  assert.match(s.use, /no owner yet for "brainstorm"/);
});

// ---------- prd-pipeline 6.1: PRD-aware suggestions ----------
import { prdSuggest, prdLink } from '../../plugins/kit/scripts/next.mjs';

const kmap = laneMap({
  phases: ['capture', 'prd', ...registry.phases],
  tools: [...registry.tools, { name: 'kit', status: 'adopted', phases: ['capture', 'prd'], skills: { capture: '/kit:capture', prd: '/kit:prd' } }],
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

test('archived change -> suggest marking the PRD Shipped (nothing written)', () => {
  const k = K({ prds: [P('gift-cards', 'Building', { change: 'gift-cards' })], changes: [{ name: 'gift-cards', archived: true, link: null }] });
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: k });
  assert.equal(s.use, '/kit:prd');
  assert.match(s.reason, /archived: mark PRD "gift-cards" Shipped \(only on your yes\)/);
});

test('notes but no PRD and no active change -> /kit:prd', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K({ notes: [{ path: 'notes/a.md', title: 'A' }] }) });
  assert.equal(s.use, '/kit:prd');
  assert.match(s.reason, /1 note\(s\) in knowledge\/notes and no PRD yet/);
});

test('no knowledge folder -> same suggestion as before', () => {
  const without = suggest({ openspec: os0, statusOf: () => null, map: kmap });
  const missing = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: { dir: 'knowledge', list: { exists: false, notes: [], prds: [], invalid: [] }, changes: [] } });
  assert.deepEqual(missing, without);
  assert.equal(without.use, '/opsx:explore');
});

test('invalid PRDs are reported as warnings', () => {
  const s = suggest({ openspec: os0, statusOf: () => null, map: kmap, knowledge: K({ invalid: [{ path: 'prds/bad.md', errors: ['invalid status "Done"'] }] }) });
  assert.match(format(s), /WARNING invalid: prds\/bad\.md: invalid status "Done"/);
});

test('6.2 readKnowledge + gitChangedSince on a real temp repo', async () => {
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { readKnowledge, gitChangedSince } = await import('../../plugins/kit/scripts/next.mjs');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-next-'));
  const w = (rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
  const g = (...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
  w('knowledge/prds/gift-cards.md', '---\ntitle: G\nstatus: Building\nsources: []\nchange: gift-cards\n---\n\n## Scope\n\nS\n');
  g('init', '-q'); g('add', '.'); g('commit', '-qm', 'one');
  const c1 = g('rev-parse', '--short', 'HEAD').stdout.trim();
  w('openspec/changes/gift-cards/proposal.md', `# P\n\nPRD: \`knowledge/prds/gift-cards.md @ ${c1}\`\n`);
  w('openspec/changes/archive/2026-10-01-old/proposal.md', '# Old\n');
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
