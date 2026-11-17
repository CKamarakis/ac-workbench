# Design

## Context

- `plugins/kit/scripts/roadmap.mjs` is the only writer of the roadmap. Each write is a small exported function (`setStatus`, `tick`, `editTask`, `addDrift` ...) that returns the broken findings after it, and `run()` maps CLI commands onto them. Milestone frontmatter is read and written with `parseFrontmatter` / `writeFrontmatter` from `knowledge.mjs`. The goal is the first plain line of the body, not a frontmatter field.
- `reportRoadmap` picks exactly one `current` milestone (the first `active` one, else the first open one). It already lists the tasks left for every open milestone, but by number and text of the open ones only, not the last done task.
- `gitFindings` already finds archived changes and merges since the last roadmap commit (the stale-Now check). Archive detection for a checkpoint can reuse the archive folder listing.
- `plugins/kit/scripts/status.mjs` builds Now from `report.current` plus active changes, and Next/After from the rest of the order (`nowRows`, `nextAndAfter`).
- The skills (`skills/roadmap/SKILL.md`, `skills/status/SKILL.md`) do the asking. The scripts only report facts and apply writes.

## Goals / Non-Goals

**Goals:**
- Every new write goes through `roadmap.mjs`, is shown first and applied on a yes, like the existing writes.
- Checkpoint state lives in the milestone file, so it survives sessions and is visible to the user.
- Existing roadmaps without the new fields read, check and report exactly as before.

**Non-Goals:**
- No `track:` grouping field and no cross-project view (proposal: a track is an active or paused milestone).
- No hook that runs the checkpoint question automatically. The question is asked by `/kit:roadmap` at its existing moments, and `/kit:status` points to it.
- No change to how `current` is picked for Waiting on you (Blocking now stays as specified).

## Decisions

**D1. A checkpoint is one frontmatter field.** `checkpoint: T3` (after a task) or `checkpoint: archive <change>` (after an archive). One per milestone. It is cleared when the user answers.
- Why: a field survives task edits, and it's readable in the file. Task numbers never change, so `T3` stays valid.
- Alternatives: a marker comment on the task line (lost on `edit-task`, and invisible in the report); a list of checkpoints (no need yet).

**D2. "Reached" is computed, never stored.** `T<n>` is reached when that task is ticked. `archive <change>` is reached when `openspec/changes/archive/*-<change>/` exists. Because the user's answer clears the field, there's no "answered" state to keep in sync.
- Why: no second source of truth, and unticking `T3` makes it not reached again, which is correct.
- Alternative: a `reached: <date>` field written on tick. That would go stale when an archive happens outside the kit.

**D3. New commands.**
- `edit --id <ID> [--title <t>] [--goal <g>]`: rewrites the title in frontmatter and/or the goal line in place. A title change calls `addDrift` with `what: "<ID> renamed: <old> -> <new>"`, `by: user`.
- `checkpoint --id <ID> (--after T<n> | --archive <change> | --clear)`: validates that the task exists and isn't dropped. `--archive` doesn't require the change to exist yet, since it may not have been made.
- `decide --id <ID> (--continue | --switch-to <ID>) --why <t> [--resume <t>]`: the answer. It writes the drift entry ("Checkpoint <ID> after <T3|archive x>: continued <ID>" / "switched to <ID2>"), clears the checkpoint, and on a switch sets `<ID>` to paused and `<ID2>` to active, plus the resume note when given. It refuses when the checkpoint isn't reached. One command, so the drift entry, statuses and cleared field can't drift apart.
- `resume --id <ID> --text <t>`: sets or replaces the single `Resume:` line under `## Notes`, for a plain pause with no checkpoint.
- Why `decide` over reusing `status` + `drift`: three writes the user would otherwise have to approve separately, with a risk of half-done switches.

**D4. A track view in the report.** `reportRoadmap` gains `tracks`: every `active` or `paused` milestone, each with `last` (the highest-numbered done task), `next` (the lowest-numbered open task), `resume`, `checkpoint` and `reached`. Plus `checkpoints`: the reached ones. `formatReport` prints a "Tracks" block before Now when there are two or more tracks, or any reached checkpoint. `tick` output adds the same block when its tick reaches a checkpoint.
- "Last done" comes from the tick date (D8), with the highest number breaking ties and standing in for tasks ticked before this change.

