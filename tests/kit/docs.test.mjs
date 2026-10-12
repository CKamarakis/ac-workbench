import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpec, findSpecs, specTree } from '../../plugins/kit/scripts/docs.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(here, 'fixtures', 'docs');
const DOCS_SYNC = fs.readFileSync(path.join(FIX, 'docs-sync.spec.md'), 'utf8').replace(/\r\n/g, '\n');
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-docs-'));
const SPEC = name => `# ${name}\n\n## Purpose\nP.\n\n## Requirements\n\n### Requirement: R\nThe app SHALL r.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n`;
const kinds = sc => sc.rows.map(r => r.kw);

// 2.1
test('parseSpec keeps requirement names and splits scenario rows', () => {
  const s = parseSpec(DOCS_SYNC);
  assert.equal(s.requirements[0].name, 'Docs sync sources');
  assert.deepEqual(kinds(s.requirements[0].scenarios[0]), ['GIVEN', 'WHEN', 'THEN']);
  const sc = s.requirements[1].scenarios.find(x => x.name === 'Behavior found in the receipt');
  assert.equal(sc.rows.length, 3);
  assert.match(s.purpose, /^Brings a change's specs/);
  assert.match(s.requirements[0].text, /^The docs sync SHALL run/);
  assert.deepEqual(s.warnings, []);
});

test('scenario without GIVEN has two rows; AND is its own row', () => {
  const s = parseSpec('### Requirement: A\nThe app SHALL a.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n- **AND** c\n');
  assert.deepEqual(kinds(s.requirements[0].scenarios[0]), ['WHEN', 'THEN', 'AND']);
  assert.equal(s.requirements[0].scenarios[0].rows[2].text, 'c');
});

test('CRLF parses like LF', () => {
  assert.deepEqual(parseSpec(DOCS_SYNC.replace(/\n/g, '\r\n')), parseSpec(DOCS_SYNC));
});

test('malformed spec warns, never throws', () => {
  const s = parseSpec('### Requirement:\nno name\n\n#### Scenario: empty\njust text\n');
  assert.ok(s.warnings.length > 0);
});

// 2.2
test('nested specs become one product with children; flat spec is one level', () => {
  const d = tmp();
  w(d, 'openspec/specs/storms/stickies/spec.md', SPEC('stickies'));
  w(d, 'openspec/specs/storms/saving/spec.md', SPEC('saving'));
  w(d, 'openspec/specs/docs-sync/spec.md', SPEC('docs-sync'));
  const specs = findSpecs(d);
  assert.deepEqual(specs.map(s => s.path), ['docs-sync', 'storms/saving', 'storms/stickies']);
  const tree = specTree(specs);
  assert.deepEqual(tree.map(n => n.name), ['Docs sync', 'Storms']);
  const storms = tree[1];
  assert.equal(storms.hasSpec, false);
  assert.deepEqual(storms.children.map(n => [n.name, n.path, n.hasSpec]), [['Saving', 'storms/saving', true], ['Stickies', 'storms/stickies', true]]);
  assert.deepEqual(tree[0].children, []);
});

test('parent with its own spec and children', () => {
  const d = tmp();
  w(d, 'openspec/specs/storms/spec.md', SPEC('storms'));
  w(d, 'openspec/specs/storms/stickies/spec.md', SPEC('stickies'));
  const [storms] = specTree(findSpecs(d));
  assert.equal(storms.hasSpec, true);
  assert.equal(storms.children.length, 1);
});

test('names from segments: moving-around -> Moving around', () => {
  const d = tmp();
  w(d, 'openspec/specs/storms/moving-around/spec.md', SPEC('m'));
  assert.equal(specTree(findSpecs(d))[0].children[0].name, 'Moving around');
});

test('no openspec/specs -> no specs, no throw', () => {
  assert.deepEqual(findSpecs(tmp()), []);
});

// ---- Task 3: archive history and scan (2.3, 2.4)
import { spawnSync } from 'node:child_process';
import { archivedChanges, lastChangedBy, parseNote, parseTools, parseCard, scan, PAGE_MARK } from '../../plugins/kit/scripts/docs.mjs';

const REQ = n => `### Requirement: ${n}\nThe app SHALL x.\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n`;
function archive(d, folder, { why = 'Because it matters.', specs = {} } = {}) {
  w(d, `openspec/changes/archive/${folder}/proposal.md`, `## Why\n\n${why}\nSecond line.\n\n## What Changes\n- x\n`);
  for (const [p, t] of Object.entries(specs)) w(d, `openspec/changes/archive/${folder}/specs/${p}/spec.md`, t);
}
const git = (d, ...a) => spawnSync('git', a, { cwd: d, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_DATE: '2026-10-10T12:00:00', GIT_COMMITTER_DATE: '2026-10-10T12:00:00' } });

