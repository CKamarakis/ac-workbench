# Verify: kit-status

result: pass
date: 2026-10-17
commit: abd2204
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

## Docs sync

docs last updated: never committed; code commits since: unknown; no apply receipt  (date: 2026-10-17)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 6 | 6 | 0 | 6 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| C6 | code review (low) | next.mjs:131 leftoverCount counts Draft/Review PRD questions; status lists all PRDs (kept by user: design D13) |
| C9 | code review (low) | next.mjs:146 'Nothing open' count repeats the archived/later reminder lines |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| C1 | code review (medium) - next.mjs:113 --change is applied after prdSuggest: a PRD step for another change still wins, so the named change's step never shows | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |
| C2 | code review (low) - next.mjs:110 'waiting' reminder names active[0], not the change picked with --change | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |
| C3 | code review (low) - next.mjs:116 --change with no active changes returns 'pick a change' with an empty list instead of 'Nothing open' | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |
| C4 | code review (medium) - status.mjs:73 task regex counts markdown link bullets ('- [design](design.md)') as open tasks | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |
| C5 | code review (low) - status.mjs:226 handoff.underWay built from the capped Now rows; active changes past the cap are dropped | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |
| C7 | code review (low) - status.mjs:129 PRD sources compared unnormalized ('./notes/x.md' not matched); knowledge.mjs citing() normalizes | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |
| C8 | code review (low) - next.mjs:152 otherActive branch is dead after the choose step (only 0 or 1 change reach openspecStep) | fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46 | 2026-10-17 |

<!-- kit-verify-data {"change":"kit-status","date":"2026-10-17","commit":"abd2204","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"C6","level":"ADVISORY","what":"code review (low)","detail":"next.mjs:131 leftoverCount counts Draft/Review PRD questions; status lists all PRDs (kept by user: design D13)","source":"code","severity":"low"},{"id":"C9","level":"ADVISORY","what":"code review (low)","detail":"next.mjs:146 'Nothing open' count repeats the archived/later reminder lines","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-17"},"code":{"how":"ran","note":"","date":"2026-10-17"}},"docsSync":{"date":"2026-10-17","docsUpdated":null,"codeCommitsSince":null,"receipt":false,"proposed":6,"written":6,"declined":0,"leftOut":6,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"next.mjs:113 --change is applied after prdSuggest: a PRD step for another change still wins, so the named change's step never shows","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"},{"item":"C2","what":"code review (low)","detail":"next.mjs:110 'waiting' reminder names active[0], not the change picked with --change","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"},{"item":"C3","what":"code review (low)","detail":"next.mjs:116 --change with no active changes returns 'pick a change' with an empty list instead of 'Nothing open'","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"},{"item":"C4","what":"code review (medium)","detail":"status.mjs:73 task regex counts markdown link bullets ('- [design](design.md)') as open tasks","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"},{"item":"C5","what":"code review (low)","detail":"status.mjs:226 handoff.underWay built from the capped Now rows; active changes past the cap are dropped","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"},{"item":"C7","what":"code review (low)","detail":"status.mjs:129 PRD sources compared unnormalized ('./notes/x.md' not matched); knowledge.mjs citing() normalizes","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"},{"item":"C8","what":"code review (low)","detail":"next.mjs:152 otherActive branch is dead after the choose step (only 0 or 1 change reach openspecStep)","note":"fixed in the working tree, uncommitted (2026-10-17); tests 451/451, smoke 46","date":"2026-10-17"}],"result":"pass"} -->
