// Ported from A/B trial build B (ab-superspec @ 08dd9c5, branch wt/registry-validator). See evals/trials/workflow-ab.md.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import YAML from 'yaml';
import { laneMap, formatLanes } from '../plugins/kit/scripts/lanes.mjs';

const USAGE = 'usage: node tools/validate-registry.mjs <registry.yaml> [--out <file.json>] [--check]';

const isMapping = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const STATUSES = ['trial', 'adopted', 'dropped', 'later'];
export const COSTS = ['free', 'free-tier', 'paid', 'uses-claude-quota'];
export const SCOPES = ['machine', 'project'];
export const RUBRIC_KEYS = ['problem_fit', 'overlap', 'context_cost', 'run_cost', 'trust', 'reversibility', 'license'];
export const REQUIRED_FIELDS = ['name', 'source', 'tier', 'reason', 'cost', 'status', 'rubric', 'reviewed_version', 'reviewed_on', 'verdicts'];
export const ACTIVE = ['adopted', 'trial'];

export const isMissing = (v) => v === undefined || v === null || v === '';

const validTier = (t) =>
  t === 'global' || t === 'project' || (typeof t === 'string' && t.startsWith('project-type:') && t.length > 'project-type:'.length);

function parseVersion(v) {
  const core = String(v).trim().replace(/^[vV]/, '').split(/[-+]/)[0];
  const parts = core.split('.');
  if (!parts.every((p) => /^\d+$/.test(p))) return null;
  return parts.map(Number);
}

export function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (pa === null && pb === null) return 0;
  if (pa === null) return -1;
  if (pb === null) return 1;
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

