// Lane map: one owning tool (and skill) per workflow phase, from the registry (design D6; spec: skill-routing).
// Zero dependencies. Usage: node lanes.mjs [registry.json] [--block]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ACTIVE = ['adopted', 'trial'];
const RANK = { adopted: 2, trial: 1 };
export const BLOCK_START = '<!-- kit:routing:start -->';
export const BLOCK_END = '<!-- kit:routing:end -->';

const asList = v => (Array.isArray(v) ? v : v == null ? [] : [v]);

/**
 * Owner rule per phase, among active (adopted|trial) entries that list the phase:
 *   1. a claimant that lists another claimant under `overlaps` defers to it
 *   2. among the rest, adopted beats trial
 *   3. still more than one -> conflict (owner null); none -> unowned
 * Deferring claimants are kept as `alternatives`.
 */
export function laneMap(registry) {
  const active = (registry.tools ?? []).filter(t => ACTIVE.includes(t.status));
  const lanes = (registry.phases ?? []).map(phase => {
    const claimants = active.filter(t => asList(t.phases).includes(phase));
    const names = new Set(claimants.map(t => t.name));
    let rest = claimants.filter(t => !asList(t.overlaps).some(o => names.has(o) && o !== t.name));
    if (rest.length > 1) {
      const top = Math.max(...rest.map(t => RANK[t.status]));
      rest = rest.filter(t => RANK[t.status] === top);
    }
    const owner = rest.length === 1 ? rest[0] : null;
    const view = t => ({ name: t.name, status: t.status, skill: t.skills?.[phase] ?? null });
    return {
      phase,
      owner: owner ? view(owner) : null,
      alternatives: claimants.filter(t => t !== owner && !rest.includes(t)).map(view),
      conflict: rest.length > 1 ? rest.map(t => t.name) : [],
    };
  });
  const skip = active.flatMap(t => asList(t.skip_skills).map(s => ({ tool: t.name, skill: s })));
  return {
    lanes,
    unowned: lanes.filter(l => !l.owner && !l.conflict.length).map(l => l.phase),
    conflicts: lanes.filter(l => l.conflict.length).map(l => ({ phase: l.phase, tools: l.conflict })),
    skip,
  };
}

export function formatLanes(map) {
  const w = Math.max(5, ...map.lanes.map(l => l.phase.length));
  const lines = ['Lane map (phase -> owner: skill)'];
  for (const l of map.lanes) {
    const own = l.owner ? `${l.owner.name}${l.owner.status === 'trial' ? ' (trial)' : ''}: ${l.owner.skill ?? '(no skill recorded)'}`
      : l.conflict.length ? `CONFLICT: ${l.conflict.join(', ')}` : 'unowned';
    const alt = l.alternatives.length ? `   [alt: ${l.alternatives.map(a => a.name).join(', ')}]` : '';
    lines.push(`  ${l.phase.padEnd(w)}  ${own}${alt}`);
  }
  return lines.join('\n');
}

/** Knowledge folder and the Ready-PRD handoff to the proposal step (spec: project-starter, prd-authoring). */
export function knowledgeSection(dir) {
  const k = dir.replace(/\\/g, '/').replace(/\/+$/, '');
  return [
    '### Knowledge and PRDs',
    '',
    `- Notes, PRDs and assets live in \`${k}/\` (\`notes/\`, \`prds/\`, \`assets/\`). Never read \`${k}/archive/\`. Capture with \`/kit:capture\`, write PRDs with \`/kit:prd\`.`,
    `- \`/opsx:propose\`: if a PRD in \`${k}/prds/\` has \`status: Ready\` and no \`change\`, use it as the main input (ask which one if there are several). Add this line to the proposal: \`PRD: ${k}/prds/<slug>.md @ <commit>\`, where the commit is \`git log -1 --format=%h -- <file>\`, or \`uncommitted\` if the file has uncommitted changes.`,
    "- After the proposal exists, offer to set the PRD's `change` to the change name and its status to `Building`. Change nothing in the PRD without a yes.",
  ];
}

/** The managed CLAUDE.md block (spec: skill-routing "Projects receive routing rules"). */
export function routingBlock(map, { kitVersion, knowledgeDir = null } = {}) {
  const rows = map.lanes.map(l => {
    const use = l.owner ? (l.owner.skill ? `\`${l.owner.skill}\`` : `${l.owner.name} (no skill recorded)`)
      : l.conflict.length ? `conflict: ${l.conflict.join(' / ')}, ask` : 'no owner yet, ask';
    const alt = l.alternatives.map(a => (a.skill ? `\`${a.skill}\` (${a.name}, ${a.status})` : `${a.name} (${a.status})`)).join('; ');
    return `| ${l.phase} | ${use} | ${l.owner?.name ?? '-'} | ${alt || '-'} |`;
  });
  const skip = map.skip.length ? map.skip.map(s => `- Don't use ${s.skill.includes(' ') ? s.skill : `\`${s.skill}\``} (${s.tool})`).join('\n') : '- (none)';
  return [
    BLOCK_START,
    `## Workflow routing${kitVersion ? ` (kit ${kitVersion})` : ''}`,
    '',
    'Managed by the kit. Edit `toolkit.yaml` in the kit repo, not this block.',
    'Use one owner per phase. Only switch to an alternative when the change is big or risky, and say so.',
    '',
    '| Phase | Use | Owner | Alternative |',
    '|---|---|---|---|',
    ...rows,
    '',
    '**Skip:**',
    skip,
    ...(knowledgeDir ? ['', ...knowledgeSection(knowledgeDir)] : []),
    BLOCK_END,
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith('--')) ?? path.join(KIT, 'data', 'toolkit.json');
  const map = laneMap(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (args.includes('--block')) {
    const version = JSON.parse(fs.readFileSync(path.join(KIT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
    console.log(routingBlock(map, { kitVersion: version, knowledgeDir: 'knowledge' }));
  } else console.log(formatLanes(map));
}
