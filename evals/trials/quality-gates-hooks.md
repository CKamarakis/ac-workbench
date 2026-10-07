# Quality-gates hook trial (task 1.2), 2026-10-07

**Question:** do hooks shipped inside the kit plugin (`plugins/kit/hooks/hooks.json`, command `node "${CLAUDE_PLUGIN_ROOT}/hooks/<file>.mjs"`) run on Windows? Do they act only in kit projects, and can a `PreToolUse` hook deny a Bash call?

**Setup:**
- Claude Code 2.1.292 on Windows 11, run headless: `claude -p … --plugin-dir <repo>/plugins/kit --allowedTools "Bash(echo:*)"`.
- The installed kit (a cached 0.2.0) was untouched; `--plugin-dir` loads the working tree for one session.
- Probe hook: `plugins/kit/hooks/probe.mjs`. It logs and denies only commands containing `KIT_PROBE`, and only when `.claude/kit.json` exists.

| Case | Result |
|---|---|
| Throwaway folder **with** `.claude/kit.json`, `echo KIT_PROBE hello` | **Denied.** The agent saw `PreToolUse:Bash hook error: KIT_PROBE_DENIED by the kit plugin hook`, and the command never ran. The log recorded the event |
| Throwaway folder **without** `kit.json`, same command | **Ran normally** (`KIT_PROBE hello`); no log written |

**Verdict:** design D3 holds. Plugin-level hooks with `${CLAUDE_PLUGIN_ROOT}` work on Windows (Git Bash runs `node …`), and gating on `.claude/kit.json` keeps them inert elsewhere. The per-project fallback isn't needed.

**Note:** the installed kit is a cached copy (`~/.claude/plugins/cache/ac-workbench/kit/0.2.0`), so hooks reach real sessions only after `claude plugin update kit@ac-workbench`.

## Live check of the real hooks (task 3.3), 2026-10-07

Same headless setup (`--plugin-dir`), in throwaway kit folders.

- **Archive gate:** `openspec archive add-x --yes` with no `verify.md` was **blocked**. The agent saw: "Archive blocked by the kit: change "add-x" has no verify report. Run /kit:verify first, then archive."
- **Library hint, first try: no hint.**
  - A capture hook showed that a failed Bash command fires **`PostToolUseFailure`**, not `PostToolUse`.
  - Its input has `error: "Exit code 1\n\n<output>"` and no `tool_response`.
  - The docs page read on 2026-10-07 described only the `PostToolUse` shape, so this is a doc gap.
- **Library hint, after the fix:** the hook is registered on `PostToolUseFailure` and parses `error`. The agent received: "Library error from "next" (kit hint): before another fix, look up its current docs … npx -y ctx7@latest library next …".
