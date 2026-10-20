// flexible-handoffs (spec: skill-evals "Journey test sheet"): the hand-run sheet keeps its shape.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sheet = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'test-sheet.md'), 'utf8');

test('skill-evals: Handoff rows', () => {
  const order = ['## 1. Idea → explore', '## 2. Explore → PRD', '## 3. PRD → propose', '## 4. Later handoffs'].map(h => sheet.indexOf(h));
  assert.ok(order.every((i, n) => i > 0 && (n === 0 || i > order[n - 1])), 'handoffs in journey order');
  for (const t of sheet.split('\n').filter(l => l.startsWith('| You type') || l.startsWith('| Step'))) {
    assert.match(t, /Good looks like \| What went wrong \|$/);
  }
});

test('skill-evals: How to run it', () => {
  assert.match(sheet, /fresh copy\*\* of a real project \(call it Acme\)/);
  assert.match(sheet, /once before a release/);
  assert.match(sheet, /Nothing about the real project goes into this repo/);
});
