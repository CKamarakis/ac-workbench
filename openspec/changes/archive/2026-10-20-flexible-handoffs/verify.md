# Verify: flexible-handoffs

result: pass
date: 2026-10-20
commit: a84bdd5
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | small diff reviewed directly: removes a note-citing regex and changes skill and routing text; no new input, shell call, file write or secret |
| code | substitute | diff reviewed directly (11 code/test files, +53/-78); one low finding (stale comment), fixed; checked: no leftover users of changes[].notes, imports still used, empty Next with notes prints only the count |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

17 scenario(s): 14 with a test, 3 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| prd-authoring: Proposal from Ready PRD | by hand: agent behaviour from the routing text; lanes.test.mjs checks the text keeps the PRD: <path> @ <commit> line; real behaviour is test-sheet row 3 |
| prd-authoring: Status after proposal | by hand: routing text keeps 'offer to set the PRD's change ... Building. Change nothing in the PRD without a yes' (lanes.mjs:71, unchanged); real behaviour is test-sheet row 3 |
| prd-authoring: Several PRDs | tests/kit/lanes.test.mjs |
| prd-authoring: Draft PRD | tests/kit/lanes.test.mjs |
| project-starter: Routing block mentions PRDs | tests/kit/lanes.test.mjs |
| project-starter: Re-sync shows the change as a diff | tests/kit/start-plan.test.mjs |
| project-status: Waiting items with sources | tests/kit/status.test.mjs |
| project-status: Milestone and its change in Now | tests/kit/status.test.mjs |
| project-status: Items left for later, with their owner command | tests/kit/status.test.mjs |
| project-status: Change with every task done | by hand: unchanged scenario copied into the MODIFIED block; read status.mjs:150: '<open> of <total> tasks open', status 'tasks done: verify, then archive' when none open; no test names it (kept as it was) |
| project-status: Loose ends shown by importance and blockers | tests/kit/status.test.mjs |
| project-status: No backlog yet | tests/kit/status.test.mjs |
| project-status: Explore under way | tests/kit/status.test.mjs |
| project-status: Unused notes as one line | tests/kit/status.test.mjs |
| project-status: Acme-like project | tests/kit/status.test.mjs |
| skill-evals: Handoff rows | tests/repo/test-sheet.test.mjs |
| skill-evals: How to run it | tests/repo/test-sheet.test.mjs |

## Docs sync

docs last updated: never committed; code commits since: unknown; no apply receipt  (date: 2026-10-20)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 0 | 0 | 0 | 0 |

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
| C1 | code review (low) - status.mjs:293 comment still said 'the unused ones one count' after the plain count change | fixed in this change (comment updated) before its commit | 2026-10-20 |
| C2 | code review (low) - status.test.mjs 'verify C7' only asserted no rows after the used-note rule was removed; dead test | fixed in this change (dead test removed) before its commit | 2026-10-20 |

