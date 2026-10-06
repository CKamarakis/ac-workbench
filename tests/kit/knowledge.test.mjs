import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  knowledgeDir, parseFrontmatter, writeFrontmatter, slugify, listKnowledge, newNote, citing, move,
  sectionGet, sectionSet, readPrd,
} from '../../plugins/kit/scripts/knowledge.mjs';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-knowledge-'));
const put = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
const files = dir => fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter(e => e.isFile()).length;
const prd = (sources, extra = '') => `---\ntitle: Gift cards\nstatus: Draft\nsources:\n${sources.map(s => `  - ${s}`).join('\n')}\n${extra}---\n\n## Problem\n\nP\n\n## Scope\n\nS\n`;

// 2.1 location + frontmatter

test('knowledge dir defaults to knowledge/ and follows the stamp', () => {
  const d = tmp();
  assert.equal(knowledgeDir(d), path.join(d, 'knowledge'));
  put(d, '.claude/kit.json', JSON.stringify({ knowledge_dir: 'docs/knowledge' }));
  assert.equal(knowledgeDir(d), path.join(d, 'docs', 'knowledge'));
});

test('frontmatter round-trips scalars, inline lists and block lists', () => {
  const src = '---\ntitle: "Gift: cards"\ndate: 2026-10-06\ntags: [checkout, ux]\nsources:\n  - notes/a.md\n  - notes/b.md\n---\n\nBody\n';
  const fm = parseFrontmatter(src);
  assert.equal(fm.ok, true);
  assert.deepEqual(fm.data, { title: 'Gift: cards', date: '2026-10-06', tags: ['checkout', 'ux'], sources: ['notes/a.md', 'notes/b.md'] });
  const again = parseFrontmatter(writeFrontmatter(fm.data, fm.body));
  assert.deepEqual(again.data, fm.data);
  assert.equal(again.body.trim(), 'Body');
});

test('unsupported YAML is reported as invalid, not guessed', () => {
  assert.equal(parseFrontmatter('---\nmeta: {a: 1}\n---\n').ok, false);
  assert.equal(parseFrontmatter('---\nnot yaml at all\n---\n').ok, false);
  assert.equal(parseFrontmatter('---\ntitle: x\n').ok, false);
  assert.equal(parseFrontmatter('no frontmatter').ok, true);
});

test('slugs are lowercase, ascii, dash-separated', () => {
  assert.equal(slugify('Gift card purchase flow'), 'gift-card-purchase-flow');
  assert.equal(slugify('Café — UX: v2!'), 'cafe-ux-v2');
  assert.equal(slugify('!!!'), 'note');
});

// 2.2 list

test('list: topic folders included, archive excluded, bad status reported', () => {
  const r = tmp();
  put(r, 'notes/2026-10-06-a.md', '---\ntitle: A\ndate: 2026-10-06\n---\n');
  put(r, 'notes/checkout/2026-10-07-b.md', '---\ntitle: B\ndate: 2026-10-07\ntags: [checkout]\n---\n');
  put(r, 'archive/notes/2026-01-01-old.md', '---\ntitle: Old\n---\n');
  put(r, 'prds/good.md', prd(['notes/2026-10-06-a.md']));
  put(r, 'prds/bad.md', '---\ntitle: Bad\nstatus: Done\n---\n');
  const l = listKnowledge(r);
  assert.deepEqual(l.notes.map(n => n.path).sort(), ['notes/2026-10-06-a.md', 'notes/checkout/2026-10-07-b.md']);
  assert.ok(!JSON.stringify(l).includes('Old'));
  const bad = l.prds.find(p => p.slug === 'bad');
  assert.equal(bad.valid, false);
  assert.match(bad.errors.join(), /invalid status "Done"/);
  assert.equal(l.prds.find(p => p.slug === 'good').valid, true);
});

test('list: notes without frontmatter use heading or filename', () => {
  const r = tmp();
  put(r, 'notes/2026-10-06-raw.md', '# Raw idea\n\ntext');
  const [n] = listKnowledge(r).notes;
  assert.equal(n.title, 'Raw idea');
  assert.equal(n.date, '2026-10-06');
});

// 2.3 new-note

test('note written with title and date', () => {
  const r = tmp();
  const { path: p } = newNote(r, { title: 'Gift card purchase flow', body: 'flow', date: '2026-10-06', source: 'voice' });
  assert.equal(p, 'notes/2026-10-06-gift-card-purchase-flow.md');
  const fm = parseFrontmatter(fs.readFileSync(path.join(r, p), 'utf8'));
  assert.equal(fm.data.title, 'Gift card purchase flow');
  assert.equal(fm.data.date, '2026-10-06');
  assert.equal(fm.data.source, 'voice');
});

