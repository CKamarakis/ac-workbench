# Verify: loose-end-fixes

result: pass
date: 2026-10-19
commit: e319c5b
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | /security-review got an empty diff (change not committed yet); reviewed the working-tree diff of next.mjs, status.mjs, roadmap.mjs by hand: no findings |
| code | substitute | reviewed the working-tree diff by hand (change not committed, small diff): orderLines slot filling checked for add with --after/--before and for reorder; one finding |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

14 scenario(s): 13 with a test, 1 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| prd-authoring: Shipped suggested | by hand: skill wording: checked plugins/kit/skills/prd/SKILL.md 'After /opsx:archive' now asks done-or-continues and writes only on a yes |
| project-status: Now with nothing under way | tests/kit/status.test.mjs |
| project-status: PRD not marked Shipped | tests/kit/status.test.mjs |
| project-status: Everything agrees | tests/kit/status.test.mjs |
| project-status: Loose end blocks finished work | tests/kit/status.test.mjs |
| roadmap: A note under Order survives an add | tests/kit/roadmap.test.mjs |
| roadmap: A note under Order survives a reorder | tests/kit/roadmap.test.mjs |
| roadmap: Answer without an answer | tests/kit/roadmap.test.mjs |
| skill-routing: Ready PRD without a change | tests/kit/next.test.mjs |
| skill-routing: Ready PRD waits for the active change | tests/kit/next.test.mjs |
| skill-routing: PRD changed since planning | tests/kit/next.test.mjs |
| skill-routing: Archived change | tests/kit/next.test.mjs |
| skill-routing: Notes but no PRD | tests/kit/next.test.mjs |
| skill-routing: No knowledge folder | tests/kit/next.test.mjs |

## Docs sync

docs last updated: never committed; code commits since: unknown; no apply receipt  (date: 2026-10-19)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 3 | 3 | 0 | 3 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| C1 | code review (low) - roadmap.mjs:221 the doc comment of setSection ('Replaces the lines of one ## name section') now sits above the new orderLines function, so orderLines has two doc comments and setSection none | fixed in the working tree before commit: setSection's comment moved back above setSection | 2026-10-19 |

<!-- kit-verify-data {"change":"loose-end-fixes","date":"2026-10-19","commit":"e319c5b","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"/security-review got an empty diff (change not committed yet); reviewed the working-tree diff of next.mjs, status.mjs, roadmap.mjs by hand: no findings","date":"2026-10-19"},"code":{"how":"substitute","note":"reviewed the working-tree diff by hand (change not committed, small diff): orderLines slot filling checked for add with --after/--before and for reorder; one finding","date":"2026-10-19"}},"scenarioCheck":[{"capability":"prd-authoring","scenario":"Shipped suggested","name":"prd-authoring: Shipped suggested","status":"by-hand","test":null,"note":"skill wording: checked plugins/kit/skills/prd/SKILL.md 'After /opsx:archive' now asks done-or-continues and writes only on a yes"},{"capability":"project-status","scenario":"Now with nothing under way","name":"project-status: Now with nothing under way","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"PRD not marked Shipped","name":"project-status: PRD not marked Shipped","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Everything agrees","name":"project-status: Everything agrees","status":"named","test":"tests/kit/status.test.mjs"},{"capability":"project-status","scenario":"Loose end blocks finished work","name":"project-status: Loose end blocks finished work","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"roadmap","scenario":"A note under Order survives an add","name":"roadmap: A note under Order survives an add","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"A note under Order survives a reorder","name":"roadmap: A note under Order survives a reorder","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Answer without an answer","name":"roadmap: Answer without an answer","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"skill-routing","scenario":"Ready PRD without a change","name":"skill-routing: Ready PRD without a change","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Ready PRD waits for the active change","name":"skill-routing: Ready PRD waits for the active change","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"PRD changed since planning","name":"skill-routing: PRD changed since planning","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Archived change","name":"skill-routing: Archived change","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Notes but no PRD","name":"skill-routing: Notes but no PRD","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"No knowledge folder","name":"skill-routing: No knowledge folder","status":"named","test":"tests/kit/next.test.mjs"}],"webUi":true,"scenarios":{"project-status: Now with nothing under way":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"project-status: PRD not marked Shipped":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"project-status: Loose end blocks finished work":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"skill-routing: Notes but no PRD":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: Archived change":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"prd-authoring: Shipped suggested":{"byHand":true,"note":"skill wording: checked plugins/kit/skills/prd/SKILL.md 'After /opsx:archive' now asks done-or-continues and writes only on a yes","date":"2026-10-19"}},"docsSync":{"date":"2026-10-19","docsUpdated":null,"codeCommitsSince":null,"receipt":false,"proposed":3,"written":3,"declined":0,"leftOut":3,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (low)","detail":"roadmap.mjs:221 the doc comment of setSection ('Replaces the lines of one ## name section') now sits above the new orderLines function, so orderLines has two doc comments and setSection none","note":"fixed in the working tree before commit: setSection's comment moved back above setSection","date":"2026-10-19"}],"result":"pass"} -->
