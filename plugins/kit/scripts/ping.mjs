// Kit smoke test: prints the plugin name, version, root, and what it ships. Zero dependencies.
// CLAUDE_PLUGIN_ROOT is never set in the Bash tool's shell (by design); Claude Code substitutes it into
// skill text when a skill loads, so the root is found from this script's own location instead.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
const skills = fs.readdirSync(path.join(root, 'skills'), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort();
const hooks = fs.existsSync(path.join(root, 'hooks', 'hooks.json'));
console.log(`kit ok: ${manifest.name} ${manifest.version}`);
console.log(`plugin root: ${root}`);
console.log(`skills (${skills.length}): ${skills.join(', ')}`);
console.log(`hooks: ${hooks ? 'archive gate + library hint (active only in kit projects)' : 'none'}`);
