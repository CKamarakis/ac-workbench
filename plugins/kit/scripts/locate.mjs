// Find command-line tools even when they are not on the shell's PATH (design D13; spec: tool-setup, project-starter).
// Zero dependencies. Usage: node locate.mjs <tool>...   -> JSON { tool: { path, via } | null }
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Known install folders per tool on Windows. Each entry is a path pattern built from env vars;
// a `*` segment matches one directory level (used for winget package folders).
const KNOWN_WIN32 = {
  git: ['{ProgramFiles}/Git/cmd/git.exe'],
  gh: ['{ProgramFiles}/GitHub CLI/gh.exe'],
  jq: ['{LOCALAPPDATA}/Microsoft/WinGet/Links/jq.exe', '{LOCALAPPDATA}/Microsoft/WinGet/Packages/jqlang.jq_*/jq.exe'],
  gitleaks: ['{LOCALAPPDATA}/Microsoft/WinGet/Links/gitleaks.exe', '{LOCALAPPDATA}/Microsoft/WinGet/Packages/Gitleaks.Gitleaks_*/gitleaks.exe'],
  node: ['{ProgramFiles}/nodejs/node.exe'],
  npm: ['{ProgramFiles}/nodejs/npm.cmd'],
  claude: ['{USERPROFILE}/.local/bin/claude.exe'],
  winget: ['{LOCALAPPDATA}/Microsoft/WindowsApps/winget.exe'],
};

function expandPattern(pattern, env) {
  const filled = pattern.replace(/\{(\w+)\}/g, (_, k) => env[k] ?? `\0missing:${k}`);
  if (filled.includes('\0missing:')) return [];
  // Expand single `*` segments against the file system.
  const parts = filled.split('/');
  let bases = [parts[0] === '' ? '/' : parts[0]];
  for (const seg of parts.slice(1)) {
    const next = [];
    for (const b of bases) {
      if (!seg.includes('*')) { next.push(path.join(b, seg)); continue; }
      const re = new RegExp('^' + seg.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i');
      let names = [];
      try { names = fs.readdirSync(b); } catch { /* missing dir */ }
      next.push(...names.filter(n => re.test(n)).map(n => path.join(b, n)));
    }
    bases = next;
  }
  return bases;
}

const isFile = p => { try { return fs.statSync(p).isFile(); } catch { return false; } };
// Windows app execution aliases (e.g. WindowsAppswinget.exe) are reparse points that statSync can't follow.
const isPresent = p => isFile(p) || (() => { try { fs.lstatSync(p); return true; } catch { return false; } })();

function searchPath(name, env, platform) {
  const dirs = String(env.PATH ?? env.Path ?? '').split(platform === 'win32' ? ';' : ':').filter(Boolean);
  const exts = platform === 'win32' ? ['', ...String(env.PATHEXT || '.EXE;.CMD;.BAT').toLowerCase().split(';')] : [''];
  for (const d of dirs) for (const e of exts) {
    const p = path.join(d, name + e);
    if (isFile(p)) return p;
  }
  return null;
}

function npmPrefixDirs(env, platform, npmPrefix) {
  const dirs = [];
  if (platform === 'win32' && env.APPDATA) dirs.push(path.join(env.APPDATA, 'npm'));
  const prefix = npmPrefix ? npmPrefix() : null;
  if (prefix) dirs.push(platform === 'win32' ? prefix : path.join(prefix, 'bin'));
  return [...new Set(dirs)];
}

function defaultNpmPrefix() {
  const r = spawnSync('npm prefix -g', { encoding: 'utf8', shell: true, timeout: 15000 });
  return r.status === 0 ? r.stdout.trim() : null;
}

/**
 * Locate one tool. Returns { path, via } or null.
 * via: 'path' (on PATH), 'npm-prefix' (npm global folder), 'known' (standard install folder).
 * preferKnown: check the standard install folder before PATH (e.g. Windows Gitcmd, whose git can run `submodule`,
 * rather than Git Bash's mingw64 git, which fails inside `claude plugin install`).
 */
export function locate(name, { env = process.env, platform = process.platform, npmPrefix = defaultNpmPrefix, preferKnown = false } = {}) {
  const known = () => {
    if (platform !== 'win32') return null;
    for (const pattern of KNOWN_WIN32[name] ?? []) {
      for (const p of expandPattern(pattern, env)) if (isPresent(p)) return { path: p, via: 'known' };
    }
    return null;
  };
  if (preferKnown) { const k = known(); if (k) return k; }
  const onPath = searchPath(name, env, platform);
  if (onPath) return { path: onPath, via: 'path' };
  { // any npm -g CLI (openspec, playwright-cli, ...) lives in the npm global folder
    const exts = platform === 'win32' ? ['.cmd', '.exe', ''] : [''];
    for (const d of npmPrefixDirs(env, platform, npmPrefix)) for (const e of exts) {
      const p = path.join(d, name + e);
      if (isFile(p)) return { path: p, via: 'npm-prefix' };
    }
  }
  return known();
}

export function locateAll(names, opts) {
  let prefix; // resolve `npm prefix -g` at most once
  const npmPrefix = opts?.npmPrefix ?? (() => (prefix ??= defaultNpmPrefix()));
  return Object.fromEntries(names.map(n => [n, locate(n, { ...opts, npmPrefix })]));
}

/** PATH value with the folders of the given located tools prepended (e.g. Git\cmd before `claude plugin`). */
export function pathWith(located, env = process.env, platform = process.platform) {
  const sep = platform === 'win32' ? ';' : ':';
  const dirs = Object.values(located).filter(Boolean).map(l => path.dirname(l.path));
  return [...new Set(dirs), env.PATH ?? env.Path ?? ''].join(sep);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const names = process.argv.slice(2);
  if (!names.length) { console.error('usage: node locate.mjs <tool>...'); process.exit(2); }
  console.log(JSON.stringify(locateAll(names), null, 2));
}
