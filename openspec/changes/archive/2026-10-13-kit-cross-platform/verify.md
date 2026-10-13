# Verify: kit-cross-platform

result: pass
date: 2026-10-13
commit: d04f2bd
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran | /security-review run inline on the branch diff (no sub-agents); 0 findings |
| code | ran |  |

## Docs sync

docs last updated: 2026-10-13 (b452220); code commits since: 3; no apply receipt  (date: 2026-10-13)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 5 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| C1 | code review (high) | tools/smoke.mjs:82 openspec steps use shell:false off Windows with a quoted command string: smoke can never pass on macOS/Linux |
| C2 | code review (medium) | toolkit.yaml linux: brew-only installs; Linux without Homebrew can't install git/gh/jq/gitleaks (user chose Homebrew on Linux in /kit:ready D1) |
| C3 | code review (low) | prereqs.mjs:13 HINTS.git picks the platform at load time, ignoring checkPrereqs' platform parameter |
| C4 | code review (low) | tools/install-check.mjs: object marketplace sources (github/url) are treated as missing local folders |
| C5 | code review (low) | tools/install-check.mjs: requires SKILL.md name = folder; Claude Code may fall back to the folder name (unverified) |
| C6 | code review (low) | tools/smoke.mjs and smoke-check.mjs call bare git instead of locate('git'); an empty commit could be recorded |
| C7 | code review (low) | tools/smoke.mjs: rmSync runs before the pass record is written; a Windows EBUSY would lose the record |
| C8 | code review (low) | setup.mjs:39 defaultDeps/hasBrew call locate without the cached npm prefix: extra npm prefix -g processes |
| C9 | code review (low) | setup.mjs: Homebrew guard only in apply(); plan and prereqs still show brew commands as runnable |
| C10 | code review (low) | toolkit.yaml emil-skills: two near-identical commands; a double-quoted "*" might work in both shells (unverified on Windows) |

## Overrides

None.

<!-- kit-verify-data {"change":"kit-cross-platform","date":"2026-10-13","commit":"d04f2bd","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"C1","level":"ADVISORY","what":"code review (high)","detail":"tools/smoke.mjs:82 openspec steps use shell:false off Windows with a quoted command string: smoke can never pass on macOS/Linux","source":"code","severity":"high"},{"id":"C2","level":"ADVISORY","what":"code review (medium)","detail":"toolkit.yaml linux: brew-only installs; Linux without Homebrew can't install git/gh/jq/gitleaks (user chose Homebrew on Linux in /kit:ready D1)","source":"code","severity":"medium"},{"id":"C3","level":"ADVISORY","what":"code review (low)","detail":"prereqs.mjs:13 HINTS.git picks the platform at load time, ignoring checkPrereqs' platform parameter","source":"code","severity":"low"},{"id":"C4","level":"ADVISORY","what":"code review (low)","detail":"tools/install-check.mjs: object marketplace sources (github/url) are treated as missing local folders","source":"code","severity":"low"},{"id":"C5","level":"ADVISORY","what":"code review (low)","detail":"tools/install-check.mjs: requires SKILL.md name = folder; Claude Code may fall back to the folder name (unverified)","source":"code","severity":"low"},{"id":"C6","level":"ADVISORY","what":"code review (low)","detail":"tools/smoke.mjs and smoke-check.mjs call bare git instead of locate('git'); an empty commit could be recorded","source":"code","severity":"low"},{"id":"C7","level":"ADVISORY","what":"code review (low)","detail":"tools/smoke.mjs: rmSync runs before the pass record is written; a Windows EBUSY would lose the record","source":"code","severity":"low"},{"id":"C8","level":"ADVISORY","what":"code review (low)","detail":"setup.mjs:39 defaultDeps/hasBrew call locate without the cached npm prefix: extra npm prefix -g processes","source":"code","severity":"low"},{"id":"C9","level":"ADVISORY","what":"code review (low)","detail":"setup.mjs: Homebrew guard only in apply(); plan and prereqs still show brew commands as runnable","source":"code","severity":"low"},{"id":"C10","level":"ADVISORY","what":"code review (low)","detail":"toolkit.yaml emil-skills: two near-identical commands; a double-quoted \"*\" might work in both shells (unverified on Windows)","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"/security-review run inline on the branch diff (no sub-agents); 0 findings","date":"2026-10-13"},"code":{"how":"ran","note":"","date":"2026-10-13"}},"docsSync":{"date":"2026-10-13","docsUpdated":{"commit":"b452220","date":"2026-10-13"},"codeCommitsSince":3,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":5,"unplanned":[]},"result":"pass"} -->