test('history newest first with the first line of the proposal why', () => {
  const d = tmp();
  archive(d, '2026-10-07-a', { why: 'First reason.', specs: { 'storms/stickies': `## ADDED Requirements\n\n${REQ('Drag')}` } });
  archive(d, '2026-10-12-b', { why: 'Second reason.', specs: { 'storms/stickies': `## MODIFIED Requirements\n\n${REQ('Drag')}` } });
  const a = archivedChanges(d);
  assert.deepEqual(a.map(x => x.folder), ['2026-10-12-b', '2026-10-07-a']);
  assert.deepEqual(a.map(x => [x.date, x.change, x.why]), [['2026-10-12', 'b', 'Second reason.'], ['2026-10-07', 'a', 'First reason.']]);
  assert.deepEqual(a[0].specPaths, ['storms/stickies']);
  assert.equal(lastChangedBy(a, 'storms/stickies', 'Drag').folder, '2026-10-12-b');
  assert.equal(lastChangedBy(a, 'storms/stickies', 'Nope'), null);
});

test('archive without specs has no spec paths; undated folder sorts after dated ones', () => {
  const d = tmp();
  archive(d, '2026-10-07-a');
  archive(d, 'old-thing');
  const a = archivedChanges(d);
  assert.deepEqual(a.map(x => x.folder), ['2026-10-07-a', 'old-thing']);
  assert.deepEqual(a[0].specPaths, []);
  assert.equal(a[1].date, null);
  assert.equal(a[1].change, 'old-thing');
});

test('parseNote: how it works, why entries per requirement, card links', () => {
  const n = parseNote('# Stickies\n\n## How it works, roughly\nDrawn on canvas.\n200x200 default.\n\n## Why\n\n- **Bring to front**: one sort key, so only one sticky changes. See [[storms-canvas]].\n- **Drag**: plain.\n');
  assert.equal(n.how, 'Drawn on canvas.\n200x200 default.');
  assert.deepEqual(n.why.map(x => x.requirement), ['Bring to front', 'Drag']);
  assert.deepEqual(n.why[0].cards, ['storms-canvas']);
  assert.match(n.why[0].text, /^one sort key/);
  assert.equal(parseNote('## Why\n').how, null);
});

test('parseTools: groups, one tool with many packages, dev flag', () => {
  const t = parseTools('# Tools\n\n## Rich text\n\n### TipTap\n- packages: @tiptap/react, @tiptap/pm, @tiptap/starter-kit\n- for: rich text in stickies\n- used by: storms/stickies\n- added by: storms-items\n- dev: no\n\n## Testing\n\n### Vitest\n- for: unit tests\n- dev: yes\n');
  assert.deepEqual(t.map(g => g.group), ['Rich text', 'Testing']);
  const tip = t[0].tools[0];
  assert.deepEqual([tip.name, tip.packages.length, tip.purpose, tip.usedBy, tip.addedBy, tip.dev], ['TipTap', 3, 'rich text in stickies', 'storms/stickies', 'storms-items', false]);
  assert.deepEqual([t[1].tools[0].packages, t[1].tools[0].dev], [['Vitest'], true]);
});

test('parseCard: frontmatter, sections, replaced keeps replacedBy', () => {
  const c = parseCard('---\ntitle: Storms draws on a canvas\nstatus: replaced\nreplaced_by: storms-webgl\n---\n\n## In short\nCanvas.\n\n## Limits you\nScreen readers.\n', 'storms/storms-canvas.md');
  assert.deepEqual([c.slug, c.product, c.title, c.status, c.replacedBy], ['storms-canvas', 'storms', 'Storms draws on a canvas', 'replaced', 'storms-webgl']);
  assert.equal(c.sections['Limits you'], 'Screen readers.');
  const app = parseCard('---\ntitle: Local first\n---\n', 'local-first.md');
  assert.deepEqual([app.product, app.status, app.replacedBy], [null, 'current', null]);
});

