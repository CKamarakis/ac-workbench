// End-to-end smoke test of the kit without AI (kit-cross-platform design D5-D8; spec: kit-self-test).
// Runs the kit's scripts and hook in workflow order in a throwaway project, with the real OpenSpec CLI.
// Usage: npm run smoke   (on request only; never part of npm test)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { locate } from '../plugins/kit/scripts/locate.mjs';
import { testRoot } from './test-root.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KIT = path.join(REPO, 'plugins', 'kit');
const FIXTURES = path.join(REPO, 'tools', 'smoke', 'fixtures');
/** The OpenSpec version the kit was last tested with: the registry's reviewed_version (kit-followups D10). */
export const testedVersion = registry => (registry?.tools ?? []).find(t => t.name === 'openspec')?.reviewed_version ?? null;
export const versionLine = (installed, tested) => `OpenSpec ${installed || '(version unknown)'}${installed && installed === tested ? '' : tested ? ` (kit tested with ${tested})` : ''}`;
export const RECORD = path.join(REPO, '.smoke-pass.json');
const CHANGE = 'smoke-change';

/**
 * Run steps in order; stop at the first failure.
 * A step: { name, run: () => ({ status, out }), expect: { code = 0, line?: RegExp, file?: string, noLine?: RegExp } }.
 * `file` is checked relative to `cwd`. Returns { ok, passed, failed: { name, cmd, expected, actual } | null }.
 */
export function runSteps(steps, { cwd = process.cwd(), log = console.log } = {}) {
  let passed = 0;
  for (const s of steps) {
    let r;
    try { r = s.run(); } catch (e) { r = { status: -1, out: String(e?.stack ?? e) }; }
    const exp = { code: 0, ...s.expect };
    const problems = [];
    if (r.status !== exp.code) problems.push(`exit ${exp.code}, got ${r.status}`);
    if (exp.line && !exp.line.test(r.out ?? '')) problems.push(`a line matching ${exp.line}`);
    if (exp.noLine && exp.noLine.test(r.out ?? '')) problems.push(`no line matching ${exp.noLine}`);
    if (exp.file && !fs.existsSync(path.join(cwd, exp.file))) problems.push(`file ${exp.file}`);
    if (problems.length) {
      const failed = { name: s.name, cmd: s.cmd ?? '(in-process step)', expected: problems.join('; '), actual: String(r.out ?? '').trim() };
      log(`FAIL ${s.name}`);
      log(`  command:  ${failed.cmd}`);
      log(`  expected: ${failed.expected}`);
      log(`  output:\n${failed.actual.split(/\r?\n/).map(l => '    ' + l).join('\n')}`);
      return { ok: false, passed, failed };
    }
    log(`ok   ${s.name}`);
    passed++;
  }
  return { ok: true, passed, failed: null };
}

const out = r => (r.stdout ?? '') + (r.stderr ?? '') + (r.error ? String(r.error) : '');

