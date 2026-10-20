# Verify: kit-docs

result: pass
date: 2026-10-12
commit: 7660098
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

docs last updated: 2026-10-12 (99b326d); code commits since: 1  (date: 2026-10-12)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 9 | 5 | 0 | 6 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| S1 | security review (low) | docs.mjs prdFor: a PRD path in an archived proposal (PRD: ../x.md) can read another .md's title/status into the page; reject paths outside the project |
| C1 | code review (medium) | docs.mjs:197 stale-note check uses the last commit date; an uncommitted refreshed note is reported stale again and re-drafted |
| C2 | code review (low) | next.mjs:261 /kit:next runs the full docs scan (one git log per spec) just to read page.stale |
| C3 | code review (low) | docs.mjs:124 same-day archives ordered by folder name; 'changed by', history order and PRD pick can name the older one |
| C4 | code review (low) | docs.mjs:240 builtFrom is HTML-escaped in the page but compared raw; an archive name with & or ' keeps the page stale forever |
| C5 | code review (low) | docs-page.mjs:191 card anchors use only the slug; same slug under two products collides, product-qualified [[x/y]] links match nothing |
| C6 | code review (medium) | docs.mjs:167 a tool with no packages: line defaults to its name; scan reports it gone and its real package unlisted, re-drafted every run |
| C7 | code review (low) | docs-page.mjs:8 inlineMd applies bold after code; ** inside backticks turns into bold markup inside the code span |
| C8 | code review (low) | archive-gate.mjs:29 reminder fires when knowledge/docs/ exists even if index.html was never built; should check the page file |
| C9 | code review (low) | docs-page.mjs:221 meta name kit-docs-archive duplicated instead of sharing PAGE_MARK; a rename breaks the stale check |
| C10 | code review (low) | docs.mjs:194 dead today(); buildModel parses package.json twice |

## Overrides

None.

<!-- kit-verify-data {"change":"kit-docs","date":"2026-10-12","commit":"7660098","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"S1","level":"ADVISORY","what":"security review (low)","detail":"docs.mjs prdFor: a PRD path in an archived proposal (PRD: ../x.md) can read another .md's title/status into the page; reject paths outside the project","source":"security","severity":"low"},{"id":"C1","level":"ADVISORY","what":"code review (medium)","detail":"docs.mjs:197 stale-note check uses the last commit date; an uncommitted refreshed note is reported stale again and re-drafted","source":"code","severity":"medium"},{"id":"C2","level":"ADVISORY","what":"code review (low)","detail":"next.mjs:261 /kit:next runs the full docs scan (one git log per spec) just to read page.stale","source":"code","severity":"low"},{"id":"C3","level":"ADVISORY","what":"code review (low)","detail":"docs.mjs:124 same-day archives ordered by folder name; 'changed by', history order and PRD pick can name the older one","source":"code","severity":"low"},{"id":"C4","level":"ADVISORY","what":"code review (low)","detail":"docs.mjs:240 builtFrom is HTML-escaped in the page but compared raw; an archive name with & or ' keeps the page stale forever","source":"code","severity":"low"},{"id":"C5","level":"ADVISORY","what":"code review (low)","detail":"docs-page.mjs:191 card anchors use only the slug; same slug under two products collides, product-qualified [[x/y]] links match nothing","source":"code","severity":"low"},{"id":"C6","level":"ADVISORY","what":"code review (medium)","detail":"docs.mjs:167 a tool with no packages: line defaults to its name; scan reports it gone and its real package unlisted, re-drafted every run","source":"code","severity":"medium"},{"id":"C7","level":"ADVISORY","what":"code review (low)","detail":"docs-page.mjs:8 inlineMd applies bold after code; ** inside backticks turns into bold markup inside the code span","source":"code","severity":"low"},{"id":"C8","level":"ADVISORY","what":"code review (low)","detail":"archive-gate.mjs:29 reminder fires when knowledge/docs/ exists even if index.html was never built; should check the page file","source":"code","severity":"low"},{"id":"C9","level":"ADVISORY","what":"code review (low)","detail":"docs-page.mjs:221 meta name kit-docs-archive duplicated instead of sharing PAGE_MARK; a rename breaks the stale check","source":"code","severity":"low"},{"id":"C10","level":"ADVISORY","what":"code review (low)","detail":"docs.mjs:194 dead today(); buildModel parses package.json twice","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-12"},"code":{"how":"ran","note":"","date":"2026-10-12"}},"docsSync":{"date":"2026-10-12","docsUpdated":{"commit":"99b326d","date":"2026-10-12"},"codeCommitsSince":1,"receipt":true,"proposed":9,"written":5,"declined":0,"leftOut":6,"unplanned":[]},"result":"pass"} -->
