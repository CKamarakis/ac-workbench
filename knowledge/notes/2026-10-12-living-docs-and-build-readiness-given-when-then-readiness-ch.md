---
title: "Living docs and build-readiness: Given/When/Then, readiness check, docs sync, docs page"
date: 2026-10-12
tags:
  - docs
  - openspec
  - m6
source: voice
---

## Problem (from real use on Toughbubble)

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

## Toughbubble trial

- Testing hasn't started yet on the current Toughbubble change, so it's a ready-made trial for the docs sync: run it before testing and again after, and see what it catches.
- Run on the copy (`Projects/temp/Toughbubble`), not the real repo.

## Backfill: document a project that's already built

Likely a common entry point: people adopt a docs tool after they've built something.

1. Gather sources: PRDs and notes in `knowledge/`, archived OpenSpec changes, test names, routes and screens in the code.
2. Draft the feature tree (capabilities → requirements → scenarios), each marked with its source: from a requirement, from code, from a test.
3. The user confirms per capability. Only confirmed parts become `openspec/specs/`.
4. Show the differences between what the requirements say and what the code does.

- Unverified: whether OpenSpec can already create specs from existing code.
- Where it lives (`/kit:start` on an existing project, or its own command): decide at M6.

## To do

- The user lists the decisions that came up during the Toughbubble apply. They're the input for the readiness check and M6 evidence.
