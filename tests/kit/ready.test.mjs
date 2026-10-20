import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scan, vagueHits, requirements, recommend, writeSafeguards, readSafeguards, importers } from '../../plugins/kit/scripts/ready.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';

const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
const SPEC = [
  '## ADDED Requirements', '',
  '### Requirement: Upload an image',
  'The editor SHALL upload images. Size limit TBD.', '',
  '#### Scenario: Upload',
  '- **GIVEN** a note', '- **WHEN** the user drops an image', '- **THEN** it appears', '',
  '### Requirement: Empty',
  'Something without scenarios?', '',
].join('\n');

function project({ tasks = true, pkg = { dependencies: { '@dnd-kit/core': '^6' }, devDependencies: { vitest: '^3' } }, prd = true } = {}) {
  const d = tmpDir('kit-ready-');
  w(d, 'openspec/changes/add-x/proposal.md', `# Proposal\n\nPRD: knowledge/prds/upload.md @ abc1234\n\nUse \`TBD\` in code, it's fine.\n`);
  w(d, 'openspec/changes/add-x/specs/upload/spec.md', SPEC);
  w(d, 'openspec/changes/add-x/design.md', '# Design\n\nKeep it fast.\n\n```\nTODO inside a fence\n```\n');
  if (tasks) w(d, 'openspec/changes/add-x/tasks.md', '# Tasks\n\n- [ ] 1.1 Do it\n');
  if (pkg) w(d, 'package.json', JSON.stringify(pkg));
  if (prd) w(d, 'knowledge/prds/upload.md', '---\ntitle: Upload\nstatus: Ready\n---\nUploads should be nice, etc.\n');
  return d;
}

// 3.1
test('a TBD in a spec is reported with its line; fences and inline code are skipped', () => {
  const s = scan({ dir: project(), change: 'add-x' });
  assert.equal(s.planningComplete, true);
  const at = s.vague.map(v => v.at);
  assert.ok(at.includes('openspec/changes/add-x/specs/upload/spec.md:4'));
  assert.ok(at.includes('openspec/changes/add-x/design.md:3'), 'fast');
  assert.ok(!s.vague.some(v => /fence/.test(v.text)), 'TODO in a fence is skipped');
  assert.ok(!s.vague.some(v => v.at.endsWith('proposal.md:5')), 'inline code is skipped');
  assert.ok(s.vague.some(v => v.at === 'knowledge/prds/upload.md:5' && v.words.includes('nice') && v.words.includes('etc.')));
});

test('a "?" counts on a requirement line of a spec, not on scenario bullets', () => {
  const hits = vagueHits('s.md', SPEC, { spec: true });
  assert.ok(hits.some(h => h.at === 's.md:12' && h.words.includes('?')));
  assert.deepEqual(vagueHits('p.md', 'Why? Because.\n'), []);
  assert.deepEqual(vagueHits('p.md', 'Flags words such as "fast" or “nice”.\n'), [], 'quoted words are mentions');
});

test('requirements with scenario and GIVEN counts; the linked PRD', () => {
  const s = scan({ dir: project(), change: 'add-x' });
  assert.deepEqual(s.requirements.map(r => [r.name, r.scenarios, r.given]), [['Upload an image', 1, 1], ['Empty', 0, 0]]);
  assert.deepEqual(s.prd, { path: 'knowledge/prds/upload.md', commit: 'abc1234', exists: true });
  assert.deepEqual(requirements('x', '## MODIFIED Requirements\n### Requirement: A\n#### Scenario: s\n'), [{ spec: 'x', name: 'A', scenarios: 1, given: 0 }]);
});

test('dependencies come from package.json; a missing package.json gives null', () => {
  assert.deepEqual(scan({ dir: project(), change: 'add-x' }).dependencies, { dependencies: { '@dnd-kit/core': '^6' }, devDependencies: { vitest: '^3' } });
  assert.equal(scan({ dir: project({ pkg: null }), change: 'add-x' }).dependencies, null);
});

test('a change without tasks reports the next artifact', () => {
  const s = scan({ dir: project({ tasks: false }), change: 'add-x' });
  assert.equal(s.planningComplete, false);
  assert.equal(s.nextArtifact, 'tasks');
});

