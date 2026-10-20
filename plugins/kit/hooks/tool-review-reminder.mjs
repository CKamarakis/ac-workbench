// SessionStart hook: one line when the oldest reviewed_on in toolkit.yaml is more than 30 days old (build-safeguards
// design D9; spec: tool-review "Review reminder at session start"). Context only: never blocks, never writes, no network.
// Inert outside the kit repo (no toolkit.yaml at the project root). Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { oldestReview, REMIND_DAYS } from '../scripts/tool-review.mjs';
import { projectDir as hookDir } from './kit-project.mjs';

/** The context line to add, or null (pure apart from reading toolkit.yaml). */
export function reminder(projectDir, now = Date.now()) {
  const file = projectDir ? path.join(projectDir, 'toolkit.yaml') : null;
  if (!file || !fs.existsSync(file)) return null;
  const o = oldestReview(fs.readFileSync(file, 'utf8'), now);
  if (!o || o.days <= REMIND_DAYS) return null;
  const age = Number.isFinite(o.days) ? `${o.days} days` : 'never reviewed';
  return `Kit reminder: tell the user in one line: "Tool review due (oldest: ${o.tool}, ${age}): run /kit:tool-review".`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.on('data', d => (raw += d)).on('end', () => {
    try {
      const ev = JSON.parse(raw || '{}');
      // Plain stdout on exit 0 is added to the agent's context for SessionStart (hooks reference).
      const line = reminder(hookDir(ev));
      if (line) console.log(line);
    } catch { /* never block a session over a hook error */ }
    process.exitCode = 0;
  });
}
