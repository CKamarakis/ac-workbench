import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpDir } from '../../tools/test-root.mjs';
import { scan, memorySlug, formatScan } from '../../plugins/kit/scripts/harness.mjs';
import { laneMap, routingBlock } from '../../plugins/kit/scripts/lanes.mjs';
import { locate } from '../../plugins/kit/scripts/locate.mjs';

const KIT = path.resolve(import.meta.dirname, '../../plugins/kit');

// kit-harness-review 3.1-3.3 (spec: harness-review "Setup scan", "Kit checks only with the kit", "Read-only")
const w = (root, rel, text) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const skill = (name, desc) => `---\nname: ${name}\ndescription: ${desc}\n---\n\n# ${name}\n`;
// C10 (M11 verify): the located git, and init must succeed
const GIT = locate('git', { preferKnown: true })?.path ?? 'git';
const git = d => assert.equal(spawnSync(GIT, ['init', '-q'], { cwd: d }).status, 0, 'git init');

function machine() {
  const home = tmpDir('kit-harness-home-');
  const dir = tmpDir('kit-harness-proj-');
  git(dir);
  const env = { HOME: home }; // no CLAUDE_CONFIG_DIR
  return { home, dir, env, opts: { dir, home, env } };
}

test('plain project without the kit: instructions, skills, hooks, permissions, MCP; kit not present', () => {
  const m = machine();
  w(m.dir, 'CLAUDE.md', '# Project\nUse pnpm.\n');
  w(m.dir, '.claude/skills/deploy/SKILL.md', skill('deploy', 'Deploy the app'));
  w(m.dir, '.claude/skills/lint/SKILL.md', skill('lint', 'Lint the code'));
  w(m.dir, '.claude/settings.json', JSON.stringify({ permissions: { allow: ['Bash(npm test)'], deny: ['Read(.env)'] }, hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node guard.mjs' }] }] } }));
  w(m.dir, '.mcp.json', JSON.stringify({ mcpServers: { notion: {} } }));
  w(m.home, '.claude/skills/mine/SKILL.md', skill('mine', 'A personal skill'));
  const s = scan(m.opts);
  assert.deepEqual(s.instructions.map(i => [i.file, i.scope]), [['CLAUDE.md', 'project']]);
  assert.ok(s.instructions[0].bytes > 0);
  assert.deepEqual(s.skills.filter(x => x.scope === 'project').map(x => [x.name, x.description]), [['deploy', 'Deploy the app'], ['lint', 'Lint the code']]);
  assert.deepEqual(s.skills.filter(x => x.scope === 'user').map(x => x.name), ['mine']);
  assert.deepEqual(s.hooks.map(h => [h.event, h.blocking, h.source]), [['PreToolUse', true, '.claude/settings.json']]);
  assert.deepEqual([s.permissions.allow, s.permissions.deny], [1, 1]);
  assert.deepEqual(s.mcp.map(x => x.name), ['notion']);
  assert.equal(s.kit, null);
  assert.match(formatScan(s), /kit: not present/);
});

test('broken settings file is reported, everything else still listed', () => {
  const m = machine();
  w(m.dir, 'CLAUDE.md', 'x');
  w(m.dir, '.claude/settings.json', '{ not json');
  const s = scan(m.opts);
  assert.deepEqual(s.unreadable.map(u => u.file), ['.claude/settings.json']);
  assert.equal(s.instructions.length, 1);
});

test('memory: found from the git root, with type, size and shape; text never in the output', () => {
  const m = machine();
  const memDir = path.join(m.home, '.claude', 'projects', memorySlug(m.dir), 'memory');
  w(memDir, 'MEMORY.md', '- [Deploy](deploy-steps.md)\n');
  w(memDir, 'deploy-steps.md', '---\nname: deploy-steps\nmetadata:\n  type: project\n---\n\n1. run `npm run build`\n2. run `vercel deploy`\n3. check the link\nSECRET-TEXT\n');
  w(memDir, 'role.md', '---\nname: role\ntype: user\n---\nThe user is a PM.\n');
  fs.mkdirSync(path.join(m.dir, 'src', 'deep'), { recursive: true });
  const s = scan({ ...m.opts, dir: path.join(m.dir, 'src', 'deep') }); // a subfolder shares the root's memory
  assert.equal(s.memory.found, true);
  const steps = s.memory.files.find(f => f.file === 'deploy-steps.md');
  assert.deepEqual([steps.type, steps.numbered, steps.commands], ['project', 3, true]);
  assert.equal(s.memory.files.find(f => f.file === 'role.md').type, 'user');
  assert.ok(!JSON.stringify(s).includes('SECRET-TEXT'));
  assert.ok(!formatScan(s).includes('SECRET-TEXT'));
});

test('memory: autoMemoryDirectory in settings wins; a missing folder is reported, not guessed', () => {
  const m = machine();
  const custom = tmpDir('kit-harness-mem-');
  w(custom, 'note.md', '---\ntype: feedback\n---\nx\n');
  w(m.dir, '.claude/settings.local.json', JSON.stringify({ autoMemoryDirectory: custom }));
  assert.equal(scan(m.opts).memory.dir, custom);
  const n = machine();
  const s = scan(n.opts);
  assert.equal(s.memory.found, false);
  assert.match(s.memory.reason, /no memory folder/);
});

test('memory: CLAUDE_CONFIG_DIR and CLAUDE_CODE_PROJECT_DIR_NAME pick the folder', () => {
  const m = machine();
  const cfg = tmpDir('kit-harness-cfg-');
  w(cfg, 'projects/work/memory/a.md', '---\ntype: project\n---\nx\n');
  const s = scan({ ...m.opts, env: { ...m.env, CLAUDE_CONFIG_DIR: cfg, CLAUDE_CODE_PROJECT_DIR_NAME: 'work' } });
  assert.equal(s.memory.dir, path.join(cfg, 'projects', 'work', 'memory'));
  assert.equal(s.memory.files.length, 1);
});

test('enabled plugins: hooks and skills they turn on; "not inspected" when the folder is missing', () => {
  const m = machine();
  const kitDir = tmpDir('kit-harness-plugin-');
  w(kitDir, 'hooks/hooks.json', JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/hooks/archive-gate.mjs"' }] }] } }));
  w(kitDir, 'skills/next/SKILL.md', skill('next', 'Next step'));
  w(m.home, '.claude/settings.json', JSON.stringify({ enabledPlugins: { 'kit@ac-workbench': true, 'ghost@market': true, 'off@market': false } }));
  w(m.home, '.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'kit@ac-workbench': [{ scope: 'user', installPath: kitDir }], 'ghost@market': [{ scope: 'user', installPath: path.join(kitDir, 'gone') }] } }));
  const s = scan(m.opts);
  assert.deepEqual(s.plugins.map(p => [p.id, p.inspected]), [['ghost@market', false], ['kit@ac-workbench', true]]);
  const kit = s.plugins.find(p => p.id === 'kit@ac-workbench');
  assert.deepEqual(kit.skills, ['next']);
  assert.deepEqual(s.hooks.filter(h => h.source === 'plugin:kit@ac-workbench').map(h => [h.event, h.blocking]), [['PreToolUse', true]]);
});

test('kit project: kit version, routing block status and lane conflicts', () => {
  const m = machine();
  w(m.dir, '.claude/kit.json', JSON.stringify({ kit_version: '0.5.3', knowledge_dir: 'knowledge' }));
  w(m.dir, 'CLAUDE.md', '# P\n');
  const registry = { phases: ['plan'], tools: [{ name: 'a', status: 'adopted', phases: ['plan'] }, { name: 'b', status: 'adopted', phases: ['plan'] }] };
  const s = scan({ ...m.opts, registry });
  assert.equal(s.kit.version, '0.5.3');
  assert.equal(s.kit.routing, 'missing');
  assert.deepEqual(s.kit.conflicts, [{ phase: 'plan', tools: ['a', 'b'] }]);
  assert.match(formatScan(s), /routing block: missing/);
});

test('L29: kit project reports the context doc size; over 60 lines is flagged (spec "Context doc grown long")', () => {
  const m = machine();
  w(m.dir, '.claude/kit.json', JSON.stringify({ kit_version: '0.17.2' }));
  const registry = { phases: [], tools: [] };
  assert.equal(scan({ ...m.opts, registry }).kit.contextDoc, null, 'no doc: nothing to report');
  w(m.dir, 'docs/project-context.md', Array.from({ length: 41 }, (_, i) => `line ${i}`).join('\n'));
  assert.deepEqual(scan({ ...m.opts, registry }).kit.contextDoc, { file: 'docs/project-context.md', lines: 41, long: false });
  w(m.dir, 'docs/project-context.md', Array.from({ length: 198 }, (_, i) => `line ${i}`).join('\n') + '\n');
  const s = scan({ ...m.opts, registry });
  assert.deepEqual(s.kit.contextDoc, { file: 'docs/project-context.md', lines: 198, long: true });
  assert.match(formatScan(s), /context doc: docs\/project-context\.md, 198 lines \(over 60\)/);
});

test('kit project: routing block reads as current the way /kit:start writes it (knowledge_dir unset or untidy)', () => {
  const registry = { phases: ['plan'], tools: [{ name: 'a', status: 'adopted', phases: ['plan'] }] };
  const version = JSON.parse(fs.readFileSync(path.join(KIT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const block = routingBlock(laneMap(registry), { kitVersion: version, knowledgeDir: 'knowledge', libraryDocs: true, qualityGates: true });
  for (const stamp of [{ kit_version: version }, { kit_version: version, knowledge_dir: ' knowledge\\ ' }]) {
    const m = machine();
    w(m.dir, '.claude/kit.json', JSON.stringify(stamp));
    w(m.dir, 'CLAUDE.md', `# P\n\n${block}\n`);
    assert.equal(scan({ ...m.opts, registry }).kit.routing, 'current', JSON.stringify(stamp));
  }
});

test('memory: a git worktree shares the main repo\'s memory folder', () => {
  const m = machine();
  const g = (...a) => assert.equal(spawnSync(GIT, ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: m.dir }).status, 0, a.join(' '));
  g('commit', '--allow-empty', '-qm', 'x');
  const wt = tmpDir('kit-harness-wt-');
  g('worktree', 'add', '-q', wt);
  w(path.join(m.home, '.claude', 'projects', memorySlug(m.dir), 'memory'), 'a.md', '---\ntype: project\n---\nx\n');
  w(wt, 'CLAUDE.md', '# Worktree\n');
  const s = scan({ ...m.opts, dir: wt });
  assert.equal(s.memory.found, true);
  assert.deepEqual(s.instructions.map(i => i.file), ['CLAUDE.md']); // project files still come from the worktree
});

test('almost empty project: nothing listed, no errors', () => {
  const m = machine();
  const s = scan(m.opts);
  assert.deepEqual([s.instructions.length, s.skills.length, s.hooks.length, s.unreadable.length], [0, 0, 0, 0]);
  assert.match(formatScan(s), /instructions: none/);
});

test('read-only: the scan changes no file in the project or the home folder', () => {
  const m = machine();
  w(m.dir, 'CLAUDE.md', 'x');
  w(m.dir, '.claude/settings.json', '{}');
  const snap = root => { const out = []; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out.push(`${p}:${fs.statSync(p).mtimeMs}`); } }; walk(root); return out.sort().join('\n'); };
  const before = snap(m.dir) + snap(m.home);
  scan(m.opts);
  assert.equal(snap(m.dir) + snap(m.home), before);
});

// M11 verify leftovers (S1, C3-C9), fixed before v1
test('S1: hook output names the program only, never the full command (it can hold a token)', () => {
  const m = machine();
  w(m.dir, '.claude/settings.json', JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: '"C:/tools/notify.exe" --token=SECRET123 --to ops' }] }] } }));
  const s = scan(m.opts);
  assert.equal(s.hooks[0].program, 'notify.exe');
  assert.ok(!JSON.stringify(s).includes('SECRET123'));
});

