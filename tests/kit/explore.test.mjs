import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';
import { save, linkPrd, readRecord, listRecords, stateOf } from '../../plugins/kit/scripts/explore.mjs';

const SCRIPT = fileURLToPath(new URL('../../plugins/kit/scripts/explore.mjs', import.meta.url));

function project(files = {}) {
  const d = tmpDir('kit-explore-');
  const all = { 'knowledge/notes/a.md': '---\ntitle: A\n---\n', 'knowledge/notes/b.md': '---\ntitle: B\n---\n', 'knowledge/notes/topic/c.md': '---\ntitle: C\n---\n', ...files };
  for (const [rel, text] of Object.entries(all)) {
    fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true });
    fs.writeFileSync(path.join(d, rel), text);
  }
  return d;
}
const first = { title: 'Kit status', sources: ['notes/a.md', 'notes/b.md', 'notes/topic/c.md'], decisions: ['one command', 'overview on top', 'script plus skill', 'next is tactical'], questions: ['one or two tables?', 'status vs roadmap report?'] };

test('new record: sources, decisions, Q1 and Q2, state exploring; a readable file', () => {
  const d = project();
  const r = save(d, { slug: 'kit-status', ...first });
  assert.deepEqual(r.sources, ['notes/a.md', 'notes/b.md', 'notes/topic/c.md']);
  assert.equal(r.decisions.length, 4);
  assert.deepEqual(r.questions.map(q => q.id), ['Q1', 'Q2']);
  assert.equal(r.state, 'exploring');
  const text = fs.readFileSync(path.join(d, 'knowledge/explore/kit-status.md'), 'utf8');
  assert.match(text, /^---\ntitle: Kit status\nsources:\n {2}- notes\/a\.md/);
  assert.match(text, /## Open questions\n\n- Q1 one or two tables\?\n- Q2 status vs roadmap report\?/);
});

test('unknown source refused, nothing written', () => {
  const d = project();
  assert.throws(() => save(d, { slug: 'x', title: 'X', sources: ['notes/missing.md'] }), /source not found: notes\/missing\.md/);
  assert.throws(() => save(d, { slug: 'x', title: 'X', sources: ['prds/p.md'] }), /source not found/);
  assert.equal(fs.existsSync(path.join(d, 'knowledge/explore/x.md')), false);
});

test('saves only add; answering the last question makes it ready-for-prd; IDs never reused', () => {
  const d = project();
  save(d, { slug: 'kit-status', ...first });
  let r = save(d, { slug: 'kit-status', answers: { Q1: 'one table' } });
  assert.deepEqual(r.questions.map(q => q.id), ['Q2']);
  assert.ok(r.decisions.includes('Q1: one table'));
  r = save(d, { slug: 'kit-status', questions: ['parallel items?'] });
  assert.deepEqual(r.questions.map(q => q.id), ['Q2', 'Q3'], 'Q1 is not reused');
  r = save(d, { slug: 'kit-status', answers: { Q2: 'status is strategic', Q3: 'list all' } });
  assert.equal(r.state, 'ready-for-prd');
  assert.equal(r.decisions.length, 7);
  assert.throws(() => save(d, { slug: 'kit-status', answers: { Q9: 'x' } }), /no open question Q9/);
});

test('link to its PRD: state in-prd; further saves refused and point to /kit:prd', () => {
  const d = project({ 'knowledge/prds/kit-status.md': '---\ntitle: Kit status\nstatus: Draft\nsources: []\n---\n' });
  save(d, { slug: 'kit-status', ...first, questions: [] });
  assert.throws(() => linkPrd(d, { slug: 'kit-status', prd: 'prds/nope.md' }), /PRD not found/);
  const r = linkPrd(d, { slug: 'kit-status', prd: 'prds/kit-status.md' });
  assert.equal(r.state, 'in-prd');
  assert.equal(readRecord(d, 'kit-status').prd, 'prds/kit-status.md');
  assert.throws(() => save(d, { slug: 'kit-status', decisions: ['late'] }), /already in PRD prds\/kit-status\.md: update the PRD with \/kit:prd/);
});

test('prd-parts verify: an explore record links to a PRD part; paths outside prds/ are still refused', () => {
  const d = project({ 'knowledge/prds/acme-v1/part-a.md': '---\ntitle: Part A\nstatus: Draft\npart-of: acme-v1\n---\n', 'knowledge/notes/n.md': '---\ntitle: N\n---\n' });
  save(d, { slug: 'pa', ...first, questions: [] });
  assert.throws(() => linkPrd(d, { slug: 'pa', prd: 'prds/../notes/n.md' }), /PRD not found/);
  assert.equal(linkPrd(d, { slug: 'pa', prd: 'prds/acme-v1/part-a.md' }).prd, 'prds/acme-v1/part-a.md');
});

test('stateOf and list', () => {
  assert.equal(stateOf({ prd: null, questions: [] }), 'ready-for-prd');
  const d = project();
  save(d, { slug: 'b-two', title: 'B', sources: ['notes/b.md'], questions: ['q'] });
  save(d, { slug: 'a-one', title: 'A', sources: ['notes/a.md'] });
  assert.deepEqual(listRecords(d).map(r => [r.slug, r.state]), [['a-one', 'ready-for-prd'], ['b-two', 'exploring']]);
});

test('CLI: save from a JSON file, list, and error: on a bad slug', () => {
  const d = project();
  const f = path.join(d, 'rec.json');
  fs.writeFileSync(f, JSON.stringify(first));
  const cli = (...a) => spawnSync(process.execPath, [SCRIPT, ...a, '--dir', d], { encoding: 'utf8' });
  let r = cli('save', '--slug', 'kit-status', '--file', f);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /explore\/kit-status\.md: exploring; 4 decision\(s\), 2 open question\(s\)/);
  assert.match(cli('list').stdout, /kit-status {2}exploring {2}Kit status {2}\(Q1, Q2 open\)/);
  r = cli('save', '--slug', 'Bad Slug', '--file', f);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^error: --slug <kebab-case> is required/);
});