export function validate(doc) {
  const errors = [];
  const warnings = [];

  if (!isMapping(doc)) {
    errors.push('registry: root must be a mapping');
    return { errors, warnings };
  }
  if (!Array.isArray(doc.tools)) {
    errors.push('registry.tools: missing or not a list');
    return { errors, warnings };
  }
  if (doc.tools.length === 0) {
    errors.push('registry.tools: must contain at least one tool');
    return { errors, warnings };
  }

  const seen = new Set();
  doc.tools.forEach((entry, index) => {
    if (!isMapping(entry)) {
      errors.push(`tools[${index}]: entry must be a mapping`);
      return;
    }
    const id = typeof entry.name === 'string' && entry.name !== '' ? entry.name : `tools[${index}]`;

    for (const field of REQUIRED_FIELDS) {
      if (isMissing(entry[field])) errors.push(`${id}.${field}: missing required field`);
    }
    if (!isMissing(entry.name) && (typeof entry.name !== 'string' || entry.name.trim() === '')) {
      errors.push(`${id}.name: must be a non-empty string`);
    }

    if (!isMissing(entry.status) && !STATUSES.includes(entry.status)) {
      errors.push(`${id}.status: "${entry.status}" is not one of ${STATUSES.join(', ')}`);
    }
    if (!isMissing(entry.cost) && !COSTS.includes(entry.cost)) {
      errors.push(`${id}.cost: "${entry.cost}" is not one of ${COSTS.join(', ')}`);
    }
    if (!isMissing(entry.tier) && !validTier(entry.tier)) {
      errors.push(`${id}.tier: "${entry.tier}" is not one of global, project, project-type:<type>`);
    }

    if (!isMissing(entry.rubric)) {
      if (!isMapping(entry.rubric)) {
        errors.push(`${id}.rubric: must be a mapping`);
      } else {
        for (const key of RUBRIC_KEYS) {
          if (isMissing(entry.rubric[key])) errors.push(`${id}.rubric.${key}: missing required field`);
        }
      }
    }

    if (!isMissing(entry.verdicts)) {
      if (!Array.isArray(entry.verdicts) || entry.verdicts.length === 0) {
        errors.push(`${id}.verdicts: must be a non-empty list`);
      } else {
        let prevDate;
        entry.verdicts.forEach((v, i) => {
          const at = `${id}.verdicts[${i}]`;
          if (!isMapping(v)) {
            errors.push(`${at}: verdict must be a mapping`);
            return;
          }
          for (const field of ['date', 'status', 'rationale']) {
            if (isMissing(v[field])) errors.push(`${at}.${field}: missing required field`);
          }
          if (!isMissing(v.status) && !STATUSES.includes(v.status)) {
            errors.push(`${at}.status: "${v.status}" is not one of ${STATUSES.join(', ')}`);
          }
          if (!isMissing(v.date)) {
            if (prevDate !== undefined && !(String(prevDate) <= String(v.date))) {
              errors.push(`${at}.date: earlier than previous verdict`);
            }
            prevDate = v.date;
          }
        });
        const latest = entry.verdicts[entry.verdicts.length - 1];
        if (isMapping(latest) && STATUSES.includes(entry.status) && STATUSES.includes(latest.status) && entry.status !== latest.status) {
          errors.push(`${id}.status: "${entry.status}" does not match latest verdict status "${latest.status}"`);
        }
      }
    }

    if (ACTIVE.includes(entry.status)) {
      if (isMissing(entry.scope)) errors.push(`${id}.scope: missing required field`);
      else if (!SCOPES.includes(entry.scope)) {
        errors.push(`${id}.scope: "${entry.scope}" is not one of ${SCOPES.join(', ')}`);
      }
      if (isMissing(entry.check)) errors.push(`${id}.check: missing required field`);
      if (isMissing(entry.install)) errors.push(`${id}.install: missing required field`);
      else if (!isMapping(entry.install)) errors.push(`${id}.install: must be a mapping`);
      else if (isMissing(entry.install.win32)) errors.push(`${id}.install.win32: missing required field`);
    }

    if (!isMissing(entry.first_use) && typeof entry.first_use !== 'string') errors.push(`${id}.first_use: must be one line of text`);
    if (!isMissing(entry.install_why) && typeof entry.install_why !== 'string') errors.push(`${id}.install_why: must be one line of text`);
    if (!isMissing(entry.recommend) && !['yes', 'no'].includes(entry.recommend)) {
      errors.push(`${id}.recommend: "${entry.recommend}" is not one of yes, no`);
    }
    if (!isMissing(entry.recommend) && isMissing(entry.recommend_why)) {
      errors.push(`${id}.recommend_why: required when recommend is set`);
    }

    if (!isMissing(entry.installed_version) && !isMissing(entry.reviewed_version) && compareVersions(entry.installed_version, entry.reviewed_version) > 0) {
      warnings.push(`${id}: needs review (installed ${entry.installed_version}, reviewed ${entry.reviewed_version})`);
    }

    if (id === entry.name) {
      if (seen.has(id)) errors.push(`${id}.name: duplicate entry name`);
      seen.add(id);
    }
  });

  const asList = (v) => (Array.isArray(v) ? v : []);
  const active = doc.tools.filter(
    (t) => isMapping(t) && ACTIVE.includes(t.status) && typeof t.name === 'string' && t.name !== '' && Array.isArray(t.phases),
  );
  const resolved = (a, b) => asList(a.overlaps).includes(b.name) && asList(a.skip_skills).length > 0;
  const phases = [...new Set(active.flatMap((t) => t.phases))];
  for (const phase of phases) {
    const owners = active.filter((t) => t.phases.includes(phase));
    for (let i = 0; i < owners.length; i++) {
      for (let j = i + 1; j < owners.length; j++) {
        const a = owners[i];
        const b = owners[j];
        if (!resolved(a, b) && !resolved(b, a)) {
          errors.push(
            `registry.phases: phase "${phase}": ${a.name} and ${b.name} both own it with no overlap recorded (add overlaps + skip_skills on one of them)`,
          );
        }
      }
    }
  }

  // Test policy per project type (quality-gates; spec: toolkit-registry "Test policy per project type").
  if (doc.project_types !== undefined) {
    if (!isMapping(doc.project_types)) errors.push('registry.project_types: must be a mapping');
    else {
      const known = new Set(['none', ...doc.tools.map((t) => (isMapping(t) && typeof t.tier === 'string' && t.tier.startsWith('project-type:') ? t.tier.slice(13) : null)).filter(Boolean)]);
      for (const [type, pol] of Object.entries(doc.project_types)) {
        const at = `registry.project_types.${type}`;
        if (!known.has(type)) errors.push(`${at}: unknown project type "${type}" (no tool uses it and it isn't "none")`);
        if (!isMapping(pol) || !Array.isArray(pol.tests) || pol.tests.length === 0) { errors.push(`${at}.tests: needs at least one command`); continue; }
        pol.tests.forEach((c, i) => { if (!isMapping(c) || typeof c.script !== 'string' || !c.script) errors.push(`${at}.tests[${i}].script: missing`); });
        if (!['hard', 'advisory'].includes(pol.missing_required)) errors.push(`${at}.missing_required: must be hard or advisory`);
      }
    }
  }

  return { errors, warnings };
}

export function toJson(doc) {
  return JSON.stringify(doc, null, 2) + '\n';
}

export function main(argv) {
  let file;
  let out;
  let check = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') check = true;
    else if (arg === '--out') {
      out = argv[++i];
      if (out === undefined || out.startsWith('--')) return usage();
    } else if (arg.startsWith('--') || file !== undefined) return usage();
    else file = arg;
  }
  if (file === undefined || (check && out === undefined)) return usage();

  let doc;
  try {
    doc = YAML.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.log(`${file}: ${String(err.message).split('\n')[0]}`);
    return 1;
  }

  const { errors, warnings } = validate(doc);
  for (const line of errors) console.log(line);
  for (const line of warnings) console.log(line);
  if (errors.length > 0) return 1;

  if (out !== undefined) {
    const json = toJson(doc);
    try {
      if (check) {
        let existing = null;
        try {
          existing = fs.readFileSync(out, 'utf8').replace(/\r\n/g, '\n');
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
        }
        if (existing !== json) {
          console.log(`stale: ${out} does not match ${file}`);
          return 1;
        }
        console.log(`${out} is up to date`);
      } else {
        fs.writeFileSync(out, json);
      }
    } catch (err) {
      console.log(`${out}: ${String(err.message).split('\n')[0]}`);
      return 1;
    }
  }
  console.log(`Registry valid (${doc.tools.length} tools)`);
  console.log(formatLanes(laneMap(doc)));
  return 0;
}

function usage() {
  console.log(USAGE);
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}
