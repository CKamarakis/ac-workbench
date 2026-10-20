# Verify: roadmap-structure

result: pass
date: 2026-10-17
commit: 8f05fc3
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran | run inline (no sub-agents): roadmap.mjs, next.mjs, start-plan.mjs; 0 findings |
| code | ran | code-review skill, medium, on roadmap.mjs, start-plan.mjs, next.mjs; 10 findings |

## Docs sync

docs last updated: 2026-10-17 (c76351a); code commits since: 3; no apply receipt  (date: 2026-10-17)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 4 | 4 | 0 | 7 |

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
| C1 | code review (medium) - roadmap.mjs:266 setStatus writes the new status before checking the destination exists; a failed move leaves a half-done write | fixed in 8f05fc3 | 2026-10-17 |
| C2 | code review (medium) - roadmap.mjs:256 addMilestone writes the file before checking the --after/--before anchor; a bad anchor leaves a stray file and uses up the ID | fixed in 8f05fc3 | 2026-10-17 |
| C3 | code review (medium) - roadmap.mjs:252 addMilestone can overwrite an existing milestone: used-ID check is case-sensitive, file name lowercased, no exists check | fixed in 8f05fc3 | 2026-10-17 |
| C4 | code review (medium) - roadmap.mjs:175 stale Now flags the merge that brought in the roadmap update itself (branch-then-merge workflow always warns) | fixed in 8f05fc3 | 2026-10-17 |
| C5 | code review (low) - roadmap.mjs:166 any commit touching an archived change counts as 'archived' (no --diff-filter=A): false stale Now after editing old archives | fixed in 8f05fc3 | 2026-10-17 |
| C6 | code review (medium) - roadmap.mjs:433 'now' with no --text/--text-file silently empties Now | fixed in 8f05fc3 | 2026-10-17 |
| C7 | code review (low) - roadmap.mjs:250 --goal goes through String.replace with a string; $& $' $` are read as patterns | fixed in 8f05fc3 | 2026-10-17 |
| C8 | code review (low) - roadmap.mjs:349 link dedupes on the untrimmed value but stores it trimmed; values with spaces get added twice | fixed in 8f05fc3 | 2026-10-17 |
| C9 | code review (low) - next.mjs:195 cited text is 'null' + design when a change has no proposal, and notes match by plain substring of the file name | fixed in 8f05fc3 | 2026-10-17 |
| C10 | code review (low) - roadmap.mjs:38 re-defines today/norm instead of importing today from knowledge.mjs; git log --merges scans all history | fixed in 8f05fc3 | 2026-10-17 |

<!-- kit-verify-data {"change":"roadmap-structure","date":"2026-10-17","commit":"8f05fc3","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"ran","note":"run inline (no sub-agents): roadmap.mjs, next.mjs, start-plan.mjs; 0 findings","date":"2026-10-17"},"code":{"how":"ran","note":"code-review skill, medium, on roadmap.mjs, start-plan.mjs, next.mjs; 10 findings","date":"2026-10-17"}},"docsSync":{"date":"2026-10-17","docsUpdated":{"commit":"c76351a","date":"2026-10-17"},"codeCommitsSince":3,"receipt":false,"proposed":4,"written":4,"declined":0,"leftOut":7,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"roadmap.mjs:266 setStatus writes the new status before checking the destination exists; a failed move leaves a half-done write","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C2","what":"code review (medium)","detail":"roadmap.mjs:256 addMilestone writes the file before checking the --after/--before anchor; a bad anchor leaves a stray file and uses up the ID","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C3","what":"code review (medium)","detail":"roadmap.mjs:252 addMilestone can overwrite an existing milestone: used-ID check is case-sensitive, file name lowercased, no exists check","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C4","what":"code review (medium)","detail":"roadmap.mjs:175 stale Now flags the merge that brought in the roadmap update itself (branch-then-merge workflow always warns)","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C5","what":"code review (low)","detail":"roadmap.mjs:166 any commit touching an archived change counts as 'archived' (no --diff-filter=A): false stale Now after editing old archives","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C6","what":"code review (medium)","detail":"roadmap.mjs:433 'now' with no --text/--text-file silently empties Now","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C7","what":"code review (low)","detail":"roadmap.mjs:250 --goal goes through String.replace with a string; $& $' $` are read as patterns","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C8","what":"code review (low)","detail":"roadmap.mjs:349 link dedupes on the untrimmed value but stores it trimmed; values with spaces get added twice","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C9","what":"code review (low)","detail":"next.mjs:195 cited text is 'null' + design when a change has no proposal, and notes match by plain substring of the file name","note":"fixed in 8f05fc3","date":"2026-10-17"},{"item":"C10","what":"code review (low)","detail":"roadmap.mjs:38 re-defines today/norm instead of importing today from knowledge.mjs; git log --merges scans all history","note":"fixed in 8f05fc3","date":"2026-10-17"}],"result":"pass"} -->
