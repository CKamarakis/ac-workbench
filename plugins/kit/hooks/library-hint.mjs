// PostToolUse(Bash) hook: after a failed build/type/test command with a library error, tell the agent to look
// up current docs with context7 before retrying (quality-gates design D5; spec: skill-routing "Library-error
// hook"). Inert outside kit projects. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILDISH = /\b(npm (run )?(build|test|typecheck|type-check)\b|npx (tsc|vitest|jest|next)\b|tsc\b|vitest\b|jest\b|next build\b|pnpm (run )?(build|test)\b|yarn (build|test)\b)/;

const pkgOf = spec => {
  if (!spec || /^[./]/.test(spec) || /^node:/.test(spec)) return null;
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
};

const PATTERNS = [
  [/is not exported from ['"]([^'"]+)['"]/, m => m[1]],
  [/Module ['"]{1,2}([^'"]+)['"]{1,2} has no exported member/, m => m[1]],
  [/has no exported member[\s\S]{0,200}?from ['"]([^'"]+)['"]/, m => m[1]],
  [/Cannot find module ['"]([^'"]+)['"]/, m => m[1]],
  [/is not a function[\s\S]{0,2000}?node_modules[\\/]((?:@[^\\/]+[\\/])?[^\\/]+)/, m => m[1].replace(/\\/g, '/')],
];

/** Pure decision: null, or the hint text. */
export function hint(event, projectDir) {
  if (!projectDir || !fs.existsSync(path.join(projectDir, '.claude', 'kit.json'))) return null;
  if (event?.tool_name && event.tool_name !== 'Bash') return null;
  const cmd = event?.tool_input?.command ?? '';
  if (!BUILDISH.test(cmd)) return null;
  // A failed command arrives as PostToolUseFailure with `error` = "Exit code N\n<output>" (seen live, Claude Code
  // 2.1.292); PostToolUse with tool_response is kept for completeness.
  const r = event?.tool_response ?? {};
  const err = typeof event?.error === 'string' ? event.error : '';
  const out = err || (typeof r === 'string' ? r : `${r.stdout ?? ''}\n${r.stderr ?? ''}\n${r.output ?? ''}`);
  const code = err ? Number(/^Exit code (\d+)/.exec(err)?.[1] ?? 1) : typeof r === 'object' ? (r.exit_code ?? r.exitCode ?? r.code) : undefined;
  if (code === 0 || (code === undefined && !/error/i.test(out))) return null;
  for (const [re, pick] of PATTERNS) {
    const m = re.exec(out);
    if (!m) continue;
    const pkg = pkgOf(pick(m));
    if (!pkg) continue;
    return `Library error from "${pkg}" (kit hint): before another fix, look up its current docs for the version in package.json: npx -y ctx7@latest library ${pkg} "<what you need>", then npx -y ctx7@latest docs <library-id> "<question>".`;
  }
  return null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let raw = '';
  process.stdin.on('data', d => (raw += d)).on('end', () => {
    try {
      const ev = JSON.parse(raw || '{}');
      const text = hint(ev, process.env.CLAUDE_PROJECT_DIR || ev.cwd || process.cwd());
      if (text) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: ev.hook_event_name || 'PostToolUseFailure', additionalContext: text } }));
    } catch { /* never break the session over a hook error */ }
  });
}