**D8. Tick writes a done date** (ready decision D1, 2026-11-17). `tick` writes `- [x] T<n> <text> (done <YYYY-MM-DD>)`, and `--undo` strips it. The parser treats the `(done ...)` suffix like the drop note: it goes into `t.doneDate`, not `t.text`, so `edit-task`, the report and evals see the same text as before. Undated done tasks stay valid, with no finding.
- Why: the user wants "last done" to be the task actually done last, not a guess from its number.
- Alternatives: the highest number only (simpler, but wrong when tasks are done out of order); a full timestamp (more noise in a hand-read file than a day's precision is worth).

**D9. Rename keeps the file name** (ready decision D2). `edit --title` changes only the frontmatter. The old slug stays in the file name, so every link and git history path keeps working. Like a GitHub milestone, the ID is the key and the title is a label.

**D10. `decide` guards and the follow-up offer** (ready decisions D5, D6). `decide --switch-to` refuses a `done` or `dropped` milestone, or the same ID, with an error and no write. To go back to a finished one, set its status first. After `--continue`, the skill offers once, skippably, to set the next checkpoint on that milestone.

**D5. The check gains three findings.** A malformed `checkpoint:` (broken), a checkpoint naming a missing or dropped task (broken), and more than two `active` milestones (tidy-up). "Checkpoint reached" is reported as a note line, not a finding: it's a moment, not something to fix.

**D6. Status reads `report.tracks`.** `nowRows` emits a row per track instead of only `report.current`. A paused milestone counts when it has a done task or a resume note (spec: Tracks in Now). `nextAndAfter` skips IDs already in Now. A reached checkpoint sets the row status to "checkpoint reached: continue or switch", and the handoff names `/kit:roadmap`.

**D7. Skill text.**
- `/kit:roadmap`: new table rows for `edit`, `checkpoint`, `decide` and `resume`. A new moment: "a checkpoint is reached". Show the track block, ask "Continue X or switch to Y?" once, and on switch draft the resume note from `last`, `next` and open linked changes, then keep, correct or skip. Also offer the resume note on a plain pause.
- `/kit:status`: describes the track rows and the checkpoint handoff.

**D11. Rules found at verify** (the review against the spec and the code review, 2026-11-17; fixed in `b39ad0a`).
- **The goal is the first plain line before any heading.** Before this, a milestone with no goal took its first note or link line as the goal, and `edit --goal` overwrote it. Lines inside a multi-line comment are skipped.
- **The resume note is read and written only under `## Notes`.** A `Resume:` line in another section is the user's own text and stays. The write touches only the Notes section, not spacing elsewhere.
- **A switch pauses only an active source.** A planned source (one whose archive checkpoint was reached before work started) stays planned, so it doesn't show as a paused track that never started.
- **A switch target needs a task,** and a finished source is refused. Both are checked before writing, like every other write, so a switch never leaves the roadmap broken.
- **Re-ticking a done task changes nothing:** no new date and no second checkpoint question. A re-tick is usually a mistake, and dating an old undated task would make it the "last done" wrongly.
- **"Other choice" is the next planned milestone after the track**, falling back to the first planned one. The milestone that comes next in the order is the natural alternative.
- **Callers pass the archived change names to `reportRoadmap`** (`report`, `check`, `tick`, `/kit:status`, `/kit:next`). The parser has the knowledge folder, not the project folder, so it can't find `openspec/changes/archive` on its own.
- **Status Left for a track:** the last done task, then every open task (the first is next), then the resume note. Every open task is listed, not only the next one, so the existing "Project with a roadmap" scenario still holds.

## Risks / Trade-offs

- [Archive-reached depends on `/kit:roadmap` running after `/opsx:archive`, and that isn't reliable today (unverified)] → `/kit:status` and `check` also show it, so the next look at the project catches it.
- [Tasks ticked before this change have no date] → For those, the highest number stands in, and the task is named by its text so the user can tell. The check never asks for dates to be backfilled.
- [A `(done ...)` suffix typed by hand in the wrong shape] → It stays part of the text. The check doesn't flag it, since it's harmless.
- [`decide` writes several things at once] → The skill shows the full write first, as with every write. The function checks everything before writing anything (as `setStatus` does for moves).
- [Status Now grows with more tracks] → The existing 5-row cap and "+N more" still apply. The cap warning nudges toward two tracks.

## Migration Plan

- No migration. Both new fields (`checkpoint:` and the `Resume:` line) are optional. Rollback is reverting the kit; a leftover `checkpoint:` field is then ignored by the old parser (it keeps unknown frontmatter).

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-11-17. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | high | Changes the milestone task-line format (done date), adds roadmap.mjs commands and changes report/tick output that status.mjs and next.mjs read; two specs |
| Undo | low | Reverting the commits undoes it; dated task lines still parse on the old kit as task text |
| Safety | low | No secrets, permissions, hooks or network writes |

- **Recommended:** scenario-to-test check, worktree for the build, review against the spec, edge-case probes, medium security findings block, your OK before merge
- **Chosen:** scenario-to-test check, worktree for the build, review against the spec, edge-case probes, medium security findings block, your OK before merge

<!-- kit-safeguards-data {"date":"2026-11-17","ratings":{"reach":{"level":"high","why":"Changes the milestone task-line format (done date), adds roadmap.mjs commands and changes report/tick output that status.mjs and next.mjs read; two specs"},"undo":{"level":"low","why":"Reverting the commits undoes it; dated task lines still parse on the old kit as task text"},"safety":{"level":"low","why":"No secrets, permissions, hooks or network writes"}},"recommended":["scenario-check","worktree","spec-review","probes","security-weighted","user-ok"],"chosen":["scenario-check","worktree","spec-review","probes","security-weighted","user-ok"]} -->
