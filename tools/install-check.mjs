// Install check: the plugin as Claude Code loads it (kit-cross-platform design D9; spec: kit-self-test "Install check").
// Dev tool, run by npm test (tests/kit/install-check.test.mjs). Returns one line per problem: "<file>: <what is wrong>".
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

// Hook events from the Claude Code hooks reference (https://code.claude.com/docs/en/hooks, read 2026-10-13).
export const HOOK_EVENTS = ['SessionStart', 'Setup', 'UserPromptSubmit', 'UserPromptExpansion', 'PreToolUse', 'PermissionRequest',
  'PermissionDenied', 'PostToolUse', 'PostToolUseFailure', 'PostToolBatch', 'Notification', 'MessageDisplay', 'SubagentStart',
  'SubagentStop', 'TaskCreated', 'TaskCompleted', 'Stop', 'StopFailure', 'TeammateIdle', 'InstructionsLoaded', 'ConfigChange',
  'CwdChanged', 'DirectoryAdded', 'FileChanged', 'WorktreeCreate', 'WorktreeRemove', 'PreCompact', 'PostCompact', 'PreModelSwitch',
  'PostModelSwitch', 'Elicitation', 'ElicitationResult', 'SessionEnd'];

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

function readJson(file, problems, rel) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (e) { problems.push(`${rel}: ${fs.existsSync(file) ? `not valid JSON (${e.message})` : 'missing'}`); return null; }
}

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  try { return YAML.parse(m[1]) ?? {}; } catch { return null; }
}

function checkPlugin(root, pluginDir, problems) {
  const relDir = path.relative(root, pluginDir).split(path.sep).join('/');
  const pj = readJson(path.join(pluginDir, '.claude-plugin', 'plugin.json'), problems, `${relDir}/.claude-plugin/plugin.json`);
  if (pj) {
    if (!pj.name) problems.push(`${relDir}/.claude-plugin/plugin.json: missing name`);
    if (!SEMVER.test(String(pj.version ?? ''))) problems.push(`${relDir}/.claude-plugin/plugin.json: version "${pj.version ?? ''}" is not a semantic version (x.y.z)`);
  }

  const hooksFile = path.join(pluginDir, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksFile)) {
    const rel = `${relDir}/hooks/hooks.json`;
    const h = readJson(hooksFile, problems, rel);
    for (const [event, groups] of Object.entries(h?.hooks ?? {})) {
      if (!HOOK_EVENTS.includes(event)) problems.push(`${rel}: unknown hook event "${event}"`);
      for (const g of Array.isArray(groups) ? groups : []) for (const hook of g.hooks ?? []) {
        const cmd = String(hook.command ?? '');
        for (const m of cmd.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"'\s]+)/g)) {
          if (!fs.existsSync(path.join(pluginDir, m[1]))) problems.push(`${rel}: ${event} runs ${m[1]}, which does not exist`);
        }
      }
    }
  }

  const skillsDir = path.join(pluginDir, 'skills');
  const skills = fs.existsSync(skillsDir) ? fs.readdirSync(skillsDir, { withFileTypes: true }).filter(e => e.isDirectory()) : [];
  for (const s of skills) {
    const rel = `${relDir}/skills/${s.name}/SKILL.md`;
    const file = path.join(skillsDir, s.name, 'SKILL.md');
    if (!fs.existsSync(file)) { problems.push(`${rel}: missing`); continue; }
    const fm = frontmatter(fs.readFileSync(file, 'utf8'));
    if (!fm) { problems.push(`${rel}: no readable frontmatter`); continue; }
    if (fm.name !== s.name) problems.push(`${rel}: name "${fm.name ?? ''}" does not match its folder "${s.name}"`);
    if (typeof fm.description !== 'string' || !fm.description.trim()) problems.push(`${rel}: missing description`);
  }
}

/** All problems found under `root` (a marketplace repo). Empty array = the plugin loads as expected. */
export function checkInstall(root) {
  const problems = [];
  const mp = readJson(path.join(root, '.claude-plugin', 'marketplace.json'), problems, '.claude-plugin/marketplace.json');
  if (!mp) return problems;
  if (!mp.name) problems.push('.claude-plugin/marketplace.json: missing name');
  if (!Array.isArray(mp.plugins) || !mp.plugins.length) problems.push('.claude-plugin/marketplace.json: no plugins listed');
  for (const p of mp.plugins ?? []) {
    const dir = path.resolve(root, String(p.source ?? ''));
    if (!p.name || !p.source) { problems.push(`.claude-plugin/marketplace.json: plugin entry needs name and source (${JSON.stringify(p)})`); continue; }
    if (!fs.existsSync(dir)) { problems.push(`.claude-plugin/marketplace.json: plugin "${p.name}" points to ${p.source}, which does not exist`); continue; }
    checkPlugin(root, dir, problems);
  }
  return problems;
}
