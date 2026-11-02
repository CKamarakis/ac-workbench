# Verify: worktree-cleanup

result: pass
date: 2026-11-01
commit: 6a48f6a
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | /security-review needs origin/HEAD, which this clone doesn't have; reviewed the diff by hand: spawnSync with argument arrays, writes only inside the git folder, no secrets or network |
| code | ran | /code-review low returned no findings; C1 noted by hand while reading the diff |

## Safeguards

reach low, undo low, safety low; chosen: scenario-check

review against the spec: not chosen

ui review: not chosen

## Scenarios

7 scenario(s): 6 with a test, 1 checked by hand, 0 without a test

| Scenario | Checked by |
|---|---|
| skill-routing: Worktree chosen | tests/kit/lanes.test.mjs |
| skill-routing: No Safeguards section | tests/kit/lanes.test.mjs |
| skill-routing: Clean-up offered after the merge back | tests/kit/lanes.test.mjs |
| skill-routing: Clean-up refused by git | by hand: checked 2026-11-01 in ../temp: git worktree remove refuses a worktree with an untracked note (exit 128, folder kept), git branch -d refuses an unmerged wt/ branch (exit 1); the routing line forbids --force and -D (tests/kit/lanes.test.mjs) |
| skill-routing: Worktree left after archive | tests/kit/next.test.mjs |
| skill-routing: Reminder shown once | tests/kit/next.test.mjs |
| skill-routing: Worktree of an active change | tests/kit/next.test.mjs |

## Docs sync

docs last updated: never committed; code commits since: unknown; no apply receipt  (date: 2026-11-01)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 0 | 0 | 0 | 0 |

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
| S1 | security review (low) - next.mjs worktreeLine: worktree folder and branch names go unchecked into the printed remove commands the agent may run; a folder or branch with shell characters (; $ backtick) would end up in a command. Needs a local worktree with that name, so not exploitable from outside | fixed on branch worktree-cleanup (not committed yet): kebab-case names only, unsafe branch falls back to wt/<name>; test in tests/kit/next.test.mjs | 2026-11-01 |
| C1 | code review (low) - next.mjs: worktreeLine and worktreeState were inserted after the 'Pure decision. Input:' comment, so that comment now sits above worktreeLine instead of suggest (it already sat above docsLine) | fixed on branch worktree-cleanup (not committed yet): 'Pure decision' comment back above suggest | 2026-11-01 |

<!-- kit-verify-data {"change":"worktree-cleanup","date":"2026-11-01","commit":"6a48f6a","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"/security-review needs origin/HEAD, which this clone doesn't have; reviewed the diff by hand: spawnSync with argument arrays, writes only inside the git folder, no secrets or network","date":"2026-11-01"},"code":{"how":"ran","note":"/code-review low returned no findings; C1 noted by hand while reading the diff","date":"2026-11-01"}},"scenarioCheck":[{"capability":"skill-routing","scenario":"Worktree chosen","name":"skill-routing: Worktree chosen","status":"recorded","test":"tests/kit/lanes.test.mjs","note":""},{"capability":"skill-routing","scenario":"No Safeguards section","name":"skill-routing: No Safeguards section","status":"named","test":"tests/kit/lanes.test.mjs"},{"capability":"skill-routing","scenario":"Clean-up offered after the merge back","name":"skill-routing: Clean-up offered after the merge back","status":"recorded","test":"tests/kit/lanes.test.mjs","note":""},{"capability":"skill-routing","scenario":"Clean-up refused by git","name":"skill-routing: Clean-up refused by git","status":"by-hand","test":null,"note":"checked 2026-11-01 in ../temp: git worktree remove refuses a worktree with an untracked note (exit 128, folder kept), git branch -d refuses an unmerged wt/ branch (exit 1); the routing line forbids --force and -D (tests/kit/lanes.test.mjs)"},{"capability":"skill-routing","scenario":"Worktree left after archive","name":"skill-routing: Worktree left after archive","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Reminder shown once","name":"skill-routing: Reminder shown once","status":"recorded","test":"tests/kit/next.test.mjs","note":""},{"capability":"skill-routing","scenario":"Worktree of an active change","name":"skill-routing: Worktree of an active change","status":"recorded","test":"tests/kit/next.test.mjs","note":""}],"webUi":true,"scenarios":{"skill-routing: Worktree chosen":{"test":"tests/kit/lanes.test.mjs","date":"2026-11-01"},"skill-routing: Clean-up offered after the merge back":{"test":"tests/kit/lanes.test.mjs","date":"2026-11-01"},"skill-routing: Worktree left after archive":{"test":"tests/kit/next.test.mjs","date":"2026-11-01"},"skill-routing: Reminder shown once":{"test":"tests/kit/next.test.mjs","date":"2026-11-01"},"skill-routing: Worktree of an active change":{"test":"tests/kit/next.test.mjs","date":"2026-11-01"},"skill-routing: Clean-up refused by git":{"byHand":true,"note":"checked 2026-11-01 in ../temp: git worktree remove refuses a worktree with an untracked note (exit 128, folder kept), git branch -d refuses an unmerged wt/ branch (exit 1); the routing line forbids --force and -D (tests/kit/lanes.test.mjs)","date":"2026-11-01"}},"safeguards":{"date":"2026-10-31","ratings":{"reach":{"level":"low","why":"one routing line and one reminder line; no flag, output contract or file format others rely on changes"},"undo":{"level":"low","why":"reverting the commits undoes it; the reminders file lives inside .git"},"safety":{"level":"low","why":"the clean-up runs only on a yes and never forces, so no work can be lost"}},"recommended":["scenario-check"],"chosen":["scenario-check"]},"docsSync":{"date":"2026-11-01","docsUpdated":null,"codeCommitsSince":null,"receipt":false,"proposed":0,"written":0,"declined":0,"leftOut":0,"unplanned":[]},"resolved":[{"item":"S1","what":"security review (low)","detail":"next.mjs worktreeLine: worktree folder and branch names go unchecked into the printed remove commands the agent may run; a folder or branch with shell characters (; $ backtick) would end up in a command. Needs a local worktree with that name, so not exploitable from outside","note":"fixed on branch worktree-cleanup (not committed yet): kebab-case names only, unsafe branch falls back to wt/<name>; test in tests/kit/next.test.mjs","date":"2026-11-01"},{"item":"C1","what":"code review (low)","detail":"next.mjs: worktreeLine and worktreeState were inserted after the 'Pure decision. Input:' comment, so that comment now sits above worktreeLine instead of suggest (it already sat above docsLine)","note":"fixed on branch worktree-cleanup (not committed yet): 'Pure decision' comment back above suggest","date":"2026-11-01"}],"result":"pass"} -->
