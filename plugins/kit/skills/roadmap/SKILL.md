---
name: roadmap
description: Keep this project's roadmap (knowledge/roadmaps/) - goals in order as one file per milestone, what's left, what's being worked on now, the decisions waiting on the user, and a drift log - and show it as a short report. Create one (optional), add or reorder milestones, start, pause, finish, drop or rename one, tick tasks, set a checkpoint to choose between two tracks (continue or switch, with a resume note), link notes, PRDs and changes, update Now, record a drift entry or an answered decision, and check it's in good condition. Use when the user asks for the roadmap, the plan, the order of work, what's left or waiting, wants to add or reprioritise a goal, or after a change is archived or a branch merged.
---

# Kit roadmap

Optional, per project. The roadmap answers: what are the goals, in which order, what's left in each, what's being worked on now, and what waits on the user. **The user owns order and scope; you propose, and write only on a yes.**

```
knowledge/roadmaps/
  roadmap.md       north star, principles, Order (IDs), Now (<= 5 lines), Waiting on you
  milestones/      one file per planned, active or paused milestone (frontmatter id, title, status; tasks T1, T2 ...)
  done/            finished or dropped milestones, whole file kept
  drift-log.md     every change of direction, only ever added to
```

Every write goes through the script, never by hand. Run it from the project folder; if it prints `error:`, show it and stop.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/roadmap.mjs" <command> --dir . [--json]
```
After each write the script prints any **BROKEN** finding; show it with its fix and offer to fix it.

## Report (no writes)

`report` shows milestones in order with tasks left, a **Tracks** block (when two or more milestones are active or paused, or a checkpoint is reached: each with its last done task, next task and resume note), Now, and Waiting on you (Blocking now: the current milestone and the next one, plus general items; Later: the rest). Show it as printed, in a short table if that reads better, with broken findings first. Add `check` findings (tidy-up, unplanned work) in one line each. No roadmap yet: say it's optional and offer to create one.

## Writes (each one: show what changes, then apply on a yes)

| User wants | Command |
|---|---|
| A roadmap | `new` (templates; then help fill North star and Principles in their words) |
| A goal, with or without notes | `add --title <t> --goal <one line> [--after <ID> \| --before <ID>] [--notes notes/a.md,...]` |
| A milestone renamed, or its goal reworded | `edit --id <ID> [--title <t>] [--goal <g>]` (keeps the ID, file name, tasks and links; a new title is logged in the drift log) |
| A point to choose between tracks again | `checkpoint --id <ID> --after T<n>` (default) or `--archive <change>`; `--clear` removes it |
| The answer at a reached checkpoint | `decide --id <ID> --continue --why <t>`, or `decide --id <ID> --switch-to <ID> --why <t> [--resume <t>]` (logs the answer, clears the checkpoint; a switch pauses one and starts the other) |
| A note on where a paused milestone stopped | `resume --id <ID> --text <t>` (the one `Resume:` line under its Notes) |
| Tasks for it | `task --id <ID> --text <t>` per task |
| Start, pause, finish, drop | `status --id <ID> --to active\|paused\|done\|dropped` (done/dropped move the file to `done/`) |
| A task done | `tick --id <ID> --task T<n>` (writes `(done <date>)`; `--undo` reopens it, also a dropped one) |
| A task not doing any more | `drop-task --id <ID> --task T<n> --reason <r>` (it stays, marked `- [-]` with the date and reason, and no longer counts as left) |
| A task's wording | `edit-task --id <ID> --task T<n> --text <t>` (pass the text without the `T<n>` number) |
| A different order | `order --ids <all IDs in the new order>` |
| Now updated | `now --text "<up to 5 lines>"` |
| A decision for later | `wait --milestone <ID\|general> --question <q>` |
| A decision answered | `answer --match <words of the question> --answer <a>` (moves it to the drift log) |
| A link | `link --id <ID> --kind notes\|prd\|changes\|branches --value <v>` (a PRD as `<slug>`, `<slug>/<part>` or its path; one that doesn't exist is refused) |
| A change of direction | `drift --what <t> --why <t> --alt <on-plan alternative> --impact <t>` |

- **Order and scope are the user's.** If you think the order should change, say so with the reason, and change nothing without a yes. Same for adding, dropping or reshaping milestones.
- **Write in the user's words**, short: a title of 2-5 words, a one-line goal, tasks a test or a person could check.
- A milestone made from notes gets them with `--notes`; a goal with no notes yet is fine too.

## Moments to offer (one line, never pushy)

- **A PRD or change is made for a milestone:** offer `link` (`--kind prd` or `--kind changes`) and a `Milestone: <ID>` line in the PRD or the proposal.
- **A linked change is archived, or a branch merged:** offer to tick the matching task and update Now. `check` reports "Now may be stale" at these moments.
- **A checkpoint is reached** (`tick`, `check` or `report` prints "Checkpoint reached", also after an archive or merge): show the Tracks block as printed, each track's last done and next task with their text and its resume note, then ask **once**: "Continue <X> or switch to <Y>?" (with one track only, Y is the "Other choice" line). Never switch on your own, and if the user moves on without answering, write nothing; it stays reached.
  - **Continue:** `decide --continue --why <their reason>`. Then offer once, skippably, to set the next checkpoint on it ("Set the next checkpoint after T5?").
  - **Switch:** first draft the resume note for the milestone being left, from its last done task, next task and any open linked change, each task by number and text, e.g. `stopped after T3 List view; next T4 Save to the API; open change a-api`. Show it and ask: keep, correct or skip. Then `decide --switch-to <ID> --why <reason> [--resume <the note>]` (no `--resume` when skipped), and offer to update Now.
- **A milestone is paused without a checkpoint:** offer the same drafted resume note (`resume --id <ID> --text <t>`), keep, correct or skip.
- **More than two milestones active:** `check` says so in one tidy-up line. Mention it once; never block.
- **Work goes off the plan:** offer a drift entry (what, why, the on-plan alternative, impact).
- **`check` lists unplanned work** (an active change no milestone links to): offer to link it, or a drift entry.

## Rules

- Show what a write will say in full in your message first. Never put that text in an option preview (the preview box cuts long text).
- Never edit the roadmap files by hand, and never rewrite or delete a drift-log row.
- IDs never change and are never reused; reorder with `order`, not by renaming. Rename with `edit` (never drop and re-add a milestone to rename it).
- The check warns and never blocks. Don't hold up other work over a finding.
- Don't commit. Committing is the user's choice.
