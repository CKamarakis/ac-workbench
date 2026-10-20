# Verify: first-run-guidance

result: pass
date: 2026-10-19
commit: abd703a
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
| spec | ran |  |

## Safeguards

reach medium, undo low, safety low; chosen: scenario-check, spec-review

ui review: not chosen

## Scenarios

45 scenario(s): 41 with a test, 4 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| project-starter: Draft from the project | by hand: agent behaviour in start step 6; checked the skill text (look first, full draft, write on a yes) and eval first-run-setup-context-and-first-step |
| project-starter: Questions for an empty project | by hand: agent behaviour in start step 6; checked the five questions each with hint and example in the skill and the template (eval first-run-setup-context-and-first-step) |
| project-starter: Later | tests/kit/decisions.test.mjs |
| project-starter: Re-sync | tests/kit/start-apply.test.mjs |
| project-starter: New project | tests/kit/next.test.mjs |
| project-starter: Missing machine tool | tests/kit/prereqs.test.mjs |
| project-starter: Setup runs on a yes | by hand: agent behaviour in start step 1; checked the BLOCKED and missing-tool offers and the once-per-run rule (eval setup-offered-when-blocked-once-and-next-from-script) |
| project-starter: Tool still not found after setup | by hand: agent behaviour in start step 1; checked the 'Offer setup once per run' rule (eval setup-offered-when-blocked-once-and-next-from-script) |
| project-starter: Next.js project | tests/kit/start-plan.test.mjs |
| project-starter: Opt-in tools not asked | tests/kit/start-plan.test.mjs |
| project-starter: Type tools installed silently | tests/kit/start-plan.test.mjs |
| project-starter: File changes confirmed together | tests/kit/start-apply.test.mjs |
| project-status: Blank doc and a README | tests/kit/status.test.mjs |
| project-status: Nothing describes the project | tests/kit/status.test.mjs |
| project-status: Empty project | tests/kit/docs-page.test.mjs |
| project-status: Built from specs | tests/kit/status.test.mjs |
| project-status: Many capabilities built | tests/kit/status.test.mjs |
| project-status: No project description | tests/kit/status.test.mjs |
| project-status: One item under way | tests/kit/status.test.mjs |
| project-status: Nothing under way, no roadmap | tests/kit/status.test.mjs |
| project-status: Nothing under way and nothing queued | tests/kit/status.test.mjs |
| roadmap: Archive after the last roadmap update | tests/kit/roadmap.test.mjs |
| roadmap: Ordinary commits only | tests/kit/roadmap.test.mjs |
| roadmap: Branch not listed | tests/kit/roadmap.test.mjs |
| roadmap: Change with no milestone | tests/kit/roadmap.test.mjs |
| roadmap: Roadmap not committed yet | tests/kit/roadmap.test.mjs |
| skill-routing: Empty project after setup | tests/kit/next.test.mjs |
| skill-routing: Project with history | tests/kit/next.test.mjs |
| skill-routing: Planning incomplete | tests/kit/next.test.mjs |
| skill-routing: Ready check before the build | tests/kit/next.test.mjs |
| skill-routing: Tasks ready | tests/kit/next.test.mjs |
| skill-routing: Open decisions shown | tests/kit/next.test.mjs |
| skill-routing: PRD questions put off for later | tests/kit/next.test.mjs |
| skill-routing: No active change | tests/kit/next.test.mjs |
| skill-routing: Nothing open, items left for later | tests/kit/next.test.mjs |
| skill-routing: Ready PRD before status | tests/kit/next.test.mjs |
| skill-routing: Several active changes | tests/kit/next.test.mjs |
| skill-routing: Named change not active | tests/kit/next.test.mjs |
| skill-routing: One active change | tests/kit/next.test.mjs |
| skill-routing: Loose ends in the Nothing open count | tests/kit/next.test.mjs |
| skill-routing: Loose end blocking the change | tests/kit/next.test.mjs |
| skill-routing: Explore with open questions | tests/kit/next.test.mjs |
| skill-routing: Explore ready for a PRD | tests/kit/next.test.mjs |
| skill-routing: Next task on the roadmap | tests/kit/next.test.mjs |
| skill-routing: Milestone done, next milestone | tests/kit/next.test.mjs |

## Docs sync

