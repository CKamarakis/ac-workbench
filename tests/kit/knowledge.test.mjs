import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  knowledgeDir, parseFrontmatter, writeFrontmatter, slugify, listKnowledge, newNote, citing, move,
  sectionGet, sectionSet, readPrd, openQuestions,
} from '../../plugins/kit/scripts/knowledge.mjs';

const tmp = () => tmpDir('kit-knowledge-');
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

test('set-field shape: done or declined only; prd-check still passes (ui-flow-with-impeccable 1.3)', async () => {
  const { setField, readPrd } = await import('../../plugins/kit/scripts/knowledge.mjs');
  const r = tmp();
  put(r, 'prds/x.md', prd([]));
  setField(r, 'prds/x.md', 'shape', 'declined');
  assert.match(fs.readFileSync(path.join(r, 'prds/x.md'), 'utf8'), /shape: declined\n/);
  assert.equal(setField(r, 'prds/x.md', 'shape', 'done').from, 'declined');
  assert.throws(() => setField(r, 'prds/x.md', 'shape', 'maybe'), /shape must be done or declined/);
  assert.equal(readPrd(r, path.join(r, 'prds/x.md')).valid, true, 'prd-check passes with the shape field');
});

// ---------- prd-pipeline-followups 2.1-2.3 ----------
import { spawnSync as sp } from 'node:child_process';
import { importNote, gitUpdatedOf } from '../../plugins/kit/scripts/knowledge.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

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

// build-readiness 6.2
test('openQuestions lists the section items; None and N/A do not count; readPrd carries the count', () => {
  const body = '## Open questions\n\n- Is a shortcut wanted?\n* Where does the icon go?\n\n## Risks\n\n- not a question\n';
  assert.deepEqual(openQuestions(body), ['Is a shortcut wanted?', 'Where does the icon go?']);
  assert.deepEqual(openQuestions('## Open questions\n\n- None.\n'), []);
  assert.deepEqual(openQuestions('## Problem\n\nx\n'), []);
  const r = tmpDir('kit-oq-');
  fs.mkdirSync(path.join(r, 'prds'));
  fs.writeFileSync(path.join(r, 'prds/side.md'), '---\ntitle: Side\nstatus: Draft\n---\n\n' + body);
  assert.equal(readPrd(r, path.join(r, 'prds/side.md')).openQuestions, 2);
});

// ---------- prd-parts (spec: prd-authoring "PRD parts" and the requirements after it) ----------

import { newPrd, setField, prdLink, PRD_LINE } from '../../plugins/kit/scripts/knowledge.mjs';

const KCLI = path.resolve('plugins/kit/scripts/knowledge.mjs');
const kcli = (dir, ...args) => sp(process.execPath, [KCLI, ...args, '--dir', dir], { encoding: 'utf8' });
const fmText = (data, body = '\n## Scope\n\nS\n') => `---\n${Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${body}`;
const parent = (extra = {}) => fmText({ title: 'Acme v1', status: 'Ready', ...extra }, '\n## Problem\n\nP\n\n## Parts\n\n| Part | Title |\n|---|---|\n\n## Open questions\n\n-\n');
const part = (title, status = 'Draft', extra = {}) => fmText({ title, status, 'part-of': 'acme-v1', ...extra });
const at = stamps => f => stamps[path.basename(f, '.md')] ?? '2026-01-01T00:00:00.000Z';

test('prd-parts 1.1: Dropped is a status; a Dropped PRD needs no change; the six values are named', () => {
  const r = tmp();
  put(r, 'prds/old.md', fmText({ title: 'Old', status: 'Dropped' }));
  put(r, 'prds/bad.md', fmText({ title: 'Bad', status: 'Done' }));
  assert.equal(readPrd(r, path.join(r, 'prds/old.md')).valid, true);
  assert.match(readPrd(r, path.join(r, 'prds/bad.md')).errors[0], /Draft, Review, Ready, Building, Shipped, Dropped/);
  put(r, 'prds/x.md', fmText({ title: 'X', status: 'Draft' }));
  assert.equal(setField(r, 'prds/x.md', 'status', 'Dropped').to, 'Dropped');
});

