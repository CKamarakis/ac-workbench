# Trial: roadmap-structure (kit 0.12.0, 2026-10-17)

Change `roadmap-structure` (M12a T1): roadmap format (one file per milestone under `knowledge/roadmaps/`), a warn-only check, the `/kit:roadmap` skill, and this repo's roadmap moved to it. PRD `knowledge/prds/roadmap-structure.md`; readiness decisions D1-D6 in the change's `decisions.md`.

## Full run (task 5.3)

| Check | Result |
|---|---|
| `npm test` | 415 / 415 pass (32 new in `tests/kit/roadmap.test.mjs`, 1 in `start-plan.test.mjs`, 1 in `lanes.test.mjs`) |
| `npm run registry:check` | ok; lane map lists `roadmap` owned by the kit with `/kit:roadmap` |
| `npm run evals` | 0 failures in 13 skills; `roadmap` 5 pass + 2 rubric pending (not scored, like the other skills); `start` 15 / 15 |
| `npm run smoke` | 45 steps pass (8 new roadmap steps: none yet, new, add, task, start, tick, check, report), Windows, OpenSpec 1.13.2 |
| `npm run smoke:check` | not needed (last pass 71e9795) |

## Moving this repo's roadmap (task 5.2, design D7)

| Count | `docs/roadmap.md` (before) | `knowledge/roadmaps/` (after) |
|---|---|---|
| Milestones | 15 | 15 (4 in `milestones/`, 11 in `done/`) |
| Drift entries | 30 | 30 (old columns kept verbatim under "Before 2026-10-17") |
| Pending decisions | 0 marked "pending (user)"; 2 open items in prose | 2 under Waiting on you |

- `roadmap.mjs check`: **Roadmap is in good condition.** `roadmap.md` is 87 lines (was 133, 36 KB).
- Finished milestones keep their full old row in their `done/` file (readiness D2); the old "Current position" history went into the matching done files (M2, M3, M6, M7, M8).
- Judgment calls in the move (reversible with git): north-star row 5b (`/kit:ready`) corrected from ⬜ to ✅ (built in M7); the 545-character north-star quote wrapped; "After v1" listed as bullets under North star; short titles and one-line goals written per milestone.
- `docs/roadmap.md` is a pointer; `CLAUDE.md`, `README.md`, `openspec/config.yaml`, `docs/project-context.md` and the agent's memory note point to `knowledge/roadmaps/`.

## Found during apply

- Added a `task` command (add `T<n>` lines): `tick` and the "active milestone without tasks" rule need it. Split `answer` from `wait`. Design D1 updated.
- The install check covers skills and hooks, not templates; the templates are proven by the `new` unit test and the smoke step instead (task 1.2 reworded).
