# Verify: release-basics

result: pass
date: 2026-10-20
commit: 952c24f
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | reviewed directly: LICENSE text, two issue forms that warn against pasting secrets, manifest metadata; no code paths |
| code | substitute | reviewed directly; one bug found and fixed while building: the test-sheet test split on LF only and failed on a Windows checkout (CRLF) |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

3 scenario(s): 3 with a test, 0 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| repo-release: License present | tests/repo/release-basics.test.mjs |
| repo-release: Bug report fields | tests/repo/release-basics.test.mjs |
| repo-release: No dropped features | tests/repo/release-basics.test.mjs |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

<!-- kit-verify-data {"change":"release-basics","date":"2026-10-20","commit":"952c24f","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"reviewed directly: LICENSE text, two issue forms that warn against pasting secrets, manifest metadata; no code paths","date":"2026-10-20"},"code":{"how":"substitute","note":"reviewed directly; one bug found and fixed while building: the test-sheet test split on LF only and failed on a Windows checkout (CRLF)","date":"2026-10-20"}},"scenarioCheck":[{"capability":"repo-release","scenario":"License present","name":"repo-release: License present","status":"named","test":"tests/repo/release-basics.test.mjs"},{"capability":"repo-release","scenario":"Bug report fields","name":"repo-release: Bug report fields","status":"named","test":"tests/repo/release-basics.test.mjs"},{"capability":"repo-release","scenario":"No dropped features","name":"repo-release: No dropped features","status":"named","test":"tests/repo/release-basics.test.mjs"}],"webUi":true,"result":"pass"} -->
