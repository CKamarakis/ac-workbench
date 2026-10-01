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