test('OpenSpec status, when available, decides completeness', () => {
  const statusOf = () => ({ isPlanningComplete: false, artifacts: [{ id: 'proposal', status: 'done' }, { id: 'design', status: 'ready' }] });
  const s = scan({ dir: project(), change: 'add-x', statusOf });
  assert.equal(s.planningComplete, false);
  assert.equal(s.nextArtifact, 'design');
});

test('ready to apply follows applyRequires: a missing optional design does not block', () => {
  const statusOf = () => ({ isPlanningComplete: false, applyRequires: ['tasks'], artifacts: [{ id: 'proposal', status: 'done' }, { id: 'design', status: 'ready' }, { id: 'tasks', status: 'done' }] });
  assert.equal(scan({ dir: project(), change: 'add-x', statusOf }).planningComplete, true);
});

test('unknown change and bad names are errors', () => {
  assert.throws(() => scan({ dir: project(), change: 'nope' }), /change not found/);
  assert.throws(() => scan({ dir: project(), change: 'Bad Name' }), /kebab-case/);
});

test('a vague word in a requirement heading is flagged; a "?" in a heading is not', () => {
  const hits = vagueHits('s.md', '### Requirement: Results load fast\n\n### Requirement: Which order?\nText.\n', { spec: true });
  assert.deepEqual(hits.map(h => [h.at, h.words]), [['s.md:1', ['fast']]]);
});

// verify C2: applyRequires is often just ["tasks"]; that alone must not pass a change without specs
test('tasks done per OpenSpec but no specs -> planning not complete, next artifact specs', () => {
  const d = project();
  fs.rmSync(path.join(d, 'openspec/changes/add-x/specs'), { recursive: true });
  const statusOf = () => ({ applyRequires: ['tasks'], artifacts: [{ id: 'proposal', status: 'done' }, { id: 'specs', status: 'done' }, { id: 'tasks', status: 'done' }] });
  const s = scan({ dir: d, change: 'add-x', statusOf });
  assert.equal(s.planningComplete, false);
  assert.equal(s.nextArtifact, 'specs');
  assert.equal(scan({ dir: project(), change: 'add-x', statusOf }).planningComplete, true);
});

// build-safeguards 2.1 (spec: build-readiness "Safeguards picked per change")
const READY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'kit', 'scripts', 'ready.mjs');
const rate = (reach, undo, safety) => ({
  reach: { level: reach, why: `reach ${reach}` }, undo: { level: undo, why: `undo ${undo}` }, safety: { level: safety, why: `safety ${safety}` },
});

test('Low-risk change: all low -> today\'s flow plus the scenario-to-test check', () => {
  assert.deepEqual(recommend({ reach: 'low', undo: 'low', safety: 'low' }), ['scenario-check']);
});

test('Shared module: reach medium adds a worktree and the review against the spec', () => {
  assert.deepEqual(recommend({ reach: 'medium', undo: 'low', safety: 'low' }), ['scenario-check', 'worktree', 'spec-review']);
});

test('any high adds probes, weighted security and the user\'s OK; subagents only with a reason', () => {
  assert.deepEqual(recommend({ reach: 'low', undo: 'high', safety: 'low' }), ['scenario-check', 'worktree', 'spec-review', 'probes', 'security-weighted', 'user-ok']);
  assert.ok(!recommend({ reach: 'high', undo: 'high', safety: 'high' }).includes('subagents'));
  assert.ok(recommend({ reach: 'low', undo: 'low', safety: 'low' }, { subagentsWhy: '12 independent tasks' }).includes('subagents'));
});

test('User changes the recommendation: design.md records ratings, recommendation and choice', () => {
  const d = project();
  const r = writeSafeguards({ dir: d, change: 'add-x', ratings: rate('medium', 'low', 'low'), chosen: ['scenario-check', 'spec-review'], date: '2026-10-18' });
  assert.deepEqual(r.recommended, ['scenario-check', 'worktree', 'spec-review']);
  const file = path.join(d, 'openspec/changes/add-x/design.md');
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /^## Safeguards$/m);
  assert.match(text, /\| Reach \| medium \| reach medium \|/);
  assert.match(text, /\*\*Chosen:\*\* scenario-to-test check, review against the spec/);
  assert.match(text, /Keep it fast\./, 'the rest of design.md is kept');
  assert.deepEqual(readSafeguards(file).chosen, ['scenario-check', 'spec-review']);
});

