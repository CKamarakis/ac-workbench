import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpDir } from '../../tools/test-root.mjs';
import { scan, memorySlug, formatScan } from '../../plugins/kit/scripts/harness.mjs';
import { laneMap, routingBlock } from '../../plugins/kit/scripts/lanes.mjs';

const KIT = path.resolve(import.meta.dirname, '../../plugins/kit');

// kit-harness-review 3.1-3.3 (spec: harness-review "Setup scan", "Kit checks only with the kit", "Read-only")
const w = (root, rel, text) => { const p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const skill = (name, desc) => `---\nname: ${name}\ndescription: ${desc}\n---\n\n# ${name}\n`;
const git = d => spawnSync('git', ['init', '-q'], { cwd: d });

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
  const g = (...a) => assert.equal(spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd: m.dir }).status, 0, a.join(' '));
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
