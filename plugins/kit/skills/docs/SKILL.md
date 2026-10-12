---
name: docs
description: Build or refresh this project's docs page (knowledge/docs/index.html) - what's built, why, and what's undecided - from its OpenSpec specs, archived changes and decision records, after drafting the missing or stale notes it needs (per sub-feature "how it works" and "why", a foundation card for a cross-cutting technical choice, the tools inventory) and confirming each with the user. Use when the user asks for the docs page, wants to see what's built, asks to update or rebuild the docs, add a foundation card or the tools inventory, or when /kit:next says the docs page is out of date.
---

# Kit docs

One page per project: products › sub-features, their behaviors as Given/When/Then user stories, the "why" where a decision has depth, foundation cards, a tools inventory, history, and open decisions shown as undecided. The page is rebuilt from sources by a script, at no token cost; this skill only drafts the curated notes the specs don't hold.

Script, run from the project folder. If it prints `error:`, show it and stop.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/docs.mjs" scan --dir . --json
node "${CLAUDE_PLUGIN_ROOT}/scripts/docs.mjs" build --dir .
```

## Steps

1. **Scan:** `docs.mjs scan --dir . --json`. It lists notes that are missing or stale, tools in `package.json` that the inventory doesn't cover (and inventory tools that are gone), the foundation cards found, and whether the page is older than the newest archive.
2. **Nothing to draft** (no missing or stale notes, no unlisted or gone tools): run `build` and say in one line that the page is rebuilt. Ask nothing.
3. **Read the sources** for each item: the capability's `openspec/specs/<path>/spec.md`, the archived changes that touched it (`openspec/changes/archive/*/specs/<path>/`, their `proposal.md` and `design.md`), and its existing note when stale.
4. **Draft**, in these formats, written for the user, not for engineers:
   - **Capability note** `knowledge/docs/<path>.md`:
     ```markdown
     ## How it works, roughly
     <2-4 lines, only when it matters: an approach, a size, a limit>

     ## Why

     - **<requirement name exactly as in spec.md>**: <the reason, one or two lines>. [[<card-slug>]] when a card explains it.
     ```
     A "why" entry only for a decision with depth: it trades something, shapes more than one behavior, or would surprise someone later. Small or preference choices (a colour, a label, a default someone simply liked) get none. An empty Why section is fine.
   - **Tools inventory** `knowledge/docs/tools.md`, grouped by purpose; one tool may be many packages:
     ```markdown
     ## <purpose group>

     ### <tool>
     - packages: <pkg>, <pkg>
     - for: <what it's for>
     - used by: <spec paths>
     - added by: <change>
     - dev: yes|no
     ```
   - **Foundation card** `knowledge/foundations/<slug>.md` (app-wide) or `knowledge/foundations/<product>/<slug>.md`, for a technical choice that shapes more than one sub-feature or trades a limit for a gain:
     ```markdown
     ---
     title: <plain-language claim, e.g. "Storms draws on a canvas">
     status: current
     ---

     ## In short
     ## Why (evidence)
     ## Gives you
     ## Limits you
     ## Revisit if
     ## Affects
     ## History
     ```
     A card that a newer choice replaces stays: set `status: replaced` and `replaced_by: <slug>`, and add a History line.
5. **Show the list first:** "N drafts for you", one line each with its kind and the path it will be written to. Then ask with the **AskUserQuestion** tool, up to 4 per call, calls back to back until all are asked. Options: **Yes** (write it), **Change** (the user says what; redraft and ask again), **Skip**. Show the draft text in the option preview or the question.
6. **Write only the yeses.** A skipped item writes nothing and comes back in the next scan.
7. **Build:** `docs.mjs build --dir .`. Report in one line: what was written, the page counts, any warnings.

## Rules

- Never edit specs, archived changes or `decisions.md`; the page shows them as they are.
- Never write a file the user hasn't said yes to.
- Don't invent reasons. If the sources don't say why, leave the why out.
- Don't commit. During an archive, the archive step decides whether the page goes into the archive commit.
