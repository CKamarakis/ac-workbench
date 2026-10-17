# Proposal

PRD: `knowledge/prds/roadmap-structure.md @ 0b5fbaa`

## Why

The roadmap is how the user, as product owner, finds the goals, what's left and what waits on them after time away. In this repo it's written freehand each session: 36 KB / 133 lines after 18 days, plan, state and history in one file, finished milestones at full length, a stale "Current position" and north-star table, and tasks as free text that no script can read. Other projects (Toughbubble) have none. The user decided on 2026-10-17 (roadmap M12a, option A) that a dependable roadmap structure comes first, before the Toughbubble proof (M12) and before `/kit:status`, which will read it.

## What Changes

- **New roadmap format, one file per milestone**, optional per project, under `knowledge/roadmaps/`:
  - `roadmap.md`: north star, principles, the milestone order (IDs), Now (5 lines or fewer), Waiting on you;
  - `milestones/<id>-<slug>.md`: frontmatter `id`, `title`, `status` (`planned`, `active`, `paused`, `done`, `dropped`), a one-line goal, a task list (`- [ ] T2 …`), links to notes, PRD and change;
  - `done/`: finished milestones, whole file kept;
  - `drift-log.md`: only ever added to.
- **New check**, warn only, never blocks: **broken** findings first (missing frontmatter fields, unknown status, duplicate ID, order vs files, task shape, active milestone without tasks), then **tidy-up** (over 150 lines or a row over 300 characters, finished milestone not moved, stale Now). It also lists unplanned work (an active change no milestone links to) and Waiting on you, split into Blocking now and Later by milestone order, never by age.
- **New skill `/kit:roadmap`**: create (on a yes), add a milestone (with or without notes), start, finish, tick a task, add a drift entry, link notes, PRD and change both ways, update Now, and a short report. It runs the check after every write and offers fixes; only the user changes order or scope.
- **`/kit:start` mentions `/kit:roadmap` under Later** when the project has none; it still asks only the project type (decided at readiness, 2026-10-17).
- **Lane map:** a `roadmap` phase owned by the kit with `/kit:roadmap`.
- **This repo moves to the new format:** `docs/roadmap.md` → `knowledge/roadmaps/`, with milestone, drift-entry and pending-decision counts matched before and after; `CLAUDE.md`, `openspec/config.yaml` and `docs/project-context.md` point to the new location.

```
knowledge/roadmaps/
  roadmap.md  ---- order: M12a, M12, M13 ...    Now (<=5 lines)   Waiting on you
      |                                             ^
      v                                             |  check (warn only):
  milestones/m12-toughbubble-proof.md  ------------+  broken / tidy-up / unplanned work
      frontmatter id, title, status + tasks + links
  done/          finished milestones (moved, kept whole)
  drift-log.md   append only

flow:  goal or notes --> /kit:roadmap add --> milestone --> PRD --> change
       change archived --> tick task --> Now updated --> report to the user
```

## Capabilities

### New Capabilities

- `roadmap`: the roadmap format and layout, the warn-only check, Waiting on you by relevance, the `/kit:roadmap` skill (writes and report), and the rule that only the user changes order or scope.

### Modified Capabilities

- `project-starter`: the starter's summary mentions `/kit:roadmap` under Later when the project has no roadmap; it creates nothing.
- `skill-routing`: the lane map gains a `roadmap` phase owned by the kit with `/kit:roadmap`.

## Impact

- New: a zero-dependency roadmap script like the other kit scripts, the `/kit:roadmap` skill, roadmap templates (roadmap, milestone, drift log), eval cases for the skill, unit tests.
- Changed: `toolkit.yaml` (kit phases and skills; regenerated `plugins/kit/data/toolkit.json`), the starter's plan and skill (the Later line), smoke test steps.
- This repo: `docs/roadmap.md` replaced by `knowledge/roadmaps/` (old file kept until counts match); pointers in `CLAUDE.md`, `openspec/config.yaml`, `docs/project-context.md`, and the user's memory note that says "read docs/roadmap.md first".
- Out of scope: backlog (change 4), `/kit:status` (change 3), dependencies and priority scores, ticket systems.
- Unverified: nothing here depends on external docs; OpenSpec is used only through its existing CLI.
