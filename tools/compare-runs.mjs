#!/usr/bin/env node
// Compare two eval run records side by side. Usage: node tools/compare-runs.mjs <runA.json> <runB.json>
import fs from 'node:fs';
import { compareRuns, formatComparison } from './evals/lib.mjs';

const [fa, fb] = process.argv.slice(2);
if (!fa || !fb) {
  console.error('usage: node tools/compare-runs.mjs <runA.json> <runB.json>');
  process.exit(2);
}
const read = f => JSON.parse(fs.readFileSync(f, 'utf8'));
console.log(formatComparison(compareRuns(read(fa), read(fb))));
