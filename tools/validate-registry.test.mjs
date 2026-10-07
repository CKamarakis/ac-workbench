import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { validate, compareVersions } from './validate-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function load(name) {
  return YAML.parse(fs.readFileSync(path.join(root, 'evals', 'registry', 'fixtures', `${name}.yaml`), 'utf8'));
}
export function validDoc() {
  return structuredClone(load('valid'));
}
export function tool(doc, name) {
  return doc.tools.find((t) => t.name === name);
}

test('valid fixture has no errors', () => {
  assert.deepEqual(validate(load('valid')).errors, []);
});

test('non-mapping root', () => {
  assert.equal(validate([]).errors.length, 1);
});

test('missing tools', () => {
  assert.ok(validate({ version: 1 }).errors.some((e) => /tools/.test(e)));
});

test('empty tools list', () => {
  assert.ok(validate({ tools: [] }).errors.some((e) => /tools/.test(e)));
});

test('missing reason', () => {
  const errors = validate(load('missing-field')).errors;
  assert.ok(errors.some((e) => /openspec/.test(e) && /reason/.test(e)));
});

test('bad status lists allowed values', () => {
  const errors = validate(load('bad-enum')).errors;
  assert.ok(errors.some((e) => ['maybe', 'trial', 'adopted', 'dropped', 'later'].every((s) => e.includes(s))));
});

test('bad cost', () => {
  const doc = validDoc();
  tool(doc, 'openspec').cost = 'cheap';
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec.cost') && e.includes('uses-claude-quota')));
});

test('tier project-type ok, bad tier fails', () => {
  const doc = validDoc();
  tool(doc, 'openspec').tier = 'project-type:web';
  assert.ok(!validate(doc).errors.some((e) => e.includes('openspec.tier')));
  tool(doc, 'openspec').tier = 'project-type:';
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec.tier')));
});

test('rubric key missing', () => {
  const doc = validDoc();
  delete tool(doc, 'openspec').rubric.license;
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec.rubric.license')));
});

test('empty value counts as missing', () => {
  const doc = validDoc();
  tool(doc, 'openspec').reason = '';
  tool(doc, 'openspec').source = null;
  const errors = validate(doc).errors;
  assert.ok(errors.some((e) => e.includes('openspec.reason') && /missing/.test(e)));
  assert.ok(errors.some((e) => e.includes('openspec.source') && /missing/.test(e)));
});

test('non-mapping entry', () => {
  const doc = validDoc();
  doc.tools.push('oops');
  let errors;
  assert.doesNotThrow(() => { errors = validate(doc).errors; });
  assert.ok(errors.some((e) => e.includes('tools[3]')));
});

test('status/verdict mismatch', () => {
  const errors = validate(load('status-mismatch')).errors;
  assert.ok(errors.some((e) => /openspec/.test(e) && /verdict/.test(e)));
});

test('appended verdict matches status', () => {
  const doc = validDoc();
  const t = tool(doc, 'superpowers');
  t.verdicts.push({ date: '2026-10-01', status: 'adopted', rationale: 'won' });
  t.status = 'adopted';
  assert.deepEqual(validate(doc).errors, []);
});

test('verdicts out of order', () => {
  const doc = validDoc();
  tool(doc, 'superpowers').verdicts.push({ date: '2026-01-01', status: 'trial', rationale: 'back' });
  assert.ok(validate(doc).errors.some((e) => e.includes('superpowers.verdicts')));
});

test('verdict missing rationale', () => {
  const doc = validDoc();
  delete tool(doc, 'superpowers').verdicts[0].rationale;
  assert.ok(validate(doc).errors.some((e) => e.includes('superpowers.verdicts[0].rationale')));
});

test('verdicts not a list', () => {
  for (const bad of [{}, []]) {
    const doc = validDoc();
    tool(doc, 'superpowers').verdicts = bad;
    let errors;
    assert.doesNotThrow(() => { errors = validate(doc).errors; });
    assert.ok(errors.some((e) => e.includes('superpowers.verdicts')));
  }
});

test('non-mapping verdict', () => {
  const doc = validDoc();
  tool(doc, 'superpowers').verdicts.push('oops');
  let errors;
  assert.doesNotThrow(() => { errors = validate(doc).errors; });
  assert.ok(errors.some((e) => e.includes('superpowers.verdicts[')));
});

test('invalid status skips mismatch', () => {
  assert.ok(!validate(load('bad-enum')).errors.some((e) => /verdict/.test(e)));
});

test('duplicate name', () => {
  const doc = validDoc();
  doc.tools.push(structuredClone(tool(doc, 'openspec')));
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec') && /duplicate/.test(e)));
});

