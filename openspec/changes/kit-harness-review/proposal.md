# Proposal

## Why

A Claude Code setup grows piece by piece (CLAUDE.md, rules, skills, hooks, permissions, MCP servers, plugins, memory) and nobody sees it whole. Claude Code's own checks cover parts of it: `/doctor` checks setup health, `/doctor prompt-audit` finds outdated, broken or conflicting instructions, `/skill-doctor` shows what each skill costs and how often it's used (official docs, read 2026-10-14). None of them answer "does this setup work as a harness?": is the agent's work verified, are there guardrails, is memory stored as the right kind, does anything feed lessons back. That review is useful to any Claude Code user, with or without the kit, which makes it the kit's most shareable piece for v1 (roadmap M11, plan 2026-10-14).

## What Changes

- **`/kit:harness-review`** (new skill): a read-only check-up of the current project's Claude Code setup. It draws an ASCII map of the setup, rates 8 layers (context, tools, memory, loops, verification, guardrails, feedback, observability) as OK, PARTIAL or GAP with a one-line note each, and ends with at most 3 fixes, each saying why its layer matters.
- **A scan script** (`harness.mjs scan`, zero dependencies): lists the setup at no token cost: instruction files with sizes, rules, skills (name, description, size) at project and user level, hooks per event, permission rules, MCP servers, enabled plugins, and the project's auto-memory files with their type. The AI judges; the script counts.
- **Builds on Claude Code's built-ins**: the context layer points to `/doctor prompt-audit` for instruction content and the tools layer to `/skill-doctor` for skill cost; the review doesn't repeat what they do.
- **Works without the kit**; when `.claude/kit.json` exists, it adds the kit checks (tool overlaps from the lane map, the routing block).
- **Never edits the project**; the report stays in the chat, and is saved as a note only on the user's yes.
- **Closes the M5 change `kit-overview-feedback`** as superseded (archived without spec updates): its cockpit moved after v1, its feedback inbox was dropped, and its harness-review spec is revised here.
- **Removes the dead `/kit:feedback` route** left by that drop: the registry still sends the `kit-issues` phase to `/kit:feedback`, which was never built, so every kit project's routing block names a skill that doesn't exist. Kit issues go to the repo's GitHub issues page instead (user decision 2026-10-12). A new `assess` phase routes to `/kit:harness-review`.

```
 /kit:harness-review
   |
   scan (script) --> map (ASCII) --> 8 layers: OK / PARTIAL / GAP --> top 3 fixes
   |                                   |
   |                                   +-- context: "run /doctor prompt-audit for content"
   |                                   +-- tools:   "run /skill-doctor for cost and usage"
   |                                   +-- kit checks only if .claude/kit.json
   +-- reads only; report in chat; note on a yes
```

## Capabilities

### New Capabilities
- `harness-review`: the check-up of a Claude Code setup (scan, map, layers, scorecard, fixes, built-in pointers, kit checks, read-only).

### Modified Capabilities
- `skill-routing`: kit issues route to the GitHub issues page, not `/kit:feedback`; the lane map gains an `assess` phase for the harness review.

## Impact

- New: `plugins/kit/scripts/harness.mjs`, `plugins/kit/skills/harness-review/SKILL.md` and `checklist.md`, `tests/kit/harness.test.mjs`, `evals/harness-review/cases.yaml`; `toolkit.yaml` (phases `assess` added, `kit-issues` rerouted; the `kit` entry's reason no longer lists `/kit:feedback`); `README.md` mentions of `/kit:feedback`.
- `openspec/changes/kit-overview-feedback` moves to the archive without touching main specs.
- Reads user-level files (`~/.claude`) and the project's auto memory: names, sizes, types and frontmatter only in the scan output, never memory text; nothing leaves the machine.
- Checked 2026-10-14 (official docs): the memory folder location and its three overrides (design D2a); `/context` shows what fills the context window. Not documented: whether a skill can run `/doctor` or `/skill-doctor` itself, so the review tells the user which to run.
- Kit version 0.10.0.
