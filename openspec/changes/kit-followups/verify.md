# Verify: kit-followups

result: pass
date: 2026-10-14
commit: 8f6eb52
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran | /security-review inline on main..kit-followups-triage (no sub-agents); 0 findings |
| code | ran |  |

## Docs sync

docs last updated: 2026-10-14 (6b649b8); code commits since: 3; no apply receipt  (date: 2026-10-14)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 3 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| C1 | code review (medium) | verify.mjs addFinding: ids come from the count of open items, so after resolve a new finding can reuse an id (two C2s; resolving one removes both) |
| C2 | code review (medium) | verify.mjs resolve: generated items (U:, P1, O:decisions) come back on the next run while also listed as Resolved |
| C3 | code review (medium) | decisions.mjs changeFolder: add/later/ready-done also fall back to an archived change of the same name (mistyped or reused name writes into the archive) |
| C4 | code review (low) | decisions.mjs: a change name archived twice - only the newest archive is reachable |
| C5 | code review (low) | docs.mjs pageStatus: deciding an archived decision doesn't mark the docs page stale |
| C6 | code review (low) | docs.mjs: same-day uncommitted archives can swap order once committed, marking the page stale once |
| C7 | code review (low) | decisions.mjs archivedFolders duplicates docs.mjs archive listing with a different order |
| C8 | code review (low) | next.mjs: every /kit:next reads all archived decisions.md (cost grows with history) |
| C9 | code review (low) | install: none special-cased in four places instead of one normalizer |

## Overrides

None.

<!-- kit-verify-data {"change":"kit-followups","date":"2026-10-14","commit":"8f6eb52","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"C1","level":"ADVISORY","what":"code review (medium)","detail":"verify.mjs addFinding: ids come from the count of open items, so after resolve a new finding can reuse an id (two C2s; resolving one removes both)","source":"code","severity":"medium"},{"id":"C2","level":"ADVISORY","what":"code review (medium)","detail":"verify.mjs resolve: generated items (U:, P1, O:decisions) come back on the next run while also listed as Resolved","source":"code","severity":"medium"},{"id":"C3","level":"ADVISORY","what":"code review (medium)","detail":"decisions.mjs changeFolder: add/later/ready-done also fall back to an archived change of the same name (mistyped or reused name writes into the archive)","source":"code","severity":"medium"},{"id":"C4","level":"ADVISORY","what":"code review (low)","detail":"decisions.mjs: a change name archived twice - only the newest archive is reachable","source":"code","severity":"low"},{"id":"C5","level":"ADVISORY","what":"code review (low)","detail":"docs.mjs pageStatus: deciding an archived decision doesn't mark the docs page stale","source":"code","severity":"low"},{"id":"C6","level":"ADVISORY","what":"code review (low)","detail":"docs.mjs: same-day uncommitted archives can swap order once committed, marking the page stale once","source":"code","severity":"low"},{"id":"C7","level":"ADVISORY","what":"code review (low)","detail":"decisions.mjs archivedFolders duplicates docs.mjs archive listing with a different order","source":"code","severity":"low"},{"id":"C8","level":"ADVISORY","what":"code review (low)","detail":"next.mjs: every /kit:next reads all archived decisions.md (cost grows with history)","source":"code","severity":"low"},{"id":"C9","level":"ADVISORY","what":"code review (low)","detail":"install: none special-cased in four places instead of one normalizer","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"/security-review inline on main..kit-followups-triage (no sub-agents); 0 findings","date":"2026-10-14"},"code":{"how":"ran","note":"","date":"2026-10-14"}},"result":"pass","docsSync":{"date":"2026-10-14","docsUpdated":{"commit":"6b649b8","date":"2026-10-14"},"codeCommitsSince":3,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":3,"unplanned":[]}} -->
