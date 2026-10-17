# Verify: loose-ends

result: pass
date: 2026-10-17
commit: 6c281dc
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran |  |
| code | ran | review covered the branch; 5 findings in older committed code (roadmap.mjs Order prose, resolveWaiting without --answer, gitFindings per-merge git; next.mjs note-name citing and regex cost) are outside this change |

## Docs sync

docs last updated: never committed; code commits since: unknown; no apply receipt  (date: 2026-10-17)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 2 | 2 | 0 | 4 |

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
| C1 | code review (medium) - loose-ends.mjs:115 block accepts a finished target (done milestone, archived change, closed loose end); status then reports it as a mismatch at once | fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49 | 2026-10-17 |
| C2 | code review (low) - next.mjs:321 an unreadable loose-ends.md is swallowed in next, and the roadmap report hides its pointer; only status says the file is broken | fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49 | 2026-10-17 |
| C3 | code review (low) - status.mjs:241 with an unreadable loose-ends.md the source path falls back to 'loose-ends.md' at the project root instead of knowledge/loose-ends.md | fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49 | 2026-10-17 |
| C4 | code review (low) - loose-ends.mjs:78 save overwrites in place; a cut-off write leaves unreadable data (temp file + rename would avoid it) | fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49 | 2026-10-17 |
| C5 | code review (low) - next.mjs:133 leftoverCount/blockedBy repeat 'open, not accepted' instead of using isOpen/looseSummary from loose-ends.mjs | fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49 | 2026-10-17 |

<!-- kit-verify-data {"change":"loose-ends","date":"2026-10-17","commit":"6c281dc","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-17"},"code":{"how":"ran","note":"review covered the branch; 5 findings in older committed code (roadmap.mjs Order prose, resolveWaiting without --answer, gitFindings per-merge git; next.mjs note-name citing and regex cost) are outside this change","date":"2026-10-17"}},"docsSync":{"date":"2026-10-17","docsUpdated":null,"codeCommitsSince":null,"receipt":false,"proposed":2,"written":2,"declined":0,"leftOut":4,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"loose-ends.mjs:115 block accepts a finished target (done milestone, archived change, closed loose end); status then reports it as a mismatch at once","note":"fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49","date":"2026-10-17"},{"item":"C2","what":"code review (low)","detail":"next.mjs:321 an unreadable loose-ends.md is swallowed in next, and the roadmap report hides its pointer; only status says the file is broken","note":"fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49","date":"2026-10-17"},{"item":"C3","what":"code review (low)","detail":"status.mjs:241 with an unreadable loose-ends.md the source path falls back to 'loose-ends.md' at the project root instead of knowledge/loose-ends.md","note":"fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49","date":"2026-10-17"},{"item":"C4","what":"code review (low)","detail":"loose-ends.mjs:78 save overwrites in place; a cut-off write leaves unreadable data (temp file + rename would avoid it)","note":"fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49","date":"2026-10-17"},{"item":"C5","what":"code review (low)","detail":"next.mjs:133 leftoverCount/blockedBy repeat 'open, not accepted' instead of using isOpen/looseSummary from loose-ends.mjs","note":"fixed in the working tree, uncommitted (2026-10-17); tests 476/476, smoke 49","date":"2026-10-17"}],"result":"pass"} -->
