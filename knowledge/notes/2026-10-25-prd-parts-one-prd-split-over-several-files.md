---
title: "PRD parts: one PRD split over several files"
date: 2026-10-25
tags:
  - prd
  - kit-update
source: text
---

I checked /kit:prd (skill + scripts/knowledge.mjs). It doesn't support a multi-file PRD as one PRD, but separate per-slice PRDs already work.

## What the kit does today

- Every .md under prds/ is its own PRD, subfolders included (walk is recursive, knowledge.mjs:135). Each file needs its own frontmatter: title, status, and change once it's Building.
- No parent/child link. A file in prds/acme-v1/part-a.md would show up as an unrelated PRD called "part-a".
- new-prd only creates flat files (prds/<slug>.md), so per-slice PRDs would be acme-v1-part-a.md, acme-v1-part-b.md, and so on.
- One PRD across several changes works, one at a time. change holds one name; after each archive it's moved to the next change on your yes.
- The "PRD changed" check covers the whole file (next.mjs:69). In one big PRD, editing the part-c rows while building part-a gives a false "review the plan against it" warning. Per-slice files avoid that.
- prd-check only validates frontmatter and sources, not sections. A short per-slice PRD (scope, requirements, done when) is valid.

## Options for Acme

|                       | One PRD + Slices section   | Pare[cut off in paste]) |
|-----------------------|----------------------------|-------------------------|
| Works today           | yes                        | yes, but th[cut off in paste]g together |
| Reading per change    | whole PRD (~2.5k tokens)   | parent summ[cut off in paste] |
| "PRD changed" warning | false alarms across slices | exact per s[cut off in paste] |
| Status per slice      | no                         | yes (Draft[cut off in paste] |
| Missing               | nothing                    | parent link[cut off in paste] |

Recommendation: parent + per-slice PRDs. It's what you asked for ("update or create PRDs for each"), and it fixes the false warnings. It already works; the kit update below makes it tidy, but you don't have to wait for it.

## Requirements for the kit update (prompt for ac-workbench)

PRD parts: one PRD split over several files

- A PRD can have parts: a parent prds/<slug>.md plus part files, each with frontmatter part-of: <parent slug>.
- new-prd --part-of <slug> creates a part from a short part temp[cut off in paste]ne when, Open questions). The parent keeps Problem, Users, Goals, Out of scope and a Parts table.
- list and /kit:status show parts grouped under their parent, ea[cut off in paste]ange.
- /kit:next treats a Ready part like a Ready PRD; "PRD changed after planning" is checked per part. It also checks the parent, so a change to shared goals still warns.
- prd-check: a part's parent must exist. The parent can be marked Shipped only when every part is Shipped or dropped; until then it warns.
- /opsx:propose from a part records both lines: PRD: <part> @ <c[cut off in paste] <commit>.
- The roadmap link --kind prd accepts a part.
- Existing single-file PRDs keep working unchanged.