test('C3: with CLAUDE_CONFIG_DIR set, MCP servers come from <config dir>/.claude.json', () => {
  const m = machine();
  const cfg = tmpDir('kit-harness-cfg-');
  w(cfg, '.claude.json', JSON.stringify({ mcpServers: { fromcfg: {} } }));
  w(m.home, '.claude.json', JSON.stringify({ mcpServers: { stale: {} } }));
  assert.deepEqual(scan({ ...m.opts, env: { ...m.env, CLAUDE_CONFIG_DIR: cfg } }).mcp.map(x => x.name), ['fromcfg']);
});

test('C4: events that can block are marked (hooks reference), others are not', () => {
  const m = machine();
  const h = ev => ({ [ev]: [{ hooks: [{ type: 'command', command: 'node x.mjs' }] }] });
  w(m.dir, '.claude/settings.json', JSON.stringify({ hooks: { ...h('Stop'), ...h('UserPromptSubmit'), ...h('PostToolUse'), ...h('SessionStart') } }));
  assert.deepEqual(Object.fromEntries(scan(m.opts).hooks.map(x => [x.event, x.blocking])), { Stop: true, UserPromptSubmit: true, PostToolUse: false, SessionStart: false });
});

test('C5: autoMemoryDirectory in the shared project settings is ignored, like Claude Code does', () => {
  const m = machine();
  w(m.dir, '.claude/settings.json', JSON.stringify({ autoMemoryDirectory: tmpDir('kit-harness-mem-') }));
  assert.equal(scan(m.opts).memory.dir, path.join(m.home, '.claude', 'projects', memorySlug(m.dir), 'memory'));
});

