# Tasks

## 1. Setup

- [x] 1.1 Bump the kit to `0.9.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [x] 1.2 Test-folder helper (design D6): `tests/helpers/tmp.mjs` with `tmpDir(prefix)` and cleanup after each test file; `testRoot()` shared with `tools/smoke.mjs`. Switch all 20 `mkdtempSync(os.tmpdir())` calls in tests and tools to it. Verify: count `kit-*` folders in `../temp` and `%TEMP%` before and after `npm test`; none added, all tests pass

## 2. Small fixes

- [x] 2.1 Remove the library-error hook (design D4): delete `plugins/kit/hooks/library-hint.mjs`, its `hooks.json` entry and its tests. Verify `npm test` (the install check confirms `hooks.json` still points only at existing files)
- [x] 2.2 `install: none` (design D5, spec toolkit-registry "Nothing to install"): validator accepts it; `setup.mjs` plan reports "nothing to install"; `start-plan.mjs` treats it as present; `claude-code-builtins` and `context7` switch to it with their reason in `install_note`. Verify with tests: a `none` entry whose check fails runs no command in `apply`; validator cases for `none`; `npm run registry:check`
- [x] 2.3 `/kit:next` order (design D1, spec skill-routing): a Ready PRD waits while a change is active. Verify with `tests/kit/next.test.mjs`: the "waits for the active change" scenario; the existing "no active change" Ready-PRD test still passes
- [x] 2.4 `/kit:start` docs line from the planner (design D9): `formatPlan` prints it under Later when `knowledge/docs/` is missing; the start skill shows the planner's Later lines and drops its own sentence. Verify with a `start-plan` test (line present without `knowledge/docs/`, absent with it) and `npm run evals` for `start`

## 3. Verify resolves fixed findings

- [x] 3.1 `verify.mjs resolve --item <id> --note` (design D2, spec quality-gates "Fixed findings are resolved"): Resolved section, refuses HARD items, stays resolved across `run` unless the same finding is recorded again. Verify with `tests/kit/verify.test.mjs` for both scenarios
- [x] 3.2 `/kit:verify` skill: after fixing an advisory finding, resolve it with a note naming the commit. Verify `npm run evals` for `verify`

## 4. Decisions after archive

- [x] 4.1 `decisions.mjs` finds an archived change by name (design D3, spec build-readiness "Decisions after archive"). Verify with a test: decide D2 of an archived change; the record shows the answer and date
- [x] 4.2 Docs page shows open/Later items from archived changes, labelled with their change (spec living-docs "Open decisions on the page"). Verify with `tests/kit/docs.test.mjs`: the "Later decision survives the archive" scenario; extend the smoke test so the page built after the archive still says "1 undecided"
- [x] 4.3 `/kit:next` line "N decisions still open in archived changes" (design D3, spec build-readiness). Verify with `tests/kit/next.test.mjs` and a smoke-test step after the archive

## 5. Docs page fixes

- [x] 5.1 Stable order (design D8): plain comparison instead of `localeCompare()`; same-day archives by archive commit time. Verify with tests: two archives on one day order newest first; sort result independent of locale (`Intl` not used)
- [x] 5.2 Page: links into a collapsed product open it (the badge stays a bare number). Verify with `tests/kit/docs-page.test.mjs` (`show()` opens `details` ancestors) and a look at the rebuilt page in the browser
- [x] 5.3 Notes for this repo's page: run `/kit:docs`, draft the `living-docs` and `kit-self-test` notes, write them only on the user's yes, rebuild the page. Verify `docs.mjs scan` lists no missing notes for them
- [x] 5.4 Approval questions show drafts in full in the message, never in an option preview (added by the user 2026-10-14 after the 5.3 previews cut 11 and 8 lines off): `/kit:docs` step 5 and the `/kit:verify` docs sync. Verify with the new `docs` eval case drafts-shown-in-full

## 6. Re-sync without installs

- [x] 6.1 `start-apply.mjs --files-only` (design D7, spec project-starter "Re-sync without tool installs"). Verify with `tests/kit/start-apply.test.mjs`: an out-of-date routing block is updated, no install command runs, the summary lists the tools left alone
- [x] 6.2 Start skill: only on a re-sync whose plan would install a tool, ask "files only, or files and tools?" and pass `--files-only` on the first; otherwise ask nothing extra. Verify `npm run evals` for `start`; try it on the Toughbubble copy (`../temp/Toughbubble`) and record the result in `evals/trials/kit-followups.md`

## 7. Tested versions

- [ ] 7.1 `tools/smoke.mjs` reads OpenSpec's tested version from the registry's `reviewed_version` (design D10, spec kit-self-test). One `CLAUDE.md` line on bumping `reviewed_version` after a passing smoke run. Verify `npm run smoke` prints the version line from the registry

## 8. Wrap-up

- [ ] 8.1 Full run: `npm test`, `npm run registry:check`, `npm run evals`, `npm run smoke`, `npm run smoke:check`; no `kit-*` folders left in the test area or `%TEMP%`. Record results in `evals/trials/kit-followups.md`
- [ ] 8.2 Roadmap: M9 row and "Current position" updated, in the same commit as the change's last tasks
