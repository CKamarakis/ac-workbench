import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPrereqs, formatPrereqs } from '../../plugins/kit/scripts/prereqs.mjs';

const registry = {
  tools: [
    { name: 'git', status: 'adopted', scope: 'machine', check: 'check git', install: { win32: 'install git', linux: 'install git', darwin: 'install git' } },
    { name: 'openspec', status: 'adopted', scope: 'machine', check: 'check openspec', install: { win32: 'install openspec', linux: 'x', darwin: 'x' } },
    { name: 'jq', status: 'adopted', scope: 'machine', check: 'check jq', install: { win32: 'install jq', linux: 'x', darwin: 'x' } },
  ],
};
const setupDeps = present => ({
  platform: 'win32',
  userSettings: () => ({}),
  run: cmd => (present.includes(cmd.split(' ')[1]) ? { status: 0, stdout: 'ok', stderr: '' } : { status: 1, stdout: '', stderr: 'no' }),
});
const locateFn = present => name => (present.includes(name) ? { path: `/bin/${name}`, via: 'path' } : null);

test('all present: ready, nothing missing', () => {
  const r = checkPrereqs({ registry, locateFn: locateFn(['git', 'openspec']), setupDeps: setupDeps(['git', 'openspec', 'jq']) });
  assert.equal(r.ready, true);
  assert.deepEqual(r.blocked, []);
  assert.deepEqual(r.machineMissing, []);
  assert.match(formatPrereqs(r), /Ready\./);
});

test('missing machine tool -> offer setup, still ready', () => {
  const r = checkPrereqs({ registry, locateFn: locateFn(['git', 'openspec']), setupDeps: setupDeps(['git', 'openspec']) });
  assert.equal(r.ready, true);
  assert.deepEqual(r.machineMissing.map(m => m.name), ['jq']);
  assert.match(formatPrereqs(r), /\/kit:setup/);
});

test('missing git -> blocked with install hint, before any write', () => {
  const r = checkPrereqs({ registry, locateFn: locateFn(['openspec']), setupDeps: setupDeps(['openspec', 'jq']) });
  assert.equal(r.ready, false);
  assert.equal(r.blocked[0].name, 'git');
  assert.match(r.blocked[0].hint, /install git/);
  assert.match(formatPrereqs(r), /Stop: install the blocked tools first\. Nothing was changed\./);
});

test('openspec off PATH but locatable counts as present', () => {
  const r = checkPrereqs({ registry, locateFn: n => ({ path: `C:/Users/x/AppData/Roaming/npm/${n}.cmd`, via: 'npm-prefix' }), setupDeps: setupDeps(['git', 'openspec', 'jq']) });
  assert.equal(r.ready, true);
  assert.match(r.located.openspec, /npm/);
});