test('C6: the CLI takes --home', () => {
  const m = machine();
  w(m.home, '.claude/skills/mine/SKILL.md', skill('mine', 'A personal skill'));
  const r = spawnSync(process.execPath, [path.join(KIT, 'scripts', 'harness.mjs'), 'scan', '--dir', m.dir, '--home', m.home, '--json'], { encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: '' } });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).skills.filter(x => x.scope === 'user').map(x => x.name), ['mine']);
});

test('C7: an install that belongs to another project is never used for this one', () => {
  const m = machine();
  const other = tmpDir('kit-harness-plugin-');
  w(other, 'skills/x/SKILL.md', skill('x', 'x'));
  w(m.dir, '.claude/settings.json', JSON.stringify({ enabledPlugins: { 'p@m': true } }));
  w(m.home, '.claude/plugins/installed_plugins.json', JSON.stringify({ plugins: { 'p@m': [{ scope: 'project', projectPath: tmpDir('kit-harness-elsewhere-'), installPath: other }] } }));
  assert.deepEqual(scan(m.opts).plugins.map(p => [p.id, p.inspected]), [['p@m', false]]);
});

test('C8: plugin hooks declared in plugin.json and plugin MCP servers are counted', () => {
  const m = machine();
  const pd = tmpDir('kit-harness-plugin-');
  w(pd, '.claude-plugin/plugin.json', JSON.stringify({ name: 'p', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node s.mjs' }] }] }, mcpServers: { inline: {} } }));
  w(pd, '.mcp.json', JSON.stringify({ mcpServers: { fromfile: {} } }));
  w(m.home, '.claude/settings.json', JSON.stringify({ enabledPlugins: { 'p@m': true } }));
  w(m.home, '.claude/plugins/installed_plugins.json', JSON.stringify({ plugins: { 'p@m': [{ scope: 'user', installPath: pd }] } }));
  const s = scan(m.opts);
  assert.deepEqual(s.plugins[0].hooks, ['Stop']);
  assert.deepEqual(s.mcp.filter(x => x.source === 'plugin:p@m').map(x => x.name).sort(), ['fromfile', 'inline']);
});

test('C9: block descriptions keep their paragraphs; quotes are stripped only as a matching pair', () => {
  const m = machine();
  w(m.dir, '.claude/skills/a/SKILL.md', '---\nname: a\ndescription: >\n  First part.\n\n  Second part.\n---\n');
  w(m.dir, '.claude/skills/b/SKILL.md', "---\nname: b\ndescription: It's fine'\n---\n");
  w(m.dir, '.claude/skills/c/SKILL.md', '---\nname: c\ndescription: "a" and "b"\n---\n');
  w(m.dir, '.claude/skills/d/SKILL.md', '---\nname: d\ndescription: "quoted whole"\n---\n');
  const d = Object.fromEntries(scan(m.opts).skills.map(x => [x.name, x.description]));
  assert.deepEqual(d, { a: 'First part. Second part.', b: "It's fine'", c: '"a" and "b"', d: 'quoted whole' });
});

// kit-per-project re-verify findings on 598a7c1
test('program name skips leading NAME=value assignments and env', () => {
  const m = machine();
  const h = c => ({ hooks: [{ type: 'command', command: c }] });
  w(m.dir, '.claude/settings.json', JSON.stringify({ hooks: { Stop: [h('API_TOKEN=abc123 node notify.mjs')], SessionStart: [h('env SLACK=https://x/T0/B0/SECRET99 bash run.sh')] } }));
  const s = scan(m.opts);
  assert.deepEqual(s.hooks.map(x => x.program), ['node', 'bash']);
  assert.ok(!/abc123|SECRET99/.test(JSON.stringify(s)));
});

test('in a git worktree, the main repo\'s project install of a plugin is used', () => {
  const m = machine();
  const g = (...a) => assert.equal(spawnSync(GIT, ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: m.dir }).status, 0, a.join(' '));
  g('commit', '--allow-empty', '-qm', 'x');
  const wt = tmpDir('kit-harness-wt-');
  g('worktree', 'add', '-q', wt);
  const pd = tmpDir('kit-harness-plugin-');
  w(pd, 'skills/x/SKILL.md', skill('x', 'x'));
  w(wt, '.claude/settings.json', JSON.stringify({ enabledPlugins: { 'p@m': true } }));
  w(m.home, '.claude/plugins/installed_plugins.json', JSON.stringify({ plugins: { 'p@m': [{ scope: 'project', projectPath: m.dir, installPath: pd }] } }));
  assert.deepEqual(scan({ ...m.opts, dir: wt }).plugins.map(p => [p.id, p.inspected]), [['p@m', true]]);
});

test('PermissionRequest hooks can block (they can deny)', () => {
  const m = machine();
  w(m.dir, '.claude/settings.json', JSON.stringify({ hooks: { PermissionRequest: [{ hooks: [{ type: 'command', command: 'node deny.mjs' }] }] } }));
  assert.equal(scan(m.opts).hooks[0].blocking, true);
});

test('plugin hook files: the standard file counts once; a path outside the plugin is refused', () => {
  const m = machine();
  const pd = tmpDir('kit-harness-plugin-');
  const stop = { hooks: { Stop: [{ hooks: [{ type: 'command', command: 'node s.mjs' }] }] } };
  w(pd, 'hooks/hooks.json', JSON.stringify(stop));
  w(pd, '.claude-plugin/plugin.json', JSON.stringify({ name: 'p', hooks: ['./hooks/hooks.json', '../outside.json'] }));
  w(path.dirname(pd), 'outside.json', JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: 'node o.mjs' }] }] } }));
  w(m.home, '.claude/settings.json', JSON.stringify({ enabledPlugins: { 'p@m': true } }));
  w(m.home, '.claude/plugins/installed_plugins.json', JSON.stringify({ plugins: { 'p@m': [{ scope: 'user', installPath: pd }] } }));
  const s = scan(m.opts);
  assert.deepEqual(s.plugins[0].hooks, ['Stop']);
  assert.ok(s.unreadable.some(u => /outside\.json/.test(u.file) && /outside the plugin/.test(u.error)));
  fs.rmSync(path.join(path.dirname(pd), 'outside.json'), { force: true });
});

