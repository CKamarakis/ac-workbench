# Verify: context-questions-polish

result: pass
date: 2026-10-19
commit: 2375ac0
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

15 scenario(s): 9 with a test, 6 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| project-starter: Next.js project | tests/kit/start-plan.test.mjs |
| project-starter: Opt-in tools not asked | tests/kit/start-plan.test.mjs |
| project-starter: Type tools installed silently | tests/kit/start-plan.test.mjs |
| project-starter: File changes confirmed together | tests/kit/start-apply.test.mjs |
| project-starter: Empty folder type order | by hand: agent behaviour in start step 2; skill order rule (eval context-questions-two-rounds-and-type-order); to see live in the next acme-empty run |
| project-starter: Source first | by hand: agent behaviour; seen live in acme-fresh-3 on 0.18.1 (asked 'How should we fill docs/project-context.md?' before drafting) |
| project-starter: Draft from the project | by hand: agent behaviour; skill text (eval your-project-stage-visible); draft path not chosen in the live run yet |
| project-starter: Never ask about unseen text | by hand: agent behaviour; hard rule in step 6 (eval your-project-stage-visible) |
| project-starter: Questions for an empty project | by hand: agent behaviour; two rounds and voice hint in the skill (eval context-questions-two-rounds-and-type-order); to see live in the next acme-empty run |
| project-starter: Later | tests/kit/decisions.test.mjs |
| project-starter: Re-sync | tests/kit/start-apply.test.mjs |
| project-starter: Where more context goes | by hand: agent behaviour; closing line in step 6 (eval context-questions-two-rounds-and-type-order) |
| project-starter: Empty folder | tests/kit/start-apply.test.mjs |
| project-starter: Personal settings stay private | tests/kit/start-plan.test.mjs |
| project-starter: Kit lines kept when the file already has them | tests/kit/start-plan.test.mjs |

## Docs sync

docs last updated: 2026-10-20 (2375ac0); code commits since: 0; no apply receipt  (date: 2026-10-19)

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
| C1 | code review (medium) - start-plan.mjs:51 gitignoreBlock finds the end marker anywhere while managedBlock looks after the start; a '# kit:end...' comment above the block can make it drop its own lines | resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0 | 2026-10-19 |
| C3 | code review (medium) - start-plan.mjs:50 leaving out lines the file already has makes privacy rest on the user's own lines | resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0 | 2026-10-19 |
| C4 | code review (low) - start-plan.mjs:66 'already listed above' is wrong for lines below the block | resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0 | 2026-10-19 |
| C5 | code review (low) - start-plan.mjs:60 comment removal and note placement assume the template's shape | resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0 | 2026-10-19 |
| C10 | code review (low) - start-plan.test.mjs:68 no edge-case tests for the dedupe | resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0 | 2026-10-19 |
| V1 | review against the spec - project-starter: Lines already in .gitignore \| plugins/kit/scripts/start-plan.mjs:65 \| the note said 'already listed above' but a user's line can sit below the block (spec only says 'names them'); wording fixed | resolved by undoing the .gitignore dedupe in 2375ac0 | 2026-10-19 |
| C2 | code review (medium) - SKILL.md:67 the closing line offers to update the context doc on request while the rules say the kit never edits it | fixed in 2375ac0 | 2026-10-19 |
| C8 | code review (low) - SKILL.md:58 question 4 has no example in the template | fixed in 2375ac0 | 2026-10-19 |
| C9 | code review (low) - SKILL.md:25 type order assumes web-ui exists and one recommended type | fixed in 2375ac0 | 2026-10-19 |
| C6 | code review (low) - README.md:65 update and reload commands not recorded as checked | the commands were checked (claude plugin update --help, marketplace update --help, plugins docs); now recorded in tasks.md in 2375ac0 | 2026-10-19 |
| C7 | code review (low) - lanes.mjs:108 dropping the Owner column hides the owning tool's name | kept on purpose: the Use column names the command the agent runs; tool names live in toolkit.yaml (design D3) | 2026-10-19 |

