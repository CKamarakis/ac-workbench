---
id: M2
title: PRD pipeline
status: done
---

Capture notes and shape them into PRDs in the knowledge folder.

## Tasks

## Notes

## Before 2026-10-17 (the old roadmap row, kept whole)

- **Change:** `prd-pipeline`
- **Delivers:** `/kit:capture`, `/kit:prd`, `knowledge/` folder via `/kit:start`, PRD-aware `/kit:next`
- **Exit criteria:** An idea dictated by voice ends as a Ready PRD in a project's `knowledge/prds/`, and `/opsx:propose` in that project uses it
- **Status:** **done**: `prd-pipeline` and `prd-pipeline-followups` built (kit 0.3.0) and archived 2026-10-07

## From the old "Current position"

2. **Done 2026-10-07:** [`prd-pipeline-followups`](../openspec/changes/archive/2026-10-07-prd-pipeline-followups/) (kit 0.3.0). PRDs newest first; `.txt` import; `/kit:start` asks one question with a three-part summary; context7 through `npx` (no sign-in); a README. Archived 2026-10-07 with the other two.
   - Still open from the trials (`evals/trials/prd-pipeline-live.md`):
     - **parked** (user): keeping loose notes manageable, decided after real use;
     - **idea:** offer to tidy hand-made notes that have no frontmatter;
     - **check in M6:** a Ready PRD outranks an active change in `/kit:next`.
   - Test bed: `Projects/temp/Acme` (a copy), before touching the real Acme.
   - **M6 input** (build-readiness trial, 2026-10-12): a `/kit:start` re-sync can't update the routing alone; it bundles tool installs with file changes, so the only way to skip an install is Cancel.
