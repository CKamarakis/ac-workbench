#!/usr/bin/env node
// Run kit skill evals and write run records. See evals/README.md.
// Usage: node tools/run-evals.mjs [skill...] [--setup name] [--interventions N] [--scores file.yaml] [--var k=v]... [--session-minutes N] [--keep] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { REPO, findMissingEvals, runSkill, writeRun } from './evals/lib.mjs';

function parseArgs(argv) {
  const opts = { skills: [], setup: 'default', interventions: 0, scores: {}, vars: {}, keep: false, dry: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--setup') opts.setup = argv[++i];
    else if (a === '--interventions') opts.interventions = Number(argv[++i]);
    else if (a === '--scores') opts.scores = YAML.parse(fs.readFileSync(argv[++i], 'utf8')) ?? {};
    else if (a === '--var') {
      const [k, ...v] = String(argv[++i]).split('=');
      if (!/^\w+$/.test(k) || !v.length) throw new Error('--var expects name=value');
      opts.vars[k] = v.join('=');
    }
    else if (a === '--session-minutes') opts.sessionMinutes = Number(argv[++i]);
    else if (a === '--keep') opts.keep = true;
    else if (a === '--dry') opts.dry = true;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else opts.skills.push(a);
  }
  if (!Number.isInteger(opts.interventions) || opts.interventions < 0) throw new Error('--interventions must be a non-negative integer');
  return opts;
}

const opts = parseArgs(process.argv.slice(2));
const evalsDir = path.join(REPO, 'evals');
let failed = false;

const missing = findMissingEvals();
if (missing.length) {
  failed = true;
  for (const s of missing) console.error(`MISSING EVALS: skill "${s}" has no evals/${s}/cases.yaml`);
}

const skills = opts.skills.length
  ? opts.skills
  : fs.readdirSync(evalsDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && fs.existsSync(path.join(evalsDir, d.name, 'cases.yaml')))
      .map(d => d.name);

for (const skill of skills) {
  const file = path.join(evalsDir, skill, 'cases.yaml');
  if (!fs.existsSync(file)) { console.error(`no cases for "${skill}" (${path.relative(REPO, file)})`); failed = true; continue; }
  let run;
  try {
    run = runSkill(file, opts);
  } catch (err) {
    console.error(`INVALID CASES ${path.relative(REPO, file)}:\n${err.message}`);
    failed = true;
    continue;
  }
  console.log(`\n${skill}  [setup: ${run.setup}]  pass ${run.summary.pass}  fail ${run.summary.fail}  pending ${run.summary.pending}`);
  for (const c of run.cases) {
    console.log(`  ${c.outcome.toUpperCase().padEnd(7)} ${c.id}${c.error ? `  (${c.error})` : ''}`);
    for (const ch of c.checks.filter(x => !x.pass)) console.log(`          ✗ ${ch.kind}: ${ch.detail}`);
    for (const r of c.rubric.filter(x => x.pass !== true)) console.log(`          ${r.pass === false ? '✗' : '?'} rubric ${r.name}: ${r.reason}`);
  }
  if (run.summary.fail) failed = true;
  if (!opts.dry) console.log(`  -> ${path.relative(REPO, writeRun(run, { evalsDir })).replaceAll('\\', '/')}`);
}

process.exit(failed ? 1 : 0);
