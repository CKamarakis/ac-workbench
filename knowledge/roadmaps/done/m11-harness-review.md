---
id: M11
title: Harness review
status: done
---

v1 phase B: a read-only check-up of any Claude Code project setup.

## Tasks

## Notes

## Before 2026-10-17 (the old roadmap row, kept whole)

- **Change:** v1 phase B: harness review
- **Delivers:** Change `kit-harness-review`: `/kit:harness-review`, a read-only check-up of any Claude Code project's setup, kit or no kit (plan 2026-10-14). A scan script lists the setup (CLAUDE.md files, rules, skills, hooks, permissions, MCP servers, plugins, memory by type) at no token cost; the skill draws an ASCII map, rates 8 layers OK / PARTIAL / GAP and gives the top 3 fixes. It points to Claude Code's own `/doctor prompt-audit` (instruction content) and `/skill-doctor` (skill cost and usage) instead of repeating them. Kit checks (lanes, registry) only when the kit is present. Never edits; the report is saved as a note only on the user's yes. Revised from M5's spec; the M5 change `kit-overview-feedback` is closed as superseded
- **Exit criteria:** Run on this repo and the Acme copy; findings judged useful by the user
- **Status:** **done** 2026-10-14 (kit 0.10.0; 356 tests, smoke 37 steps): reviews of this repo and the Acme copy judged "good as a start" by the user; evidence [`kit-harness-review.md`](../evals/trials/kit-harness-review.md); verify passed (C1, C2 and the save offer fixed; 9 low findings kept); archived as `2026-10-14-kit-harness-review`
