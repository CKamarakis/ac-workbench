import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, apply, formatPlan, formatResult } from '../../plugins/kit/scripts/setup.mjs';

const tool = (name, extra = {}) => ({
  name, status: 'adopted', scope: 'machine',
  check: `check ${name}`, install: { win32: `install ${name}` }, ...extra,
});

// Fake machine: `installed` is the set of present tools; install commands add to it unless listed in `broken`.
function fakeDeps({ installed = [], broken = [], userPlugins = {} } = {}) {
  const have = new Set(installed);
  const calls = [];
  return {
    calls, have,
    deps: {
      platform: 'win32',
      userSettings: () => ({ enabledPlugins: userPlugins }),
      run: (command) => {
        calls.push(command);
        const [verb, name] = command.split(' ');
        if (verb === 'check') return have.has(name) ? { status: 0, stdout: `${name} 1.0`, stderr: '' } : { status: 1, stdout: '', stderr: `${name}: not found` };
        if (verb === 'install') {
          if (broken.includes(name)) return { status: 1, stdout: '', stderr: `download of ${name} failed` };
          have.add(name);
          return { status: 0, stdout: 'ok', stderr: '' };
        }
        return { status: 127, stdout: '', stderr: 'unknown' };
      },
    },
  };
}

const registry = tools => ({ tools });

test('fresh machine: every adopted/trial machine tool is installed and listed', () => {
  const m = fakeDeps();
  const r = apply(registry([tool('git'), tool('gh', { status: 'trial' }), tool('jq')]), { deps: m.deps });
  assert.deepEqual(r.installed, ['git', 'gh', 'jq']);
  assert.deepEqual(r.failed, []);
  assert.match(formatResult(r), /3 installed, 0 failed/);
});

test('partial: only the missing tools are installed', () => {
  const m = fakeDeps({ installed: ['git'] });
  const r = apply(registry([tool('git'), tool('jq')]), { deps: m.deps });
  assert.deepEqual(r.installed, ['jq']);
  assert.deepEqual(r.present, ['git']);
  assert.ok(!m.calls.includes('install git'));
});

test('all present: nothing to do, nothing installed (idempotent second run)', () => {
  const reg = registry([tool('git'), tool('jq')]);
  const m = fakeDeps();
  apply(reg, { deps: m.deps });
  const before = m.calls.filter(c => c.startsWith('install')).length;
  const second = apply(reg, { deps: m.deps });
  assert.deepEqual(second.installed, []);
  assert.equal(m.calls.filter(c => c.startsWith('install')).length, before);
  assert.match(formatResult(second), /Nothing to do/);
  assert.match(formatPlan(plan(reg, m.deps)), /Nothing to do/);
});

test('dropped and later entries are never installed and not listed as missing', () => {
  const m = fakeDeps();
  const p = plan(registry([tool('old', { status: 'dropped' }), tool('maybe', { status: 'later' }), tool('git')]), m.deps);
  assert.deepEqual(p.missing.map(x => x.name), ['git']);
  assert.deepEqual(p.skipped.map(x => x.name), ['old', 'maybe']);
  assert.ok(!m.calls.some(c => c.endsWith(' old') || c.endsWith(' maybe')));
});

test('project-scope entries are skipped by machine setup', () => {
  const m = fakeDeps();
  const p = plan(registry([tool('superpowers', { scope: 'project', status: 'trial' })]), m.deps);
  assert.deepEqual(p.missing, []);
  assert.match(p.skipped[0].reason, /project scope/);
});

test('one failing install is reported with a fix hint and does not stop the others', () => {
  const m = fakeDeps({ broken: ['gh'] });
  const r = apply(registry([tool('git'), tool('gh'), tool('jq')]), { deps: m.deps });
  assert.deepEqual(r.installed, ['git', 'jq']);
  assert.equal(r.failed.length, 1);
  assert.equal(r.failed[0].name, 'gh');
  assert.match(r.failed[0].error, /download of gh failed/);
  assert.match(r.failed[0].hint, /install gh/);
});

