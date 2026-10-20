# Verify: build-prereqs

result: pass
date: 2026-10-20
commit: 4005755
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | small diff reviewed directly: writes a fixed string into openspec/config.yaml, no input reaches a shell; commits only on a yes |
| code | substitute | reviewed directly: edge cases of withTasksRule covered by tests (4-space blocks, comments, empty and same-indent lists, inline rules/tasks as conflict, CRLF); kept: a commented-out copy of the rule counts as present |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

8 scenario(s): 5 with a test, 3 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| build-readiness: Worktree with an uncommitted plan | by hand: skill text step 9 (git status on the change folder, offer on a yes); eval worktree-needs-committed-plan |
| build-readiness: Plan committed | by hand: skill text: no output or no worktree, say nothing |
| project-starter: Config without rules | tests/kit/start-plan.test.mjs |
| project-starter: Config with rules for other artifacts | tests/kit/start-plan.test.mjs |
| project-starter: Rule already there | tests/kit/start-plan.test.mjs |
| project-starter: Rules not placeable | tests/kit/start-plan.test.mjs |
| project-starter: Files written | by hand: start skill step 7 commit offer; eval setup-commit-offered |
| project-starter: Nothing written | tests/kit/explore.test.mjs |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

<!-- kit-verify-data {"change":"build-prereqs","date":"2026-10-20","commit":"4005755","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"small diff reviewed directly: writes a fixed string into openspec/config.yaml, no input reaches a shell; commits only on a yes","date":"2026-10-20"},"code":{"how":"substitute","note":"reviewed directly: edge cases of withTasksRule covered by tests (4-space blocks, comments, empty and same-indent lists, inline rules/tasks as conflict, CRLF); kept: a commented-out copy of the rule counts as present","date":"2026-10-20"}},"scenarioCheck":[{"capability":"build-readiness","scenario":"Worktree with an uncommitted plan","name":"build-readiness: Worktree with an uncommitted plan","status":"by-hand","test":null,"note":"skill text step 9 (git status on the change folder, offer on a yes); eval worktree-needs-committed-plan"},{"capability":"build-readiness","scenario":"Plan committed","name":"build-readiness: Plan committed","status":"by-hand","test":null,"note":"skill text: no output or no worktree, say nothing"},{"capability":"project-starter","scenario":"Config without rules","name":"project-starter: Config without rules","status":"named","test":"tests/kit/start-plan.test.mjs"},{"capability":"project-starter","scenario":"Config with rules for other artifacts","name":"project-starter: Config with rules for other artifacts","status":"named","test":"tests/kit/start-plan.test.mjs"},{"capability":"project-starter","scenario":"Rule already there","name":"project-starter: Rule already there","status":"named","test":"tests/kit/start-plan.test.mjs"},{"capability":"project-starter","scenario":"Rules not placeable","name":"project-starter: Rules not placeable","status":"named","test":"tests/kit/start-plan.test.mjs"},{"capability":"project-starter","scenario":"Files written","name":"project-starter: Files written","status":"by-hand","test":null,"note":"start skill step 7 commit offer; eval setup-commit-offered"},{"capability":"project-starter","scenario":"Nothing written","name":"project-starter: Nothing written","status":"named","test":"tests/kit/explore.test.mjs"}],"webUi":true,"scenarios":{"build-readiness: Worktree with an uncommitted plan":{"byHand":true,"note":"skill text step 9 (git status on the change folder, offer on a yes); eval worktree-needs-committed-plan","date":"2026-10-20"},"build-readiness: Plan committed":{"byHand":true,"note":"skill text: no output or no worktree, say nothing","date":"2026-10-20"},"project-starter: Files written":{"byHand":true,"note":"start skill step 7 commit offer; eval setup-commit-offered","date":"2026-10-20"}},"result":"pass"} -->