test('missing install', () => {
  const errors = validate(load('missing-install')).errors;
  assert.ok(errors.some((e) => /openspec/.test(e) && /install/.test(e)));
});

test('missing check', () => {
  const doc = validDoc();
  delete tool(doc, 'openspec').check;
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec.check')));
});

test('install without win32', () => {
  const doc = validDoc();
  tool(doc, 'openspec').install = { linux: 'x' };
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec.install.win32')));
});

test('invalid scope', () => {
  const doc = validDoc();
  tool(doc, 'superpowers').scope = 'team';
  assert.ok(validate(doc).errors.some((e) => e.includes('superpowers.scope') && e.includes('machine') && e.includes('project')));
});

test('later without install passes', () => {
  assert.deepEqual(validate(load('later-no-install')).errors, []);
});

test('phase conflict', () => {
  const errors = validate(load('phase-conflict')).errors;
  const hits = errors.filter((e) => /superpowers/.test(e) && /openspec/.test(e) && /artifacts/.test(e));
  assert.equal(hits.length, 1);
});

test('resolved overlap passes', () => {
  assert.deepEqual(validate(load('resolved-overlap')).errors, []);
});

test('overlap without skip_skills is unresolved', () => {
  const doc = load('resolved-overlap');
  tool(doc, 'superpowers').skip_skills = [];
  assert.ok(validate(doc).errors.some((e) => /plan/.test(e)));
});

test('dropped tools ignored for phases', () => {
  const doc = load('phase-conflict');
  const t = tool(doc, 'superpowers');
  t.status = 'dropped';
  t.verdicts.push({ date: '2026-09-30', status: 'dropped', rationale: 'gone' });
  assert.ok(!validate(doc).errors.some((e) => /phase/.test(e)));
});

test('malformed phases/overlaps/skip_skills do not crash', () => {
  const doc = validDoc();
  const t = tool(doc, 'superpowers');
  t.phases = 'plan';
  t.overlaps = 'openspec';
  t.skip_skills = {};
  assert.doesNotThrow(() => validate(doc));
});

test('compareVersions', () => {
  assert.equal(compareVersions('5.1.0', '5.0.0'), 1);
  assert.equal(compareVersions('1.13.2', '1.9.9'), 1);
  assert.equal(compareVersions('5.0', '5.0.0'), 0);
  assert.equal(compareVersions('none', '1.0.0'), -1);
  assert.equal(compareVersions('1.0.0', 'none'), 1);
  assert.equal(compareVersions('none', 'bad'), 0);
});

test('numeric YAML version', () => {
  assert.equal(compareVersions(5.1, '5.0.0'), 1);
});

test('needs review warning', () => {
  const { errors, warnings } = validate(load('needs-review'));
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => /superpowers/.test(w) && /needs review/i.test(w)));
});

test('same version no warning', () => {
  const doc = validDoc();
  tool(doc, 'superpowers').installed_version = '5.0.0';
  assert.deepEqual(validate(doc).warnings, []);
});

const cli = (...args) => spawnSync(process.execPath, ['tools/validate-registry.mjs', ...args], { cwd: root, encoding: 'utf8' });
const fx = (name) => `evals/registry/fixtures/${name}.yaml`;
function withTmp(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'reg-'));
  try {
    fn(path.join(dir, 'toolkit.json'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('cli valid', () => {
  const r = cli(fx('valid'));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /[Vv]alid/);
});

test('cli needs-review exits 0 with warning', () => {
  const r = cli(fx('needs-review'));
  assert.equal(r.status, 0);
  assert.match(r.stdout, /^(?=.*superpowers)(?=.*needs review).*$/im);
});

test('cli missing-field', () => {
  const r = cli(fx('missing-field'));
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^(?=.*openspec)(?=.*reason).*$/m);
});

test('cli writes json then check passes', () => {
  withTmp((f) => {
    assert.equal(cli(fx('valid'), '--out', f).status, 0);
    assert.ok(fs.readFileSync(f, 'utf8').includes('"openspec"'));
    assert.equal(cli(fx('valid'), '--out', f, '--check').status, 0);
  });
});

test('cli failure keeps previous json', () => {
  withTmp((f) => {
    fs.writeFileSync(f, '{"previous": true}');
    assert.equal(cli(fx('missing-field'), '--out', f).status, 1);
    assert.equal(fs.readFileSync(f, 'utf8'), '{"previous": true}');
  });
});

test('cli stale', () => {
  withTmp((f) => {
    fs.writeFileSync(f, '{"stale": true}');
    const r = cli(fx('valid'), '--out', f, '--check');
    assert.equal(r.status, 1);
    assert.match(r.stdout, /stale/i);
    assert.equal(fs.readFileSync(f, 'utf8'), '{"stale": true}');
  });
});

test('cli check missing file is stale', () => {
  withTmp((f) => {
    assert.equal(cli(fx('valid'), '--out', f, '--check').status, 1);
    assert.equal(fs.existsSync(f), false);
  });
});

test('cli usage', () => {
  assert.equal(cli().status, 1);
  assert.equal(cli(fx('valid'), '--check').status, 1);
  assert.equal(cli(fx('valid'), '--out', '--check').status, 1);
});

test('cli --out into missing directory is one stdout line, empty stderr', () => {
  withTmp((f) => {
    const bad = path.join(path.dirname(f), 'nope', 'toolkit.json');
    const r = cli(fx('valid'), '--out', bad);
    assert.equal(r.status, 1);
    assert.equal(r.stderr, '');
    const lines = r.stdout.trim().split('\n');
    assert.equal(lines.length, 1);
    assert.ok(lines[0].startsWith(`${bad}: `));
  });
});

test('cli --check with --out as directory errors cleanly', () => {
  withTmp((f) => {
    const r = cli(fx('valid'), '--out', path.dirname(f), '--check');
    assert.equal(r.status, 1);
    assert.equal(r.stderr, '');
    assert.ok(!/Registry valid/.test(r.stdout));
  });
});

test('cli --check tolerates CRLF line endings', () => {
  withTmp((f) => {
    assert.equal(cli(fx('valid'), '--out', f).status, 0);
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/\n/g, '\r\n'));
    assert.equal(cli(fx('valid'), '--out', f, '--check').status, 0);
  });
});

