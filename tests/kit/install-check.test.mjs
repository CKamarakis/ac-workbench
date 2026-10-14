import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkInstall } from '../../tools/install-check.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

// kit-cross-platform 6.1: the plugin as Claude Code loads it (spec: kit-self-test "Install check")
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function copy() {
  const dir = tmpDir('kit-install-');
  fs.cpSync(path.join(REPO, '.claude-plugin'), path.join(dir, '.claude-plugin'), { recursive: true });
  fs.cpSync(path.join(REPO, 'plugins', 'kit'), path.join(dir, 'plugins', 'kit'), { recursive: true });
  return dir;
}

test('this repo: marketplace, plugin.json, hooks and every skill are valid', () => {
  assert.deepEqual(checkInstall(REPO), []);
});

test('a SKILL.md without description fails, naming the file and the field', () => {
  const dir = copy();
  const f = path.join(dir, 'plugins/kit/skills/ping/SKILL.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^description:.*$/m, ''));
  const p = checkInstall(dir);
  assert.ok(p.some(x => x.includes('plugins/kit/skills/ping/SKILL.md') && x.includes('description')), p.join('\n'));
});

test('a skill whose name does not match its folder fails', () => {
  const dir = copy();
  const f = path.join(dir, 'plugins/kit/skills/ping/SKILL.md');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^name:.*$/m, 'name: pong'));
  assert.ok(checkInstall(dir).some(x => x.includes('ping/SKILL.md') && x.includes('pong')));
});

test('a hook pointing to a missing file, or an unknown event, fails', () => {
  const dir = copy();
  const f = path.join(dir, 'plugins/kit/hooks/hooks.json');
  const h = JSON.parse(fs.readFileSync(f, 'utf8'));
  h.hooks.PreToolUse[0].hooks[0].command = 'node "${CLAUDE_PLUGIN_ROOT}/hooks/gone.mjs"';
  h.hooks.PreToolUsee = [];
  fs.writeFileSync(f, JSON.stringify(h));
  const p = checkInstall(dir);
  assert.ok(p.some(x => x.includes('hooks/gone.mjs')), p.join('\n'));
  assert.ok(p.some(x => x.includes('PreToolUsee')), p.join('\n'));
});

test('marketplace pointing to a missing folder, and a bad plugin version, fail', () => {
  const dir = copy();
  const m = path.join(dir, '.claude-plugin/marketplace.json');
  const mj = JSON.parse(fs.readFileSync(m, 'utf8'));
  mj.plugins.push({ name: 'ghost', source: './plugins/ghost' });
  fs.writeFileSync(m, JSON.stringify(mj));
  const pj = path.join(dir, 'plugins/kit/.claude-plugin/plugin.json');
  fs.writeFileSync(pj, JSON.stringify({ ...JSON.parse(fs.readFileSync(pj, 'utf8')), version: '0.8' }));
  const p = checkInstall(dir);
  assert.ok(p.some(x => x.includes('ghost')), p.join('\n'));
  assert.ok(p.some(x => x.includes('plugin.json') && x.includes('version')), p.join('\n'));
});

// Code review C4: plugins hosted elsewhere (GitHub, URL) are not checked as local folders
test('a plugin with a non-local source is not reported missing', () => {
  const dir = copy();
  const m = path.join(dir, '.claude-plugin/marketplace.json');
  const mj = JSON.parse(fs.readFileSync(m, 'utf8'));
  mj.plugins.push({ name: 'remote', source: { source: 'github', repo: 'someone/remote' } });
  fs.writeFileSync(m, JSON.stringify(mj));
  assert.deepEqual(checkInstall(dir), []);
});