test('a second run replaces the Safeguards section, keeping the sections after it', () => {
  const d = project();
  const file = path.join(d, 'openspec/changes/add-x/design.md');
  writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), date: '2026-10-18' });
  fs.appendFileSync(file, '\n## Open Questions\n\n- one\n');
  writeSafeguards({ dir: d, change: 'add-x', ratings: rate('high', 'low', 'low'), date: '2026-10-19' });
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(text.match(/^## Safeguards$/gm).length, 1);
  assert.match(text, /## Open Questions\n\n- one/);
  assert.equal(readSafeguards(file).ratings.reach.level, 'high');
});

test('a missing design.md is an error (no stub, so OpenSpec status stays right); no section -> null', () => {
  const d = project();
  const file = path.join(d, 'openspec/changes/add-x/design.md');
  fs.rmSync(file);
  assert.equal(readSafeguards(file), null);
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low') }), /design\.md doesn't exist: write the design first/);
  assert.equal(fs.existsSync(file), false);
});

test('only the Safeguards section is rewritten: blank-line runs elsewhere in design.md are kept', () => {
  const d = project();
  const file = path.join(d, 'openspec/changes/add-x/design.md');
  fs.writeFileSync(file, '# Design\n\n```\na\n\n\n\nb\n```\n');
  writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low') });
  writeSafeguards({ dir: d, change: 'add-x', ratings: rate('medium', 'low', 'low') });
  const text = fs.readFileSync(file, 'utf8');
  assert.match(text, /a\n\n\n\nb/);
  assert.equal(text.match(/^## Safeguards$/gm).length, 1);
});

test('invalid rating, missing reason, unknown safeguard, subagents without a reason -> errors', () => {
  const d = project();
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('huge', 'low', 'low') }), /--reach must be one of low, medium, high/);
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: { ...rate('low', 'low', 'low'), undo: { level: 'low', why: ' ' } } }), /--undo-why is required/);
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), chosen: ['magic'] }), /unknown safeguard: magic/);
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), chosen: ['subagents'] }), /--subagents-why is required/);
});

test('Plan doesn\'t say: importers lists the files that import that module (not others with the same name)', () => {
  const d = tmpDir('kit-imp-');
  w(d, 'lib/shared.mjs', 'export const x = 1;\n');
  w(d, 'a.mjs', "import { x } from './lib/shared.mjs';\n");
  w(d, 'b.js', "const s = require('./lib/shared');\n");
  w(d, 'c.mjs', "import x from './lib/other.mjs';\n");
  w(d, 'node_modules/z.js', "require('./lib/shared');\n");
  w(d, 'other/shared.mjs', 'export const y = 2;\n');
  w(d, 'other/use.mjs', "import { y } from './shared.mjs';\n");
  w(d, 'lib/sub/deep.mjs', "import { x } from '../shared.mjs';\n");
  assert.deepEqual(importers({ dir: d, file: 'lib/shared.mjs' }), ['a.mjs', 'b.js', 'lib/sub/deep.mjs']);
});

