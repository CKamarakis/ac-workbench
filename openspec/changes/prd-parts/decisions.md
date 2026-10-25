# Decisions: prd-parts

Written by the kit (`decisions.mjs`); edits to this table are overwritten.

open: 1  (oldest: 2026-10-25)
readiness check: 2026-10-25 at 3d90a13 (2 items)

| Id | Kind | Question or finding | From | Options | Status | Answer | Written to | Dates |
|---|---|---|---|---|---|---|---|---|
| D1 | confirm | Adding a part writes a Parts row into the parent; should that edit trigger the 'parent changed' warning on parts already being built? | openspec/changes/prd-parts/design.md:D5 | **Ignore Parts-only edits** (recommended) / Warn anyway / Drop the Parts table / Later | later |  |  | opened 2026-10-25, later 2026-10-25 |
| D2 | gap | Moving or archiving a parent that has parts: what happens to the parts? | openspec/specs/knowledge-capture/spec.md:68 | **Move parts with it** (recommended) / Refuse and name the parts / Later | decided | Warn and name the unfinished parts; ask per part: drop it, put it under another parent, or make it its own PRD. The parent moves only when no unfinished part is left; finished parts move with it. | openspec/changes/prd-parts/specs/prd-authoring/spec.md | opened 2026-10-25, decided 2026-10-25 |

<!-- kit-decisions-data {"change":"prd-parts","next":3,"items":[{"id":"D1","kind":"confirm","text":"Adding a part writes a Parts row into the parent; should that edit trigger the 'parent changed' warning on parts already being built?","from":"openspec/changes/prd-parts/design.md:D5","status":"later","dates":{"opened":"2026-10-25","later":"2026-10-25"},"options":["Ignore Parts-only edits","Warn anyway","Drop the Parts table","Later"],"recommended":"Ignore Parts-only edits"},{"id":"D2","kind":"gap","text":"Moving or archiving a parent that has parts: what happens to the parts?","from":"openspec/specs/knowledge-capture/spec.md:68","status":"decided","dates":{"opened":"2026-10-25","decided":"2026-10-25"},"options":["Move parts with it","Refuse and name the parts","Later"],"recommended":"Move parts with it","answer":"Warn and name the unfinished parts; ask per part: drop it, put it under another parent, or make it its own PRD. The parent moves only when no unfinished part is left; finished parts move with it.","written":"openspec/changes/prd-parts/specs/prd-authoring/spec.md"}],"readyAt":{"date":"2026-10-25","commit":"3d90a13","items":2}} -->
