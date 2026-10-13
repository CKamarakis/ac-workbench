# Tasks

## 1. Checks before building

- [x] 1.1 OpenSpec isolation check (design D6). In a throwaway folder with `HOME`, `USERPROFILE`, `APPDATA` and `XDG_CONFIG_HOME` pointed inside it: `openspec init --tools claude`, `openspec new change x`, `openspec archive x -y`. Compare the real global OpenSpec config folder and `~/.claude` (file list and modified times) before and after. Record the result in `evals/trials/kit-cross-platform.md`; if anything is written outside, note the fix in `design.md` D6 before group 4
- [x] 1.2 Bump the kit to `0.8.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`

## 2. Install commands per platform

- [x] 2.1 Validator (spec: toolkit-registry): adopted and trial entries need install commands for `win32`, `darwin` and `linux`, through platform keys or `all`; unknown keys fail. Verify with new cases in `tools/validate-registry.test.mjs`: platform missing, `all` only, unknown key `mac`, `later` entry without install
- [x] 2.2 `installFor(entry, platform)` in `setup.mjs` (design D1), used by `setup.mjs`, `start-plan.mjs` and `prereqs.mjs`. Verify with `tests/kit/setup.test.mjs`: platform key wins over `all`; `all` used when no key; `null` when neither
- [x] 2.3 Homebrew detection (design D3, spec: tool-setup "Missing Homebrew"): a `brew ` command with no `brew` found fails with the brew.sh hint and runs nothing; other tools continue. Verify with a test using fake `deps` (platform `darwin`, no brew, gh and openspec missing)
- [x] 2.4 Rewrite the 15 install blocks in `toolkit.yaml` (design D1, D2): npm, npx and `claude` commands under `all`; gh, jq, gitleaks and git as `win32` (unchanged) plus `darwin` and `linux` `brew install <formula>`; superspec's manual instruction under `all`. Run `npm run registry` and verify `npm run registry:check` passes and the Windows commands in `plugins/kit/data/toolkit.json` are unchanged (diff the `win32` values before and after)
- [x] 2.5 Update `plugins/kit/skills/setup/SKILL.md` so it no longer reads Windows-only (WinGet timing, "Program Files, winget" → per platform, Homebrew hint). Verify `npm run evals` for `setup` still passes its script cases

## 3. Tool finder on macOS and Linux

- [x] 3.1 `locate.mjs` known folders for `darwin` and `linux` (design D4). Verify with `tests/kit/locate.test.mjs` using a fake folder tree and `platform: 'darwin'`: a tool only in `<fake>/opt/homebrew/bin` is found with `via: 'known'`; a tool on PATH is still found first; Windows tests unchanged (make the folder roots injectable for the test)

## 4. Smoke test

- [x] 4.1 Runner `tools/smoke.mjs` (design D5, D6): throwaway project and home under `os.tmpdir()`, redirected home variables, steps `{ name, cmd, expect }`, `ok <name>` per step, stop on the first failure with command, expected and actual output, keep folders on failure, delete on pass; stop early with the install command when OpenSpec isn't found. Verify with a unit test that runs the runner on two fake steps (one passing, one failing) and checks the output and exit code
- [x] 4.2 Fixtures in `tools/smoke/fixtures/` (design D7): proposal, `design.md`, a flat spec delta, a nested delta `storms/stickies`, `tasks.md` with every task done. Verify `openspec validate` passes on them inside a scratch change
- [x] 4.3 Steps, in order (spec: kit-self-test "End-to-end smoke test"): `start-plan` and `start-apply --type none --accept all --home <tmp>` (expect `.claude/kit.json`, `CLAUDE.md`, `knowledge/`); `knowledge new-note`, `new-prd`, `set-field status Ready`; `next` suggests propose; `openspec new change smoke-change` plus fixtures; `judge --file proposal.md`; `ready scan`, `decisions add` / `later` / `ready-done`; `next` suggests apply, then verify; `verify run` with both reviews recorded as `skipped` ("smoke test"); archive gate fed an `openspec archive` event before and after verify (deny, then allow); `openspec archive smoke-change -y` (expect `openspec/specs/storms/stickies/spec.md`); `mkdir knowledge/docs`, `docs build` (expect `knowledge/docs/index.html`), `docs scan` (page up to date). Verify by running `npm run smoke` until it passes on this machine; then break one expectation on purpose and check it stops at that step and keeps the folder
- [x] 4.4 Last-pass record `.smoke-pass.json` (design D8): written only on a pass, gitignored. Verify `git status --short` stays clean after a pass and the file names `git rev-parse HEAD`
- [x] 4.5 `package.json` script `smoke`; not part of `npm test` (spec: "runs only on request"). Verify `npm test` doesn't start it

## 5. Smoke-test judge

- [x] 5.1 `tools/smoke-check.mjs` (spec: kit-self-test "Smoke-test judge", design D8): kit paths, committed and uncommitted changes, exit 0 or 3, "no pass recorded" and "commit not found" cases. Verify with a unit test on a throwaway git repo: script changed → recommended, exit 3; only `docs/` changed → not needed, exit 0; no record → recommended
- [x] 5.2 `package.json` script `smoke:check`; a line in this repo's `CLAUDE.md` (Commands and Rules): run `npm run smoke:check` when verifying a change that touches kit files and tell the user; run `npm run smoke` before a release. Verify by reading `CLAUDE.md`, and run `npm run smoke:check` once

## 6. Install check

- [x] 6.1 `tests/kit/install-check.test.mjs` (spec: kit-self-test "Install check", design D9): marketplace manifest, `plugin.json` (name, semantic version), `hooks.json` (known events from the hooks docs, each command's file exists), every `SKILL.md` (`name` matches the folder, `description` non-empty). Verify it passes on the repo, then fails with a clear message on a temporary copy with a broken `SKILL.md` and a hook pointing to a missing file

## 7. Wrap-up

- [ ] 7.1 Full run: `npm test`, `npm run registry:check`, `npm run evals`, `npm run smoke`, `npm run smoke:check` (expect "not needed" right after the pass). Record results, token use and anything unverified for the Mac tester (Homebrew installs, `~/.local/bin/claude`) in `evals/trials/kit-cross-platform.md`
- [ ] 7.2 Roadmap: M9 row and "Current position" updated with this change's state, in the same commit as the change's final tasks
