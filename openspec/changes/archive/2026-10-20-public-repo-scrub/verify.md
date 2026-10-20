# Verify: public-repo-scrub

result: pass
date: 2026-10-20
commit: f244b23
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | hook reviewed directly: file names passed quoted and after --, fixed-string grep, list never printed, temp files removed; kept: a file name containing a newline would be split (none in the repo) |
| code | substitute | reviewed directly with the 7 hook tests; the scrub checked by the 0-hit grep plus 608 tests, 129 evals and smoke |

## Safeguards

None chosen (no Safeguards section in design.md): verify as usual.

review against the spec: not chosen

ui review: not chosen

## Scenarios

6 scenario(s): 5 with a test, 1 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| repo-privacy: Listed word in a staged file | tests/repo/private-words.test.mjs |
| repo-privacy: Listed word in the commit message | tests/repo/private-words.test.mjs |
| repo-privacy: Removing a listed word is allowed | tests/repo/private-words.test.mjs |
| repo-privacy: No word list | tests/repo/private-words.test.mjs |
| repo-privacy: Word list never committed | tests/repo/private-words.test.mjs |
| repo-privacy: Tree clean before publishing | by hand: git grep --cached -iwF over every .private-words entry: 0 hits per entry (2026-10-20); repeated on the fresh clone at 3.3 |

## Docs sync

Not run yet.

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

<!-- kit-verify-data {"change":"public-repo-scrub","date":"2026-10-20","commit":"f244b23","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"hook reviewed directly: file names passed quoted and after --, fixed-string grep, list never printed, temp files removed; kept: a file name containing a newline would be split (none in the repo)","date":"2026-10-20"},"code":{"how":"substitute","note":"reviewed directly with the 7 hook tests; the scrub checked by the 0-hit grep plus 608 tests, 129 evals and smoke","date":"2026-10-20"}},"scenarioCheck":[{"capability":"repo-privacy","scenario":"Listed word in a staged file","name":"repo-privacy: Listed word in a staged file","status":"named","test":"tests/repo/private-words.test.mjs"},{"capability":"repo-privacy","scenario":"Listed word in the commit message","name":"repo-privacy: Listed word in the commit message","status":"named","test":"tests/repo/private-words.test.mjs"},{"capability":"repo-privacy","scenario":"Removing a listed word is allowed","name":"repo-privacy: Removing a listed word is allowed","status":"named","test":"tests/repo/private-words.test.mjs"},{"capability":"repo-privacy","scenario":"No word list","name":"repo-privacy: No word list","status":"named","test":"tests/repo/private-words.test.mjs"},{"capability":"repo-privacy","scenario":"Word list never committed","name":"repo-privacy: Word list never committed","status":"named","test":"tests/repo/private-words.test.mjs"},{"capability":"repo-privacy","scenario":"Tree clean before publishing","name":"repo-privacy: Tree clean before publishing","status":"by-hand","test":null,"note":"git grep --cached -iwF over every .private-words entry: 0 hits per entry (2026-10-20); repeated on the fresh clone at 3.3"}],"webUi":true,"scenarios":{"repo-privacy: Tree clean before publishing":{"byHand":true,"note":"git grep --cached -iwF over every .private-words entry: 0 hits per entry (2026-10-20); repeated on the fresh clone at 3.3","date":"2026-10-20"}},"result":"pass"} -->
