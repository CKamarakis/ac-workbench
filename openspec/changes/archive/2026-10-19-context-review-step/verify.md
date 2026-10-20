# Verify: context-review-step

result: pass
date: 2026-10-19
commit: 854d635
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

reach low, undo low, safety low; chosen: scenario-check

review against the spec: not chosen

ui review: not chosen

## Scenarios

6 scenario(s): 0 with a test, 6 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| project-starter: Source first | by hand: agent behaviour in start step 6; skill asks before drafting (eval your-project-stage-visible); checked live in the next test |
| project-starter: Draft from the project | by hand: agent behaviour; skill text 'The draft is a review, not a click' (eval your-project-stage-visible) |
| project-starter: Never ask about unseen text | by hand: agent behaviour; the hard rule in step 6 (eval your-project-stage-visible); checked live in the next test |
| project-starter: Questions for an empty project | by hand: agent behaviour; 'Too little to go on' and Not sources (eval your-project-stage-sources-and-exits); checked live in acme-empty |
| project-starter: Later | by hand: agent behaviour; 'Later stays an option every time' (eval your-project-stage-sources-and-exits); the earlier name match to decisions.test.mjs was wrong |
| project-starter: Re-sync | by hand: agent behaviour; step 6 runs only when this run created the doc (CREATE in the plan) |

## Docs sync

docs last updated: 2026-10-19 (854d635); code commits since: 0; no apply receipt  (date: 2026-10-19)

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
| C1 | code review (medium) - start SKILL.md:53 after apply the kit's own blank context doc and CLAUDE.md exist, so an empty project can look like it has describing files | fixed in 854d635 | 2026-10-19 |
| C2 | code review (medium) - start SKILL.md:54 the 'too little to go on' fallback is gone: a one-line README leads to a draft of guesses instead of the questions | fixed in 854d635 | 2026-10-19 |
| C3 | code review (low) - start SKILL.md:56 no Later once a draft is shown | fixed in 854d635 | 2026-10-19 |
| C4 | code review (low) - start SKILL.md:64 the questions path's review offers 'Ask me the questions instead' again: a loop; no Later on the empty-project path | fixed in 854d635 | 2026-10-19 |
| C5 | code review (low) - start SKILL.md:56 'Change something' has no exit besides approving or switching to the questions | fixed in 854d635 | 2026-10-19 |
| C6 | code review (low) - verify.md:37 'Later' (and maybe 'Re-sync') counted as tested through a name match with unrelated tests | fixed in 854d635 | 2026-10-19 |
| C7 | code review (low) - evals/start/cases.yaml:194 evals only check skill text, not the agent's behaviour | fixed in 854d635 | 2026-10-19 |
| C8 | code review (low) - tests/kit/status.test.mjs:82 CRLF fixed in one test only; templates check out with CRLF without a .gitattributes rule | fixed in 854d635 | 2026-10-19 |
| C9 | code review (low) - start SKILL.md:57 the show-the-text rule is stated three times | fixed in 854d635 | 2026-10-19 |

