---
title: Loose ends
status: Shipped
sources:
  - notes/2026-10-12-next-on-roadmap-and-pending-tasks.md
  - notes/kit-workflow/2026-10-17-kit-workflow-happy-path-real-life-and-overview-status-next.md
  - notes/kit-workflow/2026-10-17-roadmap-as-a-kit-skill-drift-and-continuity-and-the-status-t.md
change: loose-ends
---

<!-- Keep it to one or two pages. Every section should help someone decide or build. Write "Unknown" or move it to Open questions rather than guessing. -->

## Problem

Most days of building leave things behind: a check that can only be done somewhere else, friction worked around again, debt seen in use, review findings kept on purpose, cleanup, ideas trimmed out of scope. On 2026-10-17 alone there were about 8, which comes to roughly 40 a week. The kit only has owners for what we're building (the change), what we want (the PRD) and in what order (the roadmap). Nothing owns "noticed while doing something else", so these items end up in chat, in prose inside archived changes, or in notes that look like ideas. Status and next can't see them, and things said in chat but saved nowhere get lost.

**Bet:** if every loose end lands in one file the kit owns, with its kind, where it came from, whether it's important and what it blocks, then the important ones and the blockers show up in `/kit:status` when they matter. The rest wait for a cleanup, without anyone ranking 40 items a week.

## Users

- Me, building with the kit across several projects (ac-workbench, Acme), coming back after time away or finishing a change.
- Later: a kit user whose projects pile up the same deferred work.

## Goals and success measures

- **Goal:** nothing deferred is lost, and the important loose ends and the ones blocking something are in front of me.
- **Measure (yes/no):** after a week of normal use, every loose end from that week is in the file with a kind and an origin, and `/kit:status` shows the important ones and the ones blocking the current work.
- **Must not get worse:** status stays short (one table, loose ends capped like the other sections). Capturing costs me at most one short answer per step, never a form.

## Scope

**In:**
- **Loose ends file** (`knowledge/loose-ends.md`), written only through a script, like the roadmap. It owns items with no other owner. Decisions, PRD questions and roadmap Waiting on you stay where they are.
- Each item has:
  - an ID that is never reused, and a one-line text;
  - a **kind**: check, friction, debt, idea, cleanup or accepted;
  - an **origin**: chat, build, review, verify or note;
  - free **tags**;
  - an **important** marker;
  - optionally **blocks**: the milestone, change or loose end it stands in the way of;
  - the date and a source link;
  - a state: open, done or dropped, with a reason.
- **Importance:** you or the agent can mark an item important. When the agent marks one, it says why.
- **`/kit:status`:** the Tech debt slot becomes **Loose ends**. It shows the important ones and those blocking the current item, plus counts per kind. Accepted items never show.
- **`/kit:next`:** the "Nothing open" count includes open loose ends, and a loose end blocking the current change rides along as a reminder.
- **Capture moments, in one batch per step:** loose ends found during a step (apply, verify, archive, a long chat) are collected, and at the end of the step the agent shows them as one list and asks once which to add.
- **Cleanup (on request):** go through open items and drop the ones no longer relevant, out of scope or never to be done, each with a reason.
- **Analysis:** counts by kind, origin and tag, to see why loose ends pile up.
- **Its own command**, `/kit:loose-ends`. The roadmap report ends with one line: "small things behind the milestones: `/kit:loose-ends`".

**Out (and why):**
- Ranking and time fields ("when", due dates): importance and blockers replace them (user, 2026-10-17).
- Copying decisions, PRD questions or roadmap items into the file: they already have owners, and copies drift.
- Living inside the roadmap: the roadmap only links to it.
- Assumption: items stay in this project's file; nothing is shared across projects.

## Requirements

**Capture**
- Given a step (apply, verify, archive) that left 3 loose ends, when the step ends, then the agent shows the 3 in one list, each with a proposed kind and origin, and asks once which to add; it adds only the ones I pick.
- Given a review finding I choose to keep, when verify ends, then it is in that step's list (kind accepted, origin review).
- Given I say "later" in chat about something with no other owner, when the step ends, then it is in the list with origin chat.
- Given an item that belongs to a change, a PRD or the roadmap, when the agent would list it, then it points to that owner instead.

**Importance and blockers**
- Given a check or friction item that costs time or risks a wrong result, when the agent lists it, then it may propose "important" with a one-line reason; I can accept or remove it.
- Given a loose end that blocks M12, when M12 is current, then `/kit:status` shows it under Loose ends, marked as blocking.

**Seeing them**
- Given an item marked important, when I run `/kit:status`, then it shows with its source.
- Given 30 open ideas, when I run `/kit:status`, then ideas show as one count line, not 30 rows.
- Given accepted items, when I run `/kit:status`, then they don't show; they stay in the file as a record.

**Cleanup**
- Given 40 open loose ends, when I ask for a cleanup, then the agent goes through them by kind, proposes keep or drop for each, and drops only on my yes, with a reason (no longer relevant, out of scope, won't do).
- Given a done or dropped item, when I look at any view except the analysis, then it doesn't show.

**Analysis**
- Given a week of loose ends, when I ask for the analysis, then I see counts by kind, origin and tag, and how many were done, dropped or are still open.

**Rules**
- The file is written only through the script; IDs never change and are never reused.
- Nothing is added, marked important or dropped without my yes.

## UX notes and assets

```
Loose ends (status)
  ! Canvas v1 mismatch: real or not?   check     blocks M12     runs.md (kit-status)
  ! openspec not on agent PATH          friction                 chat 2026-10-17
  + 3 ideas, 2 cleanup, 1 debt  (/kit:loose-ends to see all)
```

End of a step:

```
This step left 3 loose ends. Add which?
  1. [check]    Canvas v1 mismatch: real or not?   important? (proposed: could be a bug in the rule)
  2. [cleanup]  Delete the temp clone
  3. [accepted] C9: count repeats reminder lines
```

Groups by kind: must look at (check, friction), will do anyway (debt), might do (idea, cleanup), nothing to do (accepted).

## Risks

| Risk | How we'd notice | What we'd do |
|---|---|---|
| 40 a week becomes noise | Loose ends section longer than one screen, or I stop reading it | Only important and blocking items as rows; the rest as counts; cleanup |
| The agent marks too much as important | Most open items are marked important | Its reason is shown; I remove the mark; analysis shows the share |
| The end-of-step question gets skipped or rushed | Items I meant to keep are missing later | Keep the list short and pre-filled; one answer adds all |
| Items duplicate an existing owner | The same thing appears twice in status | The script points to known owners |

## Open questions

- None.