docs last updated: 2026-10-19 (abd703a); code commits since: 0; no apply receipt  (date: 2026-10-19)

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
| V1 | review against the spec - project-starter: Setup runs on a yes \| plugins/kit/skills/start/SKILL.md:18 \| spec says a missing openspec gets setup offered and run; prereqs marks openspec REQUIRED, so start stops BLOCKED with no offer | fixed in abd703a | 2026-10-19 |
| V2 | review against the spec - project-starter: Questions for an empty project \| plugins/kit/templates/project-context.md:24 \| spec says each question has a hint and an example; Not now has no example in the template or the skill | fixed in abd703a | 2026-10-19 |
| V3 | review against the spec - project-status: First steps when the project is new \| plugins/kit/scripts/status.mjs fresh vs next.mjs fresh \| design D1 says one test; status also requires no main specs, so a project with specs but no changes is new for next and not for status | fixed in abd703a | 2026-10-19 |
| V4 | review against the spec - skill-routing: First step on a new project \| plugins/kit/scripts/next.mjs \| spec unclear: the fresh branch returns before the 'items left for later' count, so open loose ends aren't mentioned on a new project | fixed in abd703a | 2026-10-19 |
| C1 | code review (medium) - start SKILL.md:18 the setup offer never runs for openspec: prereqs reports it BLOCKED and the skill stops (same as S1) | fixed in abd703a | 2026-10-19 |
| C2 | code review (medium) - next.mjs:127 vs status.mjs:314 the new-project test differs between next and status (main specs, roadmap, Next rows) though D1 says one test (same as S3) | fixed in abd703a | 2026-10-19 |
| C3 | code review (low) - next.mjs:166 the new-project branch drops the 'items left for later' count, so open loose ends aren't mentioned (same as S4) | fixed in abd703a | 2026-10-19 |
| C4 | code review (low) - next.mjs:127 'no notes' ignores invalid notes and unimported .txt files, so a project with raw or dictated notes still reads as new | fixed in abd703a | 2026-10-19 |
| C5 | code review (low) - start SKILL.md:19 'run /kit:setup, then start again' can loop when a tool is still not found after setup (e.g. PATH on Windows) | fixed in abd703a | 2026-10-19 |
| C6 | code review (low) - status.mjs:169 isBlankContext skips every heading, so a doc with only the user's own headings reads as blank | fixed in abd703a | 2026-10-19 |
| C7 | code review (low) - start SKILL.md:71 start decides 'new project' by the agent's judgement, not the script's test, so it can disagree with next and status | fixed in abd703a | 2026-10-19 |
| C8 | code review (low) - status.mjs:314 the new-project test is written twice instead of one shared helper | fixed in abd703a | 2026-10-19 |
| C9 | code review (low) - next SKILL.md:30 the reply guide doesn't cover the new first-step answer (/kit:capture and /opsx:explore) | fixed in abd703a | 2026-10-19 |
| C10 | code review (low) - status.mjs:47 describe() has its own read helper, a copy of the module's | fixed in abd703a | 2026-10-19 |

