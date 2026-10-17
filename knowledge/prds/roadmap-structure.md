---
title: Roadmap structure
status: Ready
sources:
  - notes/kit-workflow/2026-10-17-roadmap-as-a-kit-skill-drift-and-continuity-and-the-status-t.md
  - notes/kit-workflow/2026-10-17-kit-workflow-happy-path-real-life-and-overview-status-next.md
  - notes/2026-10-12-road-to-v1-research-and-decisions.md
  - notes/2026-10-12-next-on-roadmap-and-pending-tasks.md
---

<!-- Keep it to one or two pages. Every section should help someone decide or build. Write "Unknown" or move it to Open questions rather than guessing. -->

## Problem

A product owner comes back to a project after days away and needs to know what the goals are, what's left and what's waiting on them. The roadmap should answer that, but in this repo it's written freehand by the agent each session:
- 36 KB / 133 lines after 18 days, read in full every session.
- 29 drift rows, the longest 1,314 characters; milestone rows up to 1,647.
- Plan, state and history are mixed in one file.
- Finished milestones keep all their detail.
- "Current position" and the north-star table are stale (step 5b still ⬜).
- Order is messy (M7, M8, M6; M12a).
- Tasks are free text.

Other projects, such as Toughbubble, have no roadmap at all. The cost: you lose track, can't trust the file, and nothing can compute "what's left" from it.

**Bet:** if the roadmap has a fixed format, a skill that writes it at set moments, and a script that checks it, then it stays precise as projects grow and other kit commands can read it, because a script enforces the format instead of an agent's memory.

## Users

- **Primary:** the kit's target user, a solo product builder who is the product owner, sets priorities, and comes back to projects after gaps.
- **Secondary:** the Claude agent, which writes the roadmap and reads it at session start.

## Goals and success measures

- **Goal:** open the roadmap, or its report, and within a minute see the goals in order, what's left in the active ones, and the decisions waiting on you.
- **Measure:**
  - This repo's roadmap, moved to the new format, passes the check with no milestone, decision or drift entry lost (counts before and after match).
  - Used on the Toughbubble copy, the user judges it dependable (yes/no).
- **Must not get worse:** the history (drift log, evidence) is kept, and the cost of reading it at session start doesn't grow.

## Scope

**In:**
- A fixed format, one file per milestone (decided 2026-10-17):
  - `knowledge/roadmaps/roadmap.md`: north star, principles, the milestone order (list of IDs), Now in 5 lines or fewer, and "Waiting on you".
  - `knowledge/roadmaps/milestones/<id>-<slug>.md`: frontmatter (`id`, `title`, `status`) plus a one-line goal, a task list (`- [ ] T2 …`) and links (notes, PRD, change).
  - `knowledge/roadmaps/done/`: finished milestones move here, whole file kept.
  - `knowledge/roadmaps/drift-log.md`: the drift log, only ever added to.
- Status words: `planned`, `active`, `paused`, `done`, `dropped`.
- A check script, warn only (see Requirements).
- A `/kit:roadmap` skill: create, add item, start, finish, tick task, drift entry, links to notes, PRD and change in both directions, a short report.
- Moving this repo's `docs/roadmap.md` to the new format and location; `CLAUDE.md` points to the new file.
- Optional per project; `/kit:start` asks.

**Out (and why):**
- Backlog: its own change (4); kept separate so the roadmap doesn't grow back.
- `/kit:status`: change 3; it reads this format.
- Dependencies, blockers, priority scores: later, when a real case needs them (user).
- Ticket systems and MCPs: user said no; a high-level view in the repo is enough.
- Automatic reordering: only the user sets order.
- One YAML file with a generated view (option C): declined; one large file grows and conflicts when features run in parallel.

## Requirements

*Create*
- Given a project with no roadmap, when I run `/kit:roadmap`, then it offers to create one from the template and writes nothing until I say yes.
- Given a new or re-synced project, when `/kit:start` runs, then it asks whether I want a roadmap (optional) and creates nothing on a no.
- Given a project with no roadmap, when I use any other kit command, then nothing asks for or needs a roadmap.

