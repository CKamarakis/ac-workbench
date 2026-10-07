import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gate } from '../../plugins/kit/hooks/archive-gate.mjs';
import { hint } from '../../plugins/kit/hooks/library-hint.mjs';
import { runVerify, addFinding, addOverride } from '../../plugins/kit/scripts/verify.mjs';

const hooks = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'plugins', 'kit', 'hooks');
const w = (d, rel, t) => { fs.mkdirSync(path.dirname(path.join(d, rel)), { recursive: true }); fs.writeFileSync(path.join(d, rel), t); };
function kitProject(kit = true) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-hooks-'));
  if (kit) w(d, '.claude/kit.json', '{"project_type":"none"}');
  w(d, 'openspec/changes/add-x/proposal.md', '# P\n');
  w(d, 'package.json', '{"scripts":{}}');
  return d;
}
const reg = { project_types: { none: { tests: [{ script: 'test', required: false }], missing_required: 'advisory', advisory: [] } } };
const bash = command => ({ tool_name: 'Bash', tool_input: { command } });

// 3.1 archive gate
test('archive without verify is blocked with the fix', () => {
  const d = kitProject();
  assert.match(gate(bash('openspec archive add-x --yes'), d), /has no verify report\. Run \/kit:verify first/);
  assert.match(gate(bash('"$(npm prefix -g)/openspec" archive --yes add-x'), d), /Run \/kit:verify first/);
});

test('archive after pass or override is allowed; fail is blocked with the items', () => {
  const d = kitProject();
  runVerify({ dir: d, change: 'add-x', registry: reg, run: () => ({ status: 0, out: '' }) });
  assert.equal(gate(bash('openspec archive add-x'), d), null);
  addFinding({ dir: d, change: 'add-x', source: 'security', severity: 'high', text: 'x' });
  assert.match(gate(bash('openspec archive add-x'), d), /verify failed for "add-x" \(security review \(high\)\)/);
  addOverride({ dir: d, change: 'add-x', item: 'S1', reason: 'accepted risk' });
  assert.equal(gate(bash('openspec archive add-x'), d), null);
});

test('gate does nothing outside kit projects or for other commands', () => {
  assert.equal(gate(bash('openspec archive add-x'), kitProject(false)), null);
  const d = kitProject();
  assert.equal(gate(bash('openspec status --change add-x'), d), null);
  assert.equal(gate(bash('openspec archive'), d), null);
  assert.equal(gate({ tool_name: 'Edit', tool_input: { command: 'openspec archive add-x' } }, d), null);
  assert.equal(gate(bash('openspec archive unknown-change'), d), null);
});

test('gate script end to end: deny JSON on stdout', () => {
  const d = kitProject();
  const r = spawnSync(process.execPath, [path.join(hooks, 'archive-gate.mjs')], { input: JSON.stringify(bash('openspec archive add-x')), env: { ...process.env, CLAUDE_PROJECT_DIR: d }, encoding: 'utf8' });
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /\/kit:verify/);
});

// 3.2 library hint
const failed = (command, stderr, exit_code = 1) => ({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command }, tool_response: { stdout: '', stderr, exit_code } });

test('library API mismatch names the package', () => {
  const d = kitProject();
  assert.match(hint(failed('npm run build', "Attempted import error: 'revalidateTag' is not exported from 'next/cache'."), d), /from "next"[\s\S]*npx -y ctx7@latest library next/);
  assert.match(hint(failed('npx tsc --noEmit', `src/a.ts(1,10): error TS2305: Module '"drizzle-orm/pg-core"' has no exported member 'pgTabel'.`), d), /"drizzle-orm"/);
  assert.match(hint(failed('npm test', "Error: Cannot find module '@scope/pkg/sub'"), d), /"@scope\/pkg"/);
  assert.match(hint(failed('npm test', 'TypeError: x.foo is not a function\n    at f (C:\\p\\node_modules\\zod\\lib\\index.js:1:1)'), d), /"zod"/);
});

test('no hint for own bugs, success, relative modules, non-build commands, or outside kit projects', () => {
  const d = kitProject();
  assert.equal(hint(failed('npm test', 'AssertionError: expected 2 to equal 3'), d), null);
  assert.equal(hint(failed('npm run build', "is not exported from 'next/cache'", 0), d), null);
  assert.equal(hint(failed('npm test', "Cannot find module './util'"), d), null);
  assert.equal(hint(failed('git status', "is not exported from 'next/cache'"), d), null);
  assert.equal(hint(failed('npm run build', "is not exported from 'next/cache'"), kitProject(false)), null);
});

test('hint script end to end: additionalContext on stdout', () => {
  const d = kitProject();
  const r = spawnSync(process.execPath, [path.join(hooks, 'library-hint.mjs')], { input: JSON.stringify(failed('npm run build', "'x' is not exported from 'next/cache'")), env: { ...process.env, CLAUDE_PROJECT_DIR: d }, encoding: 'utf8' });
  const out = JSON.parse(r.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.match(out.hookSpecificOutput.additionalContext, /ctx7/);
});

test('failed command as PostToolUseFailure (real event shape, seen live): hint from the error string', () => {
  const d = kitProject();
  const ev = { hook_event_name: 'PostToolUseFailure', tool_name: 'Bash', tool_input: { command: 'npm run build' }, error: "Exit code 1\n\n> build\n\nAttempted import error: 'revalidateTagz' is not exported from 'next/cache'." };
  assert.match(hint(ev, d), /"next"/);
  const r = spawnSync(process.execPath, [path.join(hooks, 'library-hint.mjs')], { input: JSON.stringify(ev), env: { ...process.env, CLAUDE_PROJECT_DIR: d }, encoding: 'utf8' });
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.hookEventName, 'PostToolUseFailure');
  assert.equal(hint({ ...ev, error: 'Exit code 1\n\nAssertionError: expected 1 to be 2' }, d), null);
});