test('name collision gets a suffix and keeps the existing note', () => {
  const r = tmp();
  newNote(r, { title: 'Idea', body: 'first', date: '2026-10-06' });
  const { path: p } = newNote(r, { title: 'Idea', body: 'second', date: '2026-10-06' });
  assert.equal(p, 'notes/2026-10-06-idea-2.md');
  assert.match(fs.readFileSync(path.join(r, 'notes/2026-10-06-idea.md'), 'utf8'), /first/);
});

test('topic named -> note goes into that folder', () => {
  const r = tmp();
  assert.equal(newNote(r, { title: 'Pay', date: '2026-10-06', topic: 'checkout' }).path, 'notes/checkout/2026-10-06-pay.md');
  assert.throws(() => newNote(r, { title: 'x', topic: '../../etc' }), /outside the knowledge folder/);
});

test('image attached -> copied to assets/ and linked relatively', () => {
  const r = tmp();
  const img = path.join(tmp(), 'Screen Shot.PNG');
  fs.writeFileSync(img, 'png');
  const res = newNote(r, { title: 'Flow', date: '2026-10-06', topic: 'checkout', asset: img });
  assert.equal(res.asset, 'assets/screen-shot.png');
  assert.match(fs.readFileSync(path.join(r, res.path), 'utf8'), /\]\(\.\.\/\.\.\/assets\/screen-shot\.png\)/);
});

test('a title is required', () => {
  assert.throws(() => newNote(tmp(), { title: ' ' }), /needs a title/);
});

// 2.4 citing + move

test('archive an unused note: moved, nothing else changes', () => {
  const r = tmp();
  put(r, 'notes/2026-10-06-a.md', '---\ntitle: A\n---\n');
  put(r, 'prds/x.md', prd([]).replace('sources:\n\n', 'sources: []\n'));
  const before = fs.readFileSync(path.join(r, 'prds/x.md'), 'utf8');
  const res = move(r, 'notes/2026-10-06-a.md', 'archive');
  assert.equal(res.to, 'archive/notes/2026-10-06-a.md');
  assert.deepEqual(res.updated, []);
  assert.equal(fs.readFileSync(path.join(r, 'prds/x.md'), 'utf8'), before);
});

