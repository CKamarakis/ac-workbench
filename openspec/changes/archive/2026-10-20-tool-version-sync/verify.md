# Verify: tool-version-sync

result: pass
date: 2026-10-20
commit: b7b0997
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

5 scenario(s): 5 with a test, 0 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| project-starter: Old Impeccable | tests/kit/tool-versions.test.mjs |
| project-starter: Files only | tests/kit/tool-versions.test.mjs |
| project-starter: Newer than tested | tests/kit/tool-versions.test.mjs |
| project-starter: Old OpenSpec skills | tests/kit/tool-versions.test.mjs |
| project-starter: Old OpenSpec CLI | tests/kit/tool-versions.test.mjs |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| S1 | security review (low) | start-plan.mjs openspecVersions: 'openspec --version' runs with cwd = project at plan time; on Windows a planted openspec.cmd in a cloned repo would run. Pre-existing pattern (node -e checks, git/openspec init already run there); hardening: call the locate()d absolute path |
| C7 | code review (low) | start-plan.mjs: openspec-skills is a special case in code, not registry-driven (design D5); v2 |
| C8 | code review (low) | start-plan.mjs: formatPlan tool line packs several action conditions into one template (style) |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| C1 | code review (medium) - start-apply.mjs: an update counted as done on exit 0 without re-reading the version | fixed in b7b0997 | 2026-10-20 |
| C2 | code review (medium) - SKILL.md: a first setup of an existing project with UPDATE lines asked nothing about tools (openspec update deletes skills) | fixed in b7b0997 | 2026-10-20 |
| C3 | code review (medium) - SKILL.md: a WARNING could be dropped when the plan says Nothing to change | fixed in b7b0997 | 2026-10-20 |
| C4 | code review (low) - start-apply.mjs: what openspec update removed wasn't named | fixed in b7b0997 | 2026-10-20 |
| C5 | code review (low) - start-plan.mjs: a version file the pattern can't read showed as ok with no note | fixed in b7b0997 | 2026-10-20 |
| C6 | code review (low) - roadmap not updated with the change | fixed in b7b0997 | 2026-10-20 |

<!-- kit-verify-data {"change":"tool-version-sync","date":"2026-10-20","commit":"b7b0997","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"S1","level":"ADVISORY","what":"security review (low)","detail":"start-plan.mjs openspecVersions: 'openspec --version' runs with cwd = project at plan time; on Windows a planted openspec.cmd in a cloned repo would run. Pre-existing pattern (node -e checks, git/openspec init already run there); hardening: call the locate()d absolute path","source":"security","severity":"low"},{"id":"C7","level":"ADVISORY","what":"code review (low)","detail":"start-plan.mjs: openspec-skills is a special case in code, not registry-driven (design D5); v2","source":"code","severity":"low"},{"id":"C8","level":"ADVISORY","what":"code review (low)","detail":"start-plan.mjs: formatPlan tool line packs several action conditions into one template (style)","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-20"},"code":{"how":"ran","note":"","date":"2026-10-20"}},"scenarioCheck":[{"capability":"project-starter","scenario":"Old Impeccable","name":"project-starter: Old Impeccable","status":"named","test":"tests/kit/tool-versions.test.mjs"},{"capability":"project-starter","scenario":"Files only","name":"project-starter: Files only","status":"named","test":"tests/kit/tool-versions.test.mjs"},{"capability":"project-starter","scenario":"Newer than tested","name":"project-starter: Newer than tested","status":"named","test":"tests/kit/tool-versions.test.mjs"},{"capability":"project-starter","scenario":"Old OpenSpec skills","name":"project-starter: Old OpenSpec skills","status":"named","test":"tests/kit/tool-versions.test.mjs"},{"capability":"project-starter","scenario":"Old OpenSpec CLI","name":"project-starter: Old OpenSpec CLI","status":"named","test":"tests/kit/tool-versions.test.mjs"}],"webUi":true,"resolved":[{"item":"C1","what":"code review (medium)","detail":"start-apply.mjs: an update counted as done on exit 0 without re-reading the version","note":"fixed in b7b0997","date":"2026-10-20"},{"item":"C2","what":"code review (medium)","detail":"SKILL.md: a first setup of an existing project with UPDATE lines asked nothing about tools (openspec update deletes skills)","note":"fixed in b7b0997","date":"2026-10-20"},{"item":"C3","what":"code review (medium)","detail":"SKILL.md: a WARNING could be dropped when the plan says Nothing to change","note":"fixed in b7b0997","date":"2026-10-20"},{"item":"C4","what":"code review (low)","detail":"start-apply.mjs: what openspec update removed wasn't named","note":"fixed in b7b0997","date":"2026-10-20"},{"item":"C5","what":"code review (low)","detail":"start-plan.mjs: a version file the pattern can't read showed as ok with no note","note":"fixed in b7b0997","date":"2026-10-20"},{"item":"C6","what":"code review (low)","detail":"roadmap not updated with the change","note":"fixed in b7b0997","date":"2026-10-20"}],"result":"pass"} -->
