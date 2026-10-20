# Verify: kit-debt-fixes

result: pass
date: 2026-10-19
commit: c1a2df7
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

18 scenario(s): 18 with a test, 0 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| harness-review: Project without the kit | tests/kit/harness.test.mjs |
| harness-review: Kit overlap | tests/kit/harness.test.mjs |
| harness-review: Context doc grown long | tests/kit/harness.test.mjs |
| project-status: Bare word | tests/kit/next.test.mjs |
| project-status: Named with .md | tests/kit/next.test.mjs |
| roadmap: Drop a task | tests/kit/roadmap.test.mjs |
| roadmap: Tick a dropped task | tests/kit/roadmap.test.mjs |
| roadmap: Edit a task's text | tests/kit/roadmap.test.mjs |
| roadmap: Task text with a number | tests/kit/roadmap.test.mjs |
| roadmap: Reopen a dropped task | tests/kit/roadmap.test.mjs |
| roadmap: Milestone file shape | tests/kit/roadmap.test.mjs |
| roadmap: Reorder keeps IDs | tests/kit/roadmap.test.mjs |
| roadmap: Broken milestone | tests/kit/roadmap.test.mjs |
| roadmap: Long row | tests/kit/roadmap.test.mjs |
| roadmap: Finished milestone not moved | tests/kit/roadmap.test.mjs |
| roadmap: Waiting item names an unknown milestone | tests/kit/roadmap.test.mjs |
| roadmap: Dropped task without its note | tests/kit/roadmap.test.mjs |
| roadmap: Text under Order | tests/kit/roadmap.test.mjs |

## Docs sync

docs last updated: 2026-10-19 (fcb6d71); code commits since: 1; no apply receipt  (date: 2026-10-19)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 1 |

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
| C1 | code review (medium) - next.mjs:154 a milestone whose tasks are all dropped is never reported as done (report total 0; the done branch needs total > 0), so /kit:next falls through to Nothing open | fixed in fcb6d71 | 2026-10-19 |
| C2 | code review (low) - roadmap.mjs:130 'active but has no tasks' counts dropped tasks while the report counts only kept ones | fixed in fcb6d71 | 2026-10-19 |
| C3 | code review (medium) - roadmap.mjs:354 a dropped task can't be reopened: tick --undo and edit-task refuse it and there is no undo command | fixed in fcb6d71 | 2026-10-19 |
| C4 | code review (low) - roadmap.mjs:272 the task-number guard (/^\s*T\d+\b/i) also refuses real text such as 'T3 stack spike' or 't2 instance sizing' | fixed in fcb6d71 | 2026-10-19 |
| C5 | code review (low) - roadmap.mjs:522 the unknown-command error doesn't list drop-task and edit-task | fixed in fcb6d71 | 2026-10-19 |
| C6 | code review (low) - harness-review SKILL.md:27 the skill looks for 'over 60' but reads scan --json, where the field is contextDoc.long; 60 is written in two places | fixed in fcb6d71 | 2026-10-19 |
| C7 | code review (medium) - verify SKILL.md:43 a diff over ~2000 lines reaches spec-reviewer only as a file list; without Bash it can't see what changed | fixed in fcb6d71 | 2026-10-19 |
| C8 | code review (low) - roadmap.mjs:193 the diff-tree spawn repeats git path, cwd, encoding and timeout instead of extending run() | fixed in fcb6d71 | 2026-10-19 |
| C9 | code review (low) - next.mjs:23 cmd() falls back to the owner tool's bare name ('Start with superspec.'), which isn't a runnable command | fixed in fcb6d71 | 2026-10-19 |
| C10 | code review (low) - roadmap.mjs:310 the comment states diff-tree --stdin behaviour without naming its source (git docs) | fixed in fcb6d71 | 2026-10-19 |
| V1 | review against the spec - roadmap: Roadmap layout \| plugins/kit/scripts/roadmap.mjs:34 \| spec says a dropped task reads '- [-] T<n> <text> (dropped <date>: <reason>)'; the check accepts any '- [-]' line, so a hand-written one without date and reason passes | fixed in c1a2df7 | 2026-10-19 |

