---
name: harness-review
description: Read-only check-up of this project's Claude Code setup (CLAUDE.md, rules, skills, subagents, hooks, permissions, MCP servers, plugins, auto memory) - an ASCII map, eight layers rated OK / PARTIAL / GAP, and at most three fixes with reasons. Works in any Claude Code project, with or without the rest of the kit. Use when the user asks to review, audit or check their Claude Code setup or agent harness, asks what to improve in how they use Claude Code, or asks whether their setup is any good.
---

# Kit harness review

A second opinion on how this project is set up for Claude Code. It reviews the **setup**, not the project's code, and never a plugin's own code. It changes nothing.

Claude Code has its own checks; this review points to them instead of repeating them:
- `/doctor`: is Claude Code installed and working.
- `/doctor prompt-audit`: outdated, broken or conflicting instructions in CLAUDE.md, rules, skills and agents.
- `/skill-doctor`: what each skill costs and how often it's used.
- `/context`: what fills the context window right now.

Script, run from the project folder. If it prints `error:`, show it and stop.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/harness.mjs" scan --dir . --json
```

## Steps

1. **Scan.** Run the script. It lists the setup at no token cost: instruction files with sizes, rules, skills, subagents and commands (project and user), hooks per event (including what enabled plugins turn on), permission rules, MCP servers, plugins, auto-memory files by type and shape, and the kit's state when the kit is present. Don't ask the user for anything the scan already has.
2. **Read only what you need to judge**, e.g. `package.json` scripts for verification, the `CLAUDE.md` headings, a hook's command. For memory, open a file only when the scan flags it (3+ numbered steps, or names commands) and never quote more than its title.
3. **Map first.** Draw the setup as a plain-ASCII diagram (`+ - | -->` only): the session in the middle; instruction files and memory feeding in; skills, subagents, MCP servers and plugins as tools; hooks on the events they fire on, marking the ones that can block. Missing pieces are shown as missing.
4. **Rate the eight layers** with [checklist.md](checklist.md): context, tools, memory, loops, verification, guardrails, feedback, observability. Each gets OK, PARTIAL or GAP and a one-line note that names its evidence. In the context note, recommend `/doctor prompt-audit` (and `/context` when instructions are large); in the tools note, `/skill-doctor`. Don't list instruction conflicts or skill costs yourself.
5. **Kit checks only with the kit.** When the scan shows the kit: the routing block's status under context, lane conflicts under loops. Without the kit, don't mention the kit at all, and don't suggest installing it.
6. **Scorecard and fixes.** The scorecard table, then **at most three fixes**, most impact first: the layer, what to do, why that layer matters.
7. **Almost empty setup** (no CLAUDE.md, no `.claude` folder): keep it short. The map shows what's missing, most layers are GAP, and the first fix is writing a `CLAUDE.md` (what the project is, how to run and test it, the rules that matter).
8. **Offer to save.** Ask once: "Save this review as a note?" Only on a yes, and only when the project has a knowledge folder, write it with:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" new-note --dir . --title "Harness review <YYYY-MM-DD>" --body-file <tmp.md> --tags harness-review
   ```
   **In the saved note, name only project-level items.** The user's personal (user-level) skills, plugins, user CLAUDE.md and memory appear as counts only ("12 user skills, 2 plugins"), so a note in a public repo leaks nothing personal. The chat report can show them in full.

## Rules

- Never create, change or delete a file, except the note on a yes. Fixes are suggestions; the user applies them.
- Never print memory text; titles and counts only.
- Never judge a plugin's code; count what it turns on.
- Each rating names its evidence. If something couldn't be read (the scan lists it), say so instead of guessing.
- Don't commit.
