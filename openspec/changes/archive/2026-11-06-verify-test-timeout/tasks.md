# Tasks

## 1. Time limit and time-out result (verify.mjs)

- [x] 1.1 Add `TEST_TIMEOUT_MINUTES = 15` and use it in `defaultRun`; return `timedOut` when the child was stopped by the timer (design D1, D2); verify with a unit test that runs a short sleep command against a tiny limit (or the injected `run`) and gets `timedOut: true`
- [x] 1.2 In `runVerify`, report a time-out as `ran out after 15 min` in the tests table and as an item with the not-a-failure message and the absolute `verify.mjs` path (design D3, D4); verify with unit tests for the scenarios "Optional suite runs out of time", "Required suite runs out of time" and "Real failure is unchanged" in `tests/kit/verify.test.mjs`, and `npm test` passes

## 2. Skill and release

- [x] 2.1 Update `plugins/kit/skills/verify/SKILL.md` step 2: run `verify.mjs run` in the background when the shell tool limit is below 15 minutes, and explain a "ran out" item to the user with the file to edit (design D5); verify `npm run evals verify` passes
- [x] 2.2 Bump the kit to 1.0.0-rc.5 and run `npm run smoke:check`, then `npm run smoke` if it recommends one; verify both pass and tell the user what smoke:check says

## Workflow follow-up

- `/kit:verify`, then `/opsx:archive`.
- Re-run `/kit:verify` on Acme after updating the kit there: `test:integration` should pass (about 13.5 min).
