# Verify: build-safeguards

result: pass
date: 2026-10-18
commit: e56b9b7
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran | analysis done in-session, no sub-tasks |
| code | ran |  |
| spec | substitute | same prompt as kit:spec-reviewer via a general-purpose agent (plugin agents load at session start) |

## Safeguards

reach high, undo high, safety low; chosen: scenario-check, spec-review, probes, security-weighted, user-ok

your OK before merge: given 2026-10-18 (user OK at verify, 2026-10-18)

## Scenarios

41 scenario(s): 37 with a test, 1 checked by hand, 3 without a test

| Scenario | Checked by |
|---|---|
| build-readiness: Low-risk change | tests/kit/ready.test.mjs |
| build-readiness: Shared module | tests/kit/ready.test.mjs |
| build-readiness: Keyword alone | no test |
| build-readiness: User changes the recommendation | tests/kit/ready.test.mjs |
| build-readiness: No design yet | tests/kit/ready.test.mjs |
| build-readiness: Plan doesn't say | tests/kit/ready.test.mjs |
| project-starter: Web UI project | tests/kit/start-plan.test.mjs |
| project-starter: Opt-in tool | tests/kit/start-plan.test.mjs |
| project-starter: Dropped tool excluded | tests/kit/start-plan.test.mjs |
| project-starter: Next.js project | tests/kit/start-plan.test.mjs |
| project-starter: Opt-in tools not asked | tests/kit/start-plan.test.mjs |
| project-starter: Type tools installed silently | tests/kit/start-plan.test.mjs |
| project-starter: File changes confirmed together | tests/kit/start-apply.test.mjs |
| quality-gates: All green | tests/kit/verify.test.mjs |
| quality-gates: Failing test | tests/kit/verify.test.mjs |
| quality-gates: Docs sync with open items | tests/kit/verify.test.mjs |
| quality-gates: Earlier report from another tool | tests/kit/verify.test.mjs |
| quality-gates: Override with a reason | tests/kit/verify.test.mjs |
| quality-gates: Advisory only | tests/kit/verify.test.mjs |
| quality-gates: Fixed HARD finding | tests/kit/verify.test.mjs |
| quality-gates: Medium finding on a high-risk change | tests/kit/verify.test.mjs |
| quality-gates: Untested scenario | tests/kit/verify.test.mjs |
| quality-gates: Checked by hand | tests/kit/verify.test.mjs |
| quality-gates: Logic differs from a scenario | by hand: spec-reviewer prompt on a planted 3-vs-30-days fixture found it (runs.md 3.2) |
| quality-gates: Not chosen | tests/kit/verify.test.mjs |
| quality-gates: OK recorded | tests/kit/verify.test.mjs |
| skill-evals: A/B comparison | tools/evals/lib.test.mjs |
| skill-routing: Complete lane map | tests/kit/lanes.test.mjs |
| skill-routing: Deferring tool shown as alternative | tests/kit/lanes.test.mjs |
| skill-routing: Tie reported as conflict | tests/kit/lanes.test.mjs |
| skill-routing: Worktree chosen | no test |
| skill-routing: No Safeguards section | tests/kit/lanes.test.mjs |
| tool-review: One tool behind | tests/kit/tool-review.test.mjs |
| tool-review: Source gone | tests/kit/tool-review.test.mjs |
| tool-review: Version not found | tests/kit/tool-review.test.mjs |
| tool-review: Update with a failing smoke test | no test |
| tool-review: Drop | tests/kit/hooks.test.mjs |
| tool-review: Hold | tests/kit/harness.test.mjs |
| tool-review: Review due | tests/kit/hooks.test.mjs |
| tool-review: Not due | tests/kit/hooks.test.mjs |
| tool-review: Other project | tests/kit/harness.test.mjs |

## Docs sync