test('CLI: safeguards writes the section; a bad rating prints error:', () => {
  const d = project();
  const ok = spawnSync(process.execPath, [READY, 'safeguards', '--dir', d, '--change', 'add-x', '--reach', 'low', '--reach-why', 'one spec', '--undo', 'low', '--undo-why', 'git revert', '--safety', 'low', '--safety-why', 'nothing sensitive'], { encoding: 'utf8' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.match(ok.stdout, /recommended: scenario-to-test check/);
  const bad = spawnSync(process.execPath, [READY, 'safeguards', '--dir', d, '--change', 'add-x', '--reach', 'big'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /^error: --reach must be one of/);
});

test('a design.md that mentions the data-comment format in prose still yields the real Safeguards', () => {
  const d = project();
  const file = path.join(d, 'openspec/changes/add-x/design.md');
  fs.writeFileSync(file, '# Design\n\nThe section ends with a data comment (`<!-- kit-safeguards-data {...} -->`).\n');
  writeSafeguards({ dir: d, change: 'add-x', ratings: rate('high', 'low', 'low') });
  assert.equal(readSafeguards(file).ratings.reach.level, 'high');
});

// ui-flow-with-impeccable 1.2, 2.1 (spec: build-readiness "Web-ui project", "UI review safeguard")
test('Type in kit.json / Impeccable installed, no type / Explicit type wins / Neither: webUi with the reason', async () => {
  const { webUi } = await import('../../plugins/kit/scripts/project.mjs');
  const a = tmpDir('kit-wu-');
  w(a, '.claude/kit.json', JSON.stringify({ project_type: 'web-ui' }));
  assert.deepEqual(webUi(a), { webUi: true, why: '.claude/kit.json says project_type: web-ui' });
  const b = tmpDir('kit-wu-');
  w(b, '.claude/skills/impeccable/SKILL.md', '# x\n');
  assert.equal(webUi(b).webUi, true, 'Impeccable installed, no type');
  assert.match(webUi(b).why, /Impeccable/);
  const c = tmpDir('kit-wu-');
  w(c, 'vite.config.ts', 'export default {};\n');
  assert.match(webUi(c).why, /vite\.config\.ts found: a web app/);
  const e = tmpDir('kit-wu-');
  w(e, '.claude/kit.json', JSON.stringify({ project_type: 'cli' }));
  w(e, 'vite.config.ts', '');
  w(e, '.claude/skills/impeccable/SKILL.md', '# x\n');
  assert.deepEqual(webUi(e), { webUi: false, why: '.claude/kit.json says project_type: cli' }, 'Explicit type wins');
  assert.equal(webUi(tmpDir('kit-wu-')).webUi, false);
});

test('UI files named: ui-review is recommended with the reason and shown in the Safeguards section', () => {
  const d = project();
  w(d, '.claude/kit.json', JSON.stringify({ project_type: 'web-ui' }));
  const r = writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), uiWhy: 'src/app/board/page.tsx, src/components/Sticky.tsx' });
  assert.deepEqual(r.recommended, ['scenario-check', 'ui-review']);
  const text = fs.readFileSync(path.join(d, 'openspec/changes/add-x/design.md'), 'utf8');
  assert.match(text, /UI review \(Impeccable critique \+ audit\)/);
  assert.match(text, /\*\*UI review because:\*\* src\/app\/board\/page\.tsx/);
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), chosen: ['ui-review'] }), /--ui-why is required/);
});

test('Not web-ui: --ui-why and ui-review in the choice are refused', () => {
  const d = project();
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), uiWhy: 'src/page.tsx' }), /ui-review is for web-ui projects only/);
  assert.throws(() => writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), chosen: ['ui-review'], uiWhy: 'src/page.tsx' }), /web-ui projects only/);
});

test('CLI: ready.mjs web-ui says web-ui or not, with the reason', () => {
  const d = tmpDir('kit-wu-');
  const no = spawnSync(process.execPath, [READY, 'web-ui', '--dir', d], { encoding: 'utf8' });
  assert.equal(no.status, 0, no.stderr);
  assert.match(no.stdout, /^not web-ui: /);
  w(d, 'next.config.js', '');
  assert.match(spawnSync(process.execPath, [READY, 'web-ui', '--dir', d], { encoding: 'utf8' }).stdout, /^web-ui: next\.config\.js found/);
});

test('a dropped ui-review: its reason is neither checked nor written', () => {
  const d = project();
  const r = writeSafeguards({ dir: d, change: 'add-x', ratings: rate('low', 'low', 'low'), uiWhy: 'src/page.tsx', chosen: ['scenario-check'] });
  assert.equal(r.uiWhy, undefined);
  assert.doesNotMatch(fs.readFileSync(path.join(d, 'openspec/changes/add-x/design.md'), 'utf8'), /UI review because/);
});
