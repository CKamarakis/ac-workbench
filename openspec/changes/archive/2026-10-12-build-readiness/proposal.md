# Proposal

## Why

The first real build with the kit (Acme's Canvas, 2026-10-11) showed two leaks:
- **Decisions surface during apply that the PRD never covered.** The builder decides them alone, and the user finds out while testing.
- **The change's docs stop being updated once the build starts.** Canvas' `design.md` and specs were last edited on 2026-10-10, before 29 code commits. The build's 16 rulings live only in `apply.md`, which says it is overwritten on each apply iteration.

Archive merges the delta specs into the living specs, so whatever is wrong in the change at archive time becomes the project's record. Source: `knowledge/notes/2026-10-12-living-docs-and-build-readiness-given-when-then-readiness-ch.md` (explore results, and a dry run on a Acme copy).

## What Changes

```
 PRD (stories as Given/When/Then)
   |
 /opsx:propose
   |
 /kit:ready ......... NEW: gaps, differences, points to confirm, new tools
   |                  -> decisions asked in one batch; "Later" stays open
 /opsx:apply
   |
 /kit:verify ........ + docs sync: what was built -> specs / design.md
   |                  unplanned tools; "is this what you want?" flags
 /opsx:archive ...... reminded of open decisions (does not block on them)
```

- **New skill `/kit:ready`** (readiness check), run after planning and before apply. It reads the PRD, proposal, specs, design and tasks as the builder would, then lists:
  - gaps: missing scenarios such as empty, error, loading, permission or limit cases; TBDs and vague words;
  - differences between the PRD, the specs and the design;
  - points to confirm, even when they look decided (key assumptions, high-impact behaviors);
  - new tools the change plans to add, checked against the project's dependencies ("reuse what's there?").

  The decisions come first, counted, each with options and a recommended choice. Answers are written into the specs (as scenarios) or `design.md`.
- **Decision record per change** (`decisions.md`, written only through a script). Each item is open, decided or "later". Open items come back in `/kit:next`, in `/kit:verify` and at archive.
- **Docs sync inside `/kit:verify`.** It takes what the build decided (the apply receipt when there is one, the commits and the diff) and sorts each item:
  - behavior → spec scenario;
  - decision with depth → `design.md`;
  - how the build ran → left out.

  It flags anything that changes what the user sees or could lose data, lists dependencies added but never planned, proposes each update, and writes it only on a yes. It is advisory.
- **Warn, never block.** The readiness check, the docs sync and open decisions never stop apply or archive. Verify's existing HARD items (failing tests, high-severity security findings) still block.
- **Given/When/Then:**
  - PRD requirements are written as Given/When/Then user stories;
  - the routing block tells the proposal step to carry them into spec scenarios with a `GIVEN` line when there is a starting state. A `- **GIVEN**` line passes `openspec validate --strict` (OpenSpec 1.13.2, tested 2026-10-12).
- **Lane map:** a new `ready` phase between `plan` and `build`, owned by the kit. `/kit:next` suggests `/kit:ready` when planning is complete and no readiness check has run.

Not in this change (it goes in `kit-docs`, next): the docs page, product and sub-feature tree, foundation cards, tools inventory page, and backfill (`/kit:docs`).

## Capabilities

### New Capabilities
- `build-readiness`: the readiness check before apply, the per-change decision record, the new-tool check, and open decisions resurfacing.
- `docs-sync`: syncing a change's specs and design with what was built, before archive.

### Modified Capabilities
- `quality-gates`: the verify report gains an advisory docs-sync section and open-decision count; the archive gate reminds about open decisions without blocking.
- `skill-routing`: the `ready` phase in the lane map; `/kit:next` suggests it and reports open decisions; the routing block asks for Given/When/Then scenarios.
- `prd-authoring`: the PRD template writes requirements as Given/When/Then user stories.

## Impact

- **New:**
  - `plugins/kit/skills/ready/SKILL.md`;
  - `plugins/kit/scripts/decisions.mjs` and `plugins/kit/scripts/ready.mjs` (zero dependencies, with tests);
  - eval cases under `evals/ready/`.
- **Changed:**
  - `plugins/kit/skills/verify/SKILL.md` and `scripts/verify.mjs` (docs sync scan, report section);
  - `hooks/archive-gate.mjs` (reminder);
  - `scripts/next.mjs` (ready phase, open decisions);
  - `templates/prd.md` and `templates/CLAUDE.md` (routing block);
  - `toolkit.yaml` (phase `ready`, kit owns it), regenerated `data/toolkit.json`.
- **Kit version:** 0.6.0. Projects pick up the routing change on the next `/kit:start` re-sync.
- **Trial:** on `Projects/temp/Acme` (a clone on `feat/acme-canvas`), never on the real repo.
- **Unverified:**
  - a PreToolUse hook adding a message (`additionalContext`) while letting the command run. It's documented (code.claude.com/docs/en/hooks, "Add context for Claude") but not yet tested here; design D6 has a fallback;
  - the apply receipt's format is SuperSpec's and could change.