test('prd-parts 1.2: a part is named parent/file and labelled with its parent; a nested file without part-of keeps its name', () => {
  const r = tmp();
  put(r, 'prds/acme-v1.md', parent());
  put(r, 'prds/acme-v1/part-a.md', part('Part A'));
  put(r, 'prds/acme-v1/notes-only.md', fmText({ title: 'Loose', status: 'Draft' }));
  const a = readPrd(r, path.join(r, 'prds/acme-v1/part-a.md'));
  assert.equal(a.name, 'acme-v1/part-a');
  assert.equal(a.partOf, 'acme-v1');
  assert.equal(a.label, 'Acme v1 › Part A');
  const loose = readPrd(r, path.join(r, 'prds/acme-v1/notes-only.md'));
  assert.equal(loose.name, 'notes-only');
  assert.equal(loose.partOf, null);
  assert.equal(loose.label, 'Loose');
  assert.deepEqual(readPrd(r, path.join(r, 'prds/acme-v1.md')).parts, ['acme-v1/part-a']);
});

test('prd-parts 1.2: the same part name under two parents gives two different parts', () => {
  const r = tmp();
  put(r, 'prds/acme-v1.md', parent());
  put(r, 'prds/acme-v2.md', parent({ title: 'Acme v2' }));
  put(r, 'prds/acme-v1/part-a.md', part('A1'));
  put(r, 'prds/acme-v2/part-a.md', part('A2', 'Draft', { 'part-of': 'acme-v2' }));
  const names = listKnowledge(r, { updatedOf: at({}) }).prds.map(p => p.name).sort();
  assert.deepEqual(names, ['acme-v1', 'acme-v1/part-a', 'acme-v2', 'acme-v2/part-a']);
});

test('prd-parts 1.3: orphan part, wrong folder and part of a part are invalid; a parent with parts may be Building without a change', () => {
  const r = tmp();
  put(r, 'prds/acme-v1/part-a.md', part('Orphan'));
  put(r, 'prds/other/part-x.md', part('Wrong folder'));
  put(r, 'prds/acme-v2.md', parent({ title: 'Acme v2', status: 'Building' }));
  put(r, 'prds/acme-v2/part-b.md', part('B', 'Building', { 'part-of': 'acme-v2', change: 'acme-part-b' }));
  put(r, 'prds/acme-v3.md', parent({ title: 'Acme v3', status: 'Building' }));
  const l = listKnowledge(r, { updatedOf: at({}) });
  const err = p => l.invalid.find(x => x.path === p)?.errors.join('; ') ?? '';
  assert.match(err('prds/acme-v1/part-a.md'), /parent not found: prds\/acme-v1\.md/);
  assert.match(err('prds/other/part-x.md'), /doesn't match its folder/);
  assert.equal(err('prds/acme-v2.md'), '');
  assert.match(err('prds/acme-v3.md'), /needs a "change"/);
  put(r, 'prds/acme-v2/part-b.md', part('B', 'Draft', { 'part-of': 'acme-v2' }));
  put(r, 'prds/acme-v2/part-b/sub.md', part('Sub', 'Draft', { 'part-of': 'acme-v2/part-b' }));
  assert.ok(listKnowledge(r, { updatedOf: at({}) }).invalid.some(x => x.path === 'prds/acme-v2/part-b/sub.md'));
});

test('prd-parts 1.3: parent Shipped too early warns; a Dropped part counts as finished', () => {
  const r = tmp();
  put(r, 'prds/acme-v1.md', parent({ status: 'Shipped' }));
  put(r, 'prds/acme-v1/part-a.md', part('A', 'Shipped', { change: 'acme-part-a' }));
  put(r, 'prds/acme-v1/part-b.md', part('B', 'Building', { change: 'acme-part-b' }));
  let l = listKnowledge(r, { updatedOf: at({}) });
  assert.deepEqual(l.warnings, ['acme-v1 is Shipped while acme-v1/part-b is Building']);
  assert.equal(l.invalid.length, 0);
  put(r, 'prds/acme-v1/part-b.md', part('B', 'Dropped'));
  l = listKnowledge(r, { updatedOf: at({}) });
  assert.deepEqual(l.warnings, []);
});

test('prd-parts 1.3: parents ordered by their newest part, each part right after its parent', () => {
  const r = tmp();
  put(r, 'prds/acme-v1.md', parent());
  put(r, 'prds/acme-v1/part-a.md', part('A'));
  put(r, 'prds/acme-v1/part-b.md', part('B'));
  put(r, 'prds/solo.md', fmText({ title: 'Solo', status: 'Draft' }));
  const l = listKnowledge(r, { updatedOf: at({ 'acme-v1': '2026-01-01T00:00:00Z', 'part-a': '2026-01-02T00:00:00Z', 'part-b': '2026-03-01T00:00:00Z', solo: '2026-02-01T00:00:00Z' }) });
  assert.deepEqual(l.prds.map(p => p.name), ['acme-v1', 'acme-v1/part-b', 'acme-v1/part-a', 'solo']);
});

test('prd-parts 1.4: list indents parts with status and change; prd-check warns with exit 0; set-field Shipped warns', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent({ status: 'Building' }));
  put(d, 'knowledge/prds/acme-v1/part-a.md', part('Part A', 'Building', { change: 'acme-part-a' }));
  put(d, 'knowledge/prds/acme-v1/part-b.md', part('Part B', 'Ready'));
  const list = kcli(d, 'list').stdout;
  assert.match(list, /\n {4}prds\/acme-v1\/part-a\.md {2}Building {2}- Part A {2}\(change: acme-part-a\)/);
  assert.match(list, /\n {4}prds\/acme-v1\/part-b\.md {2}Ready {2}- Part B/);
  assert.match(list, /\n {2}prds\/acme-v1\.md {2}Building/);
  const set = kcli(d, 'set-field', '--file', 'prds/acme-v1.md', '--key', 'status', '--value', 'Shipped');
  assert.equal(set.status, 0);
  assert.match(set.stdout, /WARNING acme-v1 is Shipped while acme-v1\/part-a is Building, acme-v1\/part-b is Ready/);
  const check = kcli(d, 'prd-check');
  assert.equal(check.status, 0);
  assert.match(check.stdout, /WARNING acme-v1 is Shipped/);
});

