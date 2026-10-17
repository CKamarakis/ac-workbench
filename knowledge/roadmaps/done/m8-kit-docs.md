---
id: M8
title: Kit docs
status: done
---

The living docs page: what is built, why, and what is undecided.

## Tasks

## Notes

## Before 2026-10-17 (the old roadmap row, kept whole)

- **Change:** `kit-docs`
- **Delivers:** `/kit:docs`: docs page (product → sub-feature → behavior), foundation cards, tools inventory; rebuilt during archive (backfill moved to its own change)
- **Exit criteria:** The page builds for this repo after a full `/kit:docs` run (Toughbubble trial dropped by the user)
- **Status:** **done** 2026-10-12, archived (kit 0.7.0); verify passed (security: 1 low, fixed; code: 10 advisory, 8 fixed); evidence [`kit-docs.md`](../evals/trials/kit-docs.md)

## From the old "Current position"

   - **M8 scope, decided by the user 2026-10-12 before `/opsx:propose`** (on branch `kit-docs`):
     - **Flow: SuperSpec** (the user's choice; `/kit:judge` matched "backfill"). Schema in `openspec/schemas/superspec/`; Superpowers on in `.claude/settings.local.json` only. Restart the session, then `/opsx:propose kit-docs --schema superspec`.
     - **Tree levels:** nested spec folders (`specs/storms/stickies/spec.md`) give product → sub-feature.
     - **Backfill:** not in M8; its own change later.
     - **Foundation cards:** `knowledge/foundations/`; feature history comes from the archived changes.
     - **Cockpit (M5):** stays a separate page.
     - Already confirmed in the explore (note `2026-10-12-living-docs-and-build-readiness-…`, "Explore results"): three-panel layout (tree / behavior / why), user-centric audience, Given/When/Then behaviors, "why" only where a decision has depth, "how it works, roughly" per sub-feature, tools inventory, open decisions shown as undecided.
