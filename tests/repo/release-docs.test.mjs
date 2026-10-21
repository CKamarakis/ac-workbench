// release-docs (spec: repo-release): the README a stranger reads first, and the changelog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('repo-release: Opening sections', () => {
  const md = read('README.md');
  const at = h => md.search(new RegExp(`^## ${h}$`, 'm'));
  const order = ['Status', 'Quickstart', 'The happy path', 'Limits', 'Coming next'].map(at);
  const ref = md.search(/^# Reference$/m);
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])) && ref > order.at(-1), 'opening sections in order, before Reference');
  // Every image and local link resolves (anchors and URLs skipped).
  const links = [...md.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)].map(m => m[1]).filter(l => !/^[a-z]+:/i.test(l));
  assert.ok(links.length > 5);
  for (const l of links) assert.ok(fs.existsSync(path.join(ROOT, l)), `missing: ${l}`);
});

test('repo-release: Newest entry matches the plugin', () => {
  const version = JSON.parse(read('plugins/kit/.claude-plugin/plugin.json')).version;
  const first = read('CHANGELOG.md').match(/^## (\S+)/m)[1];
  assert.equal(first, version);
});