test('prd-parts 2.2: new-prd --part-of writes the part and appends a Parts row, keeping the user\'s lines', () => {
  const r = tmp();
  put(r, 'prds/acme-v1.md', parent().replace('|---|---|\n', '|---|---|\n| acme-v1/old | My own row |\n\nA note of mine.\n'));
  const res = newPrd(r, { title: 'Part A', partOf: 'acme-v1' });
  assert.equal(res.path, 'prds/acme-v1/part-a.md');
  const a = readPrd(r, path.join(r, res.path));
  assert.equal(a.status, 'Draft');
  assert.equal(a.partOf, 'acme-v1');
  const body = fs.readFileSync(path.join(r, res.path), 'utf8');
  for (const h of ['Scope', 'Requirements', 'Done when', 'Open questions']) assert.match(body, new RegExp(`^## ${h}\\r?$`, 'm'));
  const p = fs.readFileSync(path.join(r, 'prds/acme-v1.md'), 'utf8');
  assert.match(p, /\| acme-v1\/old \| My own row \|\n\| acme-v1\/part-a \| Part A \|\n\nA note of mine\.\n\n## Open questions/);
});

test('prd-parts 2.2: Parts section or table header added when missing', () => {
  const r = tmp();
  put(r, 'prds/plain.md', fmText({ title: 'Plain', status: 'Draft' }, '\n## Problem\n\nP\n'));
  newPrd(r, { title: 'One', partOf: 'plain' });
  assert.match(fs.readFileSync(path.join(r, 'prds/plain.md'), 'utf8'), /## Problem\n\nP\n\n## Parts\n\n\| Part \| Title \|\n\|---\|---\|\n\| plain\/one \| One \|\n$/);
  put(r, 'prds/texty.md', fmText({ title: 'Texty', status: 'Draft' }, '\n## Parts\n\nSome words.\n\n## Risks\n\nR\n'));
  newPrd(r, { title: 'Two', partOf: 'texty' });
  assert.match(fs.readFileSync(path.join(r, 'prds/texty.md'), 'utf8'), /Some words\.\n\n\| Part \| Title \|\n\|---\|---\|\n\| texty\/two \| Two \|\n\n## Risks/);
});

test('prd-parts 2.2: new-prd --part-of refuses a missing parent, a part as parent and an existing file', () => {
  const r = tmp();
  assert.throws(() => newPrd(r, { title: 'A', partOf: 'nope' }), /parent PRD not found: prds\/nope\.md/);
  put(r, 'prds/acme-v1.md', parent());
  newPrd(r, { title: 'Part A', partOf: 'acme-v1' });
  assert.throws(() => newPrd(r, { title: 'Sub', partOf: 'acme-v1/part-a' }), /a part can't have parts/);
  assert.throws(() => newPrd(r, { title: 'Part A', partOf: 'acme-v1' }), /PRD exists, nothing written/);
  assert.equal(fs.readdirSync(path.join(r, 'prds/acme-v1')).length, 1);
});

test('prd-parts 2.3: moving a parent with an unfinished part moves nothing and names it', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent());
  put(d, 'knowledge/prds/acme-v1/part-a.md', part('Part A', 'Shipped', { change: 'acme-part-a' }));
  put(d, 'knowledge/prds/acme-v1/part-b.md', part('Part B', 'Building', { change: 'acme-part-b' }));
  const res = kcli(d, 'move', '--from', 'prds/acme-v1.md', '--to', 'archive');
  assert.equal(res.status, 3);
  assert.match(res.stdout, /acme-v1\/part-b {2}Building/);
  assert.doesNotMatch(res.stdout, /acme-v1\/part-a {2}/);
  assert.match(res.stdout, /drop it .*another parent.*a PRD of its own/s);
  assert.ok(fs.existsSync(path.join(d, 'knowledge/prds/acme-v1.md')));
  assert.ok(!fs.existsSync(path.join(d, 'knowledge/archive')));
});

test('prd-parts 2.3: a part made independent keeps status and change; proposals citing it are named', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent());
  put(d, 'knowledge/prds/acme-v1/part-b.md', part('Part B', 'Building', { change: 'acme-part-b' }));
  put(d, 'openspec/changes/acme-part-b/proposal.md', '# P\n\nPRD: knowledge/prds/acme-v1/part-b.md @ abc1234\nPRD parent: knowledge/prds/acme-v1.md @ def5678\n');
  assert.equal(kcli(d, 'set-field', '--file', 'prds/acme-v1/part-b.md', '--key', 'part-of', '--value', '').status, 0);
  const mv = kcli(d, 'move', '--from', 'prds/acme-v1/part-b.md', '--to', 'prds');
  assert.equal(mv.status, 0, mv.stderr);
  assert.match(mv.stdout, /these proposals cite the old path: openspec\/changes\/acme-part-b\/proposal\.md/);
  const b = readPrd(path.join(d, 'knowledge'), path.join(d, 'knowledge/prds/part-b.md'));
  assert.deepEqual([b.name, b.partOf, b.status, b.change, b.valid], ['part-b', null, 'Building', 'acme-part-b', true]);
});

