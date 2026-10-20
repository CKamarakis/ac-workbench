---
title: "Living docs and build-readiness: Given/When/Then, readiness check, docs sync, docs page"
date: 2026-10-12
tags:
  - docs
  - openspec
  - m6
source: voice
---

## Problem (from real use on Acme)

A big feature ends up with so many requirements and behaviors that they're hard to track. Requirements change while testing (some didn't work and were adjusted), and `design.md` and the other change files aren't kept up to date during the build. Also, many decisions only came up during apply that weren't thought of at PRD time.

Wanted: documentation like API docs. Each feature is an entity with sub-features and specific behaviors (a tree), plus a record of the decisions and why things are the way they are. Ideally rendered as a simple browsable page.

## Ideas

1. **Given/When/Then everywhere.** User stories and use cases in the PRD written as Given/When/Then, carried into the OpenSpec scenarios (they're WHEN/THEN today; add GIVEN). Unverified: does `openspec validate` accept a GIVEN line?
2. **Readiness check before `/opsx:apply`.** Read the PRD, specs, design and tasks as the builder would:
   - list open decisions (missing scenarios: empty, error, loading, permissions, limits; UI states and copy; data shape; TBDs and vague words);
   - list **differences** (PRD vs specs vs design) and **the important points to confirm** even if they look decided (key assumptions, high-impact behaviors);
   - ask them in one batch with clickable options and a recommended choice;
   - write the answers into the specs (as scenarios) or `design.md` (decision + reason).
3. **Docs sync before archive, in `/kit:verify`.** Compare the built diff with the delta specs, `design.md` and `tasks.md`; list mismatches; propose fixes per section through `/opsx:update`; record the result in `verify.md`. Open question: block or warn.
4. **Docs page.** A kit script that renders `openspec/specs/` (via `openspec show <spec> --json`) and the archived `design.md` files as one static HTML page: capability tree, requirements and scenarios, and a Decisions tab per capability.

Pipeline: PRD (G/W/T) → propose → readiness check → apply → verify + docs sync → archive → docs page.

## Tools checked (2026-10-12)

- `openspec view` (1.13.2): a terminal dashboard only, no HTML export. `openspec show --json` gives clean data to build from.
- Log4brains: decision records as a static site; activity slow (last push Dec 2024). https://github.com/thomvaill/log4brains
- Pickles: living docs from Given/When/Then; end of life, tied to .NET/SpecFlow. https://github.com/picklesdoc/pickles
- specre: one Markdown file per behavior; a competing format, skip. https://docs.rs/crate/specre/0.3.2
- No ready-made OpenSpec docs-site tool found (searches were thin).

## Page layout

- The user suggested Swagger UI as the style (https://swagger.io/tools/swagger-ui/): a single column of collapsible sections, one per endpoint. Familiar, but long and with no tree.
- Proposed instead: copy the three-panel layout of Redoc (https://github.com/Redocly/redoc) or Scalar (https://github.com/scalar/scalar). Both are API-only tools, so copy the layout, don't use the tools.
  - left: feature tree (capability → requirement);
  - middle: requirement text and its Given/When/Then scenarios;
  - right: the decisions behind it (from `design.md`) and the change that added it.
- Next step: a rough mockup of both layouts using one real spec from this repo, so the user can pick.

## Acme trial

- Testing hasn't started yet on the current Acme change, so it's a ready-made trial for the docs sync: run it before testing and again after, and see what it catches.
- Run on the copy (`Projects/temp/Acme`), not the real repo.

## Backfill: document a project that's already built

Likely a common entry point: people adopt a docs tool after they've built something.

1. Gather sources: PRDs and notes in `knowledge/`, archived OpenSpec changes, test names, routes and screens in the code.
2. Draft the feature tree (capabilities → requirements → scenarios), each marked with its source: from a requirement, from code, from a test.
3. The user confirms per capability. Only confirmed parts become `openspec/specs/`.
4. Show the differences between what the requirements say and what the code does.

- Unverified: whether OpenSpec can already create specs from existing code.
- Where it lives (`/kit:start` on an existing project, or its own command): decide at M6.

## Explore results (2026-10-12, `/opsx:explore`)

Where these differ from the sections above, these win.

### Confirmed by the user

1. **Docs page:** the three-panel layout (tree / behavior / why).
2. **Audience:** the user, user-centric, not engineering. But high-level technical logic is kept where it matters (an approach, a tool, item dimensions): when it's new, different, or changes what the feature can do.
3. **Tree:** app → product (e.g. Canvas) → sub-features (Stickies, Moving around, Saving, Undo...) → behaviors. **Planned** sub-features come from the PRD and the non-goals list (e.g. auto-arrange → canvas-arrange).
4. **Behaviors in Given/When/Then.** Tested: a `- **GIVEN**` line passes `openspec validate --strict` (1.13.2); the JSON keeps scenarios as `rawText`, so the page splits GIVEN/WHEN/THEN itself.
5. **The "why" only where a decision has depth.** Small or preference decisions get none; an empty why is fine. No deep engineering detail.
6. **Per sub-feature, "How it works, roughly"**, only when it matters. Example, Stickies: drawn on canvas; 200×200 default; stacking order by a sort key so "bring to front" changes one sticky; plain text now, rich text with canvas-items.
7. **Foundations:** plain-language cards for technical choices that shape more than one sub-feature, or trade a limit for a gain. Fields: in short, why (evidence), gives you, limits you, revisit if, affects, history. **Both levels:** per product and app-wide. A replaced card stays, marked with what replaced it and why. Example: "Canvas draws on a canvas" (spike 1: canvas smooth to 2,000 items at 4× throttle; HTML slows at 1,000; SVG collapses on zoom. Limits: screen readers, a text overlay, every item type drawn by hand).
8. **History per feature:** how it changed, including adjustments made during testing.
9. **Tools inventory (app-wide):** grouped by purpose (Acme: 28 deps + 14 dev tools; TipTap alone is 10 packages = 1 tool), with what it's for, which features use it, and the change that added it. **It speaks up twice:**
   - readiness check: a planned new tool → "the inventory already has X for that; reuse it?" If it's truly new, its why goes on a card;
   - docs sync: the `package.json` diff vs the plan → tools added but never planned (Canvas example: `fake-indexeddb` appears in no change doc).
10. **Docs sync sorts what was built:**
    - behavior → spec scenario (always);
    - decision with depth → `design.md` / a foundation card (as well);
    - how the build ran (push cadence, dispatch, test ports) → stays in `apply.md` in the archive, not on the page.
    - Plus a **flag** on anything that changes what the user sees or could lose data: "this is what was built; is it what you want?", answered before the docs are written.
11. **The build rulings in `apply.md` are the docs sync's main input**; the code diff is a backstop.
12. **The readiness check and docs sync warn, never block**, but a decision waiting for the user must be impossible to miss:
    - the decisions are listed first, with a count, each with clickable options and a recommended choice;
    - "Later" is an explicit choice, recorded as open with its date;
    - open decisions come back in `/kit:next`, in the docs sync and at archive;
    - on the docs page an open decision shows as "undecided" on its sub-feature.
    - `/kit:verify`'s existing hard checks (failing tests, high-severity security findings) still block.
13. **Its own command, `/kit:docs`:** the first run backfills an already-built project (sources, a draft tree marked by where each item came from, confirmation per capability, requirements vs code differences); later runs rebuild the docs page. `/kit:start` only mentions it.

### Docs-sync dry run on Canvas (Acme copy, read-only)

- `design.md` and the specs were last changed on 2026-10-10 (`ccb7873`); 29 code commits followed. The build's 16 rulings and 4 visible changes live only in `apply.md`, which says it is overwritten on each apply iteration.
- SuperSpec's verify already spot-checks 5 design decisions against the specs and flags drift, but it samples and writes nothing back.
- Missing behaviors: a corrupt board loads as empty (**flag**); fit on one sticky zooms to ~350%; wheel/pinch over the toolbar zooms the board; undo ends an open text edit.
- Missing decisions: shadows only at ≥50% zoom; split saves (deletes first, 5,000 per chunk); full undo history on each save (revisit in canvas-arrange); speed bar ≤33 ms kept, measured ≈16.8 ms (**flag**: needs sign-off).
- 10 of the 16 rulings are about how the build ran: no docs.

### Proposed defaults (not confirmed)

- Spec folders regrouped by sub-feature (`specs/canvas/stickies/`). Nested paths list, validate and show correctly in OpenSpec 1.13.2 (tested); for Acme, regroup after `acme-canvas` is archived. **Unverified:** whether `/opsx:archive` merges into nested paths.
- Foundation cards and the inventory get a living home (e.g. `knowledge/foundations/`), because `design.md` is frozen at archive.
- Dev-only tools shown smaller than runtime tools in the inventory.

### Still open

- For Acme (not the kit): whether a corrupt board should load as empty, and the speed bar sign-off.

### Test bed

`Projects/temp/Acme`: a fresh clone of the real repo on `feat/acme-canvas` (`3b2f403`), no remote, no `node_modules`. The old copy had already been deleted.

## To do

- The user lists the decisions that came up during the Acme apply. They're the input for the readiness check and M6 evidence.
- Next: `/opsx:propose` at M6 (or earlier, as the user decides), with the roadmap updated in the same commit.
