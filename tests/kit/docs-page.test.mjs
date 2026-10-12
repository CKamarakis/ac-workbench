import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../../plugins/kit/scripts/docs-page.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const model = () => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', 'docs', 'model.json'), 'utf8'));
const count = (s, re) => (s.match(re) ?? []).length;

test('user stories are numbered and each is its own list item', () => {
  const html = renderPage(model());
  assert.equal(count(html, /<li class="story">/g), 2);
  assert.match(html, /<span class="story-n">1<\/span>/);
  assert.match(html, /<span class="story-n">2<\/span>/);
  assert.match(html, /<span class="kw">AND<\/span>/);
});

test('tree nodes carry sort data; default sort is last updated, newest first, server-side too', () => {
  const html = renderPage(model());
  assert.match(html, /data-path="storms\/saving" data-name="saving" data-created="2026-10-12" data-updated="2026-10-12"/);
  assert.match(html, /<option value="updated" selected>/);
  assert.match(html, /data-dir="desc"/);
  // storms (updated 10-12) before account (no date); saving (10-12) before stickies (10-10)
  assert.ok(html.indexOf('data-path="storms"') < html.indexOf('data-path="account"'));
  assert.ok(html.indexOf('data-path="storms/saving"') < html.indexOf('data-path="storms/stickies"'));
});

test('From PRD shows title and status; undecided count in the tree and on the page', () => {
  const html = renderPage(model());
  assert.match(html, /From PRD[\s\S]*Storms canvas[\s\S]*Shipped/);
  assert.match(html, /<span class="badge" title="1 undecided">1<\/span>/);
  assert.match(html, /Should a corrupt board load as empty\?/);
  assert.match(html, /Keep full undo history on each save\?/);
});

test('why, card links, replaced card, orphan why, history, tools, warnings', () => {
  const html = renderPage(model());
  assert.match(html, /href="#foundations\/storms-canvas"/);
  assert.match(html, /Replaced by[\s\S]*storms-canvas/);
  assert.match(html, /Notes without a requirement[\s\S]*Gone requirement/);
  assert.match(html, /Boards need to feel instant/);
  assert.match(html, /TipTap[\s\S]*@tiptap\/react/);
  assert.match(html, /class="tool dev"/);
  assert.match(html, /spec could not be read/);
});

test('renderPage is pure and offline', () => {
  const a = renderPage(model()), b = renderPage(model());
  assert.equal(a, b);
  assert.ok(!/https?:\/\//.test(a), 'no URLs');
  assert.ok(!/<link\b|\bsrc=/.test(a), 'nothing loaded');
  assert.match(a, /<meta name="kit-docs-archive" content="2026-10-12-b">/);
});

test('markup in names and text is escaped', () => {
  const m = model();
  m.pages['storms/stickies'].requirements[0].name = 'A <b>"x"</b> & y';
  m.pages['storms/stickies'].requirements[0].text = '<script>alert(1)</script>';
  const html = renderPage(m);
  assert.ok(!html.includes('<script>alert'));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /A &lt;b&gt;&quot;x&quot;&lt;\/b&gt; &amp; y/);
});

test('empty project says no specs yet', () => {
  const m = model();
  Object.assign(m, { empty: true, tree: [], pages: {} });
  assert.match(renderPage(m), /No specs yet/);
});

// Task 6 fixes chosen by the user: readable text, card links, collapsible products
import { inlineMd } from '../../plugins/kit/scripts/docs-page.mjs';
test('requirement text renders basic Markdown safely', () => {
  const html = inlineMd('The sync SHALL gather:\n- **gaps**: missing `empty` cases;\n- <b>raw</b> stays text\n\nSecond paragraph.');
  assert.equal(html, '<p>The sync SHALL gather:</p><ul><li><b>gaps</b>: missing <code>empty</code> cases;</li><li>&lt;b&gt;raw&lt;/b&gt; stays text</li></ul><p>Second paragraph.</p>');
});

test('card links match the card anchor, product cards included', () => {
  const html = renderPage(model());
  assert.match(html, /href="#foundations\/storms-canvas"/);
  assert.match(html, /data-card="storms-canvas"/);
});

test('products open and close', () => {
  const html = renderPage(model());
  assert.match(html, /<details open><summary>Storms[^<]*<span class="badge"[^>]*>1<\/span><\/summary><ul data-tree>/);
});
