import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runSteps } from './smoke.mjs';

// kit-cross-platform 4.1: the runner stops at the first failed step and says what it expected and got
test('runSteps: prints ok per step, stops at the first failure with command, expected and output', () => {
  const lines = [];
  let ranThird = false;
  const r = runSteps([
    { name: 'one', run: () => ({ status: 0, out: 'created x' }), expect: { line: /created/ } },
    { name: 'two', cmd: 'node two.mjs', run: () => ({ status: 0, out: 'something else' }), expect: { line: /created/ } },
    { name: 'three', run: () => { ranThird = true; return { status: 0, out: '' }; } },
  ], { log: l => lines.push(l) });
  assert.equal(r.ok, false);
  assert.equal(r.passed, 1);
  assert.equal(r.failed.name, 'two');
  assert.ok(!ranThird, 'stops at the first failure');
  const text = lines.join('\n');
  assert.match(text, /^ok   one$/m);
  assert.match(text, /^FAIL two$/m);
  assert.match(text, /command:  node two\.mjs/);
  assert.match(text, /expected: a line matching \/created\//);
  assert.match(text, /something else/);
});

test('runSteps: exit code, forbidden line, missing file and a throwing step all fail', () => {
  const quiet = { log: () => {} };
  assert.match(runSteps([{ name: 'a', run: () => ({ status: 1, out: '' }) }], quiet).failed.expected, /exit 0, got 1/);
  assert.match(runSteps([{ name: 'b', run: () => ({ status: 0, out: 'ERROR x' }), expect: { noLine: /ERROR/ } }], quiet).failed.expected, /no line matching/);
  assert.match(runSteps([{ name: 'c', run: () => ({ status: 0, out: '' }), expect: { file: 'nope.txt' } }], quiet).failed.expected, /file nope\.txt/);
  assert.match(runSteps([{ name: 'd', run: () => { throw new Error('boom'); } }], quiet).failed.actual, /boom/);
  assert.equal(runSteps([{ name: 'e', run: () => ({ status: 0, out: '' }) }], quiet).ok, true);
});
