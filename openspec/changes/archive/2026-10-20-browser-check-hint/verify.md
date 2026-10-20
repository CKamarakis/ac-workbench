# Verify: browser-check-hint

result: pass
date: 2026-10-20
commit: c97f6a7
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran |  |
| code | ran |  |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

5 scenario(s): 5 with a test, 0 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| quality-gates: Default verify | tests/kit/browser-hint.test.mjs |
| quality-gates: Browser check recommended | tests/kit/browser-hint.test.mjs |
| quality-gates: Not a web-ui project | tests/kit/browser-hint.test.mjs |
| quality-gates: Browser check on request | tests/kit/browser-hint.test.mjs |
| quality-gates: Issues never block | tests/kit/verify.test.mjs |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| C8 | code review (low) | verify.mjs browserSignals repeats base/untracked lookups runVerify already did (perf, kept) |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| C1 | code review (medium) - verify.mjs browserSignals: an unreadable or octal-quoted untracked path crashed verify run | fixed in c97f6a7 | 2026-10-20 |
| C2 | code review (medium) - verify.mjs browserSignals: full-tree diff could exceed the git() buffer and silently drop the signal | fixed in c97f6a7 | 2026-10-20 |
| C3 | code review (medium) - verify.mjs: one recorded browser check suppressed the hint forever, even for later screens | fixed in c97f6a7 | 2026-10-20 |
| C4 | code review (low) - verify.mjs setBrowser: H:browser stayed in the report after a check was recorded | fixed in c97f6a7 | 2026-10-20 |
| C5 | code review (low) - verify.mjs browserSignals: '+++ ' content lines and tab-suffixed headers misparsed | fixed in c97f6a7 | 2026-10-20 |
| C6 | code review (low) - verify.mjs PAGE: API routes, +server/+layout and components/pages folders counted as pages | fixed in c97f6a7 | 2026-10-20 |
| C7 | code review (low) - verify.mjs INPUT: drag/drop missing (click/change left out on purpose, design D3); comments can match (heuristic, kept) | fixed in c97f6a7 | 2026-10-20 |
| C9 | code review (low) - verify.mjs: dead ?? '' after readFileSync | fixed in c97f6a7 | 2026-10-20 |
| C10 | code review (low) - verify.mjs: addEventListener label cut mid-string | fixed in c97f6a7 | 2026-10-20 |

<!-- kit-verify-data {"change":"browser-check-hint","date":"2026-10-20","commit":"c97f6a7","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"C8","level":"ADVISORY","what":"code review (low)","detail":"verify.mjs browserSignals repeats base/untracked lookups runVerify already did (perf, kept)","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-20"},"code":{"how":"ran","note":"","date":"2026-10-20"}},"scenarioCheck":[{"capability":"quality-gates","scenario":"Default verify","name":"quality-gates: Default verify","status":"named","test":"tests/kit/browser-hint.test.mjs"},{"capability":"quality-gates","scenario":"Browser check recommended","name":"quality-gates: Browser check recommended","status":"named","test":"tests/kit/browser-hint.test.mjs"},{"capability":"quality-gates","scenario":"Not a web-ui project","name":"quality-gates: Not a web-ui project","status":"named","test":"tests/kit/browser-hint.test.mjs"},{"capability":"quality-gates","scenario":"Browser check on request","name":"quality-gates: Browser check on request","status":"named","test":"tests/kit/browser-hint.test.mjs"},{"capability":"quality-gates","scenario":"Issues never block","name":"quality-gates: Issues never block","status":"recorded","test":"tests/kit/verify.test.mjs","note":""}],"webUi":true,"scenarios":{"quality-gates: Issues never block":{"test":"tests/kit/verify.test.mjs","date":"2026-10-20"}},"resolved":[{"item":"C1","what":"code review (medium)","detail":"verify.mjs browserSignals: an unreadable or octal-quoted untracked path crashed verify run","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C2","what":"code review (medium)","detail":"verify.mjs browserSignals: full-tree diff could exceed the git() buffer and silently drop the signal","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C3","what":"code review (medium)","detail":"verify.mjs: one recorded browser check suppressed the hint forever, even for later screens","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C4","what":"code review (low)","detail":"verify.mjs setBrowser: H:browser stayed in the report after a check was recorded","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C5","what":"code review (low)","detail":"verify.mjs browserSignals: '+++ ' content lines and tab-suffixed headers misparsed","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C6","what":"code review (low)","detail":"verify.mjs PAGE: API routes, +server/+layout and components/pages folders counted as pages","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C7","what":"code review (low)","detail":"verify.mjs INPUT: drag/drop missing (click/change left out on purpose, design D3); comments can match (heuristic, kept)","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C9","what":"code review (low)","detail":"verify.mjs: dead ?? '' after readFileSync","note":"fixed in c97f6a7","date":"2026-10-20"},{"item":"C10","what":"code review (low)","detail":"verify.mjs: addEventListener label cut mid-string","note":"fixed in c97f6a7","date":"2026-10-20"}],"result":"pass"} -->
