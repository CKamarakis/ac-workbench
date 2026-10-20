---
title: Next on Roadmap and Pending Tasks
date: 2026-10-12
tags:
  - kit-next
  - cockpit
  - prioritizing
source: voice
---

**Need:** keep track of what I said I'd do, and choose what's next myself, without `/kit:next` turning into a wall of reminders. With ~11 open problems, every "later" item riding along on each suggestion gets noisy.

**Idea**
- `/kit:next` stays short: one step from the flow, plus at most one summary line, e.g. "7 things waiting – `/kit:next --all`".
- `/kit:next --all` lists everything put off, grouped by kind:
  - PRD open questions answered "Later";
  - decisions marked `later` in a change's `decisions.md`;
  - parked notes;
  - the roadmap's next actions.
- Order hints only: "blocks another item", "almost done", how long it has waited. The user picks (AskUserQuestion) and it routes to the right skill. The kit never decides the order.
- A visual board of the same list fits the M5 cockpit (`kit-overview-feedback`).

```
Next: /kit:verify build-readiness        ← the flow
Waiting (7)                               ← your list, you pick
  PRD questions   sidebar (4)             Draft, 0 days
  Decisions       acme-canvas D3 later  3 days
  Notes parked    mcp-connector (2)       4 days
  Roadmap         M5 cockpit, M8 docs
```

**Open question:** read the list from where things already live (PRDs, `decisions.md`, notes, roadmap), or keep one backlog file? Leaning: read the existing places, so there's nothing to keep in sync.

**When:** decide at M6 whether this is part of the M5 cockpit or its own change. Context: came up 2026-10-12 after `/kit:prd` gained "open questions now or later" (build-readiness 6.2).
