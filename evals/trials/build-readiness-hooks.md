# Trial: PreToolUse context without a decision (build-readiness 1.1)

Date: 2026-10-12. Claude Code CLI (`~/.local/bin/claude.exe`), headless `claude -p`, Windows 11.

## Question

Can a PreToolUse(Bash) hook let a command run and still pass a message to the agent? Design D6 relies on it for the archive reminder about open decisions.

## Setup

- A throwaway folder in the session scratchpad, with `git init` and no `.claude/kit.json`.
- `.claude/settings.json`: one PreToolUse hook, matcher `Bash`, running `node probe.mjs`.
- `probe.mjs`: when the command contains `PROBE-MARK`, it prints `{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"KIT-REMINDER: 2 decisions still open since 2026-10-12"}}`, with no `permissionDecision`.
- Prompt: run `echo PROBE-MARK`, then repeat any hook context received. `--allowedTools 'Bash(echo:*)'`.

## Result: works

```
PROBE-MARK
PreToolUse:Bash hook additional context: KIT-REMINDER: 2 decisions still open since 2026-10-12
```

- The command ran. Normal permissions applied, because the hook gave no decision.
- The agent received the text next to the tool result, labelled "PreToolUse:Bash hook additional context". That matches the hooks docs (code.claude.com/docs/en/hooks, "Add context for Claude").

## Verdict

D6 stands as designed: `archive-gate.mjs` returns `additionalContext` when it allows an archive and decisions are open. The fallback isn't needed.
