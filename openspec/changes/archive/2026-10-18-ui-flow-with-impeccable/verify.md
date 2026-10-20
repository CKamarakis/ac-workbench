# Verify: ui-flow-with-impeccable

result: pass
date: 2026-10-18
commit: c0cac8d
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran | in-session review of the diff: no new shell, network or outside writes; no findings |
| code | ran |  |
| spec | substitute | same prompt as kit:spec-reviewer via a general-purpose agent (plugin agents load at session start); 5 requirements, 17 scenarios, 0 differences; ~75k tokens |

## Safeguards

reach medium, undo low, safety low; chosen: scenario-check, worktree, spec-review

## Scenarios

18 scenario(s): 13 with a test, 0 checked by hand, 5 without a test

| Scenario | Checked by |
|---|---|
| build-readiness: Type in kit.json | tests/kit/ready.test.mjs |
| build-readiness: Impeccable installed, no type | tests/kit/ready.test.mjs |
| build-readiness: Explicit type wins | tests/kit/ready.test.mjs |
| build-readiness: Neither | tests/kit/lanes.test.mjs |
| build-readiness: UI files named | tests/kit/ready.test.mjs |
| build-readiness: Generated page | no test |
| build-readiness: Word alone | no test |
| build-readiness: Not web-ui | tests/kit/ready.test.mjs |
| build-readiness: Missing empty state | no test |
| prd-authoring: Screen in a web-ui project | no test |
| prd-authoring: No screen | no test |
| prd-authoring: Declined | tests/kit/knowledge.test.mjs |
| quality-gates: Chosen and run | tests/kit/verify.test.mjs |
| quality-gates: Chosen, not recorded | tests/kit/verify.test.mjs |
| quality-gates: Design context missing | tests/kit/verify.test.mjs |
| quality-gates: App can't run | tests/kit/verify.test.mjs |
| quality-gates: Impeccable not installed | tests/kit/verify.test.mjs |
| quality-gates: UI review not chosen | tests/kit/verify.test.mjs |

## Docs sync

docs last updated: 2026-10-18 (c0cac8d); code commits since: 0; no apply receipt  (date: 2026-10-18)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 3 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| N:build-readiness: Generated page | scenario without a test | build-readiness: Generated page |
| N:build-readiness: Word alone | scenario without a test | build-readiness: Word alone |
| N:build-readiness: Missing empty state | scenario without a test | build-readiness: Missing empty state |
| N:prd-authoring: Screen in a web-ui project | scenario without a test | prd-authoring: Screen in a web-ui project |
| N:prd-authoring: No screen | scenario without a test | prd-authoring: No screen |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| V1 | review against the spec - quality-gates: UI review at verify \| verify.mjs:417 \| wording: the --source error message left out ui (not a behaviour difference) | fixed in the working tree before commit (message now lists ui) | 2026-10-18 |
| C1 | code review (low) - webUi only knew next.config.*; /kit:start knows next, vite, astro, svelte, nuxt | fixed before commit: now uses WEB_APP_CONFIG, shared with start-plan (user choice at verify) | 2026-10-18 |
| C2 | code review (low) - ready.mjs: a dropped ui-review still wrote its reason ("UI review because") | fixed before commit: reason written only when ui-review is chosen | 2026-10-18 |
| C3 | code review (low) - ready.mjs: the web-ui guard ran on --ui-why even when ui-review was dropped | fixed before commit: guard runs only for a chosen ui-review | 2026-10-18 |
| C4 | code review (low) - verify.mjs: addFinding error message left out ui | fixed before commit: messages built from the source lists | 2026-10-18 |
| C5 | code review (low) - webUi: files overrode an explicit non-web-ui type in kit.json | fixed before commit: an explicit type wins (user choice at verify) | 2026-10-18 |
| C6 | code review (low) - prd skill: shape: done set even when the brief was not written | fixed before commit: done only after the UX notes section is written | 2026-10-18 |
| C7 | code review (low) - verify.mjs: "ui review: not chosen" in every report, CLI projects too | fixed before commit: only in web-ui projects | 2026-10-18 |
| C8 | code review (low) - verify.mjs: review and finding source lists copied in five places | fixed before commit: one REVIEW_SOURCES and one RESOLVABLE constant | 2026-10-18 |
| C9 | code review (low) - ready.mjs imported verify.mjs (and its graph) for webUi | fixed before commit: webUi moved to project.mjs | 2026-10-18 |

