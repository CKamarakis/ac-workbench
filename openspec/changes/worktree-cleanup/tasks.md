# Tasks

## 1. Clean-up offer

- [x] 1.1 Routing line in `lanes.mjs`: after the merge back, offer to remove the worktree and its branch on a yes (`ExitWorktree`, `git worktree remove`, `git branch -d`, never forcing; list what git refuses and remove nothing); test in `tests/kit/lanes.test.mjs`

## 2. Reminder

- [x] 2.1 `next.mjs`: pure `worktreeLine(worktrees, archived, reminded)` for worktrees under `.claude/worktrees/` whose change is archived and not yet reminded; `main` reads `git worktree list --porcelain`, the archive folder names and `<git common dir>/kit-worktree-reminders`, and records the names it showed; `format` prints the line; tests in `tests/kit/next.test.mjs` for each "Leftover worktree reminder" scenario

## 3. Integration

- [x] 3.1 `npm test`, `npm run evals`, `npm run smoke:check` (and `npm run smoke` if it recommends one)
- [x] 3.2 Kit 1.0.0-rc.4 and a CHANGELOG entry