test('a record with no decisions reads back with none', () => {
  const d = project();
  save(d, { slug: 'q-only', title: 'Q only', sources: ['notes/a.md'], questions: ['what?'] });
  assert.deepEqual(readRecord(d, 'q-only').decisions, []);
});

// ---------- explore-stage 3.1: undo of the automatic save (spec "Saved at the end of an explore") ----------
import { undo } from '../../plugins/kit/scripts/explore.mjs';

test('undo: a new record is removed; an update goes back to before that save', () => {
  const d = project();
  save(d, { slug: 'kit-status', ...first });
  assert.deepEqual(undo(d, { slug: 'kit-status' }), { slug: 'kit-status', removed: true, record: null });
  assert.equal(readRecord(d, 'kit-status'), null);
  save(d, { slug: 'kit-status', ...first });
  save(d, { slug: 'kit-status', decisions: ['a later one'], answers: { Q1: 'one table' } });
  const r = undo(d, { slug: 'kit-status' });
  assert.equal(r.removed, false);
  assert.deepEqual(r.record.questions.map(q => q.id), ['Q1', 'Q2']);
  assert.ok(!r.record.decisions.includes('a later one'));
  assert.throws(() => undo(d, { slug: 'kit-status' }), /nothing to undo/);
  assert.deepEqual(fs.readdirSync(path.join(d, 'knowledge', 'explore')), ['kit-status.md'], 'no backup files in the project');
});

// ---------- explore-stage verify fixes ----------

test('verify C1: one unreadable record is listed as unreadable; the others still show', () => {
  const d = project({ 'knowledge/explore/bad.md': '---\ntitle: [broken\n---\n' });
  save(d, { slug: 'good', title: 'Good', sources: ['notes/a.md'], questions: ['q'] });
  const l = listRecords(d);
  assert.deepEqual(l.map(r => [r.slug, r.state]), [['bad', 'unreadable'], ['good', 'exploring']]);
  assert.match(l[0].error, /can't be read/);
});

test('verify C2: link-prd clears the undo copy; undo on a linked record is refused', () => {
  const d = project({ 'knowledge/prds/p.md': '---\ntitle: P\nstatus: Draft\nsources: []\n---\n' });
  save(d, { slug: 'x', title: 'X', sources: ['notes/a.md'] });
  linkPrd(d, { slug: 'x', prd: 'prds/p.md' });
  assert.doesNotMatch(fs.readFileSync(path.join(d, 'knowledge/explore/x.md'), 'utf8'), /kit-explore-undo/);
  assert.throws(() => undo(d, { slug: 'x' }), /already in PRD prds\/p\.md: nothing to undo/);
  assert.ok(readRecord(d, 'x'));
});

test('verify C3: an open question written without an ID gets the next one on save', () => {
  const d = project({ 'knowledge/explore/x.md': '---\ntitle: X\nsources: []\n---\n\n## Decisions\n\n- Q1: done\n\n## Open questions\n\n- what about tablets?\n' });
  const r = save(d, { slug: 'x', decisions: ['more'] });
  assert.deepEqual(r.questions, [{ id: 'Q2', text: 'what about tablets?' }]);
  assert.equal(save(d, { slug: 'x', answers: { Q2: 'later' } }).state, 'ready-for-prd');
});

test('verify C4: sections and frontmatter keys the script does not manage are kept', () => {
  const d = project({ 'knowledge/explore/x.md': '---\ntitle: X\nsources: []\nowner: sam\n---\n\n## Context\n\nWhy we looked at this.\n\n## Decisions\n\n- one\n\n## Open questions\n\n' });
  save(d, { slug: 'x', decisions: ['two'] });
  const text = fs.readFileSync(path.join(d, 'knowledge/explore/x.md'), 'utf8');
  assert.match(text, /owner: sam/);
  assert.match(text, /## Context\n\nWhy we looked at this\./);
  assert.deepEqual(readRecord(d, 'x').decisions, ['one', 'two']);
});

test('verify C5: a multi-line decision or question is folded into one line', () => {
  const d = project();
  const r = save(d, { slug: 'x', title: 'X', sources: ['notes/a.md'], decisions: ['pinch to zoom\nand double-tap'], questions: ['a\n- b'] });
  assert.deepEqual(r.decisions, ['pinch to zoom and double-tap']);
  assert.deepEqual(r.questions.map(q => q.text), ['a - b']);
});
