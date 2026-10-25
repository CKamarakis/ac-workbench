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
  assert.match(block, /`\/opsx:propose`: take one PRD from `knowledge\/prds\/` as the main input/);
  assert.match(block, /`PRD: knowledge\/prds\/<slug>\.md @ <commit>`/);
  assert.ok(block.endsWith(BLOCK_END));
});

test('prd-parts 3.2: routing block: propose from a part with a parent line; the change offer goes to the part', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { knowledgeDir: 'docs/kb' });
  assert.match(block, /`docs\/kb\/prds\/<slug>\/<part>\.md` with `part-of: <slug>`/);
  assert.match(block, /never from a parent that has parts/);
  assert.match(block, /`PRD parent: docs\/kb\/prds\/<slug>\.md @ <commit>`/);
  assert.match(block, /offer below goes to the part/);
});

test('prd-authoring: Several PRDs, Draft PRD (most recent by default, never a stop)', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { knowledgeDir: 'knowledge' });
  assert.match(block, /else the most recently updated one with no `change` \(say which, and name the others so the user can switch\)/);
  assert.match(block, /isn't `Ready` gets a one-line note, never a stop/);
});

test('followups 5.7: routing block carries the library docs rule (npx, no sign-in)', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { knowledgeDir: 'knowledge', libraryDocs: true });
  assert.match(block, /### Library docs/);
  assert.match(block, /npx -y ctx7@latest library <name>/);
  assert.match(block, /No install or sign-in is needed/);
  assert.match(block, /error that comes from a library/);
  assert.ok(block.endsWith(BLOCK_END));
});

test('quality-gates 5.2: routing block carries the verify-before-archive rules, and no flow judge', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { qualityGates: true });
  assert.match(block, /### Quality gates/);
  assert.doesNotMatch(block, /kit:judge|SuperSpec/i);
  assert.match(block, /Before `\/opsx:archive`, run `\/kit:verify`/);
  assert.match(block, /only when the user explicitly asks, with their reason/);
});

test('build-readiness 5.2: routing block carries the /kit:ready and Given/When/Then rules; earlier lines unchanged', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { qualityGates: true });
  assert.match(block, /before `\/opsx:apply`, offer `\/kit:ready`/);
  assert.match(block, /It warns and never blocks\./);
  assert.match(block, /Given\/When\/Then stories, write the scenarios from them; add a `- \*\*GIVEN\*\*` line/);
  const lines = block.split('\n');
  const ready = lines.findIndex(l => l.includes('offer `/kit:ready`'));
  const verify = lines.findIndex(l => l.includes('Before `/opsx:archive`, run `/kit:verify`'));
  assert.ok(ready >= 0 && verify > ready, 'ready comes before verify');
  assert.equal(routingBlock(laneMap(fixture('resolved-overlap')), {}).includes('/kit:ready`: it lists'), false, 'only with qualityGates');
});

test('kit-docs 5.3: the real registry has a docs phase after close, owned by the kit with /kit:docs', () => {
  const reg = YAML.parse(fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8'));
  assert.equal(reg.phases.indexOf('docs'), reg.phases.indexOf('close') + 1);
  const lane = laneMap(reg).lanes.find(l => l.phase === 'docs');
  assert.equal(lane.owner.name, 'kit');
  assert.equal(lane.owner.skill, '/kit:docs');
});

// roadmap-structure 4.3 (spec skill-routing "Roadmap phase in the lane map")
test('the real registry has a roadmap phase, owned by the kit with /kit:roadmap', () => {
  const reg = YAML.parse(fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8'));
  const lane = laneMap(reg).lanes.find(l => l.phase === 'roadmap');
  assert.equal(lane.owner.name, 'kit');
  assert.equal(lane.owner.skill, '/kit:roadmap');
});

// kit-status 3.1 (spec skill-routing "Status phase in the lane map")
test('the real registry has a status phase, owned by the kit with /kit:status', () => {
  const reg = YAML.parse(fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8'));
  const lane = laneMap(reg).lanes.find(l => l.phase === 'status');
  assert.equal(lane.owner.name, 'kit');
  assert.equal(lane.owner.skill, '/kit:status');
});

// kit-harness-review 2.1: assess phase; kit issues go to GitHub, never /kit:feedback
test('the real registry has an assess phase owned by the kit with /kit:harness-review', () => {
  const reg = YAML.parse(fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8'));
  const lane = laneMap(reg).lanes.find(l => l.phase === 'assess');
  assert.equal(lane.owner.name, 'kit');
  assert.equal(lane.owner.skill, '/kit:harness-review');
});

test('the routing block sends kit issues to GitHub and never names /kit:feedback', () => {
  const reg = YAML.parse(fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8'));
  const block = routingBlock(laneMap(reg), { kitVersion: 'x' });
  assert.doesNotMatch(block, /kit:feedback/);
  assert.match(block, /\| kit-issues \| `github\.com\/CKamarakis\/ac-workbench\/issues` \|/);
});

// loose-ends 2.2, 2.3 (spec skill-routing "Loose ends phase in the lane map", "Loose ends rule in the routing block")
test('the real registry has a loose-ends phase, owned by the kit with /kit:loose-ends', () => {
  const reg = YAML.parse(fs.readFileSync(path.join(repo, 'toolkit.yaml'), 'utf8'));
  const lane = laneMap(reg).lanes.find(l => l.phase === 'loose-ends');
  assert.equal(lane.owner.name, 'kit');
  assert.equal(lane.owner.skill, '/kit:loose-ends');
});

test('the routing block carries the end-of-step loose ends rule', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { knowledgeDir: 'knowledge' });
  assert.match(block, /- Loose ends: during a step .*At the end of the step, offer them once as one numbered list through `\/kit:loose-ends` \(`knowledge\/loose-ends\.md`\)/);
});

// explore-stage 3.1 (spec skill-routing "Explore rule in the routing block")
test('the routing block carries the explore rule naming /kit:explore-record', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { knowledgeDir: 'knowledge' });
  assert.match(block, /- Explore: a flow starts at `\/opsx:explore` .*Notes are input an explore reads, never a step of their own\. .*with `\/kit:explore-record` by default, without asking/);
});

test('build-safeguards 2.3: routing block tells apply to follow design.md Safeguards (worktree from the branch, subagents only when chosen)', () => {
  const block = routingBlock(laneMap(fixture('resolved-overlap')), { qualityGates: true });
  assert.match(block, /At `\/opsx:apply`, follow the `## Safeguards` section/);
  assert.match(block, /git worktree add \.claude\/worktrees\/<change> -b wt\/<change>/);
  assert.match(block, /EnterWorktree/);
  assert.match(block, /No Safeguards section: build in the current branch, with no worktree and no subagents\./);
});
