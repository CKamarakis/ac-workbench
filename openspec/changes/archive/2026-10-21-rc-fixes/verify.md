# Verify: rc-fixes

result: pass
date: 2026-10-21
commit: 7acd4e0
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | reviewed directly: image-text.mjs reads stdin only, bounded chunk parsing, inflate errors caught, no shell; hook passes paths quoted; docs-page code spans escaped (test) |
| code | substitute | reviewed directly; checked: savedType distinguishes none vs absent, linkCards keeps [[card]] links outside code, hook skips image check once a text hit is found, kit-status.png still renders |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

7 scenario(s): 5 with a test, 2 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| living-docs: First run on a project with history | by hand: skill behaviour; eval big-batch-one-yes checks the text (one question, Agent per capability, review with git diff); real run comes with the next /kit:docs on a project |
| living-docs: A few new drafts | by hand: skill text: steps 5-6 apply to batches of 3 or fewer (eval big-batch-one-yes) |
| living-docs: Command in How it works | tests/kit/docs-page.test.mjs |
| project-starter: Re-sync with a saved type | tests/kit/start-plan.test.mjs |
| project-starter: First setup | tests/kit/start-plan.test.mjs |
| repo-privacy: Word in image metadata | tests/repo/private-words.test.mjs |
| repo-privacy: Word only in pixel bytes | tests/repo/private-words.test.mjs |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

<!-- kit-verify-data {"change":"rc-fixes","date":"2026-10-21","commit":"7acd4e0","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"reviewed directly: image-text.mjs reads stdin only, bounded chunk parsing, inflate errors caught, no shell; hook passes paths quoted; docs-page code spans escaped (test)","date":"2026-10-21"},"code":{"how":"substitute","note":"reviewed directly; checked: savedType distinguishes none vs absent, linkCards keeps [[card]] links outside code, hook skips image check once a text hit is found, kit-status.png still renders","date":"2026-10-21"}},"scenarioCheck":[{"capability":"living-docs","scenario":"First run on a project with history","name":"living-docs: First run on a project with history","status":"by-hand","test":null,"note":"skill behaviour; eval big-batch-one-yes checks the text (one question, Agent per capability, review with git diff); real run comes with the next /kit:docs on a project"},{"capability":"living-docs","scenario":"A few new drafts","name":"living-docs: A few new drafts","status":"by-hand","test":null,"note":"skill text: steps 5-6 apply to batches of 3 or fewer (eval big-batch-one-yes)"},{"capability":"living-docs","scenario":"Command in How it works","name":"living-docs: Command in How it works","status":"recorded","test":"tests/kit/docs-page.test.mjs","note":""},{"capability":"project-starter","scenario":"Re-sync with a saved type","name":"project-starter: Re-sync with a saved type","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"project-starter","scenario":"First setup","name":"project-starter: First setup","status":"recorded","test":"tests/kit/start-plan.test.mjs","note":""},{"capability":"repo-privacy","scenario":"Word in image metadata","name":"repo-privacy: Word in image metadata","status":"recorded","test":"tests/repo/private-words.test.mjs","note":""},{"capability":"repo-privacy","scenario":"Word only in pixel bytes","name":"repo-privacy: Word only in pixel bytes","status":"recorded","test":"tests/repo/private-words.test.mjs","note":""}],"webUi":true,"scenarios":{"project-starter: Re-sync with a saved type":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-21"},"project-starter: First setup":{"test":"tests/kit/start-plan.test.mjs","date":"2026-10-21"},"living-docs: First run on a project with history":{"byHand":true,"note":"skill behaviour; eval big-batch-one-yes checks the text (one question, Agent per capability, review with git diff); real run comes with the next /kit:docs on a project","date":"2026-10-21"},"living-docs: A few new drafts":{"byHand":true,"note":"skill text: steps 5-6 apply to batches of 3 or fewer (eval big-batch-one-yes)","date":"2026-10-21"},"living-docs: Command in How it works":{"test":"tests/kit/docs-page.test.mjs","date":"2026-10-21"},"repo-privacy: Word in image metadata":{"test":"tests/repo/private-words.test.mjs","date":"2026-10-21"},"repo-privacy: Word only in pixel bytes":{"test":"tests/repo/private-words.test.mjs","date":"2026-10-21"}},"result":"pass"} -->
