---
id: M17
title: PRD parts
status: done
notes:
  - notes/2026-10-25-prd-parts-one-prd-split-over-several-files.md
changes:
  - prd-parts
  - worktree-cleanup
---

One PRD can be split over several files: a parent plus parts, each with its own status and its own "PRD changed" check.

## Tasks

- [x] T1 Parent PRD plus part files with `part-of: <parent slug>`; `new-prd --part-of <slug>` creates a part from a short part template
- [x] T2 `list` and `/kit:status` show parts grouped under their parent
- [x] T3 `/kit:next` treats a Ready part like a Ready PRD; "PRD changed after planning" is checked per part and on the parent
- [x] T4 `prd-check`: a part's parent must exist; the parent can be Shipped only when every part is Shipped or dropped (it warns until then)
- [x] T5 `/opsx:propose` from a part records both the part and the parent; roadmap `link --kind prd` accepts a part
- [x] T6 Existing single-file PRDs keep working unchanged
- [x] T7 After the merge back from a worktree, offer to remove the worktree and its branch; on a No, /kit:next reminds once after the archive (change worktree-cleanup)

## Notes
