import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { locate, locateAll, pathWith } from '../../plugins/kit/scripts/locate.mjs';

// A fake Windows machine laid out in a temp folder; env vars point into it.
function machine(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-locate-'));
  for (const rel of files) {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, '');
  }
  const env = {
    PATH: path.join(root, 'bin'),
    PATHEXT: '.EXE;.CMD',
    APPDATA: path.join(root, 'AppData/Roaming'),
    LOCALAPPDATA: path.join(root, 'AppData/Local'),
    ProgramFiles: path.join(root, 'Program Files'),
    USERPROFILE: path.join(root, 'home'),
  };
  return { root, env, opts: { env, platform: 'win32', npmPrefix: () => null } };
}

test('on PATH wins, with PATHEXT resolution', () => {
  const m = machine(['bin/git.exe', 'Program Files/Git/cmd/git.exe']);
  assert.deepEqual(locate('git', m.opts), { path: path.join(m.root, 'bin', 'git.exe'), via: 'path' });
});

test('preferKnown picks the standard folder over PATH (Windows Git\cmd for plugin installs)', () => {
  const m = machine(['bin/git.exe', 'Program Files/Git/cmd/git.exe']);
  assert.deepEqual(locate('git', { ...m.opts, preferKnown: true }), { path: path.join(m.env.ProgramFiles, 'Git', 'cmd', 'git.exe'), via: 'known' });
  const only = machine(['bin/git.exe']);
  assert.equal(locate('git', { ...only.opts, preferKnown: true }).via, 'path');
});

test('only in the npm global folder (openspec not on PATH)', () => {
  const m = machine(['AppData/Roaming/npm/openspec.cmd']);
  assert.deepEqual(locate('openspec', m.opts), { path: path.join(m.env.APPDATA, 'npm', 'openspec.cmd'), via: 'npm-prefix' });
});

test('npm prefix from `npm prefix -g` is searched too', () => {
  const m = machine(['custom-npm/openspec.cmd']);
  const r = locate('openspec', { ...m.opts, npmPrefix: () => path.join(m.root, 'custom-npm') });
  assert.equal(r.via, 'npm-prefix');
});

test('only in Program Files (gh installed but not on PATH)', () => {
  const m = machine(['Program Files/GitHub CLI/gh.exe']);
  assert.deepEqual(locate('gh', m.opts), { path: path.join(m.env.ProgramFiles, 'GitHub CLI', 'gh.exe'), via: 'known' });
});

test('winget package folder with a version-specific name', () => {
  const m = machine(['AppData/Local/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_Microsoft.Winget.Source_8wekyb3d8bbwe/gitleaks.exe']);
  const r = locate('gitleaks', m.opts);
  assert.equal(r.via, 'known');
  assert.match(r.path, /Gitleaks\.Gitleaks_.*gitleaks\.exe$/);
});

test('missing everywhere returns null', () => {
  const m = machine([]);
  assert.equal(locate('git', m.opts), null);
  assert.equal(locate('openspec', m.opts), null);
  assert.equal(locate('no-such-tool', m.opts), null);
});

test('missing env var for a known location is skipped, not a crash', () => {
  const m = machine(['Program Files/GitHub CLI/gh.exe']);
  const env = { ...m.env }; delete env.ProgramFiles;
  assert.equal(locate('gh', { ...m.opts, env }), null);
});

test('locateAll and pathWith prepend the tool folders', () => {
  const m = machine(['Program Files/Git/cmd/git.exe', 'home/.local/bin/claude.exe']);
  const found = locateAll(['git', 'claude', 'jq'], m.opts);
  assert.equal(found.jq, null);
  const p = pathWith(found, m.env, 'win32').split(';');
  assert.equal(p[0], path.join(m.env.ProgramFiles, 'Git', 'cmd'));
  assert.equal(p[1], path.join(m.env.USERPROFILE, '.local', 'bin'));
  assert.equal(p.at(-1), m.env.PATH);
});
