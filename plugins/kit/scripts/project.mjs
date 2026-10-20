// What kind of project is this? Shared by start-plan (the type hint), ready (the shape offer, ui-review) and verify
// (the UI review lines), so the rule lives in one place (ui-flow-with-impeccable design D1). Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';

/** A web app's config file at the project root (the same list /kit:start uses to recommend `web-ui`). */
export const WEB_APP_CONFIG = /^(next|vite|astro|svelte|nuxt)\.config\.(js|mjs|cjs|ts|mts)$/;

/** The project_type written in .claude/kit.json, or null when there's no kit.json or no type in it. */
export function kitType(dir) {
  try {
    const t = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'kit.json'), 'utf8')).project_type;
    return typeof t === 'string' && t.trim() ? t.trim() : null;
  } catch { return null; }
}

/** Is this a web-ui project? A type in kit.json wins (web-ui or not); without one, Impeccable installed or a web
 *  app's config file decides (decided at verify, 2026-10-18). Returns { webUi, why }. */
export function webUi(dir) {
  const type = kitType(dir);
  if (type) return type === 'web-ui'
    ? { webUi: true, why: '.claude/kit.json says project_type: web-ui' }
    : { webUi: false, why: `.claude/kit.json says project_type: ${type}` };
  if (fs.existsSync(path.join(dir, '.claude', 'skills', 'impeccable'))) return { webUi: true, why: 'Impeccable is installed (.claude/skills/impeccable)' };
  let config = null;
  try { config = fs.readdirSync(dir).find(f => WEB_APP_CONFIG.test(f)) ?? null; } catch { /* no folder */ }
  if (config) return { webUi: true, why: `${config} found: a web app` };
  return { webUi: false, why: 'no project type in .claude/kit.json, no Impeccable, no web app config' };
}