<!-- kit-verify-data {"change":"context-review-step","date":"2026-10-19","commit":"854d635","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"code":{"how":"ran","note":"","date":"2026-10-19"},"security":{"how":"ran","note":"","date":"2026-10-19"}},"scenarioCheck":[{"capability":"project-starter","scenario":"Source first","name":"project-starter: Source first","status":"by-hand","test":null,"note":"agent behaviour in start step 6; skill asks before drafting (eval your-project-stage-visible); checked live in the next test"},{"capability":"project-starter","scenario":"Draft from the project","name":"project-starter: Draft from the project","status":"by-hand","test":null,"note":"agent behaviour; skill text 'The draft is a review, not a click' (eval your-project-stage-visible)"},{"capability":"project-starter","scenario":"Never ask about unseen text","name":"project-starter: Never ask about unseen text","status":"by-hand","test":null,"note":"agent behaviour; the hard rule in step 6 (eval your-project-stage-visible); checked live in the next test"},{"capability":"project-starter","scenario":"Questions for an empty project","name":"project-starter: Questions for an empty project","status":"by-hand","test":null,"note":"agent behaviour; 'Too little to go on' and Not sources (eval your-project-stage-sources-and-exits); checked live in acme-empty"},{"capability":"project-starter","scenario":"Later","name":"project-starter: Later","status":"by-hand","test":null,"note":"agent behaviour; 'Later stays an option every time' (eval your-project-stage-sources-and-exits); the earlier name match to decisions.test.mjs was wrong"},{"capability":"project-starter","scenario":"Re-sync","name":"project-starter: Re-sync","status":"by-hand","test":null,"note":"agent behaviour; step 6 runs only when this run created the doc (CREATE in the plan)"}],"webUi":true,"scenarios":{"project-starter: Source first":{"byHand":true,"note":"agent behaviour in start step 6; skill asks before drafting (eval your-project-stage-visible); checked live in the next test","date":"2026-10-19"},"project-starter: Draft from the project":{"byHand":true,"note":"agent behaviour; skill text 'The draft is a review, not a click' (eval your-project-stage-visible)","date":"2026-10-19"},"project-starter: Never ask about unseen text":{"byHand":true,"note":"agent behaviour; the hard rule in step 6 (eval your-project-stage-visible); checked live in the next test","date":"2026-10-19"},"project-starter: Questions for an empty project":{"byHand":true,"note":"agent behaviour; 'Too little to go on' and Not sources (eval your-project-stage-sources-and-exits); checked live in acme-empty","date":"2026-10-19"},"project-starter: Later":{"byHand":true,"note":"agent behaviour; 'Later stays an option every time' (eval your-project-stage-sources-and-exits); the earlier name match to decisions.test.mjs was wrong","date":"2026-10-19"},"project-starter: Re-sync":{"byHand":true,"note":"agent behaviour; step 6 runs only when this run created the doc (CREATE in the plan)","date":"2026-10-19"}},"safeguards":{"date":"2026-10-19","ratings":{"reach":{"level":"low","why":"one skill's text (start step 6) and its evals"},"undo":{"level":"low","why":"reverting the commit undoes it"},"safety":{"level":"low","why":"no secrets, permissions, hooks or user data"}},"recommended":["scenario-check"],"chosen":["scenario-check"]},"docsSync":{"date":"2026-10-19","docsUpdated":{"commit":"854d635","date":"2026-10-19"},"codeCommitsSince":0,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":1,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"start SKILL.md:53 after apply the kit's own blank context doc and CLAUDE.md exist, so an empty project can look like it has describing files","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C2","what":"code review (medium)","detail":"start SKILL.md:54 the 'too little to go on' fallback is gone: a one-line README leads to a draft of guesses instead of the questions","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C3","what":"code review (low)","detail":"start SKILL.md:56 no Later once a draft is shown","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C4","what":"code review (low)","detail":"start SKILL.md:64 the questions path's review offers 'Ask me the questions instead' again: a loop; no Later on the empty-project path","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C5","what":"code review (low)","detail":"start SKILL.md:56 'Change something' has no exit besides approving or switching to the questions","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C6","what":"code review (low)","detail":"verify.md:37 'Later' (and maybe 'Re-sync') counted as tested through a name match with unrelated tests","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C7","what":"code review (low)","detail":"evals/start/cases.yaml:194 evals only check skill text, not the agent's behaviour","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C8","what":"code review (low)","detail":"tests/kit/status.test.mjs:82 CRLF fixed in one test only; templates check out with CRLF without a .gitattributes rule","note":"fixed in 854d635","date":"2026-10-19"},{"item":"C9","what":"code review (low)","detail":"start SKILL.md:57 the show-the-text rule is stated three times","note":"fixed in 854d635","date":"2026-10-19"}],"result":"pass"} -->