function main() {
  const os_ = locate('openspec');
  if (!os_) {
    console.log('OpenSpec is needed for the smoke test and was not found. Install it: npm install -g @fission-ai/openspec');
    process.exit(2);
  }
  const openspecCmd = args => `"${os_.path}" ${args.join(' ')}`;

  const work = fs.mkdtempSync(path.join(testRoot(), 'kit-smoke-'));
  const home = path.join(work, 'home');
  const proj = path.join(work, 'project');
  fs.mkdirSync(path.join(home, '.config'), { recursive: true });
  fs.mkdirSync(proj);
  // Isolation (design D6): home folders point into the throwaway folder so nothing writes the user's config.
  // APPDATA stays: on Windows the npm global folder (where openspec lives) is under it, and OpenSpec keeps its
  // config in XDG_CONFIG_HOME when set (evals/trials/kit-cross-platform.md, 1.1).
  const env = {
    ...process.env, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, '.config'),
    OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1',
  };

  const version = (spawnSync(openspecCmd(['--version']), { shell: true, encoding: 'utf8', env }).stdout ?? '').trim();
  console.log(versionLine(version, testedVersion(JSON.parse(fs.readFileSync(path.join(KIT, 'data', 'toolkit.json'), 'utf8')))));
  console.log(`project: ${proj}\n`);

  const node = (script, args, extra = {}) => ({
    cmd: `node ${script} ${args.join(' ')}`,
    run: () => { const r = spawnSync(process.execPath, [path.join(KIT, script), ...args], { cwd: proj, env: { ...env, ...extra.env }, encoding: 'utf8', input: extra.input, timeout: 300000 }); return { status: r.status, out: out(r) }; },
  });
  const openspec = args => ({
    cmd: `openspec ${args.join(' ')}`,
    run: () => { const r = spawnSync(openspecCmd(args), { cwd: proj, env, encoding: 'utf8', shell: true, timeout: 300000 }); return { status: r.status, out: out(r) }; },
  });
  const local = (cmd, fn) => ({ cmd, run: () => { fn(); return { status: 0, out: '' }; } });
  const gate = { tool_name: 'Bash', tool_input: { command: `openspec archive ${CHANGE} -y` }, cwd: proj };
  const hook = () => node('hooks/archive-gate.mjs', [], { input: JSON.stringify(gate), env: { CLAUDE_PROJECT_DIR: proj } });
  const change = path.join(proj, 'openspec', 'changes', CHANGE);
  const tasks = path.join(change, 'tasks.md');
  const d = ['--dir', '.'];
  const c = [...d, '--change', CHANGE];

  const steps = [
    { name: 'test project', ...local('write package.json', () => fs.writeFileSync(path.join(proj, 'package.json'), JSON.stringify({ name: 'smoke', private: true, scripts: { test: 'node -e 0' } }, null, 2))) },
    { name: 'start: plan', ...node('scripts/start-plan.mjs', [...d, '--type', 'none']), expect: { line: /change\(s\) to apply/ } },
    { name: 'start: kit per project', ...node('scripts/start-plan.mjs', [...d, '--type', 'none']), expect: { line: /claude plugin install kit@ac-workbench --scope project/ } },
    { name: 'start: apply', ...node('scripts/start-apply.mjs', [...d, '--type', 'none', '--accept', 'all', '--home', home]), expect: { line: /ran\s+openspec init/, noLine: /ERROR/, file: '.claude/kit.json' } },
    { name: 'start: files', ...local('check files', () => { for (const f of ['CLAUDE.md', 'knowledge/notes', 'openspec/config.yaml']) if (!fs.existsSync(path.join(proj, f))) throw new Error(`missing ${f}`); }) },
    { name: 'capture: note', ...node('scripts/knowledge.mjs', ['new-note', ...d, '--title', 'Sticky notes on a board', '--body', 'Users want sticky notes they can drag.', '--date', '2026-01-01']), expect: { line: /created notes\/2026-01-01-sticky-notes-on-a-board\.md/ } },
    { name: 'prd: new', ...node('scripts/knowledge.mjs', ['new-prd', ...d, '--title', 'Storms stickies', '--sources', 'notes/2026-01-01-sticky-notes-on-a-board.md']), expect: { line: /status Draft/, file: 'knowledge/prds/storms-stickies.md' } },
    { name: 'prd: ready', ...node('scripts/knowledge.mjs', ['set-field', ...d, '--file', 'prds/storms-stickies.md', '--key', 'status', '--value', 'Ready']), expect: { line: /Draft -> Ready/ } },
    { name: 'next: propose', ...node('scripts/next.mjs', d), expect: { line: /Next: \/opsx:propose/ } },
    { name: 'openspec: new change', ...openspec(['new', 'change', CHANGE]), expect: { file: `openspec/changes/${CHANGE}/.openspec.yaml` } },
    { name: 'openspec: artifacts', ...local('copy fixtures', () => { fs.cpSync(FIXTURES, change, { recursive: true }); fs.writeFileSync(tasks, fs.readFileSync(tasks, 'utf8').replace(/- \[x\]/g, '- [ ]')); }) },
    { name: 'openspec: validate', ...openspec(['validate', CHANGE, '--strict']), expect: { line: /is valid/ } },
    { name: 'judge', ...node('scripts/judge.mjs', ['--file', `openspec/changes/${CHANGE}/proposal.md`]), expect: { line: /Recommended flow:/ } },
    { name: 'next: ready', ...node('scripts/next.mjs', d), expect: { line: /Next: \/kit:ready/ } },
    { name: 'ready: scan', ...node('scripts/ready.mjs', ['scan', ...c]), expect: { line: /prd:\s+knowledge\/prds\/storms-stickies\.md/ } },
    { name: 'decisions: add', ...node('scripts/decisions.mjs', ['add', ...c, '--kind', 'gap', '--text', 'What if the board is empty?', '--from', 'openspec/changes/smoke-change/specs/board/spec.md', '--options', 'Show a hint|Later', '--recommended', 'Show a hint']), expect: { line: /added D1/ } },
    { name: 'decisions: later', ...node('scripts/decisions.mjs', ['later', ...c, '--id', 'D1']), expect: { line: /later D1/ } },
    { name: 'decisions: ready-done', ...node('scripts/decisions.mjs', ['ready-done', ...c]), expect: { line: /readiness recorded/ } },
    { name: 'next: apply', ...node('scripts/next.mjs', d), expect: { line: /Next: \/opsx:apply/ } },
    { name: 'docs: page with an open decision', ...local('mkdir knowledge/docs', () => fs.mkdirSync(path.join(proj, 'knowledge', 'docs'), { recursive: true })) },
    { name: 'docs: build (active change)', ...node('scripts/docs.mjs', ['build', ...d]), expect: { line: /1 undecided/, file: 'knowledge/docs/index.html' } },
    { name: 'build: tasks done', ...local('tick tasks', () => fs.writeFileSync(tasks, fs.readFileSync(tasks, 'utf8').replace(/- \[ \]/g, '- [x]'))) },
    { name: 'next: verify', ...node('scripts/next.mjs', d), expect: { line: /Next: \/kit:verify/ } },
    { name: 'gate: denies before verify', ...hook(), expect: { line: /"permissionDecision":"deny"/ } },
    { name: 'verify: run', ...node('scripts/verify.mjs', ['run', ...c]), expect: { line: /PASS/, file: `openspec/changes/${CHANGE}/verify.md` } },
    { name: 'verify: security review', ...node('scripts/verify.mjs', ['reviewed', ...c, '--source', 'security', '--how', 'skipped', '--note', 'smoke test']), expect: { line: /security: skipped/ } },
    { name: 'verify: code review', ...node('scripts/verify.mjs', ['reviewed', ...c, '--source', 'code', '--how', 'skipped', '--note', 'smoke test']), expect: { line: /code: skipped/ } },
    { name: 'verify: status', ...node('scripts/verify.mjs', ['status', ...c]), expect: { line: /smoke-change: pass/ } },
    { name: 'gate: allows after verify', ...hook(), expect: { line: /decision still open/, noLine: /"deny"/ } },
    { name: 'openspec: archive', ...openspec(['archive', CHANGE, '-y']), expect: { line: /archived as/, file: 'openspec/specs/storms/stickies/spec.md' } },
    { name: 'archive: flat spec', ...local('check flat spec', () => { if (!fs.existsSync(path.join(proj, 'openspec/specs/board/spec.md'))) throw new Error('missing openspec/specs/board/spec.md'); }) },
    { name: 'next: explore', ...node('scripts/next.mjs', d), expect: { line: /Next: \/opsx:explore/ } },
    { name: 'next: archived decision', ...node('scripts/next.mjs', d), expect: { line: /1 decision still open in archived changes \(smoke-change\)/ } },
    { name: 'docs: build', ...node('scripts/docs.mjs', ['build', ...d]), expect: { line: /2 specs, 2 requirements, .*1 undecided/ } },
    { name: 'decisions: decide after archive', ...node('scripts/decisions.mjs', ['decide', ...c, '--id', 'D1', '--answer', 'Show a hint']), expect: { line: /decided D1/ } },
    { name: 'docs: build (decided)', ...node('scripts/docs.mjs', ['build', ...d]), expect: { line: /0 undecided/ } },
    { name: 'docs: scan', ...node('scripts/docs.mjs', ['scan', ...d]), expect: { line: /page: up to date/ } },
    { name: 'harness: scan', ...node('scripts/harness.mjs', ['scan', ...d]), expect: { line: /routing block: current/ } },
  ];

  const r = runSteps(steps, { cwd: proj });
  if (!r.ok) {
    console.log(`\nsmoke test FAILED at step ${r.passed + 1} of ${steps.length}. Project kept for inspection: ${proj}`);
    process.exit(1);
  }
  fs.rmSync(work, { recursive: true, force: true });
  const commit = (spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).stdout ?? '').trim();
  fs.writeFileSync(RECORD, JSON.stringify({ commit, date: new Date().toISOString().slice(0, 10), platform: process.platform, openspec: version }, null, 2) + '\n');
  console.log(`\nsmoke test passed: ${steps.length} steps (${process.platform}, OpenSpec ${version}). Recorded in .smoke-pass.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
