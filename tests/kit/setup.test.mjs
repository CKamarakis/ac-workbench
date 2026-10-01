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
