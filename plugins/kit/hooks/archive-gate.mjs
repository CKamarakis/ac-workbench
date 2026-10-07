// PreToolUse(Bash) hook: blocks `openspec archive <change>` until /kit:verify passed (quality-gates design D4;
// spec: quality-gates "Archive gate"). Inert outside kit projects (no .claude/kit.json). Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyStatus } from '../scripts/verify.mjs';

const ARCHIVE = /\bopenspec(?:\.cmd)?["']?\s+archive((?:\s+-{1,2}[\w-]+)*)\s+([a-z0-9][a-z0-9-]*)/;

/** Pure decision: null = allow, or a deny reason. */
export function gate(event, projectDir) {
  if (!projectDir || !fs.existsSync(path.join(projectDir, '.claude', 'kit.json'))) return null;
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
      const reason = gate(ev, process.env.CLAUDE_PROJECT_DIR || ev.cwd || process.cwd());
      if (reason) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
    } catch { /* never break the session over a hook error */ }
  });
}
