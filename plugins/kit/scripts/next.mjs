// /kit:next: suggest the next step from the project's OpenSpec state and the lane map
// (design D6; spec: skill-routing "Next-step suggestion"). Owners and skills always come from the
// lane map, never from this file. Zero dependencies.
// Usage: node next.mjs [--dir <project>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { laneMap } from './lanes.mjs';
import { loadRegistry } from './setup.mjs';
import { locate, pathWith } from './locate.mjs';

const lane = (map, phase) => map.lanes.find(l => l.phase === phase) ?? { phase, owner: null, alternatives: [] };

function step(map, phase, reason, extra = {}) {
  const l = lane(map, phase);
  const use = l.owner ? (l.owner.skill ?? l.owner.name) : null;
  return {
    phase,
    owner: l.owner?.name ?? null,
    use: use ?? `no owner yet for "${phase}" - ask`,
    alternatives: l.alternatives.filter(a => a.skill).map(a => ({ tool: a.name, use: a.skill })),
    reason,
    ...extra,
  };
}

/**
 * Pure decision. Input:
 *   openspec: { root, changes: [{ name, completedTasks, totalTasks, lastModified, status }] } (openspec list --json)
 *   statusOf: name -> { artifacts: [{ id, status }], isPlanningComplete }               (openspec status --json)
 *   map: laneMap(registry)
 */
export function suggest({ openspec, statusOf, map }) {
  if (!openspec || openspec.root == null) {
    return { phase: 'setup', owner: 'kit', use: '/kit:start', alternatives: [], reason: 'No OpenSpec here yet: set the project up first.' };
  }
  const active = (openspec.changes ?? []).filter(c => c.status !== 'complete')
    .sort((a, b) => String(b.lastModified).localeCompare(String(a.lastModified)));
  if (!active.length) return step(map, 'brainstorm', 'No active change: explore the next idea before proposing it.');

  const change = active[0];
  const others = active.slice(1).map(c => c.name);
  const st = statusOf(change.name) ?? {};
  const arts = st.artifacts ?? [];
  const extra = { change: change.name, ...(others.length ? { otherActive: others } : {}) };
  const planningDone = st.isPlanningComplete ?? st.isComplete ?? (arts.length > 0 && arts.every(a => a.status === 'done' || a.status === 'skipped'));

  if (!planningDone) {
    const next = arts.find(a => a.status === 'ready');
    const done = arts.filter(a => a.status === 'done').length;
    // Nothing written yet -> the artifacts owner starts it; otherwise the plan owner continues it.
    const phase = done === 0 ? 'artifacts' : 'plan';
    return step(map, phase, `Change "${change.name}" is still being planned${next ? `: next artifact is "${next.id}"` : ''}.`, { ...extra, nextArtifact: next?.id ?? null });
  }
  const total = change.totalTasks ?? 0, completed = change.completedTasks ?? 0;
  if (total === 0 || completed < total) {
    return step(map, 'build', `Planning of "${change.name}" is complete; ${total - completed} of ${total} tasks are open.`, extra);
  }
  const verify = step(map, 'verify', `All ${total} tasks of "${change.name}" are done: verify, then close the change.`, extra);
  const close = lane(map, 'close');
  return { ...verify, then: close.owner ? (close.owner.skill ?? close.owner.name) : null };
}

export function format(s) {
  const lines = [`Next: ${s.use}`, `  why:   ${s.reason}`, `  phase: ${s.phase}${s.owner ? ` (owner: ${s.owner})` : ''}`];
  if (s.then) lines.push(`  then:  ${s.then}`);
  if (s.nextArtifact) lines.push(`  next artifact: ${s.nextArtifact}`);
  if (s.alternatives?.length) lines.push(`  big or risky change? alternative: ${s.alternatives.map(a => `${a.use} (${a.tool})`).join('; ')}`);
  if (s.otherActive?.length) lines.push(`  other active changes: ${s.otherActive.join(', ')}`);
  return lines.join('\n');
}

function openspecJson(args, cwd) {
  const os = locate('openspec');
  if (!os) return null;
  const r = spawnSync(`"${os.path}" ${args}`, { cwd, shell: true, encoding: 'utf8', env: { ...process.env, PATH: pathWith({ os }) }, timeout: 60000 });
  const out = r.stdout ?? '';
  const start = out.indexOf('{');
  try { return start >= 0 ? JSON.parse(out.slice(start)) : null; } catch { return null; }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const di = args.indexOf('--dir');
  const dir = path.resolve(di >= 0 ? args[di + 1] : process.cwd());
  const ri = args.indexOf('--registry');
  const registry = loadRegistry(ri >= 0 ? args[ri + 1] : undefined);
  const openspec = fs.existsSync(path.join(dir, 'openspec')) ? openspecJson('list --json', dir) : { root: null, changes: [] };
  const s = suggest({ openspec, statusOf: name => openspecJson(`status --change "${name}" --json`, dir), map: laneMap(registry) });
  console.log(args.includes('--json') ? JSON.stringify(s, null, 2) : format(s));
}
