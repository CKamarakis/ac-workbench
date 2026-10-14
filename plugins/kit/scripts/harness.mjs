// /kit:harness-review scan: lists a project's Claude Code setup at no token cost (kit-harness-review design D1, D2,
// D2a, D2b, D4; spec: harness-review "Setup scan"). Read-only. Memory files: name, type, size and shape only, never
// their text. Plugins: what they turn on (hooks, skills), never a judgment of their code. Zero dependencies.
// Usage: node harness.mjs scan [--dir <project>] [--home <dir>] [--json]
//   --home: read that folder's .claude instead of the user's (CLAUDE_CONFIG_DIR is then ignored)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { laneMap, routingBlock, BLOCK_START, BLOCK_END } from './lanes.mjs';
import { managedBlock } from './start-plan.mjs';
import { stampKnowledgeDir } from './knowledge.mjs';
import { locate } from './locate.mjs';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const posix = p => p.split(path.sep).join('/');
const readText = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const sizeOf = p => { try { return fs.statSync(p).size; } catch { return 0; } };
const dirs = d => { try { return fs.readdirSync(d, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(); } catch { return []; } };
const files = (d, re = /\.md$/i) => { try { return fs.readdirSync(d, { withFileTypes: true }).filter(e => e.isFile() && re.test(e.name)).map(e => e.name).sort(); } catch { return []; } };
const walkMd = d => { const out = []; const go = x => { for (const n of dirs(x)) go(path.join(x, n)); for (const f of files(x)) out.push(path.join(x, f)); }; go(d); return out.sort(); };

/**
 * Hook events whose hook can stop the action (hooks reference, read 2026-10-14): the "exit code 2 behavior per event"
 * table, plus PermissionRequest, which denies through its decision control instead of exit 2.
 */
export const BLOCKING_EVENTS = new Set(['PreToolUse', 'PermissionRequest', 'UserPromptSubmit', 'UserPromptExpansion', 'Stop', 'SubagentStop',
  'TeammateIdle', 'TaskCreated', 'TaskCompleted', 'ConfigChange', 'PostToolBatch', 'PreCompact', 'PreModelSwitch', 'Elicitation',
  'ElicitationResult', 'WorktreeCreate', 'WorktreeRemove']);

/** The program a hook command runs: skips leading NAME=value assignments and `env`, keeps only the file name. */
export function hookProgram(command) {
  const tokens = String(command ?? '').trim().match(/"[^"]*"|'[^']*'|\S+/g) ?? [];
  const t = tokens.find(x => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(x) && x !== 'env') ?? '';
  return t.replace(/^["']|["']$/g, '').split(/[\\/]/).pop();
}

/** A YAML scalar's value: a quoted one unquoted and unescaped ('' in single quotes, \" and \\ in double quotes). */
function unquote(v) {
  if (/^'.*'$/.test(v) && v.length > 1) { const inner = v.slice(1, -1); return /(^|[^'])'([^']|$)/.test(inner) ? v : inner.replace(/''/g, "'"); }
  if (/^".*"$/.test(v) && v.length > 1) { const inner = v.slice(1, -1); return /(^|[^\\])"/.test(inner) ? v : inner.replace(/\\(["\\])/g, '$1'); }
  return v;
}

/** Frontmatter fields we need (name, description, type or metadata.type); no YAML parser needed. */
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text ?? '');
  if (!m) return {};
  const lines = m[1].split(/\r?\n/), out = {};
  for (let i = 0; i < lines.length; i++) {
    const kv = /^(\s*)(name|description|type):\s*(.*)$/.exec(lines[i]);
    if (!kv) continue;
    let v = kv[3].trim();
    if (/^[>|][-+]?$/.test(v)) { // folded or literal block: following, more indented lines; blank lines stay inside it
      const more = [];
      const inBlock = l => !l.trim() || (/^\s+\S/.test(l) && l.search(/\S/) > kv[1].length);
      while (i + 1 < lines.length && inBlock(lines[i + 1])) { const l = lines[++i].trim(); if (l) more.push(l); }
      v = more.join(' ');
    }
    v = unquote(v);
    if (!(kv[2] in out)) out[kv[2]] = v;
  }
  return out;
}

/** Folder name Claude Code uses under projects/: the path with every non-alphanumeric as "-" (sessions docs). */
export function memorySlug(p) {
  return path.resolve(p).replace(/[^a-zA-Z0-9]/g, '-');
}

/**
 * `top`: the checkout's own root (project files). `shared`: the main repo's root, which names the memory folder;
 * worktrees share it (design D2a). Outside git: null.
 */
function gitRoots(dir) {
  const git = locate('git', { preferKnown: true })?.path ?? 'git';
  const [top, common] = spawnSync(git, ['rev-parse', '--show-toplevel', '--git-common-dir'], { cwd: dir, encoding: 'utf8' }).stdout?.trim().split(/\r?\n/) ?? [];
  if (!top) return null;
  const commonDir = common ? path.resolve(dir, common) : null;
  return { top: path.resolve(top), shared: commonDir && path.basename(commonDir) === '.git' ? path.dirname(commonDir) : path.resolve(top) };
}

/**
 * The setup of the project at `dir`. `home` and `env` stand in for the user's home folder and environment (tests);
 * `registry` for the kit's registry (defaults to the running kit's data/toolkit.json).
 */
export function scan({ dir = process.cwd(), home = os.homedir(), env = process.env, registry = null } = {}) {
  const start = path.resolve(dir);
  const roots = gitRoots(start);
  const root = roots?.top ?? start;
  const configDir = env.CLAUDE_CONFIG_DIR || path.join(home, '.claude');
  const userLabel = p => '~/' + posix(path.relative(home, p));
  const projLabel = p => posix(path.relative(root, p));
  const unreadable = [];

  const json = (p, label) => {
    const t = readText(p);
    if (t == null) return null;
    try { return JSON.parse(t); } catch (e) { unreadable.push({ file: label, error: 'not valid JSON' }); return null; }
  };
  const settings = [
    { scope: 'user', file: path.join(configDir, 'settings.json'), label: userLabel(path.join(configDir, 'settings.json')) },
    { scope: 'project', file: path.join(root, '.claude', 'settings.json'), label: '.claude/settings.json' },
    { scope: 'local', file: path.join(root, '.claude', 'settings.local.json'), label: '.claude/settings.local.json' },
  ].map(s => ({ ...s, data: json(s.file, s.label) }));

  // Instruction files and rules
  const instructions = [];
  for (const f of ['CLAUDE.md', 'CLAUDE.local.md', 'AGENTS.md', '.claude/CLAUDE.md']) {
    const p = path.join(root, f);
    if (fs.existsSync(p)) instructions.push({ file: f, scope: 'project', bytes: sizeOf(p) });
  }
  const userClaude = path.join(configDir, 'CLAUDE.md');
  if (fs.existsSync(userClaude)) instructions.push({ file: userLabel(userClaude), scope: 'user', bytes: sizeOf(userClaude) });
  const rules = [
    ...walkMd(path.join(root, '.claude', 'rules')).map(p => ({ file: projLabel(p), scope: 'project', bytes: sizeOf(p) })),
    ...walkMd(path.join(configDir, 'rules')).map(p => ({ file: userLabel(p), scope: 'user', bytes: sizeOf(p) })),
  ];

  // Skills, subagents, commands (project and user)
  const bases = [{ scope: 'project', base: path.join(root, '.claude'), label: projLabel }, { scope: 'user', base: configDir, label: userLabel }];
  const skills = [], agents = [], commands = [];
  for (const b of bases) {
    for (const n of dirs(path.join(b.base, 'skills'))) {
      const p = path.join(b.base, 'skills', n, 'SKILL.md');
      if (!fs.existsSync(p)) continue;
      const fm = frontmatter(readText(p));
      skills.push({ name: fm.name || n, description: fm.description ?? '', scope: b.scope, file: b.label(p), bytes: sizeOf(p) });
    }
    for (const f of files(path.join(b.base, 'agents'))) {
      const p = path.join(b.base, 'agents', f);
      const fm = frontmatter(readText(p));
      agents.push({ name: fm.name || f.replace(/\.md$/i, ''), description: fm.description ?? '', scope: b.scope, file: b.label(p) });
    }
    for (const p of walkMd(path.join(b.base, 'commands'))) commands.push({ name: posix(path.relative(path.join(b.base, 'commands'), p)).replace(/\.md$/i, ''), scope: b.scope, file: b.label(p) });
  }

  // Hooks and permissions from settings
  const hooks = [];
  // Only the program a hook runs, never its full command line, which can hold a token (M11 verify S1).
  const addHooks = (h, source) => {
    for (const [event, groups] of Object.entries(h ?? {})) for (const g of Array.isArray(groups) ? groups : []) for (const x of g.hooks ?? []) {
      hooks.push({ event, matcher: g.matcher ?? '', program: x.command ? hookProgram(x.command) : String(x.type ?? ''), source, blocking: BLOCKING_EVENTS.has(event) });
    }
  };
  const permissions = { allow: 0, deny: 0, ask: 0, defaultMode: null, files: [] };
  for (const s of settings) {
    if (!s.data) continue;
    addHooks(s.data.hooks, s.label);
    const pm = s.data.permissions;
    if (pm) {
      for (const k of ['allow', 'deny', 'ask']) permissions[k] += Array.isArray(pm[k]) ? pm[k].length : 0;
      if (pm.defaultMode) permissions.defaultMode = pm.defaultMode;
      permissions.files.push(s.label);
    }
  }

  // MCP servers: the project's .mcp.json and the user's ~/.claude.json (user-wide and this project's entries)
  const mcp = [];
  const mcpJson = json(path.join(root, '.mcp.json'), '.mcp.json');
  for (const n of Object.keys(mcpJson?.mcpServers ?? {})) mcp.push({ name: n, source: '.mcp.json' });
  // With CLAUDE_CONFIG_DIR set, .claude.json lives in that folder (seen in the kit-per-project trial, 2026-10-14).
  const cjPath = env.CLAUDE_CONFIG_DIR ? path.join(configDir, '.claude.json') : path.join(home, '.claude.json');
  const cjLabel = env.CLAUDE_CONFIG_DIR ? '$CLAUDE_CONFIG_DIR/.claude.json' : '~/.claude.json';
  const cj = json(cjPath, cjLabel);
  for (const n of Object.keys(cj?.mcpServers ?? {})) mcp.push({ name: n, source: `${cjLabel} (user)` });
  const projEntry = Object.entries(cj?.projects ?? {}).find(([k]) => path.resolve(k).toLowerCase() === root.toLowerCase())?.[1];
  for (const n of Object.keys(projEntry?.mcpServers ?? {})) mcp.push({ name: n, source: `${cjLabel} (this project)` });

  // Enabled plugins and what they turn on (design D2b)
  const enabled = {};
  for (const s of settings) for (const [id, on] of Object.entries(s.data?.enabledPlugins ?? {})) enabled[id] = on;
  const installed = json(path.join(configDir, 'plugins', 'installed_plugins.json'), userLabel(path.join(configDir, 'plugins', 'installed_plugins.json')))?.plugins ?? {};
  const plugins = [];
  for (const id of Object.keys(enabled).filter(k => enabled[k] === true).sort()) {
    const entries = Array.isArray(installed[id]) ? installed[id] : [];
    // This project's install (a worktree's main repo counts), else a machine-wide one; never another project's copy.
    const here = [root, roots?.shared].filter(Boolean).map(p => path.resolve(p).toLowerCase());
    const entry = entries.find(e => e.projectPath && here.includes(path.resolve(e.projectPath).toLowerCase())) ?? entries.find(e => ['user', 'managed'].includes(e.scope));
    const dirOf = entry?.installPath;
    if (!dirOf || !fs.existsSync(dirOf)) { plugins.push({ id, inspected: false, skills: [], hooks: [] }); continue; }
    const before = hooks.length;
    // A file a plugin names: inside its folder only (Claude Code rejects paths that escape it), each file read once.
    const seen = new Set();
    const pluginFile = rel => {
      const p = path.resolve(dirOf, rel), label = `plugin:${id}/${posix(rel).replace(/^\.\//, '')}`;
      if (path.relative(dirOf, p).startsWith('..') || path.isAbsolute(path.relative(dirOf, p))) { unreadable.push({ file: label, error: 'path is outside the plugin folder; not read' }); return null; }
      if (seen.has(p.toLowerCase())) return null;
      seen.add(p.toLowerCase());
      return json(p, label);
    };
    // Hooks: hooks/hooks.json plus what plugin.json declares, inline or as files (plugin manifest reference).
    const manifest = json(path.join(dirOf, '.claude-plugin', 'plugin.json'), `plugin:${id}/.claude-plugin/plugin.json`) ?? {};
    addHooks(pluginFile('hooks/hooks.json')?.hooks, `plugin:${id}`);
    for (const h of [manifest.hooks].flat().filter(Boolean)) addHooks(typeof h === 'string' ? pluginFile(h)?.hooks : h, `plugin:${id}`);
    // MCP server names only: .mcp.json plus plugin.json mcpServers (a file path, an inline map, or a list of either).
    const names = new Set(Object.keys((m => m?.mcpServers ?? m ?? {})(pluginFile('.mcp.json'))));
    for (const s of [manifest.mcpServers].flat().filter(Boolean)) {
      const map = typeof s === 'string' ? (/\.json$/i.test(s) ? (m => m?.mcpServers ?? m ?? {})(pluginFile(s)) : {}) : s;
      for (const n of Object.keys(map ?? {})) names.add(n);
    }
    for (const n of names) mcp.push({ name: n, source: `plugin:${id}` });
    const pskills = dirs(path.join(dirOf, 'skills')).filter(n => fs.existsSync(path.join(dirOf, 'skills', n, 'SKILL.md')));
    plugins.push({ id, inspected: true, version: entry.version ?? null, skills: pskills, hooks: hooks.slice(before).map(h => h.event) });
  }

  // Auto memory (design D2a, D2)
  const memory = { dir: null, found: false, reason: null, files: [] };
  // Claude Code ignores autoMemoryDirectory from the shared project settings (settings reference; M11 verify C5).
  const auto = [...settings].reverse().filter(s => s.scope !== 'project').map(s => s.data?.autoMemoryDirectory).find(Boolean);
  if (auto) memory.dir = path.resolve(String(auto).replace(/^~(?=[\\/])/, home));
  else {
    const name = env.CLAUDE_CODE_PROJECT_DIR_NAME && env.CLAUDE_CONFIG_DIR ? env.CLAUDE_CODE_PROJECT_DIR_NAME : memorySlug(roots?.shared ?? root);
    if (name.length > 200) memory.reason = 'project path is too long to find its memory folder (Claude Code shortens it with a hash)';
    else memory.dir = path.join(configDir, 'projects', name, 'memory');
  }
  if (memory.dir && fs.existsSync(memory.dir)) {
    memory.found = true;
    for (const f of files(memory.dir)) {
      const text = readText(path.join(memory.dir, f)) ?? '';
      const fm = frontmatter(text);
      memory.files.push({
        file: f, type: f === 'MEMORY.md' ? 'index' : fm.type || null, bytes: sizeOf(path.join(memory.dir, f)),
        numbered: (text.match(/^\s*\d+[.)]\s/gm) ?? []).length,
        commands: /`[^`]*\b(npm|npx|node|git|pnpm|yarn|python|uv|claude|openspec|curl)\b[^`]*`/.test(text),
      });
    }
  } else if (!memory.reason) memory.reason = 'no memory folder for this project yet';

  // Kit checks, only with the kit (design D4)
  let kit = null;
  const kitJson = json(path.join(root, '.claude', 'kit.json'), '.claude/kit.json');
  if (fs.existsSync(path.join(root, '.claude', 'kit.json'))) {
    const reg = registry ?? json(path.join(KIT, 'data', 'toolkit.json'), 'kit data/toolkit.json') ?? { phases: [], tools: [] };
    const map = laneMap(reg);
    const current = json(path.join(KIT, '.claude-plugin', 'plugin.json'), 'kit plugin.json')?.version ?? null;
    const claude = readText(path.join(root, 'CLAUDE.md'));
    let routing = 'missing';
    if (claude != null) {
      const block = routingBlock(map, { kitVersion: current, knowledgeDir: stampKnowledgeDir(kitJson), libraryDocs: true, qualityGates: true });
      const m = managedBlock(claude.replace(/\r\n/g, '\n'), BLOCK_START, BLOCK_END, block);
      routing = m.action === 'same' ? 'current' : m.action === 'append' ? 'missing' : m.action === 'conflict' ? 'damaged' : 'outdated';
    }
    kit = { version: kitJson?.kit_version ?? null, current, routing, conflicts: map.conflicts };
  }

  return { project: posix(root), instructions, rules, skills, agents, commands, hooks, permissions, mcp, plugins, memory, kit, unreadable };
}

const kb = n => (n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

/** Plain text for the skill and the user. Never prints memory text. */
export function formatScan(s) {
  const L = [`harness scan: ${s.project}`, ''];
  L.push(s.instructions.length ? `instructions: ${s.instructions.map(i => `${i.file} (${kb(i.bytes)})`).join(', ')}` : 'instructions: none');
  if (s.rules.length) L.push(`rules: ${s.rules.length} (${kb(s.rules.reduce((t, r) => t + r.bytes, 0))})`);
  const by = (list, scope) => list.filter(x => x.scope === scope);
  for (const [label, list] of [['skills', s.skills], ['subagents', s.agents], ['commands', s.commands]]) {
    const p = by(list, 'project'), u = by(list, 'user');
    if (p.length || u.length) L.push(`${label}: ${p.length} project${p.length ? ` (${p.map(x => x.name).join(', ')})` : ''}, ${u.length} user`);
  }
  L.push(s.hooks.length ? 'hooks:' : 'hooks: none');
  for (const h of s.hooks) L.push(`  ${h.event}${h.matcher ? ` [${h.matcher}]` : ''}${h.blocking ? ' (can block)' : ''}  from ${h.source}`);
  L.push(`permissions: ${s.permissions.allow} allow, ${s.permissions.deny} deny, ${s.permissions.ask} ask${s.permissions.defaultMode ? `, default mode ${s.permissions.defaultMode}` : ''}`);
  L.push(s.mcp.length ? `MCP servers: ${s.mcp.map(m => `${m.name} (${m.source})`).join(', ')}` : 'MCP servers: none');
  L.push(s.plugins.length ? 'plugins:' : 'plugins: none enabled');
  for (const p of s.plugins) L.push(p.inspected ? `  ${p.id}${p.version ? ` ${p.version}` : ''}: ${p.skills.length} skills, hooks: ${p.hooks.length ? p.hooks.join(', ') : 'none'}` : `  ${p.id}: not inspected (install folder not found)`);
  if (s.memory.found) {
    L.push(`memory: ${s.memory.dir}, ${s.memory.files.length} files`);
    for (const f of s.memory.files) L.push(`  ${f.file}  type ${f.type ?? '(none)'}, ${kb(f.bytes)}${f.numbered >= 3 ? `, ${f.numbered} numbered steps` : ''}${f.commands ? ', names commands' : ''}`);
  } else L.push(`memory: not found (${s.memory.reason})`);
  L.push(s.kit ? `kit: ${s.kit.version ?? '?'} in this project (running ${s.kit.current ?? '?'}); routing block: ${s.kit.routing}; lane conflicts: ${s.kit.conflicts.length ? s.kit.conflicts.map(c => `${c.phase} (${c.tools.join(', ')})`).join('; ') : 'none'}` : 'kit: not present');
  for (const u of s.unreadable) L.push(`UNREADABLE ${u.file}: ${u.error}`);
  return L.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
  try {
    if (cmd !== 'scan') throw new Error('usage: harness.mjs scan [--dir <project>] [--home <dir>] [--json]');
    // --home stands in for the user's home, so the environment's config-dir overrides don't apply then.
    const home = opt('--home') ? path.resolve(opt('--home')) : undefined;
    const env = home ? { ...process.env, CLAUDE_CONFIG_DIR: '', CLAUDE_CODE_PROJECT_DIR_NAME: '' } : process.env;
    const s = scan({ dir: opt('--dir') ?? process.cwd(), env, ...(home ? { home } : {}) });
    console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : formatScan(s));
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exitCode = 1;
  }
}
