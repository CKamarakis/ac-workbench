import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applyProject, enablePluginInSettings, registerProject, formatResult } from '../../plugins/kit/scripts/start-apply.mjs';
import { planProject } from '../../plugins/kit/scripts/start-plan.mjs';
import { registry } from './fixtures/start-registry.mjs';

const tmp = p => fs.mkdtempSync(path.join(os.tmpdir(), p));

// Fake machine: git/openspec init create their folders; installs make checks pass unless broken.
function fakeDeps(dir, { broken = [] } = {}) {
  const have = new Set();
  const calls = [];
  return {
    calls, have,
    platform: 'win32',
    run: (cmd, { cwd } = {}) => {
      calls.push(cmd);
      if (cmd === 'git init') { fs.mkdirSync(path.join(cwd, '.git'), { recursive: true }); return { status: 0, stdout: '', stderr: '' }; }
      if (cmd.startsWith('openspec init')) { fs.mkdirSync(path.join(cwd, 'openspec'), { recursive: true }); fs.writeFileSync(path.join(cwd, 'openspec', 'config.yaml'), 'schema: spec-driven\n\n# Project context (optional)\n'); return { status: 0, stdout: '', stderr: '' }; }
      const [verb, name] = cmd.split(' ');
      if (verb === 'check') return have.has(name) ? { status: 0, stdout: 'ok', stderr: '' } : { status: 1, stdout: '', stderr: '' };
      if (verb === 'install' || cmd.startsWith('claude plugin install')) {
        const n = verb === 'install' ? name : cmd.split(' ')[3].split('@')[0];
        if (broken.includes(n)) return { status: 1, stdout: '', stderr: `cannot install ${n}` };
        have.add(n);
        return { status: 0, stdout: '', stderr: '' };
      }
      return { status: 127, stdout: '', stderr: 'unknown command' };
    },
  };
}
const opts = (dir, home, deps, extra = {}) => ({ dir, registry, version: '9.9.9', today: '2026-10-01', deps, home, ...extra });

test('empty folder: full apply, then a second plan has nothing to change (idempotent)', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  const deps = fakeDeps(dir);
  const r = applyProject(opts(dir, home, deps, { type: 'web-ui', optIn: ['sp'] }));
  for (const f of ['.gitignore', 'CLAUDE.md', 'docs/project-context.md', 'openspec/config.yaml', '.claude/kit.json']) assert.ok(r.written.includes(f), f);
  assert.ok(fs.existsSync(path.join(dir, '.git')));
  assert.match(fs.readFileSync(path.join(dir, 'openspec', 'config.yaml'), 'utf8'), /docs\/project-context\.md/);
  assert.deepEqual(r.tools.installed.sort(), ['imp', 'sp']);
  assert.deepEqual(r.tools.pending.map(p => p.name), ['ctx']);
  const stamp = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'kit.json'), 'utf8'));
  assert.deepEqual(stamp, { kit_version: '9.9.9', setup_date: '2026-10-01', project_type: 'web-ui', opted_in: ['sp'], tools: ['ctx', 'imp', 'sp'] });
  const again = planProject({ ...opts(dir, home, deps), type: 'web-ui', optIn: ['sp'] });
  assert.equal(again.changes, 0, JSON.stringify(again.actions.filter(a => !['same', 'keep'].includes(a.action))));
  assert.match(formatResult(r), /PENDING\s+ctx/);
});

test('machine project list is updated; user-level Claude settings are never written', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  applyProject(opts(dir, home, fakeDeps(dir)));
  const list = JSON.parse(fs.readFileSync(path.join(home, '.claude', 'kit', 'projects.json'), 'utf8'));
  assert.equal(list.projects.length, 1);
  assert.equal(path.resolve(list.projects[0].path), path.resolve(dir));
  assert.equal(fs.existsSync(path.join(home, '.claude', 'settings.json')), false);
  registerProject({ home, name: 'renamed', dir, today: '2026-10-02' });
  assert.equal(JSON.parse(fs.readFileSync(path.join(home, '.claude', 'kit', 'projects.json'), 'utf8')).projects.length, 1);
});