test('scan: missing and stale notes', () => {
  const d = tmp();
  git(d, 'init', '-q');
  w(d, 'openspec/specs/storms/stickies/spec.md', SPEC('stickies'));
  w(d, 'openspec/specs/storms/saving/spec.md', SPEC('saving'));
  w(d, 'knowledge/docs/storms/stickies.md', '## Why\n');
  git(d, 'add', '.'); git(d, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'notes');
  archive(d, '2026-10-12-x', { specs: { 'storms/stickies': `## ADDED Requirements\n\n${REQ('R2')}` } });
  const s = scan({ dir: d });
  assert.deepEqual(s.specs, [{ path: 'storms/saving', requirements: 1 }, { path: 'storms/stickies', requirements: 1 }]);
  assert.deepEqual(s.notes.missing, ['storms/saving']);
  assert.deepEqual(s.notes.stale, [{ path: 'storms/stickies', since: '2026-10-12-x' }]);
});

test('scan: uncommitted note uses its file date (today: not stale against an older archive)', () => {
  const d = tmp();
  w(d, 'openspec/specs/a/spec.md', SPEC('a'));
  w(d, 'knowledge/docs/a.md', '## Why\n');
  archive(d, '2020-01-01-old', { specs: { a: `## ADDED Requirements\n\n${REQ('R')}` } });
  assert.deepEqual(scan({ dir: d }).notes.stale, []);
});

test('scan: unlisted and gone tools; no package.json -> tools null', () => {
  const d = tmp();
  w(d, 'package.json', JSON.stringify({ dependencies: { '@tiptap/react': '1' }, devDependencies: { 'fake-indexeddb': '1' } }));
  w(d, 'knowledge/docs/tools.md', '## Rich text\n\n### TipTap\n- packages: @tiptap/react\n\n## Old\n\n### Moment\n- packages: moment\n');
  const s = scan({ dir: d });
  assert.deepEqual(s.tools, { unlisted: ['fake-indexeddb'], gone: ['Moment'] });
  assert.equal(scan({ dir: tmp() }).tools, null);
});

test('scan: cards found; page stale when built from an older archive', () => {
  const d = tmp();
  w(d, 'knowledge/foundations/local-first.md', '---\ntitle: Local first\n---\n');
  w(d, 'knowledge/foundations/storms/storms-canvas.md', '---\ntitle: Canvas\n---\n');
  archive(d, '2026-10-07-a'); archive(d, '2026-10-12-b');
  assert.deepEqual(scan({ dir: d }).page, { exists: false, builtFrom: null, stale: false });
  w(d, 'knowledge/docs/index.html', `<html><head><meta name="${PAGE_MARK}" content="2026-10-07-a"></head></html>`);
  const s = scan({ dir: d });
  assert.deepEqual(s.cards, ['local-first', 'storms/storms-canvas']);
  assert.deepEqual(s.page, { exists: true, builtFrom: '2026-10-07-a', stale: true });
});

// ---- Task 5: build (3.2-3.4)
import { buildModel, build, undecided } from '../../plugins/kit/scripts/docs.mjs';

const decisionsFile = (items) => `# Decisions\n\n<!-- kit-decisions-data ${JSON.stringify({ change: 'x', next: items.length + 1, items, readyAt: null })} -->\n`;
const item = (id, from, status = 'open') => ({ id, kind: 'gap', text: `Question ${id}?`, from, status, dates: { opened: '2026-10-12' } });

function project() {
  const d = tmp();
  w(d, 'package.json', JSON.stringify({ name: 'toughbubble', devDependencies: { vitest: '1' } }));
  w(d, 'openspec/specs/storms/stickies/spec.md', `# s\n\n## Purpose\nSticky notes.\n\n## Requirements\n\n${REQ('Drag')}\n${REQ('Bring to front')}`);
  w(d, 'openspec/specs/storms/saving/spec.md', `# s\n\n## Requirements\n\n${REQ('Save')}`);
  archive(d, '2026-10-07-a', { why: 'First.', specs: { 'storms/stickies': `## ADDED Requirements\n\n${REQ('Drag')}` } });
  archive(d, '2026-10-12-b', { why: 'Second.', specs: { 'storms/stickies': `## ADDED Requirements\n\n${REQ('Bring to front')}` } });
  fs.appendFileSync(path.join(d, 'openspec/changes/archive/2026-10-12-b/proposal.md'), '\nPRD: knowledge/prds/storms-canvas.md @ abc1234\n');
  w(d, 'knowledge/prds/storms-canvas.md', '---\ntitle: Storms canvas\nstatus: Shipped\n---\n');
  w(d, 'knowledge/docs/storms/stickies.md', '## How it works, roughly\nCanvas.\n\n## Why\n\n- **Bring to front**: one sort key. [[storms-canvas]]\n- **Gone requirement**: because\n');
  w(d, 'knowledge/foundations/storms/storms-canvas.md', '---\ntitle: Storms draws on a canvas\n---\n\n## In short\nCanvas.\n');
  w(d, 'openspec/changes/x/proposal.md', '## Why\nx\n');
  w(d, 'openspec/changes/x/decisions.md', decisionsFile([item('D1', 'openspec/changes/x/specs/storms/saving/spec.md:40'), item('D2', 'design.md:3', 'later'), { ...item('D3', 'design.md:4'), status: 'decided' }]));
  return d;
}