test('prd-parts 2.3: with every part finished, the parent and its folder move together and nothing is deleted', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent({ status: 'Shipped' }));
  put(d, 'knowledge/prds/acme-v1/part-a.md', part('Part A', 'Shipped', { change: 'acme-part-a' }));
  put(d, 'knowledge/prds/acme-v1/part-b.md', part('Part B', 'Dropped'));
  const before = files(path.join(d, 'knowledge'));
  const mv = kcli(d, 'move', '--from', 'prds/acme-v1.md', '--to', 'archive');
  assert.equal(mv.status, 0, mv.stderr);
  assert.ok(fs.existsSync(path.join(d, 'knowledge/archive/prds/acme-v1.md')));
  assert.ok(fs.existsSync(path.join(d, 'knowledge/archive/prds/acme-v1/part-b.md')));
  assert.ok(!fs.existsSync(path.join(d, 'knowledge/prds/acme-v1')));
  assert.equal(files(path.join(d, 'knowledge')), before);
});

// ---------- prd-parts verify fixes ----------

test('prd-parts verify S1: --part-of is the exact parent file name only (no "..", backslash, other case, or empty)', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent());
  put(d, 'knowledge/notes/x.md', '---\ntitle: X\n---\n');
  const r = path.join(d, 'knowledge');
  for (const bad of ['..\\notes\\x', '..', 'Acme-V1']) assert.throws(() => newPrd(r, { title: 'P', partOf: bad }), /parent PRD not found/, bad);
  assert.throws(() => newPrd(r, { title: 'P', partOf: 'Acme-V1' }), /did you mean acme-v1\?/);
  assert.throws(() => newPrd(r, { title: 'P', partOf: '' }), /--part-of needs the parent PRD's slug/);
  const cli = kcli(d, 'new-prd', '--title', 'P', '--part-of');
  assert.equal(cli.status, 1);
  assert.ok(!fs.existsSync(path.join(r, 'prds/p.md')));
  assert.ok(!fs.existsSync(path.join(r, 'notes/x')));
});

test('prd-parts verify: a part with a crafted part-of never reads outside prds/', () => {
  const r = tmp();
  put(r, 'secret.md', '---\ntitle: Secret title\n---\n');
  put(r, 'prds/acme-v1/part-a.md', part('A', 'Draft', { 'part-of': '../secret' }));
  const a = readPrd(r, path.join(r, 'prds/acme-v1/part-a.md'));
  assert.equal(a.valid, false);
  assert.doesNotMatch(a.label, /Secret/);
});

