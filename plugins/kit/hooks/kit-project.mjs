// Shared by the kit's hooks (kit-debt-fixes, L17): whether a folder is a kit project, and which folder a hook event
// is about. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';

/** True when the folder holds `.claude/kit.json`; the hooks are inert everywhere else. */
export function isKitProject(dir) {
  return !!dir && fs.existsSync(path.join(dir, '.claude', 'kit.json'));
}

/** The project folder for a hook event: CLAUDE_PROJECT_DIR, else the event's cwd, else the process's. */
export function projectDir(event, env = process.env) {
  return env.CLAUDE_PROJECT_DIR || event?.cwd || process.cwd();
}
