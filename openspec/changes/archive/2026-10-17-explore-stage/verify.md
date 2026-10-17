# Verify: explore-stage

result: pass
date: 2026-10-17
commit: 335966b
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
| 0 | 0 | 0 | 3 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| C10 | code review (low) | explore-reminder.mjs:13 kit-project guard copied from archive-gate; next.mjs reasons hardcode /opsx:explore and /kit:roadmap instead of lane owners |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| S1 | security review (low) - explore.mjs undo copy at a predictable os.tmpdir() path: on shared Linux /tmp a local user could pre-create a symlink or plant a .prev (Windows %TEMP% is per user) | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C1 | code review (medium) - explore.mjs:59 one record with bad frontmatter makes listRecords throw; next and status then see no explores at all | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C2 | code review (medium) - explore.mjs:85 undo copy never cleared by link-prd; a late undo can delete or roll back a record already linked to a PRD | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C3 | code review (low) - explore.mjs:67 an open question without a Q-id is rewritten as '- null ...' and can never be answered | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C4 | code review (medium) - explore.mjs:62 save rewrites the file from parsed fields; extra sections, sub-bullets or other frontmatter keys are lost | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C5 | code review (low) - explore.mjs:97 a multi-line decision or question keeps its newline; the second line is lost on the next save | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C6 | code review (low) - next.mjs:132 --explore with an unknown slug silently falls back to the only open explore (--change reports the bad name) | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C7 | code review (low) - explore.test.mjs:97 undo tests (and smoke) leave .prev files in the system temp folder; repo rule: never the system temp folder | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C8 | code review (low) - status.mjs:262 with a roadmap, unused notes are counted nowhere (count only shown without a roadmap) | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |
| C9 | code review (low) - next.mjs:121 leftover passed to openspecSuggest is a dead argument; readKnowledge's per-note citation regex work is unused by next (loose end L12) | fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52 | 2026-10-17 |

<!-- kit-verify-data {"change":"explore-stage","date":"2026-10-17","commit":"335966b","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"C10","level":"ADVISORY","what":"code review (low)","detail":"explore-reminder.mjs:13 kit-project guard copied from archive-gate; next.mjs reasons hardcode /opsx:explore and /kit:roadmap instead of lane owners","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-17"},"code":{"how":"ran","note":"","date":"2026-10-17"}},"docsSync":{"date":"2026-10-17","docsUpdated":null,"codeCommitsSince":null,"receipt":false,"proposed":0,"written":0,"declined":0,"leftOut":3,"unplanned":[]},"resolved":[{"item":"S1","what":"security review (low)","detail":"explore.mjs undo copy at a predictable os.tmpdir() path: on shared Linux /tmp a local user could pre-create a symlink or plant a .prev (Windows %TEMP% is per user)","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C1","what":"code review (medium)","detail":"explore.mjs:59 one record with bad frontmatter makes listRecords throw; next and status then see no explores at all","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C2","what":"code review (medium)","detail":"explore.mjs:85 undo copy never cleared by link-prd; a late undo can delete or roll back a record already linked to a PRD","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C3","what":"code review (low)","detail":"explore.mjs:67 an open question without a Q-id is rewritten as '- null ...' and can never be answered","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C4","what":"code review (medium)","detail":"explore.mjs:62 save rewrites the file from parsed fields; extra sections, sub-bullets or other frontmatter keys are lost","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C5","what":"code review (low)","detail":"explore.mjs:97 a multi-line decision or question keeps its newline; the second line is lost on the next save","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C6","what":"code review (low)","detail":"next.mjs:132 --explore with an unknown slug silently falls back to the only open explore (--change reports the bad name)","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C7","what":"code review (low)","detail":"explore.test.mjs:97 undo tests (and smoke) leave .prev files in the system temp folder; repo rule: never the system temp folder","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C8","what":"code review (low)","detail":"status.mjs:262 with a roadmap, unused notes are counted nowhere (count only shown without a roadmap)","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"},{"item":"C9","what":"code review (low)","detail":"next.mjs:121 leftover passed to openspecSuggest is a dead argument; readKnowledge's per-note citation regex work is unused by next (loose end L12)","note":"fixed in the working tree, uncommitted (2026-10-17); tests 502/502, smoke 52","date":"2026-10-17"}],"result":"pass"} -->
