# Proposal

## Why

The second round of test A on kit 0.18.1 (2026-10-19, `temp/acme-fresh-3` and `temp/acme-empty`, clean profile) worked, and the user listed what to polish: in an empty folder the type question put "none" first; the five context questions came all at once, weren't marked by importance, and were hard to read; there was no hint to answer by voice, and no word on where more context goes. A test agent's review of the kit, checked against the copy, added three items: the `.gitignore` block repeats lines the file already has, the README has no way to remove the kit (and `uninstall` without `--scope project` targets user scope), and the `CLAUDE.md` block costs context in every session. The user asked to fix all of them in one small change before test B.

## What Changes

- **Type order:** a type the project's files make likely is still first and "Recommended"; otherwise `web-ui` is first without "Recommended"; "none" is always last.
- **The questions in two rounds:** the three core ones first (problem, users, "I use it to ..."), with a voice hint (`/voice`); then two optional ones (rules for the agent, not now). A blank line between questions.
- **Where more context goes:** at the end of the step, one line: specs, briefs or notes go in `docs/` (or ideas through `/kit:capture`), and the doc can be updated from them on request.
- **`.gitignore`:** no change after all. The code review showed that leaving out lines the file already has makes privacy depend on the user's own lines (delete yours, and the settings file is no longer ignored). A repeated line is harmless, so the kit's block keeps its own lines; a test now pins that.
- **README:** when the kit loads, how to update it, and how to remove it from a project (`--scope project`, and what the kit leaves).
- **`CLAUDE.md` block, safe trim:** the table drops the Owner column (the Use column already names the command), and the header line says edits are replaced on re-sync instead of pointing at "the kit repo". About 3% smaller; a real reduction (moving long rules into the skills that use them) is a separate decision.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-starter`: type order without evidence; the context questions in two rounds with the voice hint and the `docs/` line; the kit's `.gitignore` lines are kept even when the file already has them.

## Impact

- **Code:** `plugins/kit/scripts/lanes.mjs` (table and header). Template `project-context.md` (intro line, an example for the rules question).
- **Skill text:** `plugins/kit/skills/start/SKILL.md`. **Docs:** `README.md`.
- **Tests:** `tests/kit/start-plan.test.mjs`, the routing golden file; evals for `start`.
- **Kit version:** 0.18.1 -> 0.18.2. Existing projects pick up the new routing block on their next `/kit:start` re-sync.
