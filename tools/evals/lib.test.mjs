import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadCases, findMissingEvals, makeSandbox, runCheck, scoreRubric,
  runCase, runSkill, writeRun, compareRuns, formatComparison, expand,
} from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'kit-evaltest-'));
const write = (dir, rel, content) => {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
};
const exitWith = code => `node -e "process.exit(${code})"`;

// ---- 3.1 format ----

test('loadCases reads the documented fields', () => {
  const d = tmp();
  const f = write(d, 'cases.yaml', [
    'skill: demo',
    'cases:',
    '  - id: one',
    '    description: d',
    '    setup: { git_init: true, files: { a.txt: hi } }',
    '    input: { run: echo ok }',
    '    checks:',
    '      - { kind: file-exists, path: a.txt }',
    '      - { kind: rubric, criteria: [ { name: c1, description: x } ] }',
  ].join('\n'));
  const doc = loadCases(f);
  assert.equal(doc.skill, 'demo');
  assert.equal(doc.cases[0].id, 'one');
  assert.equal(doc.cases[0].setup.files['a.txt'], 'hi');
  assert.equal(doc.cases[0].input.run, 'echo ok');
  assert.equal(doc.cases[0].checks[1].criteria[0].name, 'c1');
});

test('loadCases rejects unknown check kinds, duplicate ids and empty checks', () => {
  const d = tmp();
  const f = write(d, 'cases.yaml', [
    'skill: demo',
    'cases:',
    '  - { id: a, checks: [ { kind: vibes } ] }',
    '  - { id: a, checks: [] }',
  ].join('\n'));
  assert.throws(() => loadCases(f), err => /unknown check kind "vibes"/.test(err.message)
    && /duplicate id/.test(err.message) && /non-empty list/.test(err.message));
});

// ---- 3.2 deterministic checks ----

test('file-exists', () => {
  const d = makeSandbox({ files: { 'x/y.txt': '1' } });
  assert.equal(runCheck({ kind: 'file-exists', path: 'x/y.txt' }, d).pass, true);
  assert.equal(runCheck({ kind: 'file-exists', path: 'nope' }, d).pass, false);
});

test('command-exit with expected code and stdout match', () => {
  const d = makeSandbox({});
  write(d, 'say.js', 'console.log(process.argv[2]);');
  assert.equal(runCheck({ kind: 'command-exit', command: exitWith(0) }, d).pass, true);
  assert.equal(runCheck({ kind: 'command-exit', command: exitWith(3), expect: 3 }, d).pass, true);
  assert.equal(runCheck({ kind: 'command-exit', command: exitWith(1) }, d).pass, false);
  assert.equal(runCheck({ kind: 'command-exit', command: 'node say.js kit-1.2', stdout_match: 'kit-\\d' }, d).pass, true);
  assert.equal(runCheck({ kind: 'command-exit', command: 'node say.js nope', stdout_match: 'kit' }, d).pass, false);
});

test('git-ignored uses the sandbox .gitignore (licensed folder pattern)', () => {
  const d = makeSandbox({ git_init: true, files: { '.gitignore': '[Pp][Mm][-_ ][Oo][Ss]*/\n', 'PM-OS-v2.1/a.md': 'x', 'src/a.js': 'x' } });
  assert.equal(runCheck({ kind: 'git-ignored', path: 'PM-OS-v2.1/a.md' }, d).pass, true);
  assert.equal(runCheck({ kind: 'git-ignored', path: 'src/a.js' }, d).pass, false);
});

test('content-match and negate', () => {
  const d = makeSandbox({ files: { 'CLAUDE.md': '<!-- kit:routing:start -->\nx\n' } });
  assert.equal(runCheck({ kind: 'content-match', path: 'CLAUDE.md', pattern: 'kit:routing:start' }, d).pass, true);
  assert.equal(runCheck({ kind: 'content-match', path: 'CLAUDE.md', pattern: 'sk-[A-Za-z0-9]{20}', negate: true }, d).pass, true);
  assert.equal(runCheck({ kind: 'content-match', path: 'missing.md', pattern: 'x' }, d).pass, false);
});

test('placeholders expand; unknown ones are left alone', () => {
  assert.equal(expand('{{kit}}/scripts/a.mjs {{nope}}', { kit: '/k' }), '/k/scripts/a.mjs {{nope}}');
  const d = makeSandbox({ files: { 'a.txt': '1' } });
  assert.equal(runCheck({ kind: 'file-exists', path: '{{sandbox}}/a.txt' }, d).pass, true);
});

test('extra vars override placeholders per run (A/B: point cases at another build)', () => {
  const r = runCase({ id: 'v', checks: [{ kind: 'command-exit', command: 'node "{{tool}}"' }] }, { vars: { tool: 'does-not-exist.mjs' } });
  assert.equal(r.outcome, 'fail');
  const d = tmp();
  const tool = write(d, 'ok.mjs', 'process.exit(0)');
  assert.equal(runCase({ id: 'v2', checks: [{ kind: 'command-exit', command: 'node "{{tool}}"' }] }, { vars: { tool } }).outcome, 'pass');
});

