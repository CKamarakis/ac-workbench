// Smoke-test judge (kit-cross-platform design D8; spec: kit-self-test "Smoke-test judge"). File-based, no AI:
// lists kit files changed since the last passing `npm run smoke`, committed or not.
// Usage: npm run smoke:check   -> exit 0 not needed, 3 recommended
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT_DIRS = ['scripts', 'hooks', 'skills', 'templates', 'data'].map(d => `plugins/kit/${d}/`);
const KIT_FILES = ['plugins/kit/.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'toolkit.yaml'];
const SYSTEMS = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' };

export const isKitFile = f => KIT_FILES.includes(f) || KIT_DIRS.some(d => f.startsWith(d));

const git = (repo, ...args) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
const lines = s => String(s ?? '').split(/\r?\n/).filter(Boolean);

/** Returns { code: 0 | 3, reason, files, last }. */
export function check({ repo = REPO, record = path.join(repo, '.smoke-pass.json') } = {}) {
  let last = null;
  try { last = JSON.parse(fs.readFileSync(record, 'utf8')); } catch { /* none */ }
  if (!last?.commit) return { code: 3, reason: 'no smoke pass recorded', files: [], last: null };
  if (git(repo, 'cat-file', '-e', `${last.commit}^{commit}`).status !== 0) {
    return { code: 3, reason: `the last pass's commit ${last.commit.slice(0, 7)} was not found in git`, files: [], last };
  }
  const committed = lines(git(repo, 'diff', '--name-only', last.commit, 'HEAD').stdout);
  // Porcelain: "XY path" or "XY old -> new"; untracked files listed one by one.
  const working = lines(git(repo, 'status', '--porcelain', '--untracked-files=all').stdout).map(l => l.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''));
  const files = [...new Set([...committed, ...working])].filter(isKitFile).sort();
  return files.length
    ? { code: 3, reason: `${files.length} kit file${files.length === 1 ? '' : 's'} changed`, files, last }
    : { code: 0, reason: 'no kit file changed', files, last };
}

export function format(c) {
  const out = [c.code === 0 ? `smoke test not needed: ${c.reason} since the last pass` : `smoke test recommended: ${c.reason}`];
  for (const f of c.files) out.push(`  ${f}`);
  if (c.last) out.push(`last pass: ${String(c.last.commit).slice(0, 7)} on ${c.last.date}, ${SYSTEMS[c.last.platform] ?? c.last.platform}${c.last.openspec ? `, OpenSpec ${c.last.openspec}` : ''}`);
  if (c.code !== 0) out.push('run: npm run smoke');
  return out.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const c = check();
  console.log(format(c));
  process.exitCode = c.code;
}
