---
title: "Kit 1.0.0-rc.2: three gaps in PRD parts"
date: 2026-10-25
tags:
  - prd
  - kit-update
  - feedback
source: text
---

Feedback on kit 1.0.0-rc.2 from testing in Acme. Root causes are marked unknown: only the scripts' behaviour was tested, not the kit's source.

Context: tested the "PRD parts" update (parent `prds/<slug>.md` + parts `prds/<slug>/<part>.md` with `part-of`) by running the kit scripts against a throwaway git copy of the test app (PRD acme-v1). Everything else in the requirements passed: new-prd --part-of (incl. Parts table row, refusing a missing parent), list/status grouping, prd-check (missing parent = INVALID, Shipped parent with open parts = WARNING), per-part "PRD changed" warning, no false alarm from a sibling part, single-file PRDs unchanged.

## 1. next.mjs: editing the parent PRD after planning gives no warning

Requirement: "/kit:next treats a Ready part like a Ready PRD; 'PRD changed after planning' is checked per part. It also checks the parent, so a change to shared goals still warns."

Repro:
1. Parent `prds/acme-v1.md`, part `prds/acme-v1/part-a.md` (status Building, change acme-part-a).
2. `openspec/changes/acme-part-a/proposal.md` contains both lines:
   `PRD: knowledge/prds/acme-v1/part-a.md @ <commit A>`
   `PRD parent: knowledge/prds/acme-v1.md @ <commit A>`
3. Commit an edit to the parent only (`<commit B>`).
4. `node scripts/next.mjs --dir . --change acme-part-a`

Expected: "PRD acme-v1 (parent) changed after change acme-part-a was planned: review the plan against it."
Actual: `Next: /opsx:apply`, with no warning. Editing the part itself does warn correctly.
Cause: unknown (looks like the `PRD parent:` line isn't read, or isn't compared).
Test to add: parent edited after the `PRD parent:` commit → warns; sibling part edited → no warning.

## 2. roadmap.mjs link --kind prd: accepts PRDs that don't exist

Repro:
- `roadmap.mjs link --dir . --id M1 --kind prd --value acme-v1/nope` → `M1: prd = knowledge/prds/acme-v1.md, acme-v1/nope`
- `--value nope-flat` → accepted the same way.

Expected: refuse a value that matches no PRD or part ("error: no PRD acme-v1/nope. Nothing written."), and store every value in the same form as the entries already there (`knowledge/prds/<slug>/<part>.md`), whether given as `<slug>/<part>` or as a path.
Actual: any string is stored as given, so the milestone ends up with a mix of short names and full paths.
Also unclear: the error for a missing `--id` is "no milestone undefined", and the milestone id is case-sensitive (`m1` fails, `M1` works). A clearer message would help.

## 3. set-field can't clear `change`

Repro: `knowledge.mjs set-field --dir . --file prds/acme-v1.md --key change --value ""` → `error: change must be a kebab-case change name`

Why it matters: after splitting a PRD into parts, the parent "needs no change to be Building", but its old `change: acme-old-change` (an archived change) can't be removed through the helper, and the skill forbids editing frontmatter by hand. `/kit:status` then keeps reporting "PRD Acme v1 is Building, but its change acme-old-change is archived".
Expected: a way to clear a field (e.g. `--clear`, or an empty value for `change`), and/or the split step in /kit:prd clears the parent's `change` itself. Also: status should not flag a parent that has parts for an archived `change`.

Versions: kit 1.0.0-rc.2, Node on Windows 11, Git Bash.
