import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check, isKitFile, format } from './smoke-check.mjs';
import { tmpDir } from '../tools/test-root.mjs';

// kit-cross-platform 5.1: a throwaway git repo shaped like this one
function repo() {
  const dir = tmpDir('kit-smokecheck-');
  const git = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8' });
  git('init', '-q');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  const write = (rel, s = 'x') => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), s); };
  write('plugins/kit/scripts/verify.mjs');
  write('docs/roadmap.md');
  git('add', '-A');
  git('commit', '-qm', 'init');
  const head = git('rev-parse', 'HEAD').stdout.trim();
  const record = path.join(dir, '.smoke-pass.json');
  const pass = (commit = head) => fs.writeFileSync(record, JSON.stringify({ commit, date: '2026-10-13', platform: 'win32', openspec: '1.13.2' }));
  return { dir, git, write, head, record, pass };
}

test('kit paths: scripts, hooks, skills, templates, data, manifests and the registry count; docs do not', () => {
  for (const f of ['plugins/kit/scripts/a.mjs', 'plugins/kit/hooks/h.mjs', 'plugins/kit/skills/x/SKILL.md', 'plugins/kit/templates/t.md',
    'plugins/kit/data/toolkit.json', 'plugins/kit/.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'toolkit.yaml']) assert.ok(isKitFile(f), f);
  for (const f of ['docs/roadmap.md', 'knowledge/notes/n.md', 'openspec/changes/x/tasks.md', 'evals/next/runs/r.json', 'README.md']) assert.ok(!isKitFile(f), f);
});

test('script changed since the last pass: recommended, exit 3, file listed, system shown', () => {
  const r = repo();
  r.pass();
  r.write('plugins/kit/scripts/verify.mjs', 'changed');
  r.git('commit', '-qam', 'edit');
  const c = check({ repo: r.dir, record: r.record });
  assert.equal(c.code, 3);
  assert.deepEqual(c.files, ['plugins/kit/scripts/verify.mjs']);
  const text = format(c);
  assert.match(text, /smoke test recommended: 1 kit file changed/);
  assert.match(text, /plugins\/kit\/scripts\/verify\.mjs/);
  assert.match(text, /last pass: .*Windows/);
});

test('uncommitted and untracked kit files count too', () => {
  const r = repo();
  r.pass();
  r.write('plugins/kit/skills/new/SKILL.md');
  r.write('toolkit.yaml');
  assert.deepEqual(check({ repo: r.dir, record: r.record }).files, ['plugins/kit/skills/new/SKILL.md', 'toolkit.yaml']);
});

test('only docs changed: not needed, exit 0', () => {
  const r = repo();
  r.pass();
  r.write('docs/roadmap.md', 'changed');
  r.git('commit', '-qam', 'docs');
  const c = check({ repo: r.dir, record: r.record });
  assert.equal(c.code, 0);
  assert.match(format(c), /smoke test not needed/);
});

test('no record, or a commit git does not know: recommended with the reason', () => {
  const r = repo();
  const none = check({ repo: r.dir, record: r.record });
  assert.equal(none.code, 3);
  assert.match(format(none), /no smoke pass recorded/);
  r.pass('0123456789abcdef0123456789abcdef01234567');
  const gone = check({ repo: r.dir, record: r.record });
  assert.equal(gone.code, 3);
  assert.match(format(gone), /not found in git/);
});
