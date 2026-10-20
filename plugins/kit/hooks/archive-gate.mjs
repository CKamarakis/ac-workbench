// PreToolUse(Bash) hook: blocks `openspec archive <change>` until /kit:verify passed (quality-gates design D4;
// spec: quality-gates "Archive gate"). On an allowed archive it adds a reminder about open decisions (build-readiness D6).
// Inert outside kit projects (no .claude/kit.json). Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStatus } from '../scripts/verify.mjs';
import { decisionStatus, openLine } from '../scripts/decisions.mjs';
import { isKitProject, projectDir as hookDir } from './kit-project.mjs';

const ARCHIVE = /\bopenspec(?:\.cmd)?["']?\s+archive((?:\s+-{1,2}[\w-]+)*)\s+([a-z0-9][a-z0-9-]*)/;

/** The change an `openspec archive` command names in a kit project, or null. */
function archived(event, projectDir) {
  if (!isKitProject(projectDir)) return null;
  if (event?.tool_name && event.tool_name !== 'Bash') return null;
  const m = ARCHIVE.exec(event?.tool_input?.command ?? '');
  if (!m || !fs.existsSync(path.join(projectDir, 'openspec', 'changes', m[2]))) return null;
  return m[2];
}

/** On an allowed archive: reminders about open decisions (build-readiness D6) and the docs page (kit-docs D5), or null.
 *  Never a block. */
export function reminder(event, projectDir) {
  const change = archived(event, projectDir);
  if (!change || gate(event, projectDir)) return null;
  const parts = [];
  const line = openLine(decisionStatus({ dir: projectDir, change }));
  if (line) parts.push(`Kit reminder for "${change}": ${line} (openspec/changes/${change}/decisions.md). Tell the user; the archive is not blocked.`);
  // High-risk change without the user's OK before merge: shown like an open decision, never a block (build-safeguards D7).
  if (verifyStatus({ dir: projectDir, change }).okPending) parts.push(`Kit reminder for "${change}": this is a high-risk change and the user's OK before merge isn't recorded yet (verify.mjs ok). Tell the user; the archive is not blocked.`);
  if (fs.existsSync(path.join(projectDir, 'knowledge', 'docs'))) {
    const kit = process.env.CLAUDE_PLUGIN_ROOT || '${CLAUDE_PLUGIN_ROOT}';
    parts.push(`Kit reminder: this project uses the living docs. After the archive (spec sync), ask the user whether to rebuild the docs page (node "${kit}/scripts/docs.mjs" build --dir .) and include knowledge/docs/index.html in the archive commit.`);
  }
  return parts.length ? parts.join(' ') : null;
}

/** Pure decision: null = allow, or a deny reason. */
export function gate(event, projectDir) {
  if (!isKitProject(projectDir)) return null;
  if (event?.tool_name && event.tool_name !== 'Bash') return null;
  const m = ARCHIVE.exec(event?.tool_input?.command ?? '');
  if (!m) return null;
  const change = m[2];
  if (!fs.existsSync(path.join(projectDir, 'openspec', 'changes', change))) return null; // let openspec report it
  const s = verifyStatus({ dir: projectDir, change });
  if (s.status === 'pass' || s.status === 'overridden') return null;
  if (s.status === 'missing') return `Archive blocked by the kit: change "${change}" has no verify report. Run /kit:verify first, then archive.`;
  return `Archive blocked by the kit: /kit:verify failed for "${change}" (${s.hard.join('; ')}). Fix it and re-run /kit:verify, or ask the user whether to override with a reason.`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.on('data', d => (raw += d)).on('end', () => {
    try {
      const ev = JSON.parse(raw || '{}');
      const dir = hookDir(ev);
      const reason = gate(ev, dir);
      if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
      else {
        // No permissionDecision: normal permissions still apply (trial: evals/trials/build-readiness-hooks.md).
        const context = reminder(ev, dir);
        if (context) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: context } }));
      }
    } catch { /* never break the session over a hook error */ }
  });
}