*Add items (both directions)*
- Given a roadmap, when I name a goal that has no notes yet, then after my yes it adds a milestone file with a new ID, a short title, status `planned` and a one-line goal, and adds the ID to the order.
- Given notes that exploring turned into a goal, when I agree it's a milestone, then it's added with links to those notes.
- Given a milestone, when a PRD or change is made for it, then the milestone links to it, and the PRD or change links back.

*Progress*
- Given an active milestone with tasks, when a change linked to one of them is archived, then the skill offers to tick that task.
- Given every task ticked, when I confirm the milestone is finished, then its status becomes `done` and its file moves to `roadmaps/done/`; the order keeps a one-line entry.

*Order and IDs*
- Only the user changes order or scope. The skill proposes and writes on a yes.
- IDs never change and are never reused; the order is a list in `roadmap.md`, separate from the IDs.

*Drift and continuity*
- Given a branch or change not linked to any milestone, when the check runs, then it's listed as unplanned work, and the skill offers a drift entry (date, what, why, on-plan alternative, impact, decided by).
- Given work that stops (archive or merge), then the skill offers an updated Now, 5 lines or fewer.
- Given a Now older than the latest commit, when the check runs, then it reports Now as stale.

*Waiting on you (pending decisions)*
- Each pending decision is linked to a milestone, or marked general, and keeps the date it was proposed as plain information.
- Given pending decisions, when I look at the roadmap report or status, then those linked to the active or next milestone show under "Blocking now"; the rest show as a count under "Later", listed in full in the report.
- Given I reorder milestones, then the decisions move between "Blocking now" and "Later" with them.
- Decisions are never marked old by age: the user may leave a project for weeks.

*Check script (warn only)*
- It never blocks any step, including a release.
- The skill runs it after every write; anything broken is shown with the fix offered.
- **Broken** (shown first): a milestone file without `id`, `title` or `status`; an unknown status word; a duplicate ID; an ID in the order without a file, or a file missing from the order; a task line in the wrong shape; an active milestone with no tasks.
- **Tidy-up** (a reminder line, with an offer to fix on a yes): `roadmap.md` over 150 lines or a row over 300 characters; a finished milestone not yet moved to `done/`; a stale Now. Nothing is trimmed without a yes.

*Report*
- Given a roadmap, when I ask for it, then I see a short report: milestones in order with status and tasks left, Now, and Waiting on you. `/kit:status` reuses it later.

*Move this repo*
- Given today's `docs/roadmap.md`, when it's moved, then the counts of milestones, drift entries and pending decisions match before and after, and the result passes the check.

## UX notes and assets

```
top-down:   goal --> roadmap item --> notes --> explore --> PRD --> change
bottom-up:  notes --> explore --> "this is a goal" --> roadmap item
loop:       change archived --> tick task --> Now updated --> report to user
```

```
knowledge/roadmaps/
  roadmap.md            north star, principles, order, Now, Waiting on you
  drift-log.md          only added to
  milestones/           active and planned (about 3-10 files)
    m12-toughbubble-proof.md
  done/                 finished milestones, whole file kept
```

A milestone file:
```markdown
---
id: M12
title: Toughbubble proof
status: planned
---
Prove the kit on a real project.

- [x] T1 Upgrade to the current kit
- [ ] T2 One real feature end to end, with time and tokens

Links: notes/kit-workflow/… · change: (none yet)
```

## Risks

| Risk | How we'd notice | What we'd do |
|---|---|---|
| Format too rigid for real life, so the user stops using it | Hand edits often fail the check | Loosen the rules after the Toughbubble trial |
| Moving loses history | Counts before and after don't match | Keep the old file until the counts are checked |
| Size limits nag | Tidy-up lines on every run | Tune 150 lines / 300 characters after the Toughbubble trial |
| Agent forgets to write at set moments | The check flags Now as stale | `/kit:next` reminds; maybe a hook later |
| Many milestone files in a long project | `milestones/` grows past ~10 files | Finished ones move to `done/`; reconsider if it still grows |

## Open questions

All eight were answered by the user on 2026-10-17 (location, size limits, status words, format, warn vs block, pending decisions by relevance, finished milestones, `/kit:start` asks); see Scope and Requirements.

- None.
