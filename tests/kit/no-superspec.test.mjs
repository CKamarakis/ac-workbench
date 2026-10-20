// Guard: SuperSpec and /kit:judge stay gone from the live kit (build-safeguards design D10).
// History is kept as it is and not scanned: the OpenSpec archive, evals/trials, evals/registry/runs, knowledge/.
// The main specs under openspec/specs change at archive, through this change's delta specs, so they aren't scanned here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ROOTS = ['plugins', 'docs', 'tools', 'tests', 'evals', 'README.md', '.gitignore'];
// Eval run records and trials are history; eval cases are live.
const HISTORY = rel => /^evals\/(trials|registry\/runs)\/|^evals\/[^/]+\/runs\//.test(rel);
const WORDS = /superspec|kit:judge/i;
// Allowed: this file; the validator's provenance comment; the routing test's negative check; a past decision record.
const SKIP = new Set(['tests/kit/no-superspec.test.mjs']);
const ALLOWED_LINE = [
  ['tools/validate-registry.mjs', /^\/\/ Ported from A\/B trial build B/],
  ['tests/kit/lanes.test.mjs', /doesNotMatch/],
  ['docs/project-context.md', /A\/B trial of the registry and validator/], // a past decision (D11), kept as written
];

function files(rel) {
  const abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) return [];
  if (fs.statSync(abs).isFile()) return [rel];
  return fs.readdirSync(abs, { withFileTypes: true })
    .filter(e => e.name !== 'node_modules' && !e.name.startsWith('.git'))
    .flatMap(e => files(path.posix.join(rel, e.name)));
}

/** The generated registry without verdict history and without dropped entries: what the kit acts on. */
function liveRegistry(text) {
  const reg = JSON.parse(text);
  const tools = (reg.tools ?? []).filter(t => t.status !== 'dropped').map(({ verdicts, ...t }) => t);
  return JSON.stringify({ ...reg, tools }, null, 1);
}

export function hits() {
  const out = [];
  for (const rel of ROOTS.flatMap(files)) {
    if (SKIP.has(rel) || HISTORY(rel) || !/\.(m?js|json|md|ya?ml|txt)$|^\.gitignore$/.test(path.posix.basename(rel)) && rel !== '.gitignore') continue;
    let text = fs.readFileSync(path.join(repo, rel), 'utf8');
    if (rel === 'plugins/kit/data/toolkit.json') text = liveRegistry(text);
    text.split(/\r?\n/).forEach((line, i) => {
      if (!WORDS.test(line)) return;
      if (ALLOWED_LINE.some(([f, re]) => f === rel && re.test(line))) return;
      out.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return out;
}

test('build-safeguards 1.5: no SuperSpec or /kit:judge in the live kit', () => {
  assert.deepEqual(hits(), []);
});