docs last updated: 2026-10-18 (5a4b8ae); code commits since: 0; no apply receipt  (date: 2026-10-18)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 0 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| N:build-readiness: Keyword alone | scenario without a test | build-readiness: Keyword alone |
| N:skill-routing: Worktree chosen | scenario without a test | skill-routing: Worktree chosen |
| N:tool-review: Update with a failing smoke test | scenario without a test | tool-review: Update with a failing smoke test |
| V4 | review against the spec | quality-gates: Review against the spec (SHALL NOT edit) \| agents/spec-reviewer.md:4 \| read-only only by prompt: Bash is unrestricted in the frontmatter |
| X5 | edge-case probe | drop on a verdicts list with a blank or comment line may insert mid-list |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| S1 | security review (low) - tool-review.mjs: npm package name from toolkit.yaml reached cmd.exe unchecked (Windows .cmd shim); filtered at confidence 7 (needs an untrusted repo) | fixed in 1a394bc (NPM_NAME check + test) | 2026-10-18 |
| C1 | code review (medium) - verify.mjs: security-weighted and user-ok follow isHigh(ratings), not the user's choice in design.md Safeguards | fixed in 5a4b8ae | 2026-10-18 |
| C2 | code review (medium) - verify.mjs scenarioCheck: any file under tests/ (fixtures, JSON) containing a short scenario title counts as its test | fixed in 5a4b8ae | 2026-10-18 |
| C3 | code review (low) - ready.mjs writeSafeguards: collapses 3+ blank lines across the whole design.md, not just the section | fixed in 5a4b8ae | 2026-10-18 |
| C4 | code review (medium) - ready.mjs writeSafeguards: creating a stub design.md makes openspec count the design artifact as done | fixed in 5a4b8ae | 2026-10-18 |
| C5 | code review (low) - tool-review.mjs github fallback: takes the first tag, not the highest version | fixed in 5a4b8ae | 2026-10-18 |
| C6 | code review (low) - verify.mjs okPending: read from a stored K:ok item, so a change made high-risk after the last run gets no archive reminder | fixed in 5a4b8ae | 2026-10-18 |
| C7 | code review (medium) - tool-review.mjs registryEntries: a column-0 comment inside tools: ends the list; later tools vanish from scan, reminder and record | fixed in 5a4b8ae | 2026-10-18 |
| C8 | code review (low) - ready.mjs importers: matches the basename only, so other files with the same name inflate reach | fixed in 5a4b8ae | 2026-10-18 |
| C9 | code review (low) - verify.mjs duplicates ready.mjs's Safeguards data parser; a format change would silently turn the high-risk rules off | fixed in 5a4b8ae | 2026-10-18 |
| V1 | review against the spec - quality-gates: Hard failures and overrides \| verify.mjs:364,438 \| spec: a HARD item clears once fixed and a re-run passes; code keeps the finding on every run and resolve refuses HARD (L19) | fixed in 5a4b8ae | 2026-10-18 |
| V2 | review against the spec - quality-gates: Hard failures / User's OK \| verify.mjs:193 \| spec unclear: medium-HARD and the OK follow the ratings; build-readiness lets the user change the choice, which the code ignores | fixed in 5a4b8ae | 2026-10-18 |
| V3 | review against the spec - build-readiness: Plan doesn't say \| ready.mjs:211 \| spec: files that import that module; code matches the basename only | fixed in 5a4b8ae | 2026-10-18 |
| V5 | review against the spec - quality-gates: Not chosen \| verify.mjs:264 \| with no Safeguards section the report doesn't say the spec review wasn't chosen | fixed in 5a4b8ae | 2026-10-18 |
| X1 | edge-case probe - common-word scenario names (Hold, Drop) count as tested when any test file contains the word | fixed in 5a4b8ae | 2026-10-18 |
| X2 | edge-case probe - a tool without reviewed_on never makes the reminder fire | fixed in 5a4b8ae | 2026-10-18 |
| X3 | edge-case probe - 0.16.0 -> 0.17.0 is reported behind, though 0.x minors are often breaking | fixed in 5a4b8ae | 2026-10-18 |
| X4 | edge-case probe - a winget id that no longer exists shows unknown, not source not found | fixed in 5a4b8ae | 2026-10-18 |
| C10 | code review (medium) - safeguards-data.mjs: a design.md mentioning the data-comment format in prose hid the real Safeguards (found dogfooding verify) | fixed in e56b9b7 | 2026-10-18 |

