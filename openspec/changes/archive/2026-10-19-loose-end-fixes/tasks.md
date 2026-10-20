# Tasks

## 1. Roadmap writes keep the user's text (L9, L10)

- [x] 1.1 Add failing tests in `tests/kit/roadmap.test.mjs` for the three scenarios of "Roadmap writes never lose the user's text" (note under Order survives `add`; survives `order`; `answer` without `--answer` fails and changes no file), and verify they fail on today's code
- [x] 1.2 In `roadmap.mjs`, make `addMilestone` and `setOrder` rewrite only the ID lines under `## Order` and keep every other line in its place (comments are already kept); verify tests 1.1 for add and order pass and the existing roadmap tests still pass
- [x] 1.3 In `resolveWaiting`, throw before any write when `answer` is missing or blank (error names `--answer`); verify test 1.1 for answer passes

## 2. Ask instead of advising Shipped (L1)

- [x] 2.1 Change `status.mjs` mismatch (b) to the question wording and the fix "`/kit:prd`: mark it Shipped, or link the next change (on your yes)"; update `tests/kit/status.test.mjs` (today it asserts "mark it Shipped") and verify the status tests pass
- [x] 2.2 Change the archived-change reason in `next.mjs` to the same question; update the next tests and verify they pass
- [x] 2.3 Search skills, evals and docs for the old "mark it Shipped" / "mark PRD ... Shipped" advice and align the wording; verify with `npm run evals -- --dry` (structure) and a grep that finds no old wording outside archived changes

## 3. Close out

- [x] 3.1 Close L15 in `knowledge/loose-ends.md` with the reason "not reproduced 2026-10-19: an open explore counts as work under way, no mismatch" (`/kit:loose-ends`), and mark L1, L9 and L10 done when this change is archived; verify `/kit:status` no longer lists them
- [x] 3.2 Bump the kit's patch version in `plugins/kit/.claude-plugin/plugin.json`; run `npm test`, `npm run smoke` and `openspec validate loose-end-fixes --strict`, and verify all pass

## Workflow follow-up

- `/kit:verify`, then archive; merge and push so the Acme tests install the fixed kit from GitHub.
- Roadmap: update Now, resume M12 with test A (fresh install) then test B (upgrade).