test('file-level vars are defaults and --var overrides them', () => {
  const d = tmp();
  write(d, 'ok.mjs', 'process.exit(0)');
  const f = write(d, 'c/cases.yaml', [
    'skill: c',
    'vars:',
    "  tool: '{{repo}}/no-such-validator.mjs'",
    'cases:',
    '  - id: a',
    `    checks: [ { kind: command-exit, command: 'node "{{tool}}"' } ]`,
  ].join('\n'));
  assert.equal(runSkill(f).cases[0].outcome, 'fail');
  assert.equal(runSkill(f, { vars: { tool: path.join(d, 'ok.mjs') } }).cases[0].outcome, 'pass');
});

// ---- rubric + case outcomes ----

test('rubric criteria are scored individually; unscored is null', () => {
  const r = scoreRubric({ criteria: [{ name: 'a' }, { name: 'b' }] }, { a: { pass: true, reason: 'ok' } });
  assert.deepEqual(r, [{ name: 'a', pass: true, reason: 'ok' }, { name: 'b', pass: null, reason: 'not scored' }]);
});

test('runCase outcomes: pass, fail, pending, and sandbox cleanup', () => {
  const pass = runCase({ id: 'p', setup: { files: { 'mk.js': "require('fs').writeFileSync('out.txt','hi')" } }, input: { run: 'node mk.js' }, checks: [{ kind: 'file-exists', path: 'out.txt' }] });
  assert.equal(pass.outcome, 'pass');
  assert.equal(pass.sandbox, undefined);
  const fail = runCase({ id: 'f', checks: [{ kind: 'file-exists', path: 'out.txt' }] });
  assert.equal(fail.outcome, 'fail');
  const pend = runCase({ id: 'r', checks: [{ kind: 'rubric', criteria: [{ name: 'c' }] }] });
  assert.equal(pend.outcome, 'pending');
  const prompt = runCase({ id: 'q', input: { prompt: 'do it' }, checks: [{ kind: 'file-exists', path: 'x' }] });
  assert.equal(prompt.outcome, 'pending');
  const scored = runCase({ id: 's', checks: [{ kind: 'rubric', criteria: [{ name: 'c' }] }] }, { scores: { s: { c: { pass: false, reason: 'no diagram' } } } });
  assert.equal(scored.outcome, 'fail');
  assert.equal(scored.rubric[0].reason, 'no diagram');
  const kept = runCase({ id: 'k', checks: [{ kind: 'file-exists', path: '.' }] }, { keep: true });
  assert.ok(fs.existsSync(kept.sandbox));
});

// ---- 3.3 run records ----

test('runSkill + writeRun produce a record in the documented format', () => {
  const d = tmp();
  const f = write(d, 'demo/cases.yaml', [
    'skill: demo',
    'cases:',
    '  - id: ok',
    '    setup: { files: { a.txt: hi } }',
    '    checks: [ { kind: content-match, path: a.txt, pattern: hi } ]',
    '  - id: judged',
    '    checks: [ { kind: rubric, criteria: [ { name: clear } ] } ]',
  ].join('\n'));
  const run = runSkill(f, { setup: 'openspec', interventions: 2, scores: { judged: { clear: { pass: true, reason: 'fine' } } }, now: new Date('2026-10-01T10:00:00Z') });
  const file = writeRun(run, { evalsDir: d });
  assert.equal(path.basename(file), '2026-10-01-openspec.json');
  assert.equal(path.basename(writeRun(run, { evalsDir: d })), '2026-10-01-openspec-2.json');
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const k of ['skill', 'date', 'setup', 'interventions', 'duration_ms', 'summary', 'cases']) assert.ok(k in rec, k);
  assert.deepEqual(rec.summary, { pass: 2, fail: 0, pending: 0 });
  assert.equal(rec.interventions, 2);
  assert.equal('session_minutes' in rec, false);
  assert.equal(runSkill(f, { sessionMinutes: 7.5 }).session_minutes, 7.5);
  assert.deepEqual(rec.cases[1].rubric, [{ name: 'clear', pass: true, reason: 'fine' }]);
  assert.equal(typeof rec.cases[0].duration_ms, 'number');
});

// ---- 3.4 missing evals ----

test('findMissingEvals names skills without cases.yaml', () => {
  const d = tmp();
  fs.mkdirSync(path.join(d, 'skills/ping'), { recursive: true });
  fs.mkdirSync(path.join(d, 'skills/start'), { recursive: true });
  write(d, 'evals/start/cases.yaml', 'skill: start\n');
  assert.deepEqual(findMissingEvals({ skillsDir: path.join(d, 'skills'), evalsDir: path.join(d, 'evals') }), ['ping']);
});

// ---- 3.5 comparison ----

test('compareRuns shows per-case outcomes, time and interventions for both setups', () => {
  const read = f => JSON.parse(fs.readFileSync(path.join(here, 'fixtures', f), 'utf8'));
  const cmp = compareRuns(read('run-a.json'), read('run-b.json'));
  assert.deepEqual(cmp.rows.find(r => r.id === 'phase-conflict'), { id: 'phase-conflict', a: 'fail', b: 'pass', a_ms: 130, b_ms: 95 });
  assert.equal(cmp.rows.find(r => r.id === 'artifact-quality').a, '-');
  const text = formatComparison(cmp);
  assert.match(text, /openspec\s+superspec/);
  assert.match(text, /interventions\s+3\s+1/);
  assert.match(text, /eval run \(s\)\s+5400\.0\s+4200\.0/);
  assert.match(text, /session \(min\)\s+-\s+-/);
});
