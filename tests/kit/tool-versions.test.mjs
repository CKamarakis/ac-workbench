// tool-version-sync: a re-sync brings project tools to the tested version (spec: project-starter
// "Re-sync brings tools to the tested version").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { planProject, formatPlan, versionOf, compareVersions } from '../../plugins/kit/scripts/start-plan.mjs';
import { applyProject, formatResult } from '../../plugins/kit/scripts/start-apply.mjs';
import { tmpDir } from '../../tools/test-root.mjs';

const imp = {
  name: 'impeccable', tier: 'project-type:web-ui', status: 'adopted', scope: 'project',
  check: 'check impeccable', install: { all: 'install impeccable' }, reviewed_version: 'skill-v4.6.0',
  project_version: { file: '.claude/skills/impeccable/SKILL.md', pattern: '^version: ([0-9.]+)' },
  update: 'npx -y impeccable update -y --project',
};
const openspec = { name: 'openspec', tier: 'global', status: 'adopted', scope: 'machine', check: 'openspec --version', install: { all: 'npm install -g @fission-ai/openspec' }, reviewed_version: '1.14.3', phases: ['build'], skills: { build: '/opsx:apply' } };
const registry = { lanes: [], project_types: { 'web-ui': {} }, tools: [openspec, imp] };

/** deps: every check passes; `openspec --version` prints cli (or fails when null); records calls. */
const fakeDeps = ({ cli = null } = {}) => {
  const calls = [];
  return {
    calls, platform: 'win32',
    run: cmd => {
      calls.push(cmd);
      if (cmd === 'openspec --version') return cli ? { status: 0, stdout: `${cli}\n`, stderr: '' } : { status: 127, stdout: '', stderr: 'not found' };
      return { status: 0, stdout: 'ok', stderr: '' };
    },
  };
};

