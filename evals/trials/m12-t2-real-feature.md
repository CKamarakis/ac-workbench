# M12 T2: one real feature end to end (Acme)

A fresh copy of Acme, the test app, with kit 0.20.0 (2026-10-20). The user drove the session; the feature was a small "export as file" action in an existing menu. The detailed notes stay private (repo-privacy).

## What ran
- `/kit:start` re-sync (0.20.0 upgrade), `/opsx:propose`, `/kit:ready` (4 decisions answered; safeguards reach medium, undo low, safety low), `/opsx:apply`: 7 of 8 tasks done, with new unit tests for the converter.
- Not run: `/kit:verify` with integration tests and a browser check, because they need a database and servers; the user chose not to set those up for a test project.

## Findings (fixed in kit 0.20.1, change `build-prereqs`)
1. A worktree was chosen, but the plan wasn't committed, so the worktree couldn't see it; the user had to skip the worktree. Now `/kit:ready` offers to commit the plan.
2. The kit upgrade was never committed, so it mixed with the feature on one branch. Now `/kit:start` offers to commit the setup.
3. OpenSpec wrote a manual "verify in the browser" task, which stalled the build at 7 of 8. Now `/kit:start` adds an OpenSpec `rules.tasks` line against such tasks.
- The browser hint correctly stayed quiet: the feature is a click, not new input handling.

## Time and tokens
Not recorded: the session's time and `/cost` weren't captured, and the user closed T2 without them (2026-10-20). The next run of `docs/test-sheet.md` (M13 T6) can record both.
