import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { scan, vagueHits, requirements } from '../../plugins/kit/scripts/ready.mjs';

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
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-ready-'));
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
