// Eval engine for kit skills (design D8). Dev-only: may use npm deps.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CHECK_KINDS = ['file-exists', 'command-exit', 'git-ignored', 'content-match', 'rubric'];

// ---------- loading ----------

export function loadCases(file) {
  const doc = YAML.parse(fs.readFileSync(file, 'utf8')) ?? {};
  const errors = [];
  if (!doc.skill) errors.push(`${file}: missing "skill"`);
  if (!Array.isArray(doc.cases) || doc.cases.length === 0) errors.push(`${file}: "cases" must be a non-empty list`);
  const ids = new Set();
  for (const [i, c] of (doc.cases ?? []).entries()) {
    const where = `${file}: case ${c?.id ?? `#${i + 1}`}`;
    if (!c?.id) errors.push(`${where}: missing "id"`);
    else if (ids.has(c.id)) errors.push(`${where}: duplicate id`);
    else ids.add(c.id);
    if (!Array.isArray(c?.checks) || c.checks.length === 0) errors.push(`${where}: "checks" must be a non-empty list`);
    for (const ch of c?.checks ?? []) {
      if (!CHECK_KINDS.includes(ch?.kind)) errors.push(`${where}: unknown check kind "${ch?.kind}" (allowed: ${CHECK_KINDS.join(', ')})`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return doc;
}

// Every skill folder needs evals/<skill>/cases.yaml (spec: skill-evals).
export function findMissingEvals({ skillsDir = path.join(REPO, 'plugins/kit/skills'), evalsDir = path.join(REPO, 'evals') } = {}) {
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .filter(name => !fs.existsSync(path.join(evalsDir, name, 'cases.yaml')));
}

// ---------- sandbox ----------

export function expand(str, vars) {
  return String(str).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function makeSandbox(setup = {}, { repo = REPO } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-eval-'));
  if (setup.git_init) {
    const r = spawnSync('git', ['init', '-q'], { cwd: dir, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`git init failed in sandbox: ${r.stderr || r.error}`);
  }
  for (const rel of setup.copy ?? []) {
    fs.cpSync(path.join(repo, rel), path.join(dir, rel), { recursive: true });
  }
  for (const [rel, content] of Object.entries(setup.files ?? {})) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, String(content));
  }
  return dir;
}

function sh(command, cwd) {
  const r = spawnSync(command, { cwd, shell: true, encoding: 'utf8' });
  return { status: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? String(r.error ?? '') };
}

// ---------- checks ----------

// Returns { kind, pass, detail } for deterministic checks.
export function runCheck(check, cwd, vars = {}) {
  const v = { ...vars, sandbox: cwd };
  switch (check.kind) {
    case 'file-exists': {
      const p = expand(check.path, v);
      const ok = fs.existsSync(path.resolve(cwd, p));
      return { kind: check.kind, pass: ok, detail: `${p} ${ok ? 'exists' : 'missing'}` };
    }
    case 'command-exit': {
      const cmd = expand(check.command, v);
      const r = sh(cmd, cwd);
      const expect = check.expect ?? 0;
      let ok = r.status === expect;
      let detail = `exit ${r.status} (expected ${expect})`;
      if (ok && check.stdout_match) {
        ok = new RegExp(check.stdout_match, 'm').test(r.stdout);
        if (!ok) detail += `; stdout did not match /${check.stdout_match}/`;
      }
      if (!ok && r.stderr.trim()) detail += `; stderr: ${r.stderr.trim().split('\n')[0]}`;
      return { kind: check.kind, pass: ok, detail };
    }
    case 'git-ignored': {
      const p = expand(check.path, v);
      const r = spawnSync('git', ['check-ignore', '-q', '--no-index', p], { cwd, encoding: 'utf8' });
      const ok = r.status === 0;
      return { kind: check.kind, pass: ok, detail: `${p} ${ok ? 'is ignored' : 'is NOT ignored'}` };
    }
    case 'content-match': {
      const p = expand(check.path, v);
      const file = path.resolve(cwd, p);
      if (!fs.existsSync(file)) return { kind: check.kind, pass: false, detail: `${p} missing` };
      const hit = new RegExp(check.pattern, 'm').test(fs.readFileSync(file, 'utf8'));
      const ok = check.negate ? !hit : hit;
      return { kind: check.kind, pass: ok, detail: `${p} ${hit ? 'matches' : 'does not match'} /${check.pattern}/` };
    }
    default:
      return { kind: check.kind, pass: false, detail: `not a deterministic check: ${check.kind}` };
  }
}

// Rubric criteria get their pass/fail from a scores map: { [criterion]: { pass, reason } }.
export function scoreRubric(check, caseScores = {}) {
  return (check.criteria ?? []).map(c => {
    const s = caseScores[c.name];
    if (!s || typeof s.pass !== 'boolean') return { name: c.name, pass: null, reason: 'not scored' };
    return { name: c.name, pass: s.pass, reason: s.reason ?? '' };
  });
}

// ---------- cases & runs ----------

export function runCase(c, { scores = {}, keep = false, repo = REPO, vars: extra = {} } = {}) {
  const started = Date.now();
  const vars = { kit: path.join(repo, 'plugins', 'kit'), repo, ...extra };
  const result = { id: c.id, outcome: 'pass', duration_ms: 0, checks: [], rubric: [] };
  let dir;
  try {
    dir = makeSandbox(c.setup, { repo });
    let pending = false;
    if (c.input?.run) {
      const r = sh(expand(c.input.run, { ...vars, sandbox: dir }), dir);
      result.input = { status: r.status };
    } else if (c.input?.prompt) {
      pending = true; // Claude-in-the-loop engine not wired yet (design D8 open question)
      result.input = { note: 'prompt input needs an engine; not executed' };
    }
    for (const check of c.checks) {
      if (check.kind === 'rubric') {
        const crit = scoreRubric(check, scores[c.id]);
        result.rubric.push(...crit);
      } else if (!pending) {
        result.checks.push(runCheck(check, dir, vars));
      }
    }
    const failed = result.checks.some(x => !x.pass) || result.rubric.some(x => x.pass === false);
    const unscored = pending || result.rubric.some(x => x.pass === null);
    result.outcome = failed ? 'fail' : unscored ? 'pending' : 'pass';
  } catch (err) {
    result.outcome = 'fail';
    result.error = String(err.message ?? err);
  } finally {
    if (dir && !keep) fs.rmSync(dir, { recursive: true, force: true });
    else if (dir) result.sandbox = dir;
    result.duration_ms = Date.now() - started;
  }
  return result;
}

export function runSkill(caseFile, { setup = 'default', interventions = 0, scores = {}, keep = false, repo = REPO, vars = {}, sessionMinutes = null, now = new Date() } = {}) {
  const doc = loadCases(caseFile);
  const started = Date.now();
  // File-level `vars` are defaults (they may use {{repo}}/{{kit}}); run-level --var values win.
  const base = { kit: path.join(repo, 'plugins', 'kit'), repo };
  const defaults = Object.fromEntries(Object.entries(doc.vars ?? {}).map(([k, v]) => [k, expand(v, base)]));
  const cases = doc.cases.map(c => runCase(c, { scores, keep, repo, vars: { ...defaults, ...vars } }));
  const summary = { pass: 0, fail: 0, pending: 0 };
  for (const c of cases) summary[c.outcome]++;
  return {
    skill: doc.skill,
    date: now.toISOString(),
    setup,
    ...(Object.keys(vars).length ? { vars } : {}),
    interventions,
    ...(sessionMinutes != null ? { session_minutes: sessionMinutes } : {}),
    duration_ms: Date.now() - started,
    summary,
    cases,
  };
}

export function writeRun(run, { evalsDir = path.join(REPO, 'evals') } = {}) {
  const dir = path.join(evalsDir, run.skill, 'runs');
  fs.mkdirSync(dir, { recursive: true });
  const base = `${run.date.slice(0, 10)}-${run.setup.replace(/[^\w.-]/g, '_')}`;
  let file = path.join(dir, `${base}.json`);
  for (let n = 2; fs.existsSync(file); n++) file = path.join(dir, `${base}-${n}.json`);
  fs.writeFileSync(file, JSON.stringify(run, null, 2) + '\n');
  return file;
}

// ---------- comparison ----------

export function compareRuns(a, b) {
  const ids = [...new Set([...a.cases.map(c => c.id), ...b.cases.map(c => c.id)])];
  const pick = (run, id) => run.cases.find(c => c.id === id);
  const rows = ids.map(id => {
    const ca = pick(a, id), cb = pick(b, id);
    return { id, a: ca?.outcome ?? '-', b: cb?.outcome ?? '-', a_ms: ca?.duration_ms ?? null, b_ms: cb?.duration_ms ?? null };
  });
  return {
    a: { setup: a.setup, date: a.date, duration_ms: a.duration_ms, session_minutes: a.session_minutes ?? null, interventions: a.interventions, summary: a.summary },
    b: { setup: b.setup, date: b.date, duration_ms: b.duration_ms, session_minutes: b.session_minutes ?? null, interventions: b.interventions, summary: b.summary },
    rows,
  };
}

export function formatComparison(cmp) {
  const w = Math.max('pass/fail/pending'.length, ...cmp.rows.map(r => r.id.length));
  const col = (s, n) => String(s).padEnd(n);
  const la = cmp.a.setup, lb = cmp.b.setup;
  const cw = Math.max(10, la.length, lb.length);
  const lines = [
    `${col('case', w)}  ${col(la, cw)}  ${col(lb, cw)}`,
    `${'-'.repeat(w)}  ${'-'.repeat(cw)}  ${'-'.repeat(cw)}`,
    ...cmp.rows.map(r => `${col(r.id, w)}  ${col(r.a, cw)}  ${col(r.b, cw)}${r.a !== r.b ? '  <' : ''}`),
    `${'-'.repeat(w)}  ${'-'.repeat(cw)}  ${'-'.repeat(cw)}`,
    `${col('pass/fail/pending', w)}  ${col(`${cmp.a.summary.pass}/${cmp.a.summary.fail}/${cmp.a.summary.pending}`, cw)}  ${col(`${cmp.b.summary.pass}/${cmp.b.summary.fail}/${cmp.b.summary.pending}`, cw)}`,
    `${col('session (min)', w)}  ${col(cmp.a.session_minutes ?? '-', cw)}  ${col(cmp.b.session_minutes ?? '-', cw)}`,
    `${col('eval run (s)', w)}  ${col((cmp.a.duration_ms / 1000).toFixed(1), cw)}  ${col((cmp.b.duration_ms / 1000).toFixed(1), cw)}`,
    `${col('interventions', w)}  ${col(cmp.a.interventions, cw)}  ${col(cmp.b.interventions, cw)}`,
  ];
  return lines.join('\n');
}
