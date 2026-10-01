import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const templates = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'kit', 'templates');

function repoWith(files) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-tpl-'));
  spawnSync('git', ['init', '-q'], { cwd: d });
  fs.writeFileSync(path.join(d, '.gitignore'), fs.readFileSync(path.join(templates, 'gitignore-block.txt')));
  for (const f of files) { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), 'x'); }
  return d;
}
const ignored = (d, p) => spawnSync('git', ['check-ignore', '-q', p], { cwd: d }).status === 0;

test('.gitignore block ignores licensed folders in any version or spelling', () => {
  const d = repoWith(['PM-OS-v2.1/a.md', 'pm_os/b.md', 'PMOS 3.0/c.md', 'PM-OS-v1.1/PM-OS/d.md', 'src/app.js']);
  for (const p of ['PM-OS-v2.1/a.md', 'pm_os/b.md', 'PMOS 3.0/c.md', 'PM-OS-v1.1/PM-OS/d.md']) assert.ok(ignored(d, p), `${p} should be ignored`);
  assert.equal(ignored(d, 'src/app.js'), false);
  const untracked = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: d, encoding: 'utf8' }).stdout;
  assert.doesNotMatch(untracked, /PM-?OS|pm_os/i);
});

test('.gitignore block has exactly one start and one end marker', () => {
  const t = fs.readFileSync(path.join(templates, 'gitignore-block.txt'), 'utf8');
  assert.equal(t.match(/^# kit:start/gm).length, 1);
  assert.equal(t.match(/^# kit:end/gm).length, 1);
});

test('CLAUDE.md and project-context templates have their placeholders', () => {
  const c = fs.readFileSync(path.join(templates, 'CLAUDE.md'), 'utf8');
  assert.match(c, /\{\{project\}\}/);
  assert.match(c, /\{\{routing\}\}/);
  assert.match(c, /docs\/project-context\.md/);
  const p = fs.readFileSync(path.join(templates, 'project-context.md'), 'utf8');
  assert.match(p, /\{\{project\}\}/);
  assert.match(p, /\{\{date\}\}/);
});