<!-- kit-verify-data {"change":"ui-flow-with-impeccable","date":"2026-10-18","commit":"c0cac8d","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"N:build-readiness: Generated page","level":"ADVISORY","what":"scenario without a test","detail":"build-readiness: Generated page","source":"scenarios"},{"id":"N:build-readiness: Word alone","level":"ADVISORY","what":"scenario without a test","detail":"build-readiness: Word alone","source":"scenarios"},{"id":"N:build-readiness: Missing empty state","level":"ADVISORY","what":"scenario without a test","detail":"build-readiness: Missing empty state","source":"scenarios"},{"id":"N:prd-authoring: Screen in a web-ui project","level":"ADVISORY","what":"scenario without a test","detail":"prd-authoring: Screen in a web-ui project","source":"scenarios"},{"id":"N:prd-authoring: No screen","level":"ADVISORY","what":"scenario without a test","detail":"prd-authoring: No screen","source":"scenarios"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"in-session review of the diff: no new shell, network or outside writes; no findings","date":"2026-10-18"},"spec":{"how":"substitute","note":"same prompt as kit:spec-reviewer via a general-purpose agent (plugin agents load at session start); 5 requirements, 17 scenarios, 0 differences; ~75k tokens","date":"2026-10-18"},"code":{"how":"ran","note":"","date":"2026-10-18"}},"scenarioCheck":[{"capability":"build-readiness","scenario":"Type in kit.json","name":"build-readiness: Type in kit.json","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Impeccable installed, no type","name":"build-readiness: Impeccable installed, no type","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Explicit type wins","name":"build-readiness: Explicit type wins","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Neither","name":"build-readiness: Neither","status":"named","test":"tests/kit/lanes.test.mjs"},{"capability":"build-readiness","scenario":"UI files named","name":"build-readiness: UI files named","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Generated page","name":"build-readiness: Generated page","status":"missing","test":null},{"capability":"build-readiness","scenario":"Word alone","name":"build-readiness: Word alone","status":"missing","test":null},{"capability":"build-readiness","scenario":"Not web-ui","name":"build-readiness: Not web-ui","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Missing empty state","name":"build-readiness: Missing empty state","status":"missing","test":null},{"capability":"prd-authoring","scenario":"Screen in a web-ui project","name":"prd-authoring: Screen in a web-ui project","status":"missing","test":null},{"capability":"prd-authoring","scenario":"No screen","name":"prd-authoring: No screen","status":"missing","test":null},{"capability":"prd-authoring","scenario":"Declined","name":"prd-authoring: Declined","status":"named","test":"tests/kit/knowledge.test.mjs"},{"capability":"quality-gates","scenario":"Chosen and run","name":"quality-gates: Chosen and run","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"Chosen, not recorded","name":"quality-gates: Chosen, not recorded","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"Design context missing","name":"quality-gates: Design context missing","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"App can't run","name":"quality-gates: App can't run","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Impeccable not installed","name":"quality-gates: Impeccable not installed","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"UI review not chosen","name":"quality-gates: UI review not chosen","status":"named","test":"tests/kit/verify.test.mjs"}],"webUi":false,"scenarios":{"quality-gates: App can't run":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"}},"safeguards":{"date":"2026-10-18","ratings":{"reach":{"level":"medium","why":"Changes shared modules: knowledge.mjs (imported by 9 scripts) and verify.mjs (imported by next.mjs and the archive gate); the new command, flag and field are additive"},"undo":{"level":"low","why":"Everything is in the repo; git revert undoes it"},"safety":{"level":"low","why":"No secrets, permissions, blocking hooks or network writes"}},"recommended":["scenario-check","worktree","spec-review"],"chosen":["scenario-check","worktree","spec-review"]},"docsSync":{"date":"2026-10-18","docsUpdated":{"commit":"c0cac8d","date":"2026-10-18"},"codeCommitsSince":0,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":3,"unplanned":[]},"resolved":[{"item":"V1","what":"review against the spec","detail":"quality-gates: UI review at verify | verify.mjs:417 | wording: the --source error message left out ui (not a behaviour difference)","note":"fixed in the working tree before commit (message now lists ui)","date":"2026-10-18"},{"item":"C1","what":"code review (low)","detail":"webUi only knew next.config.*; /kit:start knows next, vite, astro, svelte, nuxt","note":"fixed before commit: now uses WEB_APP_CONFIG, shared with start-plan (user choice at verify)","date":"2026-10-18"},{"item":"C2","what":"code review (low)","detail":"ready.mjs: a dropped ui-review still wrote its reason (\"UI review because\")","note":"fixed before commit: reason written only when ui-review is chosen","date":"2026-10-18"},{"item":"C3","what":"code review (low)","detail":"ready.mjs: the web-ui guard ran on --ui-why even when ui-review was dropped","note":"fixed before commit: guard runs only for a chosen ui-review","date":"2026-10-18"},{"item":"C4","what":"code review (low)","detail":"verify.mjs: addFinding error message left out ui","note":"fixed before commit: messages built from the source lists","date":"2026-10-18"},{"item":"C5","what":"code review (low)","detail":"webUi: files overrode an explicit non-web-ui type in kit.json","note":"fixed before commit: an explicit type wins (user choice at verify)","date":"2026-10-18"},{"item":"C6","what":"code review (low)","detail":"prd skill: shape: done set even when the brief was not written","note":"fixed before commit: done only after the UX notes section is written","date":"2026-10-18"},{"item":"C7","what":"code review (low)","detail":"verify.mjs: \"ui review: not chosen\" in every report, CLI projects too","note":"fixed before commit: only in web-ui projects","date":"2026-10-18"},{"item":"C8","what":"code review (low)","detail":"verify.mjs: review and finding source lists copied in five places","note":"fixed before commit: one REVIEW_SOURCES and one RESOLVABLE constant","date":"2026-10-18"},{"item":"C9","what":"code review (low)","detail":"ready.mjs imported verify.mjs (and its graph) for webUi","note":"fixed before commit: webUi moved to project.mjs","date":"2026-10-18"}],"result":"pass"} -->
