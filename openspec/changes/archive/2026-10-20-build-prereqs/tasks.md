## 1. OpenSpec tasks rule

- [x] 1.1 `start-plan.mjs`: `TASKS_RULE`, `withTasksRule(cfg)` (D4) and `configAction` combining pointer and rule (D5); `start-apply.mjs` adds the rule after `openspec init`; unit tests for each "OpenSpec tasks avoid manual checks" scenario pass
- [x] 1.2 Check in a throwaway folder that `openspec instructions tasks --json` returns the rule

## 2. Commit offers

- [x] 2.1 `start/SKILL.md`: Done part suggests and offers the setup commit; eval case passes
- [x] 2.2 `ready/SKILL.md`: close checks the change folder when a worktree is chosen and offers the commit; rule exception; eval case passes

## 3. Release

- [x] 3.1 Kit 0.20.1; `npm test`, `npm run evals`, `npm run smoke` pass
