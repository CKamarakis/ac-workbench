// Kit smoke test: prints plugin name, version and root. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, '.claude-plugin', 'plugin.json'), 'utf8'));
console.log(`kit ok: ${manifest.name} ${manifest.version}`);
console.log(`plugin root: ${root}`);
console.log(`CLAUDE_PLUGIN_ROOT: ${process.env.CLAUDE_PLUGIN_ROOT ?? "(not set)"}`);
