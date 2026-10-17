# Proposal

PRD: `knowledge/prds/kit-status.md @ fae18c9`
Milestone: M12a (T2)

## Why

After days away, or on a project new to the kit, the user doesn't know what the project is, what's built, what was being worked on, or which item to pick up next. `/kit:next` answers only "which step inside the current item", and it also makes a strategic pick when nothing is under way. The roadmap report shows order and Now, but Now is hand-written and can drift from what git and OpenSpec say. The user decided on 2026-10-17 (explore before the PRD) that status comes now, from existing sources, before the backlog (T3) and before the Toughbubble proof (M12).

## What Changes

- **New skill `/kit:status`** (read-only): an overview block (what the project is, what's built) and one table with the sections Now / Next / We said we'd do / Tech debt / After, columns Item · Left · Status · Source, then a "Doesn't match" list when sources disagree, and a last line naming the item plus "run `/kit:next`".
- **New script `status.mjs`**: collects the facts as JSON from their owners: OpenSpec main specs and archived changes (built), active changes and git branches (under way), the roadmap (order, Now, Waiting on you), PRDs (Ready, Building, open questions), decision records (open, archived open). It stores and writes nothing. The skill turns the facts into plain words and may use only those facts.
- **Works without a roadmap** (Toughbubble): Now from active changes, Next from Ready PRDs and notes without a PRD, plus a one-line hint about `/kit:roadmap`.
- **"Doesn't match" list**: when a copy disagrees with its owner (roadmap Now names work but nothing is under way; a `Building` PRD whose change is archived; the roadmap's stale-Now and unplanned-work findings), status shows the mismatch with its fix instead of picking a side.
- **`/kit:next` changes** (status is strategic, next is tactical):
  - with nothing under way, it points to `/kit:status` instead of `/opsx:explore`; **BREAKING** for anyone relying on the old "No active change" suggestion;
  - with several active changes, it lists them and the skill asks which one; `--change <name>` gives that change's step.
- **Lane map:** a `status` phase owned by the kit with `/kit:status`.
- **Tech debt** shows "no backlog yet" until the backlog (M12a T3) exists.

```
  owners (single source of truth)              status.mjs (facts, JSON)       /kit:status (words)
  +-------------------------------------+     +------------------------+     +----------------------------+
  | OpenSpec specs + archive  -> built  |---->|                        |     | Overview: what it is,      |
  | active changes + branches -> now    |---->| sections, Left, Source |---->|   what's built             |
  | roadmap: order, Now, waiting        |---->| mismatches (copy vs    |     | Now / Next / We said /     |
  | PRDs, decisions.md        -> said   |---->|   owner)               |     |   Tech debt / After        |
  | backlog (T3, not yet)     -> debt   |- - >| missing sources        |     | Doesn't match (if any)     |
  +-------------------------------------+     +------------------------+     | -> item + "run /kit:next"  |
                                                                              +-------------+--------------+
                                                                                            v
                                                              /kit:next: the step inside that item
```

## Capabilities

### New Capabilities
- `project-status`: the `/kit:status` report: overview, the five-section table from owner sources, the "Doesn't match" list, no-roadmap fallback, and the handoff to `/kit:next`; read-only.

### Modified Capabilities
- `skill-routing`: "Next-step suggestion" changes its "No active change" behaviour (points to `/kit:status`) and adds the several-active-changes case; a new "Status phase in the lane map" requirement.

## Impact

- New: `plugins/kit/scripts/status.mjs`, `plugins/kit/skills/status/SKILL.md`, `tests/kit/status.test.mjs` (+ fixtures), `evals/status/cases.yaml`.
- Changed: `plugins/kit/scripts/next.mjs` and `plugins/kit/skills/next/SKILL.md`, `tests/kit/next.test.mjs`, `evals/next/cases.yaml`, `tools/smoke.mjs` (the "next: explore" case), `toolkit.yaml` and generated `plugins/kit/data/toolkit.json`, `README.md` (command table), kit version bump.
- Reuses, unchanged: `roadmap.mjs` (parse, report, check, git findings), `knowledge.mjs`, `decisions.mjs`, `next.mjs` helpers.
- No new dependencies; no writes to any project file at run time.
