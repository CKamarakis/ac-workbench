import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { laneMap, formatLanes, routingBlock, BLOCK_START, BLOCK_END } from '../../plugins/kit/scripts/lanes.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const fixture = name => YAML.parse(fs.readFileSync(path.join(repo, 'evals/registry/fixtures', `${name}.yaml`), 'utf8'));
const t = (name, status, phases, extra = {}) => ({ name, status, phases, ...extra });

test('complete map: every phase has exactly one owner or is unowned', () => {
  const map = laneMap(fixture('valid'));
  for (const l of map.lanes) assert.ok(l.owner ? l.conflict.length === 0 : true);
  assert.deepEqual(map.lanes.map(l => l.phase), fixture('valid').phases);
  assert.equal(map.lanes.find(l => l.phase === 'artifacts').owner.name, 'openspec');
  assert.equal(map.lanes.find(l => l.phase === 'build').owner.name, 'superpowers');
});

test('unowned phases are listed', () => {
  const map = laneMap(fixture('valid'));
  assert.deepEqual(map.unowned, ['review']);
  assert.match(formatLanes(map), /review\s+unowned/);
});

test('resolved overlap: the tool listing the other under overlaps defers to it', () => {
  const map = laneMap(fixture('resolved-overlap'));
  const plan = map.lanes.find(l => l.phase === 'plan');
  assert.equal(plan.owner.name, 'openspec');
  assert.deepEqual(plan.alternatives.map(a => a.name), ['superpowers']);
  assert.deepEqual(map.conflicts, []);
});

test('adopted beats trial when neither defers', () => {
  const map = laneMap({ phases: ['build'], tools: [t('a', 'trial', ['build']), t('b', 'adopted', ['build'])] });
  assert.equal(map.lanes[0].owner.name, 'b');
});

test('unresolvable tie is a conflict, never a guess', () => {
  const map = laneMap({ phases: ['build'], tools: [t('a', 'adopted', ['build']), t('b', 'adopted', ['build'])] });
  assert.equal(map.lanes[0].owner, null);
  assert.deepEqual(map.conflicts, [{ phase: 'build', tools: ['a', 'b'] }]);
  assert.match(formatLanes(map), /CONFLICT: a, b/);
});

test('dropped and later tools never own a phase', () => {
  const map = laneMap({ phases: ['build'], tools: [t('old', 'dropped', ['build']), t('soon', 'later', ['build'])] });
  assert.deepEqual(map.unowned, ['build']);
});

test('skip list collects skip_skills of active tools only', () => {
  const map = laneMap({ phases: [], tools: [t('a', 'trial', [], { skip_skills: ['a:x'] }), t('b', 'dropped', [], { skip_skills: ['b:y'] })] });
  assert.deepEqual(map.skip, [{ tool: 'a', skill: 'a:x' }]);
});

test('routing block matches the golden file', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { kitVersion: '0.0.0-test' });
  const golden = fs.readFileSync(path.join(here, 'fixtures', 'routing-block.golden.md'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  assert.equal(block, golden);
  assert.ok(block.startsWith(BLOCK_START) && block.endsWith(BLOCK_END));
});

test('validator prints the lane map and needs-review flags for an updated tool', async () => {
  const { spawnSync } = await import('node:child_process');
  const r = spawnSync('node', [path.join(repo, 'tools/validate-registry.mjs'), path.join(repo, 'evals/registry/fixtures/needs-review.yaml')], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /superpowers: needs review \(installed 5\.1\.0, reviewed 5\.0\.0\)/);
  assert.match(r.stdout, /Lane map/);
  assert.match(r.stdout, /artifacts\s+openspec/);
  assert.match(r.stdout, /review\s+unowned/);
});

test('prd-pipeline 5.2: routing block names the knowledge folder and the PRD handoff', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { kitVersion: '0.0.0-test', knowledgeDir: 'knowledge' });
  assert.match(block, /### Knowledge and PRDs/);
  assert.match(block, /`\/opsx:propose`: if a PRD in `knowledge\/prds\/` has `status: Ready`/);
  assert.match(block, /`PRD: knowledge\/prds\/<slug>\.md @ <commit>`/);
  assert.ok(block.endsWith(BLOCK_END));
});
