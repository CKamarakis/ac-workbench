---
id: M17
title: PRD parts
status: active
notes:
  - notes/2026-10-25-prd-parts-one-prd-split-over-several-files.md
---

One PRD can be split over several files: a parent plus parts, each with its own status and its own "PRD changed" check.

## Tasks

- [ ] T1 Parent PRD plus part files with `part-of: <parent slug>`; `new-prd --part-of <slug>` creates a part from a short part template
- [ ] T2 `list` and `/kit:status` show parts grouped under their parent
- [ ] T3 `/kit:next` treats a Ready part like a Ready PRD; "PRD changed after planning" is checked per part and on the parent
- [ ] T4 `prd-check`: a part's parent must exist; the parent can be Shipped only when every part is Shipped or dropped (it warns until then)
- [ ] T5 `/opsx:propose` from a part records both the part and the parent; roadmap `link --kind prd` accepts a part
- [ ] T6 Existing single-file PRDs keep working unchanged

## Notes