test('install that succeeds but the check still fails is a failure with a PATH hint', () => {
  const m = fakeDeps();
  m.deps.run = (cmd) => (cmd.startsWith('install') ? { status: 0, stdout: '', stderr: '' } : { status: 1, stdout: '', stderr: '' });
  const r = apply(registry([tool('jq')]), { deps: m.deps });
  assert.match(r.failed[0].error, /new terminal/);
});

test('apply can be limited to named tools', () => {
  const m = fakeDeps();
  const r = apply(registry([tool('git'), tool('jq')]), { only: ['jq'], deps: m.deps });
  assert.deepEqual(r.installed, ['jq']);
});

test('check_match: present only when the check output matches', () => {
  const m = fakeDeps({ installed: ['market'] });
  const p = plan(registry([tool('market', { check_match: 'superpowers-marketplace' })]), m.deps);
  assert.deepEqual(p.missing.map(x => x.name), ['market']);
});

test('warns when a project-scope plugin is enabled in user settings', () => {
  const m = fakeDeps({ userPlugins: { 'superpowers@superpowers-marketplace': true, 'kit@ac-workbench': true } });
  const p = plan(registry([tool('superpowers', { scope: 'project', status: 'trial' })]), m.deps);
  assert.equal(p.warnings.length, 1);
  assert.match(p.warnings[0], /superpowers@superpowers-marketplace.*user scope/);
});

// kit-cross-platform 2.2, 2.3: install command per platform; missing Homebrew
import { installFor } from '../../plugins/kit/scripts/setup.mjs';

test('installFor: platform key wins over all; all when no key; null when neither', () => {
  const e = { install: { win32: 'winget x', all: 'brew install x' } };
  assert.equal(installFor(e, 'win32'), 'winget x');
  assert.equal(installFor(e, 'darwin'), 'brew install x');
  assert.equal(installFor({ install: { win32: 'w' } }, 'linux'), null);
  assert.equal(installFor({}, 'linux'), null);
});

test('mac without Homebrew: brew installs fail with the brew.sh hint and run nothing; npm still installs', () => {
  const m = fakeDeps();
  m.deps.platform = 'darwin';
  m.deps.hasBrew = () => false;
  const gh = tool('gh', { install: { win32: 'install gh', darwin: 'brew install gh' } });
  const os = tool('openspec', { install: { all: 'install openspec' } });
  const r = apply(registry([gh, os]), { deps: m.deps });
  assert.deepEqual(r.installed, ['openspec']);
  assert.equal(r.failed[0].name, 'gh');
  assert.match(r.failed[0].error + r.failed[0].hint, /https:\/\/brew\.sh/);
  assert.match(r.failed[0].hint, /re-run \/kit:setup/);
  assert.ok(!m.calls.some(c => c.startsWith('brew')), 'no brew command run');
});

test('mac with Homebrew: runs the darwin command', () => {
  const m = fakeDeps();
  m.deps.platform = 'darwin';
  m.deps.hasBrew = () => true;
  const jq = tool('jq', { install: { win32: 'install jq', darwin: 'install jq' } });
  assert.deepEqual(apply(registry([jq]), { deps: m.deps }).installed, ['jq']);
});

// kit-followups 2.2: install: none never runs, even when its check fails
test('install: none -> nothing to install, no command run', () => {
  const m = fakeDeps();
  const builtins = tool('builtins', { install: 'none', install_note: 'part of Claude Code' });
  const p = plan(registry([builtins]), m.deps);
  assert.deepEqual(p.missing, []);
  assert.match(p.skipped[0].reason, /nothing to install: part of Claude Code/);
  const r = apply(registry([builtins]), { deps: m.deps });
  assert.deepEqual(r.failed, []);
  assert.ok(!m.calls.some(c => c.startsWith('install') || c.startsWith('none')), 'no install command run');
  assert.equal(installFor(builtins, 'win32'), null);
});

// kit-followups verify C9: one definition of "nothing to install"
import { nothingToInstall } from '../../plugins/kit/scripts/setup.mjs';
test('C9: nothingToInstall is the single check for install: none', () => {
  assert.equal(nothingToInstall({ install: 'none' }), true);
  assert.equal(nothingToInstall({ install: { all: 'x' } }), false);
  assert.equal(nothingToInstall({}), false);
});