test('plugin MCP servers given as a file path or a list of paths are counted', () => {
  const m = machine();
  const pd = tmpDir('kit-harness-plugin-');
  w(pd, '.claude-plugin/plugin.json', JSON.stringify({ name: 'p', mcpServers: ['./config/a.json', { inline: {} }] }));
  w(pd, 'config/a.json', JSON.stringify({ mcpServers: { fromA: {} } }));
  w(m.home, '.claude/settings.json', JSON.stringify({ enabledPlugins: { 'p@m': true } }));
  w(m.home, '.claude/plugins/installed_plugins.json', JSON.stringify({ plugins: { 'p@m': [{ scope: 'user', installPath: pd }] } }));
  assert.deepEqual(scan(m.opts).mcp.filter(x => x.source === 'plugin:p@m').map(x => x.name).sort(), ['fromA', 'inline']);
});

test('--home wins over CLAUDE_CONFIG_DIR from the environment', () => {
  const m = machine();
  w(m.home, '.claude/skills/mine/SKILL.md', skill('mine', 'mine'));
  const cfg = tmpDir('kit-harness-cfg-');
  w(cfg, 'skills/other/SKILL.md', skill('other', 'other'));
  const r = spawnSync(process.execPath, [path.join(KIT, 'scripts', 'harness.mjs'), 'scan', '--dir', m.dir, '--home', m.home, '--json'], { encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: cfg } });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).skills.filter(x => x.scope === 'user').map(x => x.name), ['mine']);
});

test('YAML-escaped quotes are unescaped', () => {
  const m = machine();
  w(m.dir, '.claude/skills/e/SKILL.md', "---\nname: e\ndescription: 'Don''t run in prod'\n---\n");
  w(m.dir, '.claude/skills/f/SKILL.md', '---\nname: f\ndescription: "say \\"hi\\""\n---\n');
  const d = Object.fromEntries(scan(m.opts).skills.map(x => [x.name, x.description]));
  assert.deepEqual(d, { e: "Don't run in prod", f: 'say "hi"' });
});