<!-- kit-verify-data {"change":"build-safeguards","date":"2026-10-18","commit":"e56b9b7","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"N:build-readiness: Keyword alone","level":"ADVISORY","what":"scenario without a test","detail":"build-readiness: Keyword alone","source":"scenarios"},{"id":"N:skill-routing: Worktree chosen","level":"ADVISORY","what":"scenario without a test","detail":"skill-routing: Worktree chosen","source":"scenarios"},{"id":"N:tool-review: Update with a failing smoke test","level":"ADVISORY","what":"scenario without a test","detail":"tool-review: Update with a failing smoke test","source":"scenarios"},{"id":"V4","level":"ADVISORY","what":"review against the spec","detail":"quality-gates: Review against the spec (SHALL NOT edit) | agents/spec-reviewer.md:4 | read-only only by prompt: Bash is unrestricted in the frontmatter","source":"spec"},{"id":"X5","level":"ADVISORY","what":"edge-case probe","detail":"drop on a verdicts list with a blank or comment line may insert mid-list","source":"probe"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"analysis done in-session, no sub-tasks","date":"2026-10-18"},"code":{"how":"ran","note":"","date":"2026-10-18"},"spec":{"how":"substitute","note":"same prompt as kit:spec-reviewer via a general-purpose agent (plugin agents load at session start)","date":"2026-10-18"}},"scenarioCheck":[{"capability":"build-readiness","scenario":"Low-risk change","name":"build-readiness: Low-risk change","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Shared module","name":"build-readiness: Shared module","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"Keyword alone","name":"build-readiness: Keyword alone","status":"missing","test":null},{"capability":"build-readiness","scenario":"User changes the recommendation","name":"build-readiness: User changes the recommendation","status":"named","test":"tests/kit/ready.test.mjs"},{"capability":"build-readiness","scenario":"No design yet","name":"build-readiness: No design yet","status":"recorded","test":"tests/kit/ready.test.mjs","note":""},{"capability":"build-readiness","scenario":"Plan doesn't say","name":"build-readiness: Plan doesn't say","status":"recorded","test":"tests/kit/ready.test.mjs","note":""},{"capability":"project-starter","scenario":"Web UI project","name":"project-starter: Web UI project","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Opt-in tool","name":"project-starter: Opt-in tool","status":"named","test":"tests/kit/start-plan.test.mjs"},{"capability":"project-starter","scenario":"Dropped tool excluded","name":"project-starter: Dropped tool excluded","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Next.js project","name":"project-starter: Next.js project","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Opt-in tools not asked","name":"project-starter: Opt-in tools not asked","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Type tools installed silently","name":"project-starter: Type tools installed silently","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"File changes confirmed together","name":"project-starter: File changes confirmed together","status":"recorded","test":"tests/kit/start-apply.test.mjs","note":""},{"capability":"quality-gates","scenario":"All green","name":"quality-gates: All green","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"Failing test","name":"quality-gates: Failing test","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Docs sync with open items","name":"quality-gates: Docs sync with open items","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Earlier report from another tool","name":"quality-gates: Earlier report from another tool","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Override with a reason","name":"quality-gates: Override with a reason","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Advisory only","name":"quality-gates: Advisory only","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Fixed HARD finding","name":"quality-gates: Fixed HARD finding","status":"recorded","test":"tests/kit/verify.test.mjs","note":""},{"capability":"quality-gates","scenario":"Medium finding on a high-risk change","name":"quality-gates: Medium finding on a high-risk change","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"Untested scenario","name":"quality-gates: Untested scenario","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"Checked by hand","name":"quality-gates: Checked by hand","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"Logic differs from a scenario","name":"quality-gates: Logic differs from a scenario","status":"by-hand","test":null,"note":"spec-reviewer prompt on a planted 3-vs-30-days fixture found it (runs.md 3.2)"},{"capability":"quality-gates","scenario":"Not chosen","name":"quality-gates: Not chosen","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"quality-gates","scenario":"OK recorded","name":"quality-gates: OK recorded","status":"named","test":"tests/kit/verify.test.mjs"},{"capability":"skill-evals","scenario":"A/B comparison","name":"skill-evals: A/B comparison","status":"recorded","test":"tools/evals/lib.test.mjs","note":""},{"capability":"skill-routing","scenario":"Complete lane map","name":"skill-routing: Complete lane map","status":"recorded","test":"tests/kit/lanes.test.mjs","note":""},{"capability":"skill-routing","scenario":"Deferring tool shown as alternative","name":"skill-routing: Deferring tool shown as alternative","status":"recorded","test":"tests/kit/lanes.test.mjs","note":""},{"capability":"skill-routing","scenario":"Tie reported as conflict","name":"skill-routing: Tie reported as conflict","status":"recorded","test":"tests/kit/lanes.test.mjs","note":""},{"capability":"skill-routing","scenario":"Worktree chosen","name":"skill-routing: Worktree chosen","status":"missing","test":null},{"capability":"skill-routing","scenario":"No Safeguards section","name":"skill-routing: No Safeguards section","status":"named","test":"tests/kit/lanes.test.mjs"},{"capability":"tool-review","scenario":"One tool behind","name":"tool-review: One tool behind","status":"named","test":"tests/kit/tool-review.test.mjs"},{"capability":"tool-review","scenario":"Source gone","name":"tool-review: Source gone","status":"named","test":"tests/kit/tool-review.test.mjs"},{"capability":"tool-review","scenario":"Version not found","name":"tool-review: Version not found","status":"named","test":"tests/kit/tool-review.test.mjs"},{"capability":"tool-review","scenario":"Update with a failing smoke test","name":"tool-review: Update with a failing smoke test","status":"missing","test":null},{"capability":"tool-review","scenario":"Drop","name":"tool-review: Drop","status":"named","test":"tests/kit/hooks.test.mjs"},{"capability":"tool-review","scenario":"Hold","name":"tool-review: Hold","status":"named","test":"tests/kit/harness.test.mjs"},{"capability":"tool-review","scenario":"Review due","name":"tool-review: Review due","status":"named","test":"tests/kit/hooks.test.mjs"},{"capability":"tool-review","scenario":"Not due","name":"tool-review: Not due","status":"named","test":"tests/kit/hooks.test.mjs"},{"capability":"tool-review","scenario":"Other project","name":"tool-review: Other project","status":"named","test":"tests/kit/harness.test.mjs"}],"scenarios":{"build-readiness: Plan doesn't say":{"test":"tests/kit/ready.test.mjs","date":"2026-10-18"},"project-starter: Web UI project":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-18"},"project-starter: Dropped tool excluded":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-18"},"project-starter: Opt-in tools not asked":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-18"},"project-starter: Type tools installed silently":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-18"},"project-starter: Next.js project":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-18"},"project-starter: File changes confirmed together":{"test":"tests/kit/start-apply.test.mjs","date":"2026-10-18"},"quality-gates: Failing test":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"},"quality-gates: Docs sync with open items":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"},"quality-gates: Earlier report from another tool":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"},"quality-gates: Override with a reason":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"},"quality-gates: Advisory only":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"},"skill-evals: A/B comparison":{"test":"tools/evals/lib.test.mjs","date":"2026-10-18"},"skill-routing: Complete lane map":{"test":"tests/kit/lanes.test.mjs","date":"2026-10-18"},"skill-routing: Deferring tool shown as alternative":{"test":"tests/kit/lanes.test.mjs","date":"2026-10-18"},"skill-routing: Tie reported as conflict":{"test":"tests/kit/lanes.test.mjs","date":"2026-10-18"},"quality-gates: Logic differs from a scenario":{"byHand":true,"note":"spec-reviewer prompt on a planted 3-vs-30-days fixture found it (runs.md 3.2)","date":"2026-10-18"},"build-readiness: No design yet":{"test":"tests/kit/ready.test.mjs","date":"2026-10-18"},"quality-gates: Fixed HARD finding":{"test":"tests/kit/verify.test.mjs","date":"2026-10-18"}},"safeguards":{"date":"2026-10-18","ratings":{"reach":{"level":"high","why":"Removes the /kit:judge skill, changes the routing block and verify's HARD rules, adds a SessionStart hook: contracts other projects rely on"},"undo":{"level":"high","why":"Most of it is in git, but the Superpowers switch changed installed plugin config outside the repo (user-scope copy removed, source moved to claude-plugins-official)"},"safety":{"level":"low","why":"The archive gate's blocking logic is unchanged (only its reminder grew); no secrets or permissions; network is read-only version lookups"}},"recommended":["scenario-check","worktree","spec-review","probes","security-weighted","user-ok"],"chosen":["scenario-check","spec-review","probes","security-weighted","user-ok"]},"docsSync":{"date":"2026-10-18","docsUpdated":{"commit":"5a4b8ae","date":"2026-10-18"},"codeCommitsSince":0,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":0,"unplanned":[]},"resolved":[{"item":"S1","what":"security review (low)","detail":"tool-review.mjs: npm package name from toolkit.yaml reached cmd.exe unchecked (Windows .cmd shim); filtered at confidence 7 (needs an untrusted repo)","note":"fixed in 1a394bc (NPM_NAME check + test)","date":"2026-10-18"},{"item":"C1","what":"code review (medium)","detail":"verify.mjs: security-weighted and user-ok follow isHigh(ratings), not the user's choice in design.md Safeguards","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C2","what":"code review (medium)","detail":"verify.mjs scenarioCheck: any file under tests/ (fixtures, JSON) containing a short scenario title counts as its test","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C3","what":"code review (low)","detail":"ready.mjs writeSafeguards: collapses 3+ blank lines across the whole design.md, not just the section","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C4","what":"code review (medium)","detail":"ready.mjs writeSafeguards: creating a stub design.md makes openspec count the design artifact as done","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C5","what":"code review (low)","detail":"tool-review.mjs github fallback: takes the first tag, not the highest version","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C6","what":"code review (low)","detail":"verify.mjs okPending: read from a stored K:ok item, so a change made high-risk after the last run gets no archive reminder","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C7","what":"code review (medium)","detail":"tool-review.mjs registryEntries: a column-0 comment inside tools: ends the list; later tools vanish from scan, reminder and record","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C8","what":"code review (low)","detail":"ready.mjs importers: matches the basename only, so other files with the same name inflate reach","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C9","what":"code review (low)","detail":"verify.mjs duplicates ready.mjs's Safeguards data parser; a format change would silently turn the high-risk rules off","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"V1","what":"review against the spec","detail":"quality-gates: Hard failures and overrides | verify.mjs:364,438 | spec: a HARD item clears once fixed and a re-run passes; code keeps the finding on every run and resolve refuses HARD (L19)","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"V2","what":"review against the spec","detail":"quality-gates: Hard failures / User's OK | verify.mjs:193 | spec unclear: medium-HARD and the OK follow the ratings; build-readiness lets the user change the choice, which the code ignores","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"V3","what":"review against the spec","detail":"build-readiness: Plan doesn't say | ready.mjs:211 | spec: files that import that module; code matches the basename only","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"V5","what":"review against the spec","detail":"quality-gates: Not chosen | verify.mjs:264 | with no Safeguards section the report doesn't say the spec review wasn't chosen","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"X1","what":"edge-case probe","detail":"common-word scenario names (Hold, Drop) count as tested when any test file contains the word","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"X2","what":"edge-case probe","detail":"a tool without reviewed_on never makes the reminder fire","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"X3","what":"edge-case probe","detail":"0.16.0 -> 0.17.0 is reported behind, though 0.x minors are often breaking","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"X4","what":"edge-case probe","detail":"a winget id that no longer exists shows unknown, not source not found","note":"fixed in 5a4b8ae","date":"2026-10-18"},{"item":"C10","what":"code review (medium)","detail":"safeguards-data.mjs: a design.md mentioning the data-comment format in prose hid the real Safeguards (found dogfooding verify)","note":"fixed in e56b9b7","date":"2026-10-18"}],"result":"pass","ok":{"date":"2026-10-18","note":"user OK at verify, 2026-10-18"}} -->
