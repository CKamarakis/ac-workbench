---
name: roadmap
description: Keep this project's roadmap (knowledge/roadmaps/) - goals in order as one file per milestone, what's left, what's being worked on now, the decisions waiting on the user, and a drift log - and show it as a short report. Create one (optional), add or reorder milestones, start, pause, finish or drop one, tick tasks, link notes, PRDs and changes, update Now, record a drift entry or an answered decision, and check it's in good condition. Use when the user asks for the roadmap, the plan, the order of work, what's left or waiting, wants to add or reprioritise a goal, or after a change is archived or a branch merged.
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

`report` shows milestones in order with tasks left, Now, and Waiting on you (Blocking now: the current milestone and the next one, plus general items; Later: the rest). Show it as printed, in a short table if that reads better, with broken findings first. Add `check` findings (tidy-up, unplanned work) in one line each. No roadmap yet: say it's optional and offer to create one.

## Writes (each one: show what changes, then apply on a yes)

| User wants | Command |
|---|---|
| A roadmap | `new` (templates; then help fill North star and Principles in their words) |
| A goal, with or without notes | `add --title <t> --goal <one line> [--after <ID> \| --before <ID>] [--notes notes/a.md,...]` |
| Tasks for it | `task --id <ID> --text <t>` per task |
| Start, pause, finish, drop | `status --id <ID> --to active\|paused\|done\|dropped` (done/dropped move the file to `done/`) |
| A task done | `tick --id <ID> --task T<n>` |
| A different order | `order --ids <all IDs in the new order>` |
| Now updated | `now --text "<up to 5 lines>"` |
| A decision for later | `wait --milestone <ID\|general> --question <q>` |
| A decision answered | `answer --match <words of the question> --answer <a>` (moves it to the drift log) |
| A link | `link --id <ID> --kind notes\|prd\|changes\|branches --value <v>` |
| A change of direction | `drift --what <t> --why <t> --alt <on-plan alternative> --impact <t>` |

- **Order and scope are the user's.** If you think the order should change, say so with the reason, and change nothing without a yes. Same for adding, dropping or reshaping milestones.
- **Write in the user's words**, short: a title of 2-5 words, a one-line goal, tasks a test or a person could check.
- A milestone made from notes gets them with `--notes`; a goal with no notes yet is fine too.

## Moments to offer (one line, never pushy)

- **A PRD or change is made for a milestone:** offer `link` (`--kind prd` or `--kind changes`) and a `Milestone: <ID>` line in the PRD or the proposal.
- **A linked change is archived, or a branch merged:** offer to tick the matching task and update Now. `check` reports "Now may be stale" at these moments.
- **Work goes off the plan:** offer a drift entry (what, why, the on-plan alternative, impact).
- **`check` lists unplanned work** (an active change no milestone links to): offer to link it, or a drift entry.

## Rules

- Show what a write will say in full in your message first. Never put that text in an option preview (the preview box cuts long text).
- Never edit the roadmap files by hand, and never rewrite or delete a drift-log row.
- IDs never change and are never reused; reorder with `order`, not by renaming.
- The check warns and never blocks. Don't hold up other work over a finding.
- Don't commit. Committing is the user's choice.
