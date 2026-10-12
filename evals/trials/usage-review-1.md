# Usage review 1 (M6)

Date: 2026-10-12, a day before the planned date. Scope (from `kit-local-mvp` task 9.4): review the kit against real use — feedback inbox items, eval runs, registry verdicts, scoping and setup friction — and revisit task-observer.

## Real use so far

- **Toughbubble** (the real project) has used the kit since 2026-10-08, on kit **0.5.3**: `/kit:start`, `/kit:capture`, `/kit:prd`, 6 OpenSpec changes. Five small changes on 2026-10-09 used plain OpenSpec; the big Storms build (`storms-canvas`) used SuperSpec and is still in the user's testing (task 10.4).
- **Toughbubble copy:** the build-readiness trial (`build-readiness-live.md`), kit 0.6.0–0.6.2.
- **Feedback inbox:** no data. `/kit:feedback` is M5 and not built.
- **Evals** (`npm run evals`, 2026-10-12): 84 pass, 15 pending, 0 fail. The 15 pending are judgment (rubric) cases that are never scored. **Finding:** nothing scores them, so they can't catch a regression.

## Findings

1. **Decisions came up during apply, and the docs drifted from the build** (Storms). Addressed by M7 (`/kit:ready`, docs sync); archived 2026-10-12.
2. **The real project can't get M7 yet.** It's on 0.5.3, and a `/kit:start` re-sync bundles tool installs with the routing update, so "routing only" means Cancel (`build-readiness-live.md`).
3. **Reminders pile up, and `/kit:next` can't see the roadmap.** On 2026-10-12 it suggested M5's `/kit:ready` while the roadmap said M6. Proposal: one-step `/kit:next` plus a "what's waiting" list (note `knowledge/notes/2026-10-12-next-on-roadmap-and-pending-tasks.md`).
4. **A Ready PRD outranks an active change** in `/kit:next` today.
5. **Context7 was never used for real** (0 calls in 16 sessions). A/B: the rule is followed in a clean context but made no difference on typed, installed packages; the hook never fires because chained commands exit 0, and PowerShell isn't matched (`context7-ab.md`).
6. **Code review leftovers:** 7 low findings from the build-readiness review (archived `verify.md`, task 7.5).
7. **Windows friction seen in trials:** Git Bash rewrites `/code-review`-style arguments into paths, `python` is missing, and `openspec` needs its full path in Git Bash. The agent worked around each one.
8. **Unscored judgment evals** (see Evals above).

## Decisions (user, 2026-10-12)

| Item | Decision |
|---|---|
| SuperSpec | Keep trial; Storms added as evidence; re-judge once it's archived |
| Context7 | Keep trial; fix the hook (read the output even on exit 0, match PowerShell too) |
| `/kit:next` order | Finish the active change first; a Ready PRD waits as a reminder |
| Follow-ups | One small change after M8 (`kit-docs`): items 2, 3, 4, 5 (hook), 6 |
| Order | M6 now, then M8, then the follow-up change, then M5 |
| task-observer | Stays **later** (still 9 skills, no feedback channel); revisit with M5 |

Not decided here: scoring the 15 judgment evals (item 8) and the Windows friction (item 7). Both are listed for the follow-up change's explore.

## Next

`/opsx:propose kit-docs` (M8) on a new branch. Then `/opsx:explore` for the follow-up change.
