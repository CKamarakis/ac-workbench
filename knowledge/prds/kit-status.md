---
title: Kit status
status: Building
sources:
  - notes/kit-workflow/2026-10-17-kit-status-where-are-we-what-s-built-what-s-next.md
  - notes/kit-workflow/2026-10-17-kit-workflow-happy-path-real-life-and-overview-status-next.md
  - notes/kit-workflow/2026-10-17-roadmap-as-a-kit-skill-drift-and-continuity-and-the-status-t.md
  - notes/2026-10-12-next-on-roadmap-and-pending-tasks.md
change: kit-status
---

<!-- Keep it to one or two pages. Every section should help someone decide or build. Write "Unknown" or move it to Open questions rather than guessing. -->

## Problem

After a week away, or on opening a project for the first time, I don't know what the project is, what's built, what I was working on, or what to pick up next. `/kit:next` and Claude Code's job list show one cut-off line per item with no context, and `/kit:next` only works inside one feature. Things said in chat but saved nowhere get lost.

**Bet:** if `/kit:status` shows one short, plain-words table (what this is, where we are, which item is next), I get back into a project in a minute and pick the next item myself, because it reads what already exists instead of asking me to keep another file.

## Users

- Me, coming back to a kit project (ac-workbench, Toughbubble) after days away.
- A new kit user who just installed or updated the kit in an existing project and wants to see its value straight away.

## Goals and success measures

- **Goal:** I know what the project is, where it stands, and which item to work on next, without reading the roadmap or the git log.
- **Measure (yes/no):** I run `/kit:status` on ac-workbench and on Toughbubble after a kit update and understand where things stand (M12a exit criterion).
- **Must not get worse:** `/kit:next` for an item already under way gives the same step as today. Status stays short: one table, no wall of reminders.

## Scope

**In:**
- One command, `/kit:status`, with an overview block at the top: what the project is and what's built.
- The status table v1: sections Now / Next / We said we'd do / Tech debt / After; columns Item · Left · Status · Source.
- Hybrid: a script (`status.mjs`) collects the facts; the skill writes the plain words.
- Works without a roadmap: says what's missing and how to start (e.g. `/kit:roadmap`).
- Ends with the item to work on plus "run `/kit:next`". Status is strategic (which item); next is tactical (which step).
- `/kit:next`: when no item is under way, it points to `/kit:status` instead of picking one itself.
- Status reads each fact from its owner (single source of truth) and stores nothing:

| Fact | Owner | Copies that can drift |
|---|---|---|
| What's built | OpenSpec main specs + archived changes | PRD "Shipped", docs page, roadmap ticks |
| What's being built now | active OpenSpec change + git branch/commits | roadmap Now |
| Decisions | change `design.md`/decisions; `drift-log.md` for direction | chat, notes |
| Order and priorities | roadmap (the user's) | - |
| What's waiting on me | roadmap Waiting, PRD Open questions, change decisions | - |
| Said we'd do, not planned | backlog (M12a T3); today nowhere | chat |

**Out (and why):**
- Backlog file: M12a T3. Until then "Tech debt" says there's no backlog yet.
- Explore-or-PRD step for a new note: M12a T4 (it belongs to next).
- Technical health checks (e.g. vulnerabilities): later, per the notes.
- Dependencies, blockers, "more important" markers: later, per the notes.
- Assumption: status replaces the earlier `/kit:next --all` idea (the "what's waiting" list), so `--all` is not built.

## Requirements

**Overview**
- Given a project with `PRODUCT.md`, `docs/project-context.md` or a README, when I run `/kit:status`, then the top block says in plain words what the project is and what's built (from specs and archived changes).
- Given a project with none of those files, when I run it, then the overview says what it couldn't find and which command fills the gap.

**Table**
- Given a roadmap, when I run it, then Now shows the current item by its title in plain words (no bare "M12" or branch names), with Left from its task list and a clickable Source link.
- Given a roadmap, when I run it, then Next follows the roadmap's order; other sections are grouped by kind, oldest first.
- Given decisions waiting on me, PRD questions answered "Later", or open decisions in active or archived changes, when I run it, then they show under "We said we'd do", each with its source.
- Given no backlog, when I run it, then "Tech debt" says so in one line.
- Given no roadmap, when I run it, then Now comes from the active change (and its last commit) and Next from Ready PRDs and notes without a PRD, with a one-line hint that `/kit:roadmap` can set the order.
- Given nothing under way and several candidates, when I run it, then it gives order hints only (almost done, blocks another item, how long it has waited) and I choose; the kit never decides the order.
- Given two or three items under way (one active change or branch each, e.g. on different agents), when I run it, then Now lists every one of them, each with its own Left and Source.

**Truth and drift**
- Every line names its owner source (see the table in Scope).
- "Built" comes only from OpenSpec main specs and archived changes, never from a PRD status, the docs page or memory.
- Given two sources that disagree (e.g. roadmap Now names a task but no change or branch is active; a PRD isn't Shipped though its change is archived; a task isn't ticked though its change is archived), when I run it, then a "Doesn't match" list shows each mismatch with its fix (e.g. `roadmap now`, `/kit:prd`), instead of picking one source.
- Given no mismatches, when I run it, then the "Doesn't match" list doesn't appear.
- Status stores nothing and writes nothing; it is computed fresh on every run.

**Handoff**
- Given an item under way or chosen, when status finishes, then the last line names the item and says "run `/kit:next`" as a command to copy.
- Given an active change, a PRD in a flow (Ready, changed since planning, or to mark Shipped) or notes without a PRD, when I run `/kit:next`, then it gives that step, in this order.
- Given nothing open, when I run `/kit:next`, then it shows "Nothing open", how many items are left for later (from builds and PRD questions), and "run `/kit:status` to see what's next, or `/kit:roadmap` to change the order"; it runs nothing by itself.
- Given one item under way, when I run `/kit:next`, then it gives the same step as today.
- Given several items under way, when I run `/kit:next`, then it asks which one, and gives that item's step.

**Tests**
- The script's facts (counts, tasks left, sources, mismatches, what's missing) are covered by unit tests; the skill by eval cases.

## UX notes and assets

Return flow: status -> I agree -> next; or status -> reprioritise (roadmap) -> next.

```
Project   Toughbubble: <one line>. Built: <3-5 items>.
Now       <item in plain words>   Left: ...   Source: ...
Next      ...
We said   ...
Tech debt no backlog yet
After     ...
Doesn't match (1)
  roadmap Now says T2 under way  <- no active change, no branch   fix: roadmap now
-> Working on: <item>. Run /kit:next for the next step.
```

Background: Anthropic's long-running agent harness has each session read the git log, a progress file and a feature list before working (https://anthropic.com/engineering/effective-harnesses-for-long-running-agents); truthboard derives status from git and reports hand-written notes that disagree as "contradicted" (https://pkg.go.dev/github.com/emmanuel-D/truthboard@v0.12.2).

## Risks

| Risk | How we'd notice | What we'd do |
|---|---|---|
| Status grows into a wall of text | The Toughbubble run is longer than one screen | Cap each section; push detail to the Source link |
| A copy (roadmap Now, PRD status, task ticks) disagrees with its owner | The "Doesn't match" list | Fix the copy, never the owner |
| The plain-words summary says something the facts don't | An eval or a run shows a claim the script didn't report | The skill may only use the script's facts; evals check it |
| Status and next disagree on the item | Status says X, next works on Y | Next reads the same "under way" fact as status |

## Open questions

- None.
