# Design

## Context

- Claude Code's built-ins (official docs, read 2026-10-14): `/doctor` (setup health: installation, extensions, CLAUDE.md, permissions; fixes on a yes), `/doctor prompt-audit` (CLAUDE.md, CLAUDE.local.md, AGENTS.md, rules, skills, commands, subagents and output styles in `.claude/` and `~/.claude/`; flags outdated instructions, missing references and contradictions; proposes edits), `/skill-doctor` (skill cost and usage). The review covers what they don't (proposal Why).
- Where a setup lives, as seen on this machine: project `CLAUDE.md`, `AGENTS.md`, `.claude/{settings.json, settings.local.json, skills/, agents/, commands/, rules/}`, `.mcp.json`; user `~/.claude/{CLAUDE.md, settings.json, skills/, agents/, commands/}`; auto memory in `~/.claude/projects/<project>/memory/` with a `MEMORY.md` index and one file per memory, frontmatter `type` (e.g. `feedback`, `project`, `user`, `reference`). Documented (memory and sessions pages, read 2026-10-14): `<project>` comes from the git repository root (worktrees and subfolders share it; outside git, the project root), with every non-alphanumeric character replaced by `-`; names over 200 characters are cut and get a hash (method not documented). Overrides: `CLAUDE_CONFIG_DIR` (moves `~/.claude`), `CLAUDE_CODE_PROJECT_DIR_NAME` (with `CLAUDE_CONFIG_DIR`, sets the folder name), `autoMemoryDirectory` in any settings file (moves memory elsewhere).
- `/context` "shows what is currently consuming context" (sessions page). Whether a skill can run `/doctor` or `/skill-doctor` is not documented: the skills page says only "a few built-in commands" are available through the Skill tool, naming `/init` and `/security-review`; neither doctor appears in the skills the agent can call in this session (observed 2026-10-14). So the review tells the user which to run.
- Kit pieces it reuses: `lanes.mjs laneMap()` reports `conflicts` (two active owners of a phase); `start-plan` compares the routing block.
- M5's spec (`openspec/changes/kit-overview-feedback/specs/harness-review/spec.md`, 2026-10-01) is the starting point; the revisions are in the proposal.
- The registry still routes `kit-issues` to `/kit:feedback` (`toolkit.yaml:50, 307, 314`), and that row is in every kit project's routing block (seen in the Toughbubble copy).

## Goals / Non-Goals

**Goals:** a review a stranger can run in any Claude Code project in a few minutes; the counting done by a script; judgment written down in a checklist the skill follows.

**Non-Goals:** fixing anything (the user decides; fixes are suggestions), re-checking instruction content or skill cost (built-ins), reviewing agent apps built with the API, scoring other people's plugins' internals, a numeric score.

## Decisions

**D1. Script counts, skill judges.** `harness.mjs scan --dir . [--home <dir>] [--json]` returns the inventory (proposal). The skill reads it plus a few files it needs to judge (e.g. `package.json` scripts, hook commands) and never asks the user for facts the scan has. *Alternative:* the skill globs files itself. Rejected: costs tokens on every run and isn't testable.

**D2a. Finding the memory folder.** In order: `autoMemoryDirectory` from the project's local, project and user settings; else `<CLAUDE_CONFIG_DIR or ~/.claude>/projects/<name>/memory/`, where `<name>` is `CLAUDE_CODE_PROJECT_DIR_NAME` when both it and `CLAUDE_CONFIG_DIR` are set, else the git root path (or the project path outside git) with non-alphanumerics as `-`. A name over 200 characters can't be rebuilt (undocumented hash): the scan says the folder wasn't found and why, never guesses.

**D2b. Plugins: what they turn on, not their code** (user, `/kit:ready` D2). For each enabled plugin, the scan finds its install folder through `~/.claude/plugins/installed_plugins.json` (seen on this machine, not documented) and lists its `hooks/hooks.json` events (marking PreToolUse hooks as blocking) and its skill names. Missing folder or unreadable list: the plugin is marked "not inspected". No judgment of the plugin's code.

**D2. Memory without its text.** The scan reports each memory file's name, `type`, size and two shape signals: number of numbered-list lines and whether it names a command. That's enough to flag "procedure kept as memory" (spec) without printing personal notes. The skill may open a flagged file to confirm, and quotes at most its title.

**D3. Checklist in the skill folder.** `skills/harness-review/checklist.md`: per layer, 3-5 questions in our own words, what counts as OK / PARTIAL / GAP, and which built-in to point to. The idea of eight layers came from PM-OS (research note); the text is ours.

| Layer | Looks at (examples) |
|---|---|
| context | instruction files and sizes, AGENTS.md vs CLAUDE.md, rules; points to `/doctor prompt-audit` (content) and `/context` (what fills the window) |
| tools | skills, subagents, commands, MCP servers, plugins; points to `/skill-doctor` |
| memory | auto-memory files by type and shape |
| loops | a repeatable workflow (spec-driven, plan then build), overlapping tools (kit: lane conflicts) |
| verification | test scripts, a verify step, hooks that run checks |
| guardrails | permission rules, blocking (PreToolUse) hooks, secret scanning (e.g. a pre-commit hook) |
| feedback | a place lessons land (memory, CLAUDE.md updates, an issues channel) |
| observability | records of what happened (decision records, verify reports, eval runs, logs) |

**D4. Kit checks behind `.claude/kit.json`.** With the kit: `laneMap(registry).conflicts` under loops; routing block present and current (the planner's `CLAUDE.md` action is `same`) under context. Without: none of it, and no mention of the kit.

**D5. Report on a yes.** The report stays in chat. A saved note names only project-level items; user-level skills, plugins and `~/.claude/CLAUDE.md` appear as counts, so a note in a public repo leaks nothing personal (user, `/kit:ready` D1). An almost empty project gets a short report whose first fix is a `CLAUDE.md` (user, D3). On a yes, the skill saves it with `knowledge.mjs new-note --title "Harness review <date>"` (the capture helper), so no new write path is added. In a project without a knowledge folder, it offers to create one (`new-note` creates `knowledge/notes/`), since the note needs a home; if the user declines, it asks which folder to save that one note in and creates nothing else (user, verify D4: a yes that saves nothing, or no offer at all, both lose the report).

**D6. Routing.** Phase `assess` (owner kit, skill `/kit:harness-review`) and `kit-issues` routed to `github.com/CKamarakis/ac-workbench/issues`: one `toolkit.yaml` edit each, regenerated by `npm run registry`; the `situations` entry and the `kit` entry's reason updated; `/kit:feedback` removed from the next and setup skills. Projects get the new block on their next re-sync (files only is enough).

**D7. Closing M5.** `openspec archive kit-overview-feedback --skip-specs -y` (CLI option, checked 2026-10-14) so its cockpit and feedback deltas never reach the main specs; its proposal already carries the "reshaped" banner.

## Risks / Trade-offs

- [The review sounds confident about a setup it only partly sees (plugins' insides, other machines)] → each note names its evidence; the map shows what was scanned.
- [Reading `~/.claude` touches personal files] → the scan reads names, sizes and frontmatter only (D2); nothing is written or sent.
- [The memory folder can't be found (long path, custom location the scan doesn't see)] → the scan says so and the memory layer is rated from what exists.
- [Judgments drift between runs] → the checklist fixes the questions and the meaning of OK / PARTIAL / GAP; rubric evals check the format.

## Migration Plan

Kit 0.10.0. Existing kit projects get the new routing (assess, GitHub issues) on their next `/kit:start` re-sync. Rollback: revert the change.