<!-- kit-verify-data {"change":"context-questions-polish","date":"2026-10-19","commit":"2375ac0","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-19"},"spec":{"how":"ran","note":"","date":"2026-10-19"},"code":{"how":"ran","note":"","date":"2026-10-19"}},"scenarioCheck":[{"capability":"project-starter","scenario":"Next.js project","name":"project-starter: Next.js project","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Opt-in tools not asked","name":"project-starter: Opt-in tools not asked","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Type tools installed silently","name":"project-starter: Type tools installed silently","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"File changes confirmed together","name":"project-starter: File changes confirmed together","status":"recorded","test":"tests/kit/start-apply.test.mjs","note":""},{"capability":"project-starter","scenario":"Empty folder type order","name":"project-starter: Empty folder type order","status":"by-hand","test":null,"note":"agent behaviour in start step 2; skill order rule (eval context-questions-two-rounds-and-type-order); to see live in the next acme-empty run"},{"capability":"project-starter","scenario":"Source first","name":"project-starter: Source first","status":"by-hand","test":null,"note":"agent behaviour; seen live in acme-fresh-3 on 0.18.1 (asked 'How should we fill docs/project-context.md?' before drafting)"},{"capability":"project-starter","scenario":"Draft from the project","name":"project-starter: Draft from the project","status":"by-hand","test":null,"note":"agent behaviour; skill text (eval your-project-stage-visible); draft path not chosen in the live run yet"},{"capability":"project-starter","scenario":"Never ask about unseen text","name":"project-starter: Never ask about unseen text","status":"by-hand","test":null,"note":"agent behaviour; hard rule in step 6 (eval your-project-stage-visible)"},{"capability":"project-starter","scenario":"Questions for an empty project","name":"project-starter: Questions for an empty project","status":"by-hand","test":null,"note":"agent behaviour; two rounds and voice hint in the skill (eval context-questions-two-rounds-and-type-order); to see live in the next acme-empty run"},{"capability":"project-starter","scenario":"Later","name":"project-starter: Later","status":"named","test":"tests/kit/decisions.test.mjs"},{"capability":"project-starter","scenario":"Re-sync","name":"project-starter: Re-sync","status":"named","test":"tests/kit/start-apply.test.mjs"},{"capability":"project-starter","scenario":"Where more context goes","name":"project-starter: Where more context goes","status":"by-hand","test":null,"note":"agent behaviour; closing line in step 6 (eval context-questions-two-rounds-and-type-order)"},{"capability":"project-starter","scenario":"Empty folder","name":"project-starter: Empty folder","status":"named","test":"tests/kit/start-apply.test.mjs"},{"capability":"project-starter","scenario":"Personal settings stay private","name":"project-starter: Personal settings stay private","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"Kit lines kept when the file already has them","name":"project-starter: Kit lines kept when the file already has them","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""}],"webUi":true,"scenarios":{"project-starter: Next.js project":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: Opt-in tools not asked":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: Type tools installed silently":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: File changes confirmed together":{"test":"tests/kit/start-apply.test.mjs","date":"2026-10-19"},"project-starter: Personal settings stay private":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: Kit lines kept when the file already has them":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-19"},"project-starter: Empty folder type order":{"byHand":true,"note":"agent behaviour in start step 2; skill order rule (eval context-questions-two-rounds-and-type-order); to see live in the next acme-empty run","date":"2026-10-19"},"project-starter: Source first":{"byHand":true,"note":"agent behaviour; seen live in acme-fresh-3 on 0.18.1 (asked 'How should we fill docs/project-context.md?' before drafting)","date":"2026-10-19"},"project-starter: Draft from the project":{"byHand":true,"note":"agent behaviour; skill text (eval your-project-stage-visible); draft path not chosen in the live run yet","date":"2026-10-19"},"project-starter: Never ask about unseen text":{"byHand":true,"note":"agent behaviour; hard rule in step 6 (eval your-project-stage-visible)","date":"2026-10-19"},"project-starter: Questions for an empty project":{"byHand":true,"note":"agent behaviour; two rounds and voice hint in the skill (eval context-questions-two-rounds-and-type-order); to see live in the next acme-empty run","date":"2026-10-19"},"project-starter: Where more context goes":{"byHand":true,"note":"agent behaviour; closing line in step 6 (eval context-questions-two-rounds-and-type-order)","date":"2026-10-19"}},"safeguards":{"date":"2026-10-19","ratings":{"reach":{"level":"medium","why":"the routing block and .gitignore block are written into every kit project on re-sync"},"undo":{"level":"low","why":"reverting the commits undoes it; projects re-sync"},"safety":{"level":"low","why":"no secrets, permissions, hooks or user data"}},"recommended":["scenario-check","worktree","spec-review"],"chosen":["scenario-check","spec-review"]},"docsSync":{"date":"2026-10-19","docsUpdated":{"commit":"2375ac0","date":"2026-10-20"},"codeCommitsSince":0,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":1,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"start-plan.mjs:51 gitignoreBlock finds the end marker anywhere while managedBlock looks after the start; a '# kit:end...' comment above the block can make it drop its own lines","note":"resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0","date":"2026-10-19"},{"item":"C3","what":"code review (medium)","detail":"start-plan.mjs:50 leaving out lines the file already has makes privacy rest on the user's own lines","note":"resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0","date":"2026-10-19"},{"item":"C4","what":"code review (low)","detail":"start-plan.mjs:66 'already listed above' is wrong for lines below the block","note":"resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0","date":"2026-10-19"},{"item":"C5","what":"code review (low)","detail":"start-plan.mjs:60 comment removal and note placement assume the template's shape","note":"resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0","date":"2026-10-19"},{"item":"C10","what":"code review (low)","detail":"start-plan.test.mjs:68 no edge-case tests for the dedupe","note":"resolved by undoing the .gitignore dedupe (start-plan.mjs back to main) in 2375ac0","date":"2026-10-19"},{"item":"V1","what":"review against the spec","detail":"project-starter: Lines already in .gitignore | plugins/kit/scripts/start-plan.mjs:65 | the note said 'already listed above' but a user's line can sit below the block (spec only says 'names them'); wording fixed","note":"resolved by undoing the .gitignore dedupe in 2375ac0","date":"2026-10-19"},{"item":"C2","what":"code review (medium)","detail":"SKILL.md:67 the closing line offers to update the context doc on request while the rules say the kit never edits it","note":"fixed in 2375ac0","date":"2026-10-19"},{"item":"C8","what":"code review (low)","detail":"SKILL.md:58 question 4 has no example in the template","note":"fixed in 2375ac0","date":"2026-10-19"},{"item":"C9","what":"code review (low)","detail":"SKILL.md:25 type order assumes web-ui exists and one recommended type","note":"fixed in 2375ac0","date":"2026-10-19"},{"item":"C6","what":"code review (low)","detail":"README.md:65 update and reload commands not recorded as checked","note":"the commands were checked (claude plugin update --help, marketplace update --help, plugins docs); now recorded in tasks.md in 2375ac0","date":"2026-10-19"},{"item":"C7","what":"code review (low)","detail":"lanes.mjs:108 dropping the Owner column hides the owning tool's name","note":"kept on purpose: the Use column names the command the agent runs; tool names live in toolkit.yaml (design D3)","date":"2026-10-19"}],"result":"pass"} -->