test('prd-parts verify: set-field part-of with no --value removes it (PowerShell drops "")', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent());
  put(d, 'knowledge/prds/acme-v1/part-b.md', part('Part B'));
  assert.equal(kcli(d, 'set-field', '--file', 'prds/acme-v1/part-b.md', '--key', 'part-of', '--value').status, 0);
  assert.doesNotMatch(fs.readFileSync(path.join(d, 'knowledge/prds/acme-v1/part-b.md'), 'utf8'), /part-of/);
});

test('prd-parts verify: moving a finished parent refuses when its folder holds files that aren\'t its parts', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent({ status: 'Shipped' }));
  put(d, 'knowledge/prds/acme-v1/part-a.md', part('Part A', 'Shipped', { change: 'acme-part-a' }));
  put(d, 'knowledge/prds/acme-v1/part-b.md', fmText({ title: 'Detached', status: 'Building', change: 'x' }));
  put(d, 'knowledge/prds/acme-v1/part-c.md', '---\ntitle: Broken\nmeta: {a: 1}\n---\n');
  const res = kcli(d, 'move', '--from', 'prds/acme-v1.md', '--to', 'archive');
  assert.equal(res.status, 3);
  assert.match(res.stdout, /aren't its parts[\s\S]*prds\/acme-v1\/part-b\.md[\s\S]*prds\/acme-v1\/part-c\.md/);
  assert.ok(fs.existsSync(path.join(d, 'knowledge/prds/acme-v1.md')));
  assert.ok(!fs.existsSync(path.join(d, 'knowledge/archive')));
});

test('prd-parts verify: an invalid part stays indented right under its parent', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent());
  put(d, 'knowledge/prds/acme-v1/part-a.md', part('Part A', 'Done'));
  put(d, 'knowledge/prds/zeta.md', fmText({ title: 'Zeta', status: 'Draft' }));
  const lines = kcli(d, 'list').stdout.split('\n');
  const i = lines.findIndex(l => /^ {2}prds\/acme-v1\.md/.test(l));
  assert.match(lines[i + 1], /^ {4}prds\/acme-v1\/part-a\.md/);
});

test('prd-parts verify: reopening a part under a Shipped parent warns', () => {
  const d = tmp();
  put(d, 'knowledge/prds/acme-v1.md', parent({ status: 'Shipped' }));
  put(d, 'knowledge/prds/acme-v1/part-a.md', part('Part A', 'Shipped', { change: 'acme-part-a' }));
  const res = kcli(d, 'set-field', '--file', 'prds/acme-v1/part-a.md', '--key', 'status', '--value', 'Building');
  assert.equal(res.status, 0);
  assert.match(res.stdout, /WARNING acme-v1 is Shipped while acme-v1\/part-a is Building/);
});

test('prd-parts verify: a CRLF parent keeps CRLF line endings when a row is added', () => {
  const r = tmp();
  put(r, 'prds/acme-v1.md', parent().replace(/\n/g, '\r\n'));
  newPrd(r, { title: 'Part A', partOf: 'acme-v1' });
  const t = fs.readFileSync(path.join(r, 'prds/acme-v1.md'), 'utf8');
  assert.match(t, /\| acme-v1\/part-a \| Part A \|\r\n/);
  assert.doesNotMatch(t, /[^\r]\n/);
});

test('prd-parts 3.1: proposal lines from a part; PRD parent never read as the PRD line', () => {
  assert.deepEqual(prdLink('PRD: knowledge/prds/acme-v1/part-b.md @ abc1234\nPRD parent: knowledge/prds/acme-v1.md @ def5678'),
    { path: 'knowledge/prds/acme-v1/part-b.md', commit: 'abc1234', parent: { path: 'knowledge/prds/acme-v1.md', commit: 'def5678' } });
  assert.equal(prdLink('PRD parent: knowledge/prds/acme-v1.md @ def5678\nPRD: knowledge/prds/acme-v1/part-b.md @ abc1234').path, 'knowledge/prds/acme-v1/part-b.md');
  assert.deepEqual(prdLink('PRD: knowledge/prds/gift.md @ abc1234'), { path: 'knowledge/prds/gift.md', commit: 'abc1234' });
  assert.equal(prdLink('PRD parent: knowledge/prds/acme-v1.md @ def5678'), null);
  assert.equal(PRD_LINE.test('PRD parent: knowledge/prds/acme-v1.md @ def5678'), false);
});
