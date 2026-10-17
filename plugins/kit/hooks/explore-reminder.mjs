// UserPromptSubmit hook: when the user starts the stage after an explore (/kit:prd, /opsx:propose, /kit:next),
// remind the agent to save an unsaved explore record first (explore-stage design D8; spec: explore-record
// "Reminder when the next stage starts"). Context only: never blocks, never writes. Inert outside kit projects
// (no .claude/kit.json). Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const NEXT_STAGE = /^\s*\/(kit:prd|opsx:propose|kit:next)\b/;

/** The context line to add, or null (pure). */
export function reminder(event, projectDir) {
  if (!projectDir || !fs.existsSync(path.join(projectDir, '.claude', 'kit.json'))) return null;
  if (!NEXT_STAGE.test(String(event?.prompt ?? ''))) return null;
  return 'Kit reminder: if this session explored something (/opsx:explore) whose explore record is not saved yet, save it with /kit:explore-record before this step, and show what was written.';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.on('data', d => (raw += d)).on('end', () => {
    try {
      const ev = JSON.parse(raw || '{}');
      const line = reminder(ev, process.env.CLAUDE_PROJECT_DIR || ev.cwd || process.cwd());
      // Plain stdout on exit 0 is added to the agent's context for UserPromptSubmit (hooks reference, 2026-10-17).
      if (line) console.log(line);
    } catch { /* never block a prompt over a hook error */ }
    process.exitCode = 0;
  });
}
