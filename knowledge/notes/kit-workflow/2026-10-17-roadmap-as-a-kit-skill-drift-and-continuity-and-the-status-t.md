---
title: Roadmap as a kit skill, drift and continuity, and the status table v1
date: 2026-10-17
tags:
  - kit-workflow
  - roadmap
  - drift
  - kit-status
source: voice
---

**My thoughts (user, 2026-10-17):**
- The roadmap is an important document and must be precise. When I put it in another project, I want a format I know works and can depend on. No winging it each time.
- It should become a skill with specific rules: how to write, when to write, quality checks and guardrails. It must keep working as we add and expand.
- Once the structure is solid, it can become a kit feature: shown to me as a report, and later used to build prioritisation on.
- Later, not now: dependencies, blockers, "more important" markers.
- Drift: how do we handle it as we go, and how do we keep continuity?
- Roadmap structure takes priority over the rest for now.

**Agent review of `docs/roadmap.md` (2026-10-17):** 36 KB / 133 lines after 18 days, read every session. 29 drift rows, the longest 1,314 characters; milestone rows up to 1,647. Plan, state and history are mixed in one file. Finished milestones keep full detail. "Current position" is stale. Order is messy (M7, M8, M6; M12a). Tasks are free text.

**Agent proposal:**
- Short main file with a size cap: north star, principles, milestone table (ID · short title · status · one-line goal), Now in 5 lines or fewer.
- Active milestones have task lists in a fixed shape (`- [ ] T2 …`); finished ones shrink to one line plus an evidence link.
- Drift log in its own file, only added to; the roadmap shows only decisions still waiting.
- IDs never change; order is its own column.
- `/kit:roadmap` skill (when and how to write; only the user changes order or scope) **plus a check script** (size caps, status values, task shape, Now vs git, stale pending items).
- Optional per project. Backlog kept separate from the roadmap.
- Drift: detect it by script (work not linked to a milestone shows as "unplanned work"); pending decisions shown with their age; Now updated when work stops and flagged when stale.

**Status table v1 (agreed to try, then iterate):** sections Now / Next / We said we'd do / Tech debt / After, with columns:

| # | Item | Left | Status | Source |
|---|---|---|---|---|
| 3 | **M12 · Acme proof** | ~~T1 kit update~~ · T2 one real feature · T3 docs on Canvas · T4 SuperSpec verdict · browser-check limits | planned, 1 of 5 done | [roadmap › M12](docs/roadmap.md) |

- Milestones have short titles; "Left" comes from the task list; the source is a clickable link.
- "Next" order comes from the user (roadmap order); other sections are grouped by kind, oldest first.
- Items said in chat but saved nowhere get lost (example: `openspec` not running from agent shells), so status needs a place to catch them.

**Follow-up (user, same day):**
- Agreed with the pushbacks: skill plus a check script; roadmap optional per project; backlog kept separate. "Skill" was my way of saying it needs real structure.
- I want to see how I'd work with it: the skill writes, but the roadmap also has to come back to me as a report I read.
- Keep the flow in mind; it needs flexibility both ways: a roadmap item can exist before any notes, or notes analysed later can produce a roadmap item.
- Where does the roadmap get filled from, and how does it fit the flow?
