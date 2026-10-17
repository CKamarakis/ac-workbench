# Proposal

PRD: `knowledge/prds/loose-ends.md @ uncommitted`
Milestone: M12a (T3)

## Why

Building leaves things behind every day (about 8 on 2026-10-17: a check that belongs elsewhere, friction worked around again, kept review findings, cleanup, ideas trimmed out of scope). The kit owns what we build (changes), what we want (PRDs) and the order (roadmap), but nothing owns "noticed while doing something else", so these land in chat, archived prose or notes, and `/kit:status` and `/kit:next` can't see them. The user decided on 2026-10-17 (explore, then PRD) to give them one owner, sorted by importance and blockers rather than time.

## What Changes

- **New `knowledge/loose-ends.md`**, written only by a new script `loose-ends.mjs` (like `roadmap.mjs`). Each item: ID (`L1`, never reused), text, **kind** (check, friction, debt, idea, cleanup, accepted), **origin** (chat, build, review, verify, note), free tags, **important** (with who marked it and why), optional **blocks** (a milestone, change or loose end), date, source, state (open, done, dropped with a reason). No ranking, no time fields.
- **New skill `/kit:loose-ends`**: add (one batch at the end of a step), mark or unmark important, set blocks, done, drop, cleanup (go through open items and propose keep or drop), list, and analysis (counts by kind, origin, tag and state). Writes only on the user's yes.
- **End-of-step capture**: the kit's routing block tells the agent to collect loose ends during a step (apply, verify, archive, a long chat) and offer them once at the end; `/kit:verify` lists the review findings the user kept.
- **`/kit:status`**: the Tech debt section becomes **Loose ends**: important items and items blocking the current milestone or change as rows; the rest as counts per kind; accepted items never shown.
- **`/kit:next`**: the "Nothing open" count includes open loose ends (accepted excluded); a loose end blocking the change being worked on rides along as a reminder.
- **`/kit:roadmap` report** ends with one line pointing to `/kit:loose-ends` when there are open ones.
- **Lane map**: a `loose-ends` phase owned by the kit with `/kit:loose-ends`.

```
  during a step                     end of the step                   later
  +-----------------+   collect    +------------------------+       +---------------------------+
  | apply / verify  | -----------> | "This step left 3      | yes   | knowledge/loose-ends.md   |
  | archive / chat  |  (no writes) |  loose ends. Add       | ----> |  (loose-ends.mjs only)    |
  +-----------------+              |  which?"  (one ask)    |       +-------------+-------------+
                                   +------------------------+                     |
             +------------------------------+-----------------------+------------+
             v                              v                       v
   /kit:status "Loose ends":     /kit:next: count in         /kit:loose-ends:
   important + blocking rows,    "Nothing open"; blocker     list, cleanup,
   counts per kind               of this change as reminder  analysis
```

## Capabilities

### New Capabilities
- `loose-ends`: the loose ends file and its script, item fields and states, the `/kit:loose-ends` skill (capture batch, importance, blockers, cleanup, analysis), and the end-of-step capture rule.

### Modified Capabilities
- `project-status`: "Status report sections" and "Facts from their owners": Tech debt becomes Loose ends, filled from the loose ends file.
- `skill-routing`: "Next-step suggestion" counts open loose ends and shows a blocker of the current change; new "Loose ends phase in the lane map" and "Loose ends rule in the routing block".
- `roadmap`: "Roadmap report" ends with a pointer to `/kit:loose-ends` when there are open ones.

## Impact

- New: `plugins/kit/scripts/loose-ends.mjs`, `plugins/kit/skills/loose-ends/SKILL.md`, `tests/kit/loose-ends.test.mjs`, `evals/loose-ends/cases.yaml`.
- Changed: `status.mjs`, `next.mjs`, `roadmap.mjs` (report line), `lanes.mjs` (routing block rule), `plugins/kit/skills/verify/SKILL.md` and `status/SKILL.md`, `toolkit.yaml` + generated `toolkit.json`, tests for each, `tools/smoke.mjs`, README command table, kit version bump.
- No new dependencies. Existing owners (decision records, PRD open questions, roadmap Waiting on you) are not copied or changed.
