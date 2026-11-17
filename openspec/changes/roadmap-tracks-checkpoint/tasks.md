# Tasks

## 1. Edit a milestone

- [ ] 1.1 Add `editMilestone` and the `edit --id <ID> [--title <t>] [--goal <g>]` command to `roadmap.mjs` (design D3): the title goes in frontmatter, the goal line is replaced in place, a title change adds a drift entry with the old and new title, and nothing to edit or an empty value is an error with no write. Verify with new `tests/kit/roadmap.test.mjs` cases for each "Edit a milestone" scenario (rename keeps ID, file name, tasks and links; goal only, no drift; nothing to edit).
- [ ] 1.2 Add the `edit` row to the `/kit:roadmap` writes table and the script's usage header. Verify `npm run evals` passes for the roadmap skill.

## 2. Checkpoints in the script

- [ ] 2.1 Parse the `checkpoint:` field (`T<n>` or `archive <change>`) in `readMilestone`. Add `setCheckpoint` and the `checkpoint --id <ID> (--after T<n> | --archive <change> | --clear)` command, which refuses a missing or dropped task (design D1, D3). Verify with roadmap tests for the "After a task", "After an archive" and "Unknown task" scenarios.
- [ ] 2.2 Compute reached checkpoints (design D2: task ticked; archive folder `openspec/changes/archive/*-<change>/` exists). Add the broken findings for a malformed checkpoint and a missing or dropped task, and the tidy-up finding for more than two active milestones, to `checkRoadmap` (design D5). Verify with tests: tick reaches it, untick un-reaches it, archive reaches it, a malformed field is broken, a third active milestone gives one tidy-up line and `status --to active` still succeeds.
- [ ] 2.3 Add `tracks` and `checkpoints` to `reportRoadmap` (each with last done task, next open task, resume note, checkpoint and reached; design D4). Print the Tracks block in `formatReport` and in the `tick` output when the tick reaches a checkpoint, with each task shown as `T<n> <text>`. Verify with tests for "Tick reaches it" (both milestones, last and next with text, statuses unchanged) and "No other track" (names the next planned milestone), and confirm the existing report tests still pass unchanged for a roadmap with no checkpoint.

## 3. Continue or switch, and the resume note

- [ ] 3.1 Add `setResume` and the `resume --id <ID> --text <t>` command: one `Resume:` line under `## Notes`, replacing an older one, and creating `## Notes` if it's missing. Verify with tests for "Drafted note kept" and "Older note replaced", plus a check that the other Notes lines survive (spec "Roadmap writes never lose the user's text").
- [ ] 3.2 Add `decide` and the `decide --id <ID> (--continue | --switch-to <ID>) --why <t> [--resume <t>]` command (design D3). It checks everything before writing, refuses when the checkpoint isn't reached, writes the drift entry, clears the checkpoint, and on a switch pauses one milestone, starts the other and saves the resume note. Verify with tests for the "Continue", "Switch" and "No answer yet" scenarios, plus a refused `decide` leaving every file unchanged.
- [ ] 3.3 Update `skills/roadmap/SKILL.md` (design D7): table rows for `checkpoint`, `decide` and `resume`; the "checkpoint reached" moment (show the Tracks block, ask continue or switch once, log the answer); and the resume-note draft on a switch or plain pause (keep, correct or skip). Add eval cases in `evals/roadmap/` for checkpoint reached → one question with both tracks, a switch with a drafted resume note, and a skipped note. Verify `npm run evals` passes.

## 4. Tracks in /kit:status

- [ ] 4.1 In `status.mjs`, build Now rows from `report.tracks` (every active milestone, plus each paused one with a done task or a resume note), with last, next and resume in Left. Skip those IDs in Next and After, and set the "checkpoint reached: continue or switch" status with a `/kit:roadmap` handoff (design D6). Verify with `tests/kit/status.test.mjs` cases for "One active, one paused", "Paused but never started" and "Checkpoint waiting" (no file written), and confirm the existing status tests pass.
- [ ] 4.2 Update `skills/status/SKILL.md` for the track rows and the checkpoint handoff, and add an eval case in `evals/status/` (two tracks with a reached checkpoint → both rows and the `/kit:roadmap` handoff). Verify `npm run evals` passes.

## 5. Integration

- [ ] 5.1 Run `npm test`, `npm run evals` and `npm run smoke:check`; run `npm run smoke` if it recommends one. Verify all pass, and report the smoke:check result to the user.
- [ ] 5.2 In a throwaway copy under `../temp`, recreate the two-track case (an active milestone with a checkpoint after T3, and a paused one), tick T3, run `report` and `/kit:status`, answer with a switch, and rename a milestone with `edit`. Verify the output matches the spec scenarios, and record what you saw in the verify report.

## Workflow follow-up

- `/kit:ready` before `/opsx:apply`.
- After archive: tick M18 T1 and update Now (`/kit:roadmap`).