test('changes to existing files need confirmation; unconfirmed files stay byte-identical', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# Mine\n');
  fs.writeFileSync(path.join(dir, '.gitignore'), 'node_modules/\n');
  const r = applyProject(opts(dir, home, fakeDeps(dir)));
  assert.equal(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8'), '# Mine\n');
  assert.equal(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'), 'node_modules/\n');
  assert.deepEqual(r.skipped.map(s => s.id).sort(), ['.gitignore', 'CLAUDE.md']);
  const r2 = applyProject(opts(dir, home, fakeDeps(dir), { accept: ['CLAUDE.md'] }));
  assert.ok(r2.written.includes('CLAUDE.md'));
  assert.match(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8'), /^# Mine\n\n<!-- kit:routing:start -->/);
  assert.equal(fs.readFileSync(path.join(dir, '.gitignore'), 'utf8'), 'node_modules/\n');
});

test('never deletes or changes files it does not manage', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  const mine = { 'src/app.js': 'code', 'docs/project-context.md': 'my context', 'README.md': 'readme' };
  for (const [f, c] of Object.entries(mine)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), c); }
  applyProject(opts(dir, home, fakeDeps(dir), { accept: 'all', type: 'web-ui' }));
  for (const [f, c] of Object.entries(mine)) assert.equal(fs.readFileSync(path.join(dir, f), 'utf8'), c, f);
});

test('plugin CLI fails -> fallback writes enabledPlugins, keeping existing permissions', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  fs.mkdirSync(path.join(dir, '.claude'));
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, env: { A: '1' } }));
  const r = applyProject(opts(dir, home, fakeDeps(dir, { broken: ['sp'] }), { optIn: ['sp'] }));
  assert.deepEqual(r.tools.fallback.map(f => f.name), ['sp']);
  const s = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(s.permissions, { allow: ['Bash(npm test)'] });
  assert.deepEqual(s.env, { A: '1' });
  assert.deepEqual(s.enabledPlugins, { 'sp@market': true });
});

test('settings fallback creates a new file, and refuses invalid JSON without touching it', () => {
  const dir = tmp('kit-apply-');
  assert.equal(enablePluginInSettings(dir, 'x@m').ok, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8')), { enabledPlugins: { 'x@m': true } });
  fs.writeFileSync(path.join(dir, '.claude', 'settings.json'), '{ broken');
  assert.equal(enablePluginInSettings(dir, 'y@m').ok, false);
  assert.equal(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'), '{ broken');
});

test('interactive tools are never run, only reported as pending', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  const deps = fakeDeps(dir);
  const r = applyProject(opts(dir, home, deps, { optIn: ['notion'] }));
  assert.deepEqual(r.tools.pending.map(p => p.name).sort(), ['ctx', 'notion']);
  assert.ok(!deps.calls.some(c => c === 'install ctx' || c === 'install notion'));
});

test('non-plugin install failure is reported with a fix and does not stop the rest', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  const r = applyProject(opts(dir, home, fakeDeps(dir, { broken: ['imp'] }), { type: 'web-ui', optIn: ['sp'] }));
  assert.deepEqual(r.tools.failed.map(f => f.name), ['imp']);
  assert.match(r.tools.failed[0].fix, /install imp/);
  assert.deepEqual(r.tools.installed, ['sp']);
  assert.ok(r.written.includes('.claude/kit.json'));
});

test('install succeeds but needs a user step (e.g. OAuth) -> pending with its note, not failed', () => {
  const dir = tmp('kit-apply-'), home = tmp('kit-home-');
  const reg = { phases: [], tools: [{ name: 'mcpx', tier: 'project', status: 'trial', scope: 'project', check: 'check mcpx', check_match: 'Connected', install: { win32: 'install mcpx' }, install_note: 'run /mcp and sign in' }] };
  const deps = fakeDeps(dir);
  const r = applyProject({ dir, registry: reg, version: '9.9.9', today: '2026-10-01', deps, home, optIn: ['mcpx'] });
  assert.deepEqual(r.tools.failed, []);
  assert.deepEqual(r.tools.pending.map(p => [p.name, p.note]), [['mcpx', 'run /mcp and sign in']]);
});