test('compareVersions handles v prefix and prerelease/build suffixes', () => {
  assert.equal(compareVersions('v5.1.0', '5.0.0'), 1);
  assert.equal(compareVersions('V5.1.0', '5.0.0'), 1);
  assert.equal(compareVersions('5.1.0-beta.1', '5.0.0'), 1);
  assert.equal(compareVersions('5.1.0+build.7', '5.0.0'), 1);
});

test('non-string name is reported once', () => {
  const doc = validDoc();
  doc.tools[0].name = 123;
  const errors = validate(doc).errors;
  assert.ok(errors.includes('tools[0].name: must be a non-empty string'));
  assert.ok(!errors.some((e) => e.startsWith('tools[0].name: missing')));
});

test('no needs-review warning when reviewed_version missing', () => {
  const doc = validDoc();
  const t = tool(doc, 'superpowers');
  t.installed_version = '9.9.9';
  delete t.reviewed_version;
  const { errors, warnings } = validate(doc);
  assert.ok(errors.some((e) => e.includes('superpowers.reviewed_version')));
  assert.ok(!warnings.some((w) => /needs review/.test(w)));
});

test('non-mapping install on active entry', () => {
  const doc = validDoc();
  tool(doc, 'openspec').install = 'npm i x';
  assert.ok(validate(doc).errors.some((e) => e.includes('openspec.install')));
});

test('tiers global and project are valid', () => {
  for (const tier of ['global', 'project']) {
    const doc = validDoc();
    tool(doc, 'openspec').tier = tier;
    assert.ok(!validate(doc).errors.some((e) => e.includes('openspec.tier')));
  }
});

test('recommend: yes/no only, and needs recommend_why (prd-pipeline-followups 1.1)', () => {
  const doc = validDoc();
  const t = doc.tools[0];
  t.recommend = 'maybe';
  assert.match(validate(doc).errors.join('\n'), /recommend: "maybe" is not one of yes, no/);
  t.recommend = 'no';
  assert.match(validate(doc).errors.join('\n'), /recommend_why: required when recommend is set/);
  t.recommend_why = 'Optional';
  assert.deepEqual(validate(doc).errors, []);
});

test('project_types: unknown type, empty policy and bad missing_required are rejected (quality-gates 1.1)', () => {
  const doc = validDoc();
  doc.project_types = { mystery: { tests: [{ script: 'test', required: true }], missing_required: 'hard' } };
  assert.match(validate(doc).errors.join('\n'), /project_types\.mystery: unknown project type "mystery"/);
  doc.project_types = { none: { tests: [], missing_required: 'hard' } };
  assert.match(validate(doc).errors.join('\n'), /project_types\.none\.tests: needs at least one command/);
  doc.project_types = { none: { tests: [{ script: 'test' }], missing_required: 'maybe' } };
  assert.match(validate(doc).errors.join('\n'), /missing_required: must be hard or advisory/);
  doc.project_types = { none: { tests: [{ script: 'test', required: false }], missing_required: 'advisory' } };
  assert.deepEqual(validate(doc).errors, []);
});