<!-- kit-verify-data {"change":"flexible-handoffs","date":"2026-10-20","commit":"a84bdd5","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"small diff reviewed directly: removes a note-citing regex and changes skill and routing text; no new input, shell call, file write or secret","date":"2026-10-20"},"code":{"how":"substitute","note":"diff reviewed directly (11 code/test files, +53/-78); one low finding (stale comment), fixed; checked: no leftover users of changes[].notes, imports still used, empty Next with notes prints only the count","date":"2026-10-20"}},"scenarioCheck":[{"capability":"prd-authoring","scenario":"Proposal from Ready PRD","name":"prd-authoring: Proposal from Ready PRD","status":"by-hand","test":null,"note":"agent behaviour from the routing text; lanes.test.mjs checks the text keeps the PRD: <path> @ <commit> line; real behaviour is test-sheet row 3"},{"capability":"prd-authoring","scenario":"Status after proposal","name":"prd-authoring: Status after proposal","status":"by-hand","test":null,"note":"routing text keeps 'offer to set the PRD's change ... Building. Change nothing in the PRD without a yes' (lanes.mjs:71, unchanged); real behaviour is test-sheet row 3"},{"capability":"prd-authoring","scenario":"Several PRDs","name":"prd-authoring: Several PRDs","status":"named","test":"tests/kit/lanes.test.mjs"},{"capability":"prd-authoring","scenario":"Draft PRD","name":"prd-authoring: Draft PRD","status":"named","test":"tests/kit/lanes.test.mjs"},{"capability":"project-starter","scenario":"Routing block mentions PRDs","name":"project-starter: Routing block mentions PRDs","status":"recorded","test":"tests/kit/lanes.test.mjs","note":""},{"capability":"project-starter","scenario":"Re-sync shows the change as a diff","name":"project-starter: Re-sync shows the change as a diff","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-status","scenario":"Waiting items with sources","name":"project-status: Waiting items with sources","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Milestone and its change in Now","name":"project-status: Milestone and its change in Now","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Items left for later, with their owner command","name":"project-status: Items left for later, with their owner command","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Change with every task done","name":"project-status: Change with every task done","status":"by-hand","test":null,"note":"unchanged scenario copied into the MODIFIED block; read status.mjs:150: '<open> of <total> tasks open', status 'tasks done: verify, then archive' when none open; no test names it (kept as it was)"},{"capability":"project-status","scenario":"Loose ends shown by importance and blockers","name":"project-status: Loose ends shown by importance and blockers","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"No backlog yet","name":"project-status: No backlog yet","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Explore under way","name":"project-status: Explore under way","status":"named","test":"tests/kit/status.test.mjs"},{"capability":"project-status","scenario":"Unused notes as one line","name":"project-status: Unused notes as one line","status":"named","test":"tests/kit/status.test.mjs"},{"capability":"project-status","scenario":"Acme-like project","name":"project-status: Acme-like project","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"skill-evals","scenario":"Handoff rows","name":"skill-evals: Handoff rows","status":"named","test":"tests/repo/test-sheet.test.mjs"},{"capability":"skill-evals","scenario":"How to run it","name":"skill-evals: How to run it","status":"named","test":"tests/repo/test-sheet.test.mjs"}],"webUi":true,"scenarios":{"project-status: Waiting items with sources":{"test":"tests/kit/status.test.mjs","date":"2026-10-20"},"project-status: Milestone and its change in Now":{"test":"tests/kit/status.test.mjs","date":"2026-10-20"},"project-status: Items left for later, with their owner command":{"test":"tests/kit/status.test.mjs","date":"2026-10-20"},"project-status: Loose ends shown by importance and blockers":{"test":"tests/kit/status.test.mjs","date":"2026-10-20"},"project-status: No backlog yet":{"test":"tests/kit/status.test.mjs","date":"2026-10-20"},"project-status: Acme-like project":{"test":"tests/kit/status.test.mjs","date":"2026-10-20"},"project-starter: Routing block mentions PRDs":{"test":"tests/kit/lanes.test.mjs","date":"2026-10-20"},"project-starter: Re-sync shows the change as a diff":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-20"},"project-status: Change with every task done":{"byHand":true,"note":"unchanged scenario copied into the MODIFIED block; read status.mjs:150: '<open> of <total> tasks open', status 'tasks done: verify, then archive' when none open; no test names it (kept as it was)","date":"2026-10-20"},"prd-authoring: Proposal from Ready PRD":{"byHand":true,"note":"agent behaviour from the routing text; lanes.test.mjs checks the text keeps the PRD: <path> @ <commit> line; real behaviour is test-sheet row 3","date":"2026-10-20"},"prd-authoring: Status after proposal":{"byHand":true,"note":"routing text keeps 'offer to set the PRD's change ... Building. Change nothing in the PRD without a yes' (lanes.mjs:71, unchanged); real behaviour is test-sheet row 3","date":"2026-10-20"}},"docsSync":{"date":"2026-10-20","docsUpdated":null,"codeCommitsSince":null,"receipt":false,"proposed":0,"written":0,"declined":0,"leftOut":0,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (low)","detail":"status.mjs:293 comment still said 'the unused ones one count' after the plain count change","note":"fixed in this change (comment updated) before its commit","date":"2026-10-20"},{"item":"C2","what":"code review (low)","detail":"status.test.mjs 'verify C7' only asserted no rows after the used-note rule was removed; dead test","note":"fixed in this change (dead test removed) before its commit","date":"2026-10-20"}],"result":"pass"} -->