function project({ impeccable = null, skills = null } = {}) {
  const dir = tmpDir('kit-versions-');
  fs.mkdirSync(path.join(dir, '.git'));
  fs.mkdirSync(path.join(dir, 'openspec'));
  fs.writeFileSync(path.join(dir, '.claude-kit-marker'), '');
  if (impeccable) {
    fs.mkdirSync(path.join(dir, '.claude/skills/impeccable'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude/skills/impeccable/SKILL.md'), `---\nname: impeccable\nversion: ${impeccable}\n---\n`);
  }
  for (const [name, v] of Object.entries(skills ?? {})) {
    fs.mkdirSync(path.join(dir, `.claude/skills/${name}`), { recursive: true });
    fs.writeFileSync(path.join(dir, `.claude/skills/${name}/SKILL.md`), `---\nname: ${name}\nmetadata:\n  generatedBy: "${v}"\n---\n`);
  }
  return dir;
}
const plan = (dir, deps, extra = {}) => planProject({ dir, registry, type: 'web-ui', version: '9.9.9', today: '2026-10-20', deps, ...extra });
const tool = (p, name) => p.tools.find(t => t.name === name);

test('versions: the first x.y.z in a string; compare by parts', () => {
  assert.equal(versionOf('skill-v4.6.0'), '4.6.0');
  assert.equal(versionOf('1.14.3\n'), '1.14.3');
  assert.equal(versionOf('readme 2026-10-01'), null);
  assert.equal(compareVersions('4.5.0', '4.6.0'), -1);
  assert.equal(compareVersions('1.14.3', '1.13.2'), 1);
  assert.equal(compareVersions('4.6', '4.6.0'), 0);
});

test('project-starter: Old Impeccable', () => {
  const p = plan(project({ impeccable: '4.5.0' }), fakeDeps());
  const t = tool(p, 'impeccable');
  assert.equal(t.action, 'update');
  assert.equal(t.from, '4.5.0');
  assert.equal(t.tested, '4.6.0');
  assert.equal(t.command, imp.update);
  assert.ok(p.changes > 0);
  const text = formatPlan(p);
  assert.match(text, /UPDATE\s+impeccable\s.*4\.5\.0.*tested 4\.6\.0/);
  assert.match(text, /npx -y impeccable update -y --project/);
});

test('project-starter: Newer than tested', () => {
  const p = plan(project({ impeccable: '4.7.0' }), fakeDeps());
  const t = tool(p, 'impeccable');
  assert.equal(t.action, 'present');
  assert.equal(t.newer, '4.7.0');
  assert.match(formatPlan(p), /impeccable.*4\.7\.0, newer than the kit tested \(4\.6\.0\)/);
});

test('same version, or no version recorded: present, nothing to update', () => {
  assert.equal(tool(plan(project({ impeccable: '4.6.0' }), fakeDeps()), 'impeccable').action, 'present');
  assert.equal(tool(plan(project(), fakeDeps()), 'impeccable').action, 'present');
});

test('a missing tool is still an install, not an update', () => {
  const deps = fakeDeps();
  const run = deps.run;
  deps.run = cmd => (cmd === 'check impeccable' ? { status: 1, stdout: '', stderr: '' } : run(cmd));
  assert.equal(tool(plan(project({ impeccable: '4.5.0' }), deps), 'impeccable').action, 'install');
});

test('project-starter: Old OpenSpec skills', () => {
  const p = plan(project({ skills: { 'openspec-propose': '1.13.2', 'openspec-apply-change': '1.14.3' } }), fakeDeps({ cli: '1.14.3' }));
  const t = tool(p, 'openspec-skills');
  assert.equal(t.action, 'update');
  assert.equal(t.from, '1.13.2');
  assert.equal(t.command, 'openspec update');
  assert.match(formatPlan(p), /UPDATE\s+openspec-skills[\s\S]*removes skills outside/);
});

test('OpenSpec skills at the CLI version, or no CLI: no update entry', () => {
  assert.equal(tool(plan(project({ skills: { 'openspec-propose': '1.14.3' } }), fakeDeps({ cli: '1.14.3' })), 'openspec-skills'), undefined);
  assert.equal(tool(plan(project({ skills: { 'openspec-propose': '1.13.2' } }), fakeDeps()), 'openspec-skills'), undefined);
});

test('project-starter: Old OpenSpec CLI', () => {
  const deps = fakeDeps({ cli: '1.13.0' });
  const p = plan(project(), deps);
  assert.ok(p.warnings.some(w => /OpenSpec 1\.13\.0 is older than the kit tested \(1\.14\.3\).*npm install -g @fission-ai\/openspec/.test(w)), p.warnings.join('\n'));
  assert.match(formatPlan(p), /WARNING\s+OpenSpec 1\.13\.0/);
  assert.ok(!deps.calls.includes('npm install -g @fission-ai/openspec'));
});

test('apply runs the updates on the yes', () => {
  const dir = project({ impeccable: '4.5.0', skills: { 'openspec-propose': '1.13.2' } });
  const deps = upgrading(dir);
  const r = applyProject({ dir, registry, type: 'web-ui', version: '9.9.9', today: '2026-10-20', deps, home: tmpDir('kit-home-'), accept: 'all' });
  assert.ok(deps.calls.includes(imp.update));
  assert.ok(deps.calls.includes('openspec update'));
  assert.deepEqual(r.tools.updated.map(u => u.name).sort(), ['impeccable', 'openspec-skills']);
  assert.match(formatResult(r), /updated\s+impeccable/);
});

test('project-starter: Files only', () => {
  const dir = project({ impeccable: '4.5.0' });
  const deps = fakeDeps();
  const r = applyProject({ dir, registry, type: 'web-ui', version: '9.9.9', today: '2026-10-20', deps, home: tmpDir('kit-home-'), accept: 'all', filesOnly: true });
  assert.ok(!deps.calls.includes(imp.update));
  assert.ok(r.tools.leftAlone.includes('impeccable'));
  assert.match(formatResult(r), /left alone impeccable/);
});

test('a failed update is reported with a fix and does not stop the rest', () => {
  const dir = project({ impeccable: '4.5.0' });
  const deps = fakeDeps();
  const run = deps.run;
  deps.run = cmd => (cmd === imp.update ? (deps.calls.push(cmd), { status: 1, stdout: '', stderr: 'network down' }) : run(cmd));
  const r = applyProject({ dir, registry, type: 'web-ui', version: '9.9.9', today: '2026-10-20', deps, home: tmpDir('kit-home-'), accept: 'all' });
  assert.ok(r.tools.failed.some(f => f.name === 'impeccable' && /network down/.test(f.error) && f.fix.includes(imp.update)));
  assert.ok(r.written.includes('.claude/kit.json'));
});

// verify (code review): an update is checked by reading the version again; what openspec update removed is named;
// a version that can't be read is said, not hidden.
const upgrading = (dir, { cli = '1.14.3', impTo = '4.7.0', removed = 'Removed: 3 skill directories (deselected workflows)' } = {}) => {
  const deps = fakeDeps({ cli });
  const run = deps.run;
  deps.run = cmd => {
    if (cmd === imp.update && impTo) { deps.calls.push(cmd); fs.writeFileSync(path.join(dir, '.claude/skills/impeccable/SKILL.md'), `---\nversion: ${impTo}\n---\n`); return { status: 0, stdout: 'Done!', stderr: '' }; }
    if (cmd === 'openspec update') {
      deps.calls.push(cmd);
      const f = path.join(dir, '.claude/skills/openspec-propose/SKILL.md');
      if (fs.existsSync(f)) fs.writeFileSync(f, `---\nmetadata:\n  generatedBy: "${cli}"\n---\n`);
      return { status: 0, stdout: `Updated\n${removed}\n`, stderr: '' };
    }
    return run(cmd);
  };
  return deps;
};

test('an update that leaves the version where it was is reported as failed, with a fix', () => {
  const dir = project({ impeccable: '4.5.0' });
  const r = applyProject({ dir, registry, type: 'web-ui', version: '9.9.9', today: '2026-10-20', deps: upgrading(dir, { impTo: null }), home: tmpDir('kit-home-'), accept: 'all' });
  assert.ok(r.tools.failed.some(f => f.name === 'impeccable' && /still 4\.5\.0/.test(f.error)), JSON.stringify(r.tools));
  assert.ok(!r.tools.updated.some(u => u.name === 'impeccable'));
});

test('a real update names the new version and what openspec update removed', () => {
  const dir = project({ impeccable: '4.5.0', skills: { 'openspec-propose': '1.13.2' } });
  const r = applyProject({ dir, registry, type: 'web-ui', version: '9.9.9', today: '2026-10-20', deps: upgrading(dir), home: tmpDir('kit-home-'), accept: 'all' });
  const text = formatResult(r);
  assert.match(text, /updated\s+impeccable 4\.5\.0 -> 4\.7\.0/);
  assert.match(text, /updated\s+openspec-skills 1\.13\.2 -> 1\.14\.3[\s\S]*Removed: 3 skill directories/);
});

test('a version file that exists but does not match the pattern is named in the plan', () => {
  const dir = project();
  fs.mkdirSync(path.join(dir, '.claude/skills/impeccable'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/skills/impeccable/SKILL.md'), '---\nversion: "4.5.0"\n---\n');
  const p = plan(dir, fakeDeps());
  assert.equal(tool(p, 'impeccable').action, 'present');
  assert.match(formatPlan(p), /impeccable.*version not readable from \.claude\/skills\/impeccable\/SKILL\.md/);
});
