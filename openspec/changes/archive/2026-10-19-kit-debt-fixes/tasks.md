# Tasks

Every code task: write the failing test first, then the fix; verify with the named test file passing and the rest of `npm test` still passing.

## 1. Roadmap (L18, L23, L13)

- [x] 1.1 Dropped tasks: parse `- [-] T<n> ...` as dropped (not done, not left) in `roadmap.mjs`, add `drop-task --id --task --reason` and `edit-task --id --task --text`, `tick` refuses a dropped task, `task`/`edit-task` refuse text starting with `T<n> `; tests for the four "Drop or edit a task" scenarios in `tests/kit/roadmap.test.mjs`
- [x] 1.2 Text under Order: a line under `## Order` that isn't a `- ` item gets the fix "move this text out of ## Order ..."; test for the "Text under Order" scenario
- [x] 1.3 One `git diff-tree --stdin` call for the merges in `gitFindings`; test with a throwaway repo holding a roadmap merge and a non-roadmap merge, same findings as before
- [x] 1.4 `/kit:roadmap` skill: add drop and edit to its writes table; verify the skill text names both commands

## 2. Notes counted as used (L11, L12)

- [x] 2.1 In `next.mjs` `readKnowledge`, build each note's pattern once and require `.md` or the path; tests for "Bare word" and "Named with .md", and the existing C9 citation test still passes

## 3. Next and hooks (L17)

- [x] 3.1 `/kit:next` reasons name the lane owner's command (roadmap, brainstorm, status) via the lane map instead of hard-coded `/opsx:explore` and `/kit:roadmap`; next tests pass with the same output for the kit's lane map
- [x] 3.2 Move the "is this a kit project" check and the project-dir lookup into `plugins/kit/hooks/kit-project.mjs`, used by `archive-gate.mjs` and `explore-reminder.mjs`; hook tests pass

## 4. Reviewer, tool review, harness (L20, L21, L29)

- [x] 4.1 `spec-reviewer.md`: `tools: Read, Grep, Glob`, input is the diff text or the changed-file list; `/kit:verify` step 6 runs the diff and passes it; verify with a grep that no Bash remains in the agent and the skill names the diff hand-off
- [x] 4.2 `tool-review.mjs` drop: insert after the last verdict line, skipping blank and comment lines; test with a verdicts list holding a blank and a comment line
- [x] 4.3 `harness.mjs`: report `docs/project-context.md` lines in the kit checks and flag over 60 under context (skill text too); test for the "Context doc grown long" scenario

## 5. Close out

- [x] 5.1 Apply the new commands to this repo's roadmap: drop M12 T4 (SuperSpec verdict, dropped 2026-10-18) and fix M15 T1's text; verify `roadmap.mjs check` reports nothing broken and the report shows M12 without T4
- [x] 5.2 Kit 0.17.1 -> 0.17.2; `npm test`, `npm run smoke`, `npm run evals -- --dry`, `openspec validate kit-debt-fixes --strict` all pass

## Workflow follow-up

- `/kit:verify` (with the change's own reviews), archive, mark L11, L12, L13, L17, L18, L20, L21, L23, L29 done, merge and push.
