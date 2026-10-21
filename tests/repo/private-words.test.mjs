// public-repo-scrub (spec: repo-privacy "Private words blocked at commit"): the hooks block listed words
// in staged lines, file paths and the commit message. Fake words only: this file is public.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from '../../tools/test-root.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HOOKS = path.join(REPO, '.githooks');
const g = (d, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd: d, encoding: 'utf8' });
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };

/** A throwaway repo whose hooks are this repo's private-words check and commit-msg hook (gitleaks left out). */
function repo(list = '# test list\nzebrafish\nPlum/Path\n') {
  const d = tmpDir('kit-privwords-');
  g(d, 'init', '-q', '-b', 'main');
  const hooks = path.join(d, 'hooks');
  fs.mkdirSync(hooks);
  fs.copyFileSync(path.join(HOOKS, 'private-words.sh'), path.join(hooks, 'private-words.sh'));
  fs.copyFileSync(path.join(HOOKS, 'commit-msg'), path.join(hooks, 'commit-msg'));
  fs.copyFileSync(path.join(HOOKS, 'image-text.mjs'), path.join(hooks, 'image-text.mjs'));
  w(hooks, 'pre-commit', '#!/bin/sh\nsh "$(dirname "$0")/private-words.sh" staged || exit 1\n');
  g(d, 'config', 'core.hooksPath', 'hooks');
  w(d, '.gitignore', '.private-words\nhooks/\n');
  if (list != null) w(d, '.private-words', list);
  w(d, 'a.md', 'base\n');
  g(d, 'add', '.'); g(d, 'commit', '-qm', 'base');
  return d;
}
const commit = (d, msg = 'change') => { g(d, 'add', '-A'); return g(d, 'commit', '-qm', msg); };

test('repo-privacy: Listed word in a staged file', () => {
  const d = repo();
  w(d, 'a.md', 'base\nWe tested on ZebraFish today.\n');
  const r = commit(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /a listed word is in a\.md/);
  assert.doesNotMatch(r.stderr, /zebrafish/i);
});

test('repo-privacy: Listed word in the commit message', () => {
  const d = repo();
  w(d, 'a.md', 'base\nclean line\n');
  const r = commit(d, 'notes from the zebrafish run');
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /in the commit message/);
});

test('repo-privacy: Removing a listed word is allowed', () => {
  const d = repo(null);
  w(d, 'a.md', 'base\nzebrafish line\n');
  commit(d);
  w(d, '.private-words', 'zebrafish\n');
  w(d, 'a.md', 'base\n');
  assert.equal(commit(d).status, 0);
});

test('repo-privacy: No word list', () => {
  const d = repo(null);
  w(d, 'a.md', 'base\nzebrafish\n');
  const r = commit(d);
  assert.equal(r.status, 0);
  assert.match(r.stderr, /no \.private-words list/);
  const e = repo('# only a comment\n\n');
  w(e, 'a.md', 'base\nzebrafish\n');
  assert.equal(commit(e).status, 0);
});

test('repo-privacy: Word list never committed', () => {
  for (const p of ['.private-words', 'private/notes.md']) assert.equal(spawnSync('git', ['check-ignore', '-q', p], { cwd: REPO }).status, 0, p);
});

test('whole words only, any case; paths and file names are checked too', () => {
  const d = repo();
  w(d, 'a.md', 'base\nzebrafishes and bigzebrafish are other words\n');
  assert.equal(commit(d).status, 0);
  w(d, 'trials/zebrafish-run.md', 'clean\n');
  assert.match(commit(d).stderr, /trials\/zebrafish-run\.md/);
  g(d, 'reset', '-q');
  fs.rmSync(path.join(d, 'trials'), { recursive: true });
  w(d, 'b.md', 'see C:\\Users\\x\\..\\Plum/Path/temp\n');
  assert.notEqual(commit(d).status, 0);
});

test('the real pre-commit and commit-msg hooks call the check', () => {
  assert.match(fs.readFileSync(path.join(HOOKS, 'pre-commit'), 'utf8'), /private-words\.sh" staged \|\| exit 1/);
  assert.match(fs.readFileSync(path.join(HOOKS, 'commit-msg'), 'utf8'), /private-words\.sh" message "\$1"/);
});

// rc-fixes (spec: repo-privacy "Image metadata checked"): metadata is read, pixel bytes never are.
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); return Buffer.concat([len, Buffer.from(type, 'latin1'), data, Buffer.alloc(4)]); };
const png = (...chunks) => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Buffer.alloc(13)), ...chunks, chunk('IEND', Buffer.alloc(0))]);
const wb = (d, rel, buf) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), buf); };

test('repo-privacy: Image metadata checked (PNG text chunk, JPEG XMP); pixel bytes are not', () => {
  const d = repo();
  wb(d, 'img/meta.png', png(chunk('tEXt', Buffer.from('Comment\0made for ZebraFish', 'latin1'))));
  let r = commit(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /metadata of img\/meta\.png/);
  assert.doesNotMatch(r.stderr, /zebrafish/i);
  g(d, 'reset', '-q'); fs.rmSync(path.join(d, 'img'), { recursive: true });

  wb(d, 'img/pixels.png', png(chunk('IDAT', Buffer.from(' zebrafish ', 'latin1'))));
  assert.equal(commit(d).status, 0, 'a word inside pixel data is not metadata');

  const xmp = Buffer.from('<x:xmpmeta><dc:creator>zebrafish</dc:creator></x:xmpmeta>', 'utf8');
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), Buffer.from([0, xmp.length + 2]), xmp]);
  wb(d, 'img/photo.jpg', Buffer.concat([Buffer.from([0xff, 0xd8]), app1, Buffer.from([0xff, 0xda, 0, 2, 0xff, 0xd9])]));
  r = commit(d);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /metadata of img\/photo\.jpg/);
});
