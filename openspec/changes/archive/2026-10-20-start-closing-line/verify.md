# Verify: start-closing-line

result: pass
date: 2026-10-20
commit: e3e58e2
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | 4 lines of skill text plus an eval and a version bump: no code, input, secrets or permissions; diff read by hand |
| code | substitute | diff read by hand: skill text matches the delta spec; eval case quoted after a YAML colon slip caught by the dry run |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

2 scenario(s): 2 with a test, 0 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| project-starter: New project | tests/kit/next.test.mjs |
| project-starter: Where the opsx commands come from | evals/start/cases.yaml |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

<!-- kit-verify-data {"change":"start-closing-line","date":"2026-10-20","commit":"e3e58e2","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"4 lines of skill text plus an eval and a version bump: no code, input, secrets or permissions; diff read by hand","date":"2026-10-20"},"code":{"how":"substitute","note":"diff read by hand: skill text matches the delta spec; eval case quoted after a YAML colon slip caught by the dry run","date":"2026-10-20"}},"scenarioCheck":[{"capability":"project-starter","scenario":"New project","name":"project-starter: New project","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"project-starter","scenario":"Where the opsx commands come from","name":"project-starter: Where the opsx commands come from","status":"recorded","test":"evals/start/cases.yaml","note":""}],"webUi":true,"scenarios":{"project-starter: Where the opsx commands come from":{"test":"evals/start/cases.yaml","date":"2026-10-20"}},"result":"pass"} -->