<!-- kit-verify-data {"change":"kit-debt-fixes","date":"2026-10-19","commit":"c1a2df7","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-19"},"spec":{"how":"substitute","note":"not chosen by Safeguards (no /kit:ready run before the build); reviewed by hand: every requirement and scenario of the 3 delta specs against the diff; one finding","date":"2026-10-19"},"code":{"how":"ran","note":"","date":"2026-10-19"}},"scenarioCheck":[{"capability":"harness-review","scenario":"Project without the kit","name":"harness-review: Project without the kit","status":"named","test":"tests/kit/harness.test.mjs"},{"capability":"harness-review","scenario":"Kit overlap","name":"harness-review: Kit overlap","status":"recorded","test":"tests/kit/harness.test.mjs","note":""},{"capability":"harness-review","scenario":"Context doc grown long","name":"harness-review: Context doc grown long","status":"named","test":"tests/kit/harness.test.mjs"},{"capability":"project-status","scenario":"Bare word","name":"project-status: Bare word","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"project-status","scenario":"Named with .md","name":"project-status: Named with .md","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"roadmap","scenario":"Drop a task","name":"roadmap: Drop a task","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Tick a dropped task","name":"roadmap: Tick a dropped task","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Edit a task's text","name":"roadmap: Edit a task's text","status":"recorded","test":"tests/kit/roadmap.test.mjs","note":""},{"capability":"roadmap","scenario":"Task text with a number","name":"roadmap: Task text with a number","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Reopen a dropped task","name":"roadmap: Reopen a dropped task","status":"recorded","test":"tests/kit/roadmap.test.mjs","note":""},{"capability":"roadmap","scenario":"Milestone file shape","name":"roadmap: Milestone file shape","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Reorder keeps IDs","name":"roadmap: Reorder keeps IDs","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Broken milestone","name":"roadmap: Broken milestone","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Long row","name":"roadmap: Long row","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Finished milestone not moved","name":"roadmap: Finished milestone not moved","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Waiting item names an unknown milestone","name":"roadmap: Waiting item names an unknown milestone","status":"recorded","test":"tests/kit/roadmap.test.mjs","note":""},{"capability":"roadmap","scenario":"Dropped task without its note","name":"roadmap: Dropped task without its note","status":"recorded","test":"tests/kit/roadmap.test.mjs","note":""},{"capability":"roadmap","scenario":"Text under Order","name":"roadmap: Text under Order","status":"named","test":"tests/kit/roadmap.test.mjs"}],"webUi":true,"scenarios":{"roadmap: Edit a task's text":{"test":"tests/kit/roadmap.test.mjs","date":"2026-10-19"},"roadmap: Waiting item names an unknown milestone":{"test":"tests/kit/roadmap.test.mjs","date":"2026-10-19"},"harness-review: Kit overlap":{"test":"tests/kit/harness.test.mjs","date":"2026-10-19"},"roadmap: Reopen a dropped task":{"test":"tests/kit/roadmap.test.mjs","date":"2026-10-19"},"roadmap: Dropped task without its note":{"test":"tests/kit/roadmap.test.mjs","date":"2026-10-19"}},"docsSync":{"date":"2026-10-19","docsUpdated":{"commit":"fcb6d71","date":"2026-10-19"},"codeCommitsSince":1,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":1,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"next.mjs:154 a milestone whose tasks are all dropped is never reported as done (report total 0; the done branch needs total > 0), so /kit:next falls through to Nothing open","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C2","what":"code review (low)","detail":"roadmap.mjs:130 'active but has no tasks' counts dropped tasks while the report counts only kept ones","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C3","what":"code review (medium)","detail":"roadmap.mjs:354 a dropped task can't be reopened: tick --undo and edit-task refuse it and there is no undo command","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C4","what":"code review (low)","detail":"roadmap.mjs:272 the task-number guard (/^\\s*T\\d+\\b/i) also refuses real text such as 'T3 stack spike' or 't2 instance sizing'","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C5","what":"code review (low)","detail":"roadmap.mjs:522 the unknown-command error doesn't list drop-task and edit-task","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C6","what":"code review (low)","detail":"harness-review SKILL.md:27 the skill looks for 'over 60' but reads scan --json, where the field is contextDoc.long; 60 is written in two places","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C7","what":"code review (medium)","detail":"verify SKILL.md:43 a diff over ~2000 lines reaches spec-reviewer only as a file list; without Bash it can't see what changed","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C8","what":"code review (low)","detail":"roadmap.mjs:193 the diff-tree spawn repeats git path, cwd, encoding and timeout instead of extending run()","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C9","what":"code review (low)","detail":"next.mjs:23 cmd() falls back to the owner tool's bare name ('Start with superspec.'), which isn't a runnable command","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"C10","what":"code review (low)","detail":"roadmap.mjs:310 the comment states diff-tree --stdin behaviour without naming its source (git docs)","note":"fixed in fcb6d71","date":"2026-10-19"},{"item":"V1","what":"review against the spec","detail":"roadmap: Roadmap layout | plugins/kit/scripts/roadmap.mjs:34 | spec says a dropped task reads '- [-] T<n> <text> (dropped <date>: <reason>)'; the check accepts any '- [-]' line, so a hand-written one without date and reason passes","note":"fixed in c1a2df7","date":"2026-10-19"}],"result":"pass"} -->
