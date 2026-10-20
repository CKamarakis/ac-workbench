// /kit:tool-review: the facts for the monthly tool review (build-safeguards design D8; spec: tool-review).
// `scan` reads toolkit.yaml and looks up each adopted or trial tool's latest version by its source kind (network:
// npm, GitHub, winget, the local marketplace catalog); anything it can't read is "unknown" with the reason.
// `record` makes the targeted toolkit.yaml edits for the user's choice (update, hold, drop); run `npm run registry`
// after it. The skill reads release notes and judges what to borrow. Zero dependencies (a line scan, no YAML parser).
// Usage: node tool-review.mjs scan --dir <kit repo> [--json]
//        node tool-review.mjs record --dir <kit repo> --name <tool> --action update|hold|drop [--version <v>] [--reason "..."] [--date YYYY-MM-DD]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { locate } from './locate.mjs';

export const REMIND_DAYS = 30;
const ACTIVE = ['adopted', 'trial'];
const FIELDS = ['source', 'status', 'reviewed_version', 'reviewed_on', 'plugin'];
const today = () => new Date().toISOString().slice(0, 10);
export const NPM_NAME = /^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/i;
const unquote = v => v.trim().replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1');

/** Entries of the `tools:` list: { name, source, status, reviewed_version, reviewed_on, plugin, start, end } (line indexes). */
export function registryEntries(text) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inTools = false, cur = null;
  lines.forEach((line, i) => {
    if (/^#/.test(line)) return; // a column-0 comment doesn't end the list
    if (/^\S/.test(line)) { inTools = /^tools:\s*$/.test(line); if (cur) { cur.end = i; out.push(cur); cur = null; } return; }
    if (!inTools) return;
    const m = /^ {2}- name:\s*(.+)$/.exec(line);
    if (m) { if (cur) { cur.end = i; out.push(cur); } cur = { name: unquote(m[1]), start: i }; return; }
    const f = /^ {4}([a-z_]+):\s*(.*)$/.exec(line);
    if (cur && f && FIELDS.includes(f[1])) cur[f[1]] = unquote(f[2].replace(/\s+#.*$/, ''));
  });
  if (cur) { cur.end = lines.length; out.push(cur); }
  return out;
}

/** Days since the oldest reviewed_on among adopted and trial tools, with that tool, or null. A tool with no valid
 *  date counts as never reviewed (days: Infinity), so it makes the review due. */
export function oldestReview(text, now = Date.now()) {
  let oldest = null;
  for (const e of registryEntries(text)) {
    if (!ACTIVE.includes(e.status)) continue;
    const t = Date.parse(e.reviewed_on ?? '');
    if (Number.isNaN(t)) return { tool: e.name, date: null, days: Infinity };
    if (!oldest || t < oldest.t) oldest = { tool: e.name, date: e.reviewed_on, t };
  }
  return oldest ? { tool: oldest.tool, date: oldest.date, days: Math.floor((now - oldest.t) / 86400000) } : null;
}

/** The highest semver-looking tag, or the first one when none parse. */
export function highestTag(tags) {
  const list = tags.map(t => t.trim()).filter(Boolean);
  const parsed = list.map(t => [t, semver(t)]).filter(([, v]) => v);
  if (!parsed.length) return list[0] ?? '';
  return parsed.sort(([, a], [, b]) => b[0] - a[0] || b[1] - a[1] || b[2] - a[2])[0][0];
}

const semver = v => { const m = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(String(v ?? '')); return m ? m.slice(1).map(x => Number(x ?? 0)) : null; };

/** up-to-date | behind | major | ahead | changed (non-semver, e.g. a commit). Below 1.0 a minor bump counts as major. */
export function compare(reviewed, latest) {
  if (String(reviewed) === String(latest)) return 'up-to-date';
  const a = semver(reviewed), b = semver(latest);
  if (!a || !b) return 'changed';
  const majorAt = a[0] === 0 && b[0] === 0 ? 1 : 0;
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return b[i] > a[i] ? (i <= majorAt ? 'major' : 'behind') : 'ahead';
  return 'up-to-date';
}

function run(cmd, args) {
  // On Windows, PATH can name npm's POSIX shim; spawn its .cmd next to it instead.
  if (process.platform === 'win32' && !path.extname(cmd) && fs.existsSync(`${cmd}.cmd`)) cmd = `${cmd}.cmd`;
  const shell = process.platform === 'win32' && /\.cmd$/i.test(cmd); // a .cmd needs the shell; quote for spaces in the path
  const r = shell
    ? spawnSync(`"${cmd}" ${args.map(a => `"${a}"`).join(' ')}`, { encoding: 'utf8', timeout: 30000, shell: true })
    : spawnSync(cmd, args, { encoding: 'utf8', timeout: 30000 });
  return { status: r.status ?? -1, out: (r.stdout ?? '').trim(), err: ((r.stderr ?? '') + (r.error ? String(r.error) : '')).trim() };
}

/** Default lookups by source kind. Each returns { version } | { gone: reason } | { unknown: reason }. */
export function defaultLookups({ home = os.homedir() } = {}) {
  const tool = name => locate(name)?.path ?? null;
  return {
    npm(pkg) {
      // npm runs through its .cmd shim and a shell on Windows: only plain package names reach the command line.
      if (!NPM_NAME.test(pkg)) return { unknown: `invalid npm package name "${pkg}"` };
      const npm = tool('npm');
      if (!npm) return { unknown: 'npm not found' };
      const r = run(npm, ['view', pkg, 'version']);
      if (r.status === 0 && r.out) return { version: r.out.split('\n').pop().trim() };
      return /E404|not in this registry/i.test(r.err) ? { gone: `npm package ${pkg} not found` } : { unknown: r.err.split('\n')[0] || `npm view exited ${r.status}` };
    },
    github(repo) {
      const gh = tool('gh');
      if (!gh) return { unknown: 'gh not found (sign in with gh auth login)' };
      const rel = run(gh, ['api', `repos/${repo}/releases/latest`, '--jq', '.tag_name']);
      if (rel.status === 0 && rel.out) return { version: rel.out.replace(/^v/, '') };
      // The tags API isn't sorted by version: take the highest semver tag (the first one if none parse).
      const tags = run(gh, ['api', `repos/${repo}/tags?per_page=100`, '--jq', '.[].name']);
      if (tags.status === 0 && tags.out) return { version: highestTag(tags.out.split('\n')).replace(/^v/, '') };
      const repoInfo = run(gh, ['api', `repos/${repo}`, '--jq', '.full_name']);
      if (repoInfo.status !== 0 && /Not Found|404/.test(repoInfo.err)) return { gone: `GitHub repository ${repo} not found` };
      if (repoInfo.status === 0) {
        const c = run(gh, ['api', `repos/${repo}/commits?per_page=1`, '--jq', '.[0].sha[0:7]']);
        if (c.status === 0 && c.out) return { version: c.out, note: 'no releases or tags; latest commit' };
      }
      return { unknown: rel.err.split('\n')[0] || 'no release, tag or commit found' };
    },
    winget(id) {
      if (process.platform !== 'win32') return { unknown: 'winget is Windows only' };
      const w = tool('winget') ?? 'winget';
      const r = run(w, ['show', '--id', id, '-e', '--disable-interactivity']);
      const m = /^Version:\s*(\S+)/m.exec(r.out);
      if (!m && /No package found/i.test(r.out + r.err)) return { gone: `winget package ${id} not found` };
      return m ? { version: m[1] } : { unknown: r.err.split('\n')[0] || 'winget show gave no version' };
    },
    plugin(id) {
      const [name, market] = String(id).split('@');
      const file = path.join(home, '.claude', 'plugins', 'marketplaces', market ?? '', '.claude-plugin', 'marketplace.json');
      let cat;
      try { cat = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { unknown: `marketplace ${market} catalog not found locally (claude plugin marketplace update)` }; }
      const p = (cat.plugins ?? []).find(x => x.name === name);
      if (!p) return { gone: `${name} is no longer in the ${market} catalog` };
      if (p.version) return { version: p.version, note: 'from the local catalog; refresh with claude plugin marketplace update' };
      return { unknown: `the ${market} catalog pins ${p.source?.sha ? `commit ${String(p.source.sha).slice(0, 7)}` : 'a source'} without a version` };
    },
  };
}

/** Latest version of one entry, by source kind (a plugin is looked up in its marketplace catalog first). */
export function lookup(entry, lookups) {
  if (entry.plugin) { const r = lookups.plugin(entry.plugin); if (r.version || r.gone) return r; }
  const m = /^(npm|github|winget):(.+)$/.exec(entry.source ?? '');
  if (!m) return { unknown: `no version source for "${entry.source}"` };
  return lookups[m[1]](m[2].trim());
}

export function scan({ dir, lookups = defaultLookups() }) {
  const file = path.join(dir, 'toolkit.yaml');
  if (!fs.existsSync(file)) throw new Error('no toolkit.yaml here: the tool review runs in the kit repo');
  return registryEntries(fs.readFileSync(file, 'utf8')).filter(e => ACTIVE.includes(e.status)).map(e => {
    let r;
    try { r = lookup(e, lookups); } catch (err) { r = { unknown: err.message }; }
    const base = { name: e.name, source: e.source, status: e.status, reviewed_version: e.reviewed_version, reviewed_on: e.reviewed_on };
    if (r.gone) return { ...base, state: 'source-not-found', reason: r.gone };
    if (!r.version) return { ...base, state: 'unknown', reason: r.unknown };
    return { ...base, latest: r.version, state: compare(e.reviewed_version, r.version), ...(r.note ? { note: r.note } : {}) };
  });
}

/** The targeted toolkit.yaml edit for the user's choice. Returns the new text. */
export function recordText(text, { name, action, version, reason, date = today() }) {
  if (!['update', 'hold', 'drop'].includes(action)) throw new Error('--action must be update, hold or drop');
  if (action === 'update' && !version) throw new Error('--version is required for update (only after the smoke test passed)');
  if (action === 'drop' && !String(reason ?? '').trim()) throw new Error('--reason is required for drop');
  const crlf = String(text).includes('\r\n');
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const e = registryEntries(text).find(x => x.name === name);
  if (!e) throw new Error(`no tool "${name}" in toolkit.yaml`);
  const set = (key, value) => {
    const i = lines.findIndex((l, n) => n > e.start && n < e.end && new RegExp(`^ {4}${key}:`).test(l));
    if (i < 0) throw new Error(`${name} has no ${key} field`);
    lines[i] = `    ${key}: ${value}`;
  };
  set('reviewed_on', date);
  if (action === 'update') set('reviewed_version', version);
  if (action === 'drop') {
    set('status', 'dropped');
    const v = lines.findIndex((l, n) => n > e.start && n < e.end && /^ {4}verdicts:\s*$/.test(l));
    if (v < 0) throw new Error(`${name} has no verdicts list`);
    // After the last verdict line: blank and comment lines inside the list don't end it (L21).
    let last = v;
    for (let at = v + 1; at < e.end; at++) {
      if (/^ {6,}\S/.test(lines[at])) last = at;
      else if (lines[at].trim() && !/^\s*#/.test(lines[at])) break;
    }
    lines.splice(last + 1, 0, `      - date: ${date}`, '        status: dropped', `        rationale: ${String(reason).trim().replace(/\r?\n/g, ' ')}`);
  }
  const out = lines.join('\n');
  return crlf ? out.replace(/\n/g, '\r\n') : out;
}

export function record({ dir, ...o }) {
  const file = path.join(dir, 'toolkit.yaml');
  if (!fs.existsSync(file)) throw new Error('no toolkit.yaml here: the tool review runs in the kit repo');
  fs.writeFileSync(file, recordText(fs.readFileSync(file, 'utf8'), o));
  return { name: o.name, action: o.action };
}

const LABEL = { 'up-to-date': 'up to date', behind: 'behind', major: 'MAJOR version behind', ahead: 'ahead of the reviewed version', changed: 'changed', unknown: 'unknown', 'source-not-found': 'source not found' };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const argv = process.argv.slice(2);
    const o = { cmd: argv[0], dir: process.cwd(), json: false };
    for (let i = 1; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--json') o.json = true;
      else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
      else throw new Error(`unexpected argument ${a}`);
    }
    o.dir = path.resolve(o.dir);
    if (o.cmd === 'scan') {
      const list = scan({ dir: o.dir });
      console.log(o.json ? JSON.stringify(list, null, 2) : list.map(t => `  ${t.name.padEnd(24)} ${String(t.reviewed_version).padEnd(10)} -> ${(t.latest ?? '?').padEnd(10)} ${LABEL[t.state]}${t.reason ? ` (${t.reason})` : ''}${t.note ? ` [${t.note}]` : ''}`).join('\n'));
    } else if (o.cmd === 'record') {
      const r = record(o);
      console.log(`${r.name}: ${r.action} recorded in toolkit.yaml; now run npm run registry`);
    } else throw new Error('commands: scan, record');
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 2;
  }
}
