# Proposal

PRD: `knowledge/prds/explore-stage.md @ 071ea4b`
Milestone: M12a (T4)

## Why

The kit's flow is capture -> explore -> PRD -> propose -> ready -> apply -> verify -> archive, but `/kit:next` only knows the part from the PRD on. Explore leaves no trace, so next can't tell "never explored" from "two questions left" from "ready for a PRD"; its one notes rule ("notes, no PRD -> `/kit:prd`") skips explore and treats notes as to-dos. Outside a flow it says "run `/kit:status`" even when the roadmap already says what's next. The user decided on 2026-10-17 (explore, then PRD) that a flow starts at explore, notes are only input, and next follows the roadmap when nothing is open.

## What Changes

- **New explore record** `knowledge/explore/<slug>.md`, written only by a new script `explore.mjs`: title, `sources` (notes read; a note can be in several records), decisions, open questions (`Q1`, `Q2` ...), the PRD it fed. The state is derived, never stored: open questions -> `exploring`; none and no PRD -> `ready-for-prd`; a PRD -> `in-prd`.
- **End of an explore**: a routing-block rule makes the agent offer, once at the end of `/opsx:explore`, to save or update the record (new decisions, questions answered or added), on the user's yes. OpenSpec's explore skill is unchanged.
- **`/kit:prd`** can draft from an explore record (its decisions and its notes) and links it (state `in-prd`).
- **`/kit:next`**:
  - inside a flow, after the change and PRD rules: a record `ready-for-prd` -> `/kit:prd`; a record `exploring` -> continue `/opsx:explore`, naming its open questions; several open records -> it asks which (`--explore <slug>`);
  - **BREAKING**: the rule "notes, no PRD -> `/kit:prd`" is removed; next never suggests anything about notes;
  - outside a flow, with a roadmap: the current milestone's next open task ("start with `/opsx:explore`"), or, when it is all done, "M12a is done; next: M12; mark it done (`/kit:roadmap`)" — names only, writes nothing; no roadmap: the existing "Nothing open" message.
- **`/kit:status`**: open explore records (exploring, ready for a PRD) are items under way in Now.

```
 notes (context, many-to-many) --read by--> /opsx:explore --end: save?--> explore record
                                                                         (sources, decisions,
                                                                          open questions)
   /kit:next:  record exploring -> /opsx:explore (Q1, Q2)                      |
               record ready     -> /kit:prd  ------ drafts from ------------->  PRD -> propose -> ...
               nothing open     -> roadmap: next task / next milestone (names it, writes nothing)
```

## Capabilities

### New Capabilities
- `explore-record`: the explore record file and its script, derived state, the end-of-explore save, and the link to the PRD.

### Modified Capabilities
- `skill-routing`: "Next-step suggestion uses PRD status" loses the notes rule; "Next-step suggestion" adds the explore stages and the roadmap step outside a flow; new "Explore rule in the routing block".
- `prd-authoring`: "Draft a PRD from chosen notes" can draft from an explore record.
- `project-status`: "Facts from their owners": Now includes open explore records.

## Impact

- New: `plugins/kit/scripts/explore.mjs`, `tests/kit/explore.test.mjs`, eval cases under `evals/next` and `evals/prd` (no new skill: the record is written by the script from the routing rule and `/kit:prd`).
- Changed: `next.mjs`, `status.mjs`, `lanes.mjs` (routing rule), `plugins/kit/skills/prd/SKILL.md`, `plugins/kit/skills/next/SKILL.md`, tests for each, `tools/smoke.mjs`, README flow, kit version bump.
- No new dependencies.