<!-- kit-verify-data {"change":"first-run-guidance","date":"2026-10-19","commit":"abd703a","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-19"},"spec":{"how":"ran","note":"","date":"2026-10-19"},"code":{"how":"ran","note":"","date":"2026-10-19"}},"scenarioCheck":[{"capability":"project-starter","scenario":"Draft from the project","name":"project-starter: Draft from the project","status":"by-hand","test":null,"note":"agent behaviour in start step 6; checked the skill text (look first, full draft, write on a yes) and eval first-run-setup-context-and-first-step"},{"capability":"project-starter","scenario":"Questions for an empty project","name":"project-starter: Questions for an empty project","status":"by-hand","test":null,"note":"agent behaviour in start step 6; checked the five questions each with hint and example in the skill and the template (eval first-run-setup-context-and-first-step)"},{"capability":"project-starter","scenario":"Later","name":"project-starter: Later","status":"named","test":"tests/kit/decisions.test.mjs"},{"capability":"project-starter","scenario":"Re-sync","name":"project-starter: Re-sync","status":"named","test":"tests/kit/start-apply.test.mjs"},{"capability":"project-starter","scenario":"New project","name":"project-starter: New project","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"project-starter","scenario":"Missing machine tool","name":"project-starter: Missing machine tool","status":"named","test":"tests/kit/prereqs.test.mjs"},{"capability":"project-starter","scenario":"Setup runs on a yes","name":"project-starter: Setup runs on a yes","status":"by-hand","test":null,"note":"agent behaviour in start step 1; checked the BLOCKED and missing-tool offers and the once-per-run rule (eval setup-offered-when-blocked-once-and-next-from-script)"},{"capability":"project-starter","scenario":"Tool still not found after setup","name":"project-starter: Tool still not found after setup","status":"by-hand","test":null,"note":"agent behaviour in start step 1; checked the 'Offer setup once per run' rule (eval setup-offered-when-blocked-once-and-next-from-script)"},{"capability":"project-starter","scenario":"Next.js project","name":"project-starter: Next.js project","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Opt-in tools not asked","name":"project-starter: Opt-in tools not asked","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Type tools installed silently","name":"project-starter: Type tools installed silently","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"File changes confirmed together","name":"project-starter: File changes confirmed together","status":"recorded","test":"tests/kit/start-apply.test.mjs","note":""},{"capability":"project-status","scenario":"Blank doc and a README","name":"project-status: Blank doc and a README","status":"named","test":"tests/kit/status.test.mjs"},{"capability":"project-status","scenario":"Nothing describes the project","name":"project-status: Nothing describes the project","status":"named","test":"tests/kit/status.test.mjs"},{"capability":"project-status","scenario":"Empty project","name":"project-status: Empty project","status":"named","test":"tests/kit/docs-page.test.mjs"},{"capability":"project-status","scenario":"Built from specs","name":"project-status: Built from specs","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Many capabilities built","name":"project-status: Many capabilities built","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"No project description","name":"project-status: No project description","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"One item under way","name":"project-status: One item under way","status":"named","test":"tests/kit/status.test.mjs"},{"capability":"project-status","scenario":"Nothing under way, no roadmap","name":"project-status: Nothing under way, no roadmap","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"project-status","scenario":"Nothing under way and nothing queued","name":"project-status: Nothing under way and nothing queued","status":"recorded","test":"tests/kit/status.test.mjs","note":""},{"capability":"roadmap","scenario":"Archive after the last roadmap update","name":"roadmap: Archive after the last roadmap update","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Ordinary commits only","name":"roadmap: Ordinary commits only","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Branch not listed","name":"roadmap: Branch not listed","status":"recorded","test":"tests/kit/roadmap.test.mjs","note":""},{"capability":"roadmap","scenario":"Change with no milestone","name":"roadmap: Change with no milestone","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"roadmap","scenario":"Roadmap not committed yet","name":"roadmap: Roadmap not committed yet","status":"named","test":"tests/kit/roadmap.test.mjs"},{"capability":"skill-routing","scenario":"Empty project after setup","name":"skill-routing: Empty project after setup","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Project with history","name":"skill-routing: Project with history","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Planning incomplete","name":"skill-routing: Planning incomplete","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Ready check before the build","name":"skill-routing: Ready check before the build","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Tasks ready","name":"skill-routing: Tasks ready","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Open decisions shown","name":"skill-routing: Open decisions shown","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"PRD questions put off for later","name":"skill-routing: PRD questions put off for later","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"No active change","name":"skill-routing: No active change","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Nothing open, items left for later","name":"skill-routing: Nothing open, items left for later","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Ready PRD before status","name":"skill-routing: Ready PRD before status","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Several active changes","name":"skill-routing: Several active changes","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Named change not active","name":"skill-routing: Named change not active","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"One active change","name":"skill-routing: One active change","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Loose ends in the Nothing open count","name":"skill-routing: Loose ends in the Nothing open count","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Loose end blocking the change","name":"skill-routing: Loose end blocking the change","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Explore with open questions","name":"skill-routing: Explore with open questions","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Explore ready for a PRD","name":"skill-routing: Explore ready for a PRD","status":"named","test":"tests/kit/next.test.mjs"},{"capability":"skill-routing","scenario":"Next task on the roadmap","name":"skill-routing: Next task on the roadmap","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Milestone done, next milestone","name":"skill-routing: Milestone done, next milestone","status":"recorded","test":"tests/kit/next.test.mjs","note":""}],"webUi":true,"scenarios":{"project-starter: Next.js project":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: Opt-in tools not asked":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: Type tools installed silently":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: File changes confirmed together":{"test":"tests/kit/start-apply.test.mjs","date":"2026-10-19"},"project-status: Built from specs":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"project-status: Many capabilities built":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"project-status: No project description":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"project-status: Nothing under way, no roadmap":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"project-status: Nothing under way and nothing queued":{"test":"tests/kit/status.test.mjs","date":"2026-10-19"},"roadmap: Branch not listed":{"test":"tests/kit/roadmap.test.mjs","date":"2026-10-19"},"skill-routing: Ready check before the build":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: Open decisions shown":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: PRD questions put off for later":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: Named change not active":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: One active change":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: Loose ends in the Nothing open count":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: Next task on the roadmap":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"skill-routing: Milestone done, next milestone":{"test":"tests/kit/next.test.mjs","date":"2026-10-19"},"project-starter: Draft from the project":{"byHand":true,"note":"agent behaviour in start step 6; checked the skill text (look first, full draft, write on a yes) and eval first-run-setup-context-and-first-step","date":"2026-10-19"},"project-starter: Questions for an empty project":{"byHand":true,"note":"agent behaviour in start step 6; checked the five questions each with hint and example in the skill and the template (eval first-run-setup-context-and-first-step)","date":"2026-10-19"},"project-starter: Setup runs on a yes":{"byHand":true,"note":"agent behaviour in start step 1; checked the BLOCKED and missing-tool offers and the once-per-run rule (eval setup-offered-when-blocked-once-and-next-from-script)","date":"2026-10-19"},"project-starter: Tool still not found after setup":{"byHand":true,"note":"agent behaviour in start step 1; checked the 'Offer setup once per run' rule (eval setup-offered-when-blocked-once-and-next-from-script)","date":"2026-10-19"}},"safeguards":{"date":"2026-10-19","ratings":{"reach":{"level":"medium","why":"four specs and two shared scripts (status.mjs imports next.mjs)"},"undo":{"level":"low","why":"reverting the commits undoes it; nothing written outside the repo"},"safety":{"level":"low","why":"no secrets, permissions, blocking hooks or user data"}},"recommended":["scenario-check","worktree","spec-review"],"chosen":["scenario-check","spec-review"]},"docsSync":{"date":"2026-10-19","docsUpdated":{"commit":"abd703a","date":"2026-10-19"},"codeCommitsSince":0,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":1,"unplanned":[]},"resolved":[{"item":"V1","what":"review against the spec","detail":"project-starter: Setup runs on a yes | plugins/kit/skills/start/SKILL.md:18 | spec says a missing openspec gets setup offered and run; prereqs marks openspec REQUIRED, so start stops BLOCKED with no offer","note":"fixed in abd703a","date":"2026-10-19"},{"item":"V2","what":"review against the spec","detail":"project-starter: Questions for an empty project | plugins/kit/templates/project-context.md:24 | spec says each question has a hint and an example; Not now has no example in the template or the skill","note":"fixed in abd703a","date":"2026-10-19"},{"item":"V3","what":"review against the spec","detail":"project-status: First steps when the project is new | plugins/kit/scripts/status.mjs fresh vs next.mjs fresh | design D1 says one test; status also requires no main specs, so a project with specs but no changes is new for next and not for status","note":"fixed in abd703a","date":"2026-10-19"},{"item":"V4","what":"review against the spec","detail":"skill-routing: First step on a new project | plugins/kit/scripts/next.mjs | spec unclear: the fresh branch returns before the 'items left for later' count, so open loose ends aren't mentioned on a new project","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C1","what":"code review (medium)","detail":"start SKILL.md:18 the setup offer never runs for openspec: prereqs reports it BLOCKED and the skill stops (same as S1)","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C2","what":"code review (medium)","detail":"next.mjs:127 vs status.mjs:314 the new-project test differs between next and status (main specs, roadmap, Next rows) though D1 says one test (same as S3)","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C3","what":"code review (low)","detail":"next.mjs:166 the new-project branch drops the 'items left for later' count, so open loose ends aren't mentioned (same as S4)","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C4","what":"code review (low)","detail":"next.mjs:127 'no notes' ignores invalid notes and unimported .txt files, so a project with raw or dictated notes still reads as new","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C5","what":"code review (low)","detail":"start SKILL.md:19 'run /kit:setup, then start again' can loop when a tool is still not found after setup (e.g. PATH on Windows)","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C6","what":"code review (low)","detail":"status.mjs:169 isBlankContext skips every heading, so a doc with only the user's own headings reads as blank","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C7","what":"code review (low)","detail":"start SKILL.md:71 start decides 'new project' by the agent's judgement, not the script's test, so it can disagree with next and status","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C8","what":"code review (low)","detail":"status.mjs:314 the new-project test is written twice instead of one shared helper","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C9","what":"code review (low)","detail":"next SKILL.md:30 the reply guide doesn't cover the new first-step answer (/kit:capture and /opsx:explore)","note":"fixed in abd703a","date":"2026-10-19"},{"item":"C10","what":"code review (low)","detail":"status.mjs:47 describe() has its own read helper, a copy of the module's","note":"fixed in abd703a","date":"2026-10-19"}],"result":"pass"} -->
