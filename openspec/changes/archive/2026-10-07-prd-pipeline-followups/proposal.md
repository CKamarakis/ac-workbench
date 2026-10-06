# Proposal

## Why

The live trial of `prd-pipeline` (kit 0.2.0, `evals/trials/prd-pipeline-live.md`) worked, but showed three rough edges in daily use:
- PRDs are offered in file-name order, so the one you just worked on can sit at the bottom of the list.
- `/kit:start` asks several questions in a row (project type, opt-in tools, each file change) with no context. The user had to ask what each one meant before answering.
- A transcript dropped into `knowledge/notes/` as `.txt` is silently ignored, and a hand-added `.md` gets no date or tags.

These are small fixes that make the M2 flow comfortable before it's used on a real project.

## What Changes

- **PRDs sorted by most recent update:**
  - `knowledge.mjs list` returns each PRD's last-updated time and sorts PRDs newest first.
  - Everything that lists or offers PRDs uses that order: `/kit:prd`, the `/opsx:propose` choice (routing rule), and `/kit:next`'s Ready PRDs.
- **`/kit:start` asks one question** (changed by the user on 2026-10-06 during the live check; see the roadmap drift log):
  - only the project type is asked, with what each type adds and a recommendation from the project's files;
  - global and type tools install without asking;
  - opt-in tools (SuperSpec, Superpowers) are not asked about. They're listed as "available on demand" with their description, because Superpowers' session-start hook costs context every session, and on-demand adding is M3 work (the flow judge);
  - file changes are shown with diffs and confirmed with one yes;
  - the context text comes from the plan output (data, not the model's memory). The registry gets an optional per-tool recommendation, used in the on-demand offer later.
- **README bookkeeping** once everything is verified.
- **Import a transcript as a note:**
  - `/kit:capture` can take a `.txt` or `.md` file (dropped into `notes/` or anywhere else);
  - it proposes a title and tags, adds the frontmatter, and keeps the text unchanged;
  - `list` reports `.txt` files in `notes/` as "not imported yet", so the kit can offer to import them.

Out of scope: grouping or tidying loose notes (parked by the user until after real use).

```
 list --json
   prds: sorted by updated (newest first) --> /kit:prd shortlist, /opsx:propose choice, /kit:next
   unimported: notes/*.txt              --> /kit:capture offers "import?"

 start-plan --json
   types[]:   { name, tools, about }                 --> question 1 with context
   offered[]: { name, about, recommend, why }        --> opt-in questions
   actions[]: { id, about, recommend, why }          --> per-CHANGE questions
```

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities

These capabilities' base specs are still in unarchived changes (`kit-local-mvp`, `prd-pipeline`), so this change only ADDS requirements to them. Archive order: `kit-local-mvp` → `prd-pipeline` → this change.

- `knowledge-capture`: import a transcript file as a note; `list` reports unimported `.txt` files.
- `prd-authoring`: PRDs are listed and offered newest-updated first.
- `project-starter`: every starter question carries one line of context and a recommended answer with its reason.
- `skill-routing`: the next-step suggestion picks and lists Ready PRDs newest-updated first.

## Impact

- **Code:**
  - `plugins/kit/scripts/knowledge.mjs` (`list`: updated time, sorting, unimported; new `import` command);
  - `start-plan.mjs` (context and recommendations in the plan);
  - `lanes.mjs` (routing-rule wording: offer PRDs newest first);
  - `next.mjs` (order).
- **Skills:** `capture`, `prd`, `start`.
- **Registry:** optional `recommend` and `recommend_why` fields on tools, documented in `docs/registry.md`; values set for SuperSpec, Superpowers and the other opt-in tools.
- **Tests and evals:** `tests/kit/*`, `evals/{capture,prd,start,next}`.
- Kit version 0.2.0 → 0.3.0. Re-synced projects see a small routing-block `CHANGE`.
- Testing happens in throwaway folders and the `Projects/temp/Toughbubble` copy. No new dependencies.
