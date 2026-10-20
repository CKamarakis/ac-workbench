# Proposal

## Why

The loose-ends list holds known faults in the kit's own scripts, found in earlier verify runs and in use (L11, L12, L13, L17, L18, L20, L21, L23, L29). The user asked on 2026-10-19 to fix every doable loose end carefully before resuming M12 (drift entry that day). Each item was checked against its code and, where it matters, official docs, before this plan.

## What Changes

- **L18 roadmap tasks:** a task can be dropped (`- [-] T<n> <text> (dropped <date>: <reason>)`, not counted as left or done) or have its text edited, through `roadmap.mjs`; `tick` refuses a dropped task; `task` refuses text that starts with a task ID ("T1 T1 PRD...").
- **L23 roadmap check:** a line of the user's own text under `## Order` gets the fix "move this text out of ## Order", not "write it as `- <ID>`".
- **L11 notes counted as used:** a proposal or design uses a note only when it names the note's file with `.md` (or its path), not when a bare word matches the note's name.
- **L12:** each note's citation pattern is built once per run, not once per change (same results).
- **L13:** the roadmap check's "merge brought in a roadmap update" test runs as one `git diff-tree --stdin` call instead of one `git diff` per merge (same results; compares each merge with its first parent, as today).
- **L17:** `/kit:next` names the lane owner's command in its reasons instead of hard-coded `/opsx:explore` and `/kit:roadmap`; the hooks share one "is this a kit project" helper.
- **L20:** the `kit:spec-reviewer` agent loses Bash and is read-only by its tools, not only by its instructions; `/kit:verify` passes it the diff text (or the changed-file list for a large diff).
- **L21:** `tool-review record --action drop` adds the verdict after the last verdict even when the list holds blank or comment lines.
- **L29:** `/kit:harness-review` reports the project context doc's size and flags it past 60 lines.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `roadmap`: task line shapes include a dropped task; a new requirement to drop or edit a task; the check's fix for text under Order.
- `project-status`: a new requirement on when a note counts as used.
- `harness-review`: kit checks include the project context doc's size.

L12, L13, L17, L20 and L21 change no specified behaviour; their tests guard the same results.

## Impact

- **Code:** `plugins/kit/scripts/roadmap.mjs`, `next.mjs`, `tool-review.mjs`, `harness.mjs`; `plugins/kit/hooks/archive-gate.mjs`, `explore-reminder.mjs` (+ a shared helper); `plugins/kit/agents/spec-reviewer.md`; skills `roadmap`, `verify`, `harness-review` (text).
- **Tests:** `tests/kit/roadmap.test.mjs`, `next.test.mjs`, `status.test.mjs`, `tool-review.test.mjs`, `harness.test.mjs`, hook tests.
- **Data in this repo:** after the build, M12 T4 (SuperSpec verdict, dropped 2026-10-18) is marked dropped and M15 T1's text "T1 T1 PRD..." is corrected, with the new commands.
- **Kit version:** 0.17.1 -> 0.17.2.
