// browser-check-hint (spec: quality-gates "On-demand browser check"): a browser check is recommended,
// never run, when a web-ui change adds a page or input handling.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runVerify, setBrowser, browserSignals } from '../../plugins/kit/scripts/verify.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

const registry = { project_types: { 'web-ui': { tests: [], advisory: [] }, none: { tests: [], advisory: [] } } };
const g = (d, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
function project(type = 'web-ui') {
  const d = tmpDir('kit-hint-');
  w(d, '.claude/kit.json', JSON.stringify({ project_type: type }));
  w(d, 'package.json', JSON.stringify({ scripts: {} }));
  w(d, 'openspec/changes/add-x/proposal.md', '# P\n');
  w(d, 'src/components/board.tsx', 'export const Board = () => null;\n');
  g(d, 'init', '-q', '-b', 'main'); g(d, 'add', '.'); g(d, 'commit', '-qm', 'base');
  return d;
}
const hint = s => s.items.filter(i => i.id === 'H:browser');
const verify = d => runVerify({ dir: d, change: 'add-x', registry, run: () => ({ status: 0, out: '' }) });

test('quality-gates: Browser check recommended', () => {
  const d = project();
  w(d, 'src/components/board.tsx', 'export const Board = () => {\n  const onPointerDown = (e) => {};\n  return <div onPointerDown={onPointerDown} />;\n};\n');
  const s = verify(d);
  const h = hint(s);
  assert.equal(h.length, 1);
  assert.equal(h[0].level, 'ADVISORY');
  assert.match(h[0].what, /browser check is worth it/);
  assert.match(h[0].detail, /src\/components\/board\.tsx/);
  assert.match(h[0].detail, /onPointerDown/);
  assert.equal(s.browser, undefined);
});

test('a new page is a signal; a committed one on the branch too', () => {
  const d = project();
  g(d, 'checkout', '-qb', 'feat');
  w(d, 'src/app/settings/page.tsx', 'export default function Page() { return null; }\n');
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'page');
  const sig = browserSignals(d, 'add-x');
  assert.deepEqual(sig.pages, ['src/app/settings/page.tsx']);
  assert.match(hint(verify(d))[0].detail, /new page: src\/app\/settings\/page\.tsx/);
});

test('addEventListener with an input event family is a signal; tests and plain code are not', () => {
  const d = project();
  w(d, 'src/engine/input.ts', 'el.addEventListener("wheel", onWheel, { passive: false });\n');
  w(d, 'src/engine/input.test.ts', 'const onKeyDown = () => {};\n');
  w(d, 'src/lib/math.ts', 'export const add = (a, b) => a + b; // onboarding: not a handler\n');
  const sig = browserSignals(d, 'add-x');
  assert.deepEqual(sig.input.map(x => x.file), ['src/engine/input.ts']);
});

test('quality-gates: Default verify (no signal, no item)', () => {
  const d = project();
  w(d, 'src/components/board.tsx', 'export const Board = () => <div className="p-4" />;\n');
  w(d, 'src/app/_app.tsx', 'x\n');
  assert.deepEqual(hint(verify(d)), []);
});

test('quality-gates: Not a web-ui project', () => {
  const d = project('none');
  w(d, 'src/cli.ts', 'process.stdin.on("data", d => d);\nconst onKeyDown = () => {};\n');
  assert.deepEqual(hint(verify(d)), []);
});

test('quality-gates: Browser check on request (a recorded check drops the recommendation)', () => {
  const d = project();
  w(d, 'src/components/board.tsx', 'const onKeyDown = (e) => {};\n');
  assert.equal(hint(verify(d)).length, 1);
  setBrowser({ dir: d, change: 'add-x', result: 'pass' });
  assert.deepEqual(hint(verify(d)), []);
});

// verify (code review) fixes
test('odd file names and dangling paths never crash verify; names keep their characters', () => {
  const d = project();
  w(d, 'src/components/café.tsx', 'const onKeyDown = () => {};\n');
  w(d, 'src/components/my board.tsx', 'const x = 1;\n');
  g(d, 'add', 'src/components/my board.tsx'); g(d, 'commit', '-qm', 'b');
  w(d, 'src/components/my board.tsx', 'const x = 1;\nconst onPointerUp = () => {};\n');
  const sig = browserSignals(d, 'add-x');
  assert.deepEqual(sig.input.map(x => x.file).sort(), ['src/components/café.tsx', 'src/components/my board.tsx']);
});

test('an added line starting with ++ is content, not a file header', () => {
  const d = project();
  w(d, 'src/components/board.tsx', 'export const Board = () => null;\n++ counter;\nconst onWheel = () => {};\n');
  assert.deepEqual(browserSignals(d, 'add-x').input.map(x => x.file), ['src/components/board.tsx']);
});

test('drag and drop count; API routes, layouts and component folders named pages do not', () => {
  const d = project();
  w(d, 'src/components/kanban.tsx', '<div onDragStart={start} />\n');
  w(d, 'src/routes/api/items/+server.ts', 'x\n');
  w(d, 'src/routes/+layout.ts', 'x\n');
  w(d, 'src/routes/about/+page.server.ts', 'x\n');
  w(d, 'src/components/pages/Header.tsx', 'x\n');
  w(d, 'src/routes/about/+page.svelte', 'x\n');
  const sig = browserSignals(d, 'add-x');
  assert.deepEqual(sig.pages, ['src/routes/about/+page.svelte']);
  assert.deepEqual(sig.input.map(x => x.file), ['src/components/kanban.tsx']);
});

test('the label is clean: addEventListener("wheel")', () => {
  const d = project();
  w(d, 'src/engine/input.ts', 'el.addEventListener("wheel", onWheel);\n');
  assert.equal(browserSignals(d, 'add-x').input[0].what, 'addEventListener("wheel")');
});

test('recording a browser check removes the item at once; new work after it brings it back', () => {
  const d = project();
  w(d, 'src/components/board.tsx', 'const onKeyDown = (e) => {};\n');
  g(d, 'checkout', '-qb', 'feat'); g(d, 'add', '.'); g(d, 'commit', '-qm', 'board keys');
  assert.equal(hint(verify(d)).length, 1);
  const s = setBrowser({ dir: d, change: 'add-x', result: 'pass' });
  assert.ok(!s.items.some(i => i.id === 'H:browser'));
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'more work');
  w(d, 'src/app/checkout/page.tsx', 'export default () => null;\n');
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'checkout');
  assert.equal(hint(verify(d)).length, 1);
});
