---
title: Explore stage in the flow
status: Shipped
sources:
  - notes/kit-workflow/2026-10-17-kit-workflow-notes-first-explore-before-prd.md
  - notes/kit-workflow/2026-10-17-kit-workflow-happy-path-real-life-and-overview-status-next.md
change: explore-stage
---

<!-- Keep it to one or two pages. Every section should help someone decide or build. Write "Unknown" or move it to Open questions rather than guessing. -->

## Problem

The kit's flow is capture -> explore -> PRD -> propose -> ready -> apply -> verify -> archive, but `/kit:next` only knows the part from the PRD on. Explore leaves no trace: its decisions live in chat until a PRD is written, so next can't tell "never explored" from "explored, two questions left" from "ready for a PRD". The one notes rule it has ("notes, no PRD -> `/kit:prd`") skips explore and treats notes as to-dos, while a note is only context that can feed several things. Outside a flow, next says "run `/kit:status`" even when the roadmap already says what's next.

**Bet:** if explore leaves a small record (the notes it read, the decisions, the open questions), next can name the right stage from explore to archive, and with nothing open it can follow the roadmap's order, so I never have to work out the next stage myself.

## Users

- Me, working through the flow on ac-workbench and Toughbubble, often across several sessions per item.

## Goals and success measures

- **Goal:** inside a flow, `/kit:next` names the next stage, including the explore stages; outside a flow, it names the next roadmap step.
- **Measure (yes/no):** on the next item I start (M12 on Toughbubble), next gives the right stage at every point from the first explore to archive, without me correcting it.
- **Must not get worse:** next never jumps from notes to a PRD, never suggests acting on a note, and never writes the roadmap.

## Scope

**In:**
- **Explore record** `knowledge/explore/<slug>.md`, written only through a script: a title; `sources` (the notes it read; one note can be in several records); decisions, one line each; open questions; a state (`exploring`, `ready-for-prd`, `in-prd`); and the PRD it fed, once there is one.
- **End of an explore:** with plain `/opsx:explore`, the agent offers at the end to save or update the record (new decisions, questions answered or added), on my yes. A routing-block rule does this; OpenSpec's explore skill is not changed.
- **`/kit:prd`** drafts from an explore record (its decisions and its notes), links it, and sets it to `in-prd`.
- **`/kit:next` inside a flow:** an explore record with open questions -> "continue `/opsx:explore`: X, Y"; a record ready for a PRD -> `/kit:prd`; then the existing PRD and change stages, unchanged.
- **`/kit:next` outside a flow, with a roadmap:** the current milestone's next open task ("Next on the roadmap: M12a T4 ...; start with `/opsx:explore`"); when the current milestone is all done, "M12a is done. Next: M12 ...; mark M12a done (`/kit:roadmap`)". Next only names the step; roadmap writes stay with `/kit:roadmap` on my yes.
- **`/kit:next` outside a flow, no roadmap:** offers the Ready PRDs, or `/kit:status`.
- **Remove** the next rule "notes, no PRD -> `/kit:prd`".
- **`/kit:status`:** explore records that are `exploring` or `ready-for-prd` count as items under way.

**Out (and why):**
- Next acting on notes: notes are input that explore reads (explore 2026-10-17).
- "New notes since an explore": later (loose end L14).
- A kit skill wrapping explore: plain `/opsx:explore` works fine (user, 2026-10-17).

## Requirements

**Explore record**
- Given an explore on 3 notes that ends with 4 decisions and 2 open questions, when it ends, then the agent shows the record and saves it on my yes, state `exploring`.
- Given a record whose last open question was answered in a later explore, when that explore ends, then the record is updated and its state becomes `ready-for-prd`.
- Given a record, when `/kit:prd` drafts from it, then the PRD's sources include the record's notes, the record links the PRD, and its state is `in-prd`.

**Next inside a flow**
- Given a record `exploring` with open questions "X" and "Y", when I run `/kit:next`, then it says to continue `/opsx:explore` and names X and Y.
- Given a record `ready-for-prd`, when I run `/kit:next`, then it says `/kit:prd`, naming the record.
- Given notes but no explore record and nothing else open, when I run `/kit:next`, then it does not suggest `/kit:prd` or anything about the notes.

**Next outside a flow**
- Given no flow open and roadmap milestone M12a active with T4 open, when I run `/kit:next`, then it names M12a T4 and suggests starting with `/opsx:explore`.
- Given no flow open and every task of the current milestone M12a ticked, when I run `/kit:next`, then it says M12a is done, names the next milestone M12, and points to `/kit:roadmap` to mark M12a done; it changes nothing.
- Given no flow open and no roadmap, when I run `/kit:next`, then it offers the Ready PRDs, or `/kit:status`.

**Rules**
- The record is written only through the script, on my yes.

## UX notes and assets

```
capture --> explore --> PRD --> propose --> ready --> apply --> verify --> archive
            [explore record: sources, decisions, open questions, state]
```

## Risks

| Risk | How we'd notice | What we'd do |
|---|---|---|
| The record isn't saved at the end of an explore | next says "nothing open" in the middle of an item | The routing rule names the moment; the offer is one question |
| Records go stale (decisions change later) | A PRD contradicts its record | The PRD wins once it exists; the record is `in-prd` and read-only after |
| Several explores open at once | next names one and hides the others | Ask which one, like several active changes |

## Open questions

- None.