test('model: tree dates, PRD link, why per requirement, orphan why, history, cards', () => {
  const d = project();
  const m = buildModel({ dir: d });
  assert.equal(m.title, 'toughbubble');
  assert.equal(m.builtFrom, '2026-10-12-b');
  const storms = m.tree.find(n => n.path === 'storms');
  const stickies = storms.children.find(n => n.path === 'storms/stickies');
  assert.deepEqual([stickies.created, stickies.updated], ['2026-10-07', '2026-10-12']);
  assert.deepEqual([storms.created, storms.updated], ['2026-10-07', '2026-10-12']);
  const p = m.pages['storms/stickies'];
  assert.deepEqual(p.prd, { title: 'Storms canvas', status: 'Shipped', path: 'knowledge/prds/storms-canvas.md' });
  assert.equal(p.how, 'Canvas.');
  assert.equal(p.purpose, 'Sticky notes.');
  const front = p.requirements.find(r => r.name === 'Bring to front');
  assert.deepEqual(front.why[0].cards, ['storms-canvas']);
  assert.equal(front.change.folder, '2026-10-12-b');
  assert.deepEqual(p.orphanWhy.map(o => o.requirement), ['Gone requirement']);
  assert.deepEqual(p.history.map(h => h.folder), ['2026-10-12-b', '2026-10-07-a']);
  assert.deepEqual(m.cards.map(c => c.slug), ['storms-canvas']);
  assert.deepEqual(m.tools, []);
});

test('undecided on a sub-feature; others listed per change; decided ones left out', () => {
  const d = project();
  const u = undecided(d);
  assert.deepEqual(u.map(x => [x.id, x.specPath, x.status, x.date]), [['D1', 'storms/saving', 'open', '2026-10-12'], ['D2', null, 'later', '2026-10-12']]);
  const m = buildModel({ dir: d });
  assert.equal(m.pages['storms/saving'].undecided.length, 1);
  assert.equal(m.tree.find(n => n.path === 'storms').children.find(n => n.path === 'storms/saving').undecided, 1);
  assert.equal(m.tree.find(n => n.path === 'storms').undecided, 1);
  assert.deepEqual(m.undecidedByChange.x.map(x => x.id), ['D2']);
});

test('build writes a byte-identical, offline, escaped page that records the newest archive', () => {
  const d = project();
  w(d, 'openspec/specs/evil/spec.md', `## Requirements\n\n### Requirement: A <b>"x"</b> & y\n<script>alert(1)</script>\n\n#### Scenario: s\n- **WHEN** a\n- **THEN** b\n`);
  const r1 = build({ dir: d });
  const a = fs.readFileSync(r1.file, 'utf8');
  build({ dir: d });
  assert.equal(fs.readFileSync(r1.file, 'utf8'), a);
  assert.equal(path.relative(d, r1.file).split(path.sep).join('/'), 'knowledge/docs/index.html');
  assert.ok(!a.includes('<script>alert'));
  assert.ok(!/https?:\/\//.test(a));
  assert.match(a, /<meta name="kit-docs-archive" content="2026-10-12-b">/);
  assert.deepEqual(r1.counts, { specs: 3, requirements: 4, cards: 1, tools: 0, undecided: 2 });
  assert.equal(scan({ dir: d }).page.stale, false);
});

test('missing sources degrade: no specs, no package.json, unreadable decisions, unparsable spec', () => {
  const d = tmp();
  w(d, 'knowledge/foundations/local-first.md', '---\ntitle: Local first\n---\n');
  w(d, 'openspec/changes/y/decisions.md', '# broken, no data block\n');
  const r = build({ dir: d });
  const html = fs.readFileSync(r.file, 'utf8');
  const m = buildModel({ dir: d });
  assert.equal(m.empty, true);
  assert.equal(m.tools, null);
  assert.match(html, /No specs yet/);
  assert.match(html, /Local first/);
  assert.match(html, /No package\.json/);
  assert.ok(r.warnings.some(x => /openspec\/changes\/y\/decisions\.md/.test(x)));
  w(d, 'openspec/specs/bad/spec.md', '### Requirement:\nno name\n');
  assert.ok(buildModel({ dir: d }).pages.bad.warnings.length > 0);
});
