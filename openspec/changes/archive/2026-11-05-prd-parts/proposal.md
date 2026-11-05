# Proposal

Milestone: M17

## Why

A real project (Acme) needs one PRD built over several changes, one slice at a time. Today every file under `prds/` is its own unrelated PRD, and one big PRD gives false "PRD changed after planning" warnings (an edit to one slice flags the change building another) and has no status per slice. This blocks that project's planning now. Source: `knowledge/notes/2026-10-25-prd-parts-one-prd-split-over-several-files.md`.

## What Changes

- **PRD parts.** A PRD can be split into a parent `prds/<slug>.md` and part files `prds/<slug>/<part>.md`, each part with frontmatter `part-of: <slug>`. A part is named `<slug>/<part>`, so two parents never clash.
- `new-prd --part-of <slug>` creates a part from a new short part template (Scope, Requirements, Done when, Open questions) and adds a row to the parent's Parts table. The parent keeps Problem, Users, Goals, Out of scope and a Parts table.
- **New status `Dropped`** for any PRD or part that won't be built. It needs no change and never leads to a suggestion.
- `list` shows parts indented under their parent, each with its own status and change; `/kit:status` names a part as "<parent title> › <part title>".
- `/kit:next` treats a Ready part like a Ready PRD (a parent with parts is never proposed itself). "PRD changed after planning" is checked per part, and on the parent too, so an edit to shared goals still warns.
- `prd-check`: a part's parent must exist, and `part-of` must match the folder. A parent marked Shipped while a part is neither Shipped nor Dropped gets a warning (never a block). A parent with parts may be Building without a `change`.
- `/opsx:propose` from a part records two lines: `PRD: <part path> @ <commit>` and `PRD parent: <parent path> @ <commit>`.
- `/kit:prd` gets a "split into parts" flow: create the parts, move each slice's rows into its part, trim the parent per section, all on the user's yes.
- The roadmap's `link --kind prd` accepts a part, refuses a PRD or part that doesn't exist, and stores every form as `prds/....md` (added after the rc.2 test).
- Existing single-file PRDs keep working unchanged. Not breaking.

```
prds/
  acme-v1.md              parent: Problem, Users, Goals, Out of scope, Parts table
  acme-v1/
    part-a.md             part-of: acme-v1   status Building  change: acme-part-a
    part-b.md             part-of: acme-v1   status Ready      -> /kit:next: propose it
    part-c.md             part-of: acme-v1   status Dropped

proposal (acme-part-a):
  PRD: knowledge/prds/acme-v1/part-a.md @ <commit>     <- edit here: warns
  PRD parent: knowledge/prds/acme-v1.md @ <commit>     <- edit here: warns
  (edit in part-b.md: no warning for acme-part-a)
```

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `prd-authoring`: PRD format gains the `Dropped` status; new requirements for parts (layout, creation, listing, checks) and for a proposal made from a part.
- `skill-routing`: the next-step suggestion handles parts (Ready part, parent never proposed, changed-since check per part and parent).

## Impact

- `plugins/kit/scripts/knowledge.mjs`: `readPrd`, `listKnowledge`, `newPrd`, `prd-check`, `STATUSES`, list format, a second proposal line parser.
- `plugins/kit/templates/prd-part.md` (new), and a Parts table in `templates/prd.md`.
- `plugins/kit/scripts/next.mjs` (`prdSuggest`, `readKnowledge`), `status.mjs` (part titles), `lanes.mjs` (routing block: the part lines in a proposal).
- `plugins/kit/skills/prd/SKILL.md` (parts flow, Dropped).
- Tests: `tests/kit/knowledge.test.mjs`, `next.test.mjs`, `status.test.mjs`, `roadmap.test.mjs`, `lanes.test.mjs`; evals for `/kit:prd`.
- Projects pick up the new routing line on their next `/kit:start` re-sync.
