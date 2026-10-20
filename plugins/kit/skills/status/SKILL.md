---
name: status
description: Show where this project stands in plain words - what it is, what's built, what's under way, what's next, what we said we'd do, and anything that doesn't match between the roadmap, PRDs, OpenSpec and git - then name the item to work on and hand off to /kit:next. Read-only; works with or without a roadmap. Use when the user comes back to a project, asks where things stand, what's built, what to pick up next, or for an overview of the project.
---

# Kit status

The strategic view: **which item** to work on. `/kit:next` is the tactical one: which step inside that item. Status reads every fact from the source that owns it, and **writes nothing**.

## Steps

1. Run from the project folder:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/status.mjs" --dir . --json
   ```
   If it prints `error:`, show it and stop.
2. Read **only** the file named in `overview.description.path` (if any), to say in one or two lines what the project is. Read nothing else.
3. Reply in this shape, short:
   - **Project:** one or two lines from that file. With `overview.description.notDescribed`: say "Project not described yet" and name `overview.description.fix` (the blank context doc to fill). With no file at all: say none was found (`overview.description.looked`) and suggest `overview.description.fix`.
   - **Built:** `built.count` capabilities, then the names in `built.newest`, in plain words.
   - **One table** with the sections in this order: Now, Next, We said we'd do, Loose ends, After. Columns: Section · Item · Left · Status · Source.
     - **Keep it narrow enough for a terminal** (about 100 characters a row): a table wider than the window is shown as stacked "Item: / Left:" records instead. So:
       - Section goes in its own column on every row (short: Now, Next, Said, Loose, After). Never use section names as divider rows.
       - Item in plain words, at most about 40 characters: shorten the `item` title. Milestone IDs, change names and branch names go only in Source.
       - Left is short: for a milestone, the count and the next task ("5 tasks (next: T2)"); never the whole task list. A loose end: its kind.
       - Status short ("paused, 1/6", "blocks M12").
       - Source as a clickable relative link with a short label (`[M12](knowledge/roadmaps/milestones/m12-....md)`, `[L1](knowledge/loose-ends.md)`). In We said we'd do, add the `answer` command (e.g. `/kit:prd`) after it.
     - A section with `more` gets a "+N more" row. An empty section: one row with `note` in Item (e.g. "none yet", or "none").
     - Loose ends: the rows are the important ones and those blocking current work; then, under the table, one line with the `counts` per kind (e.g. "+ 3 idea, 2 cleanup") and `/kit:loose-ends`.
     - Now can hold explore rows (`kind: explore`): Left is the number of open questions, or "ready for a PRD".
     - Next with `unusedNotes`: one line "N notes nothing has read yet (start an explore: `/opsx:explore`)". Never list notes as rows.
     - When rows have an `age` and there's no roadmap, show it as a hint ("waited 16 days"). Never sort or pick by it.
   - **Doesn't match:** only when `mismatches` isn't empty. One line each: what, the sources involved, the fix. Never say which source is right.
   - **Missing:** one line per `missing` entry, with its fix. When `roadmap` is false, mention once that `/kit:roadmap` can set the order (optional).
   - **Last line (handoff):**
     - One item in `handoff.underWay`: "Working on: <item>. Run `/kit:next` for the next step."
     - Several: list them; "Run `/kit:next`; it asks which one."
     - None: name the first of `handoff.candidates` and ask the user to pick the next item, then run `/kit:next`.
     - None and no candidates, with `handoff.fresh` (a new project): offer the two first steps, each with what it's for: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea you already have.

## Rules

- **Use only the facts in the JSON.** No item, count, status or claim of your own. If something seems missing, say the source wasn't found; don't guess.
- **Never write.** No file is created or changed, not even a roadmap or a PRD. To change anything, offer the owning command (`/kit:roadmap`, `/kit:prd`, `/kit:ready`) and let the user decide.
- **Don't decide the order.** The roadmap's order comes from the user; without one, give hints only and let the user choose.
- **Don't work out the step inside the item.** That's `/kit:next`. Don't run it yourself.