test('archive a cited note: citing PRD named first, then its sources follow', () => {
  const r = tmp();
  put(r, 'notes/2026-10-06-a.md', '---\ntitle: A\n---\n');
  put(r, 'notes/2026-10-06-b.md', '---\ntitle: B\n---\n');
  put(r, 'prds/gift-cards.md', prd(['notes/2026-10-06-a.md', 'notes/2026-10-06-b.md']));
  assert.deepEqual(citing(r, 'notes/2026-10-06-a.md'), ['prds/gift-cards.md']);
  const res = move(r, 'notes/2026-10-06-a.md', 'archive');
  assert.deepEqual(res.updated, ['prds/gift-cards.md']);
  const p = readPrd(r, path.join(r, 'prds/gift-cards.md'));
  assert.deepEqual(p.sources, ['archive/notes/2026-10-06-a.md', 'notes/2026-10-06-b.md']);
  assert.equal(p.valid, true);
  assert.match(fs.readFileSync(path.join(r, 'prds/gift-cards.md'), 'utf8'), /## Scope\n\nS/);
});

test('move into a topic folder; nothing deleted; no overwrite', () => {
  const r = tmp();
  put(r, 'notes/2026-10-06-a.md', 'a');
  put(r, 'notes/checkout/2026-10-06-a.md', 'other');
  const n = files(r);
  assert.throws(() => move(r, 'notes/2026-10-06-a.md', 'notes/checkout'), /target exists/);
  assert.equal(move(r, 'notes/2026-10-06-a.md', 'notes/ux').to, 'notes/ux/2026-10-06-a.md');
  assert.equal(files(r), n);
  assert.throws(() => move(r, 'notes/missing.md', 'archive'), /not found/);
});

// 2.5 sections

test('approved section is written, others untouched', () => {
  const r = tmp();
  put(r, 'prds/x.md', prd([]));
  const f = path.join(r, 'prds/x.md');
  const s = sectionGet(f, 'Scope');
  assert.equal(s.text.trim(), 'S');
  assert.equal(sectionSet(f, 'Scope', 'New scope', s.hash).conflict, false);
  const text = fs.readFileSync(f, 'utf8');
  assert.match(text, /## Scope\n\nNew scope\n$/);
  assert.match(text, /## Problem\n\nP\n\n## Scope/);
});

test('section changed since section-get -> conflict, file unchanged', () => {
  const r = tmp();
  put(r, 'prds/x.md', prd([]));
  const f = path.join(r, 'prds/x.md');
  const s = sectionGet(f, 'Problem');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('\nP\n', '\nP edited by the user\n'));
  const before = fs.readFileSync(f, 'utf8');
  const res = sectionSet(f, 'Problem', 'Agent text', s.hash);
  assert.equal(res.conflict, true);
  assert.equal(fs.readFileSync(f, 'utf8'), before);
});

test('missing section is appended; --expect is required', () => {
  const r = tmp();
  put(r, 'prds/x.md', prd([]));
  const f = path.join(r, 'prds/x.md');
  const s = sectionGet(f, 'Risks');
  assert.equal(s.missing, true);
  sectionSet(f, 'Risks', 'R1', s.hash);
  assert.match(fs.readFileSync(f, 'utf8'), /## Risks\n\nR1\n$/);
  assert.throws(() => sectionSet(f, 'Risks', 'x'), /--expect/);
});

// 2.6 prd-check

test('prd-check: valid, bad status, missing source, Building without change', () => {
  const r = tmp();
  put(r, 'notes/a.md', 'a');
  put(r, 'prds/ok.md', prd(['notes/a.md']));
  put(r, 'prds/missing.md', prd(['notes/gone.md']));
  put(r, 'prds/building.md', prd(['notes/a.md']).replace('status: Draft', 'status: Building'));
  put(r, 'prds/built.md', prd(['notes/a.md'], 'change: gift-cards\n').replace('status: Draft', 'status: Building'));
  const chk = n => readPrd(r, path.join(r, 'prds', n));
  assert.equal(chk('ok.md').valid, true);
  assert.match(chk('missing.md').errors.join(), /source not found: notes\/gone\.md/);
  assert.match(chk('building.md').errors.join(), /needs a "change"/);
  assert.equal(chk('built.md').valid, true);
});

// new-prd + set-field (sub-work for 4.2)

test('new-prd: from the template, sources checked, never overwrites', async () => {
  const { newPrd } = await import('../../plugins/kit/scripts/knowledge.mjs');
  const r = tmp();
  put(r, 'notes/a.md', 'a');
  assert.throws(() => newPrd(r, { title: 'Gift cards', sources: ['notes/nope.md'] }), /source not found/);
  const { path: p } = newPrd(r, { title: 'Gift cards', sources: ['notes/a.md'] });
  assert.equal(p, 'prds/gift-cards.md');
  const x = readPrd(r, path.join(r, p));
  assert.equal(x.valid, true);
  assert.equal(x.status, 'Draft');
  assert.deepEqual(x.sources, ['notes/a.md']);
  assert.match(fs.readFileSync(path.join(r, p), 'utf8'), /## Problem[\s\S]*## Open questions/);
  assert.throws(() => newPrd(r, { title: 'Gift cards' }), /PRD exists/);
});

test('set-field: valid status and change only; body untouched', async () => {
  const { setField } = await import('../../plugins/kit/scripts/knowledge.mjs');
  const r = tmp();
  put(r, 'prds/x.md', prd([]));
  assert.throws(() => setField(r, 'prds/x.md', 'status', 'Done'), /must be one of/);
  assert.throws(() => setField(r, 'prds/x.md', 'sources', 'a'), /only status, change, title/);
  assert.equal(setField(r, 'prds/x.md', 'status', 'Ready').from, 'Draft');
  setField(r, 'prds/x.md', 'change', 'gift-cards');
  const text = fs.readFileSync(path.join(r, 'prds/x.md'), 'utf8');
  assert.match(text, /status: Ready\n/);
  assert.match(text, /change: gift-cards\n/);
  assert.match(text, /## Problem\n\nP\n\n## Scope\n\nS\n$/);
});

// ---------- prd-pipeline-followups 2.1-2.3 ----------
import { spawnSync as sp } from 'node:child_process';
import { importNote, gitUpdatedOf } from '../../plugins/kit/scripts/knowledge.mjs';

test('2.1 PRDs sorted newest-updated first (injected), ties by slug', () => {
  const r = tmp();
  for (const s of ['a', 'b', 'c']) put(r, `prds/${s}.md`, prd([]));
  const when = { a: '2026-10-01T00:00:00.000Z', b: '2026-10-05T00:00:00.000Z', c: '2026-10-05T00:00:00.000Z' };
  const l = listKnowledge(r, { updatedOf: f => when[path.basename(f, '.md')] });
  assert.deepEqual(l.prds.map(p => p.slug), ['b', 'c', 'a']);
  assert.equal(l.prds[2].updated, when.a);
});

test('2.1 real git: an uncommitted edit beats an older commit; no git -> mtime', () => {
  const d = tmp();
  const g = (...a) => sp('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
  put(d, 'knowledge/prds/a.md', prd([]));
  put(d, 'knowledge/prds/b.md', prd([]));
  g('init', '-q'); g('add', '.'); g('commit', '-qm', 'one', '--date', '2020-01-01T00:00:00Z');
  sp('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '--amend', '-qm', 'one', '--no-edit'], { cwd: d, env: { ...process.env, GIT_COMMITTER_DATE: '2020-01-01T00:00:00Z' } });
  fs.appendFileSync(path.join(d, 'knowledge/prds/b.md'), 'edit\n');
  const r = path.join(d, 'knowledge');
  const l = listKnowledge(r);
  assert.deepEqual(l.prds.map(p => p.slug), ['b', 'a']);
  assert.match(l.prds[1].updated, /^2020-01-01/);
  const n = tmp();
  put(n, 'prds/x.md', prd([]));
  const t = new Date('2021-05-05T00:00:00Z');
  fs.utimesSync(path.join(n, 'prds/x.md'), t, t);
  assert.match(gitUpdatedOf(n)(path.join(n, 'prds/x.md')), /^2021-05-05/);
});

test('2.2 .txt in notes/ is unimported, not a note; archive ignored', () => {
  const r = tmp();
  put(r, 'notes/raw.txt', 'x');
  put(r, 'notes/topic/call.txt', 'y');
  put(r, 'archive/notes/old.txt', 'z');
  const l = listKnowledge(r);
  assert.deepEqual(l.unimported, ['notes/raw.txt', 'notes/topic/call.txt']);
  assert.equal(l.notes.length, 0);
});

test('2.3 transcript dropped into notes: replaced by a dated note, text unchanged', () => {
  const r = tmp();
  const text = 'Anna: gift cards should expire.\r\n\r\n  Me: 12 months?\n';
  put(r, 'notes/call with anna.txt', text);
  const res = importNote(r, { file: path.join(r, 'notes/call with anna.txt'), title: 'Call with Anna about gift cards', date: '2026-10-06' });
  assert.equal(res.path, 'notes/2026-10-06-call-with-anna-about-gift-cards.md');
  assert.equal(res.removed, 'notes/call with anna.txt');
  assert.ok(!fs.existsSync(path.join(r, 'notes/call with anna.txt')));
  const fm = parseFrontmatter(fs.readFileSync(path.join(r, res.path), 'utf8'));
  assert.equal(fm.data.source, 'call with anna.txt');
  assert.equal(fm.body.replace(/^\n/, ''), text.replace(/\r\n/g, '\n'));
});

test('2.3 file outside the knowledge folder is kept; .md frontmatter kept', () => {
  const r = tmp();
  const outside = path.join(tmp(), 'interview.md');
  fs.writeFileSync(outside, '---\ntitle: Interview 3\ndate: 2026-09-30\ntags: [ux]\nspeaker: Bo\n---\n\nBody text\n');
  const res = importNote(r, { file: outside });
  assert.equal(res.path, 'notes/2026-09-30-interview-3.md');
  assert.equal(res.kept, outside);
  assert.ok(fs.existsSync(outside));
  const fm = parseFrontmatter(fs.readFileSync(path.join(r, res.path), 'utf8'));
  assert.deepEqual(fm.data, { title: 'Interview 3', date: '2026-09-30', tags: ['ux'], source: 'interview.md', speaker: 'Bo' });
  assert.equal(fm.body.replace(/^\n/, ''), 'Body text\n');
});

test('2.3 import refuses other types and a missing title', () => {
  const r = tmp();
  put(r, 'notes/a.pdf', 'x');
  put(r, 'notes/b.txt', 'x');
  assert.throws(() => importNote(r, { file: path.join(r, 'notes/a.pdf'), title: 'A' }), /only \.txt and \.md/);
  assert.throws(() => importNote(r, { file: path.join(r, 'notes/b.txt') }), /needs a title/);
  assert.ok(fs.existsSync(path.join(r, 'notes/b.txt')));
});
