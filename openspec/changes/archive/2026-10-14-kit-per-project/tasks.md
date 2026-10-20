# Tasks

## 1. Registry

- [x] 1.1 Bump the kit to `0.11.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`
- [x] 1.2 `toolkit.yaml` (design D1): add `ac-workbench-marketplace` (scope `machine`, tier `global`, check and install as in D1); change `kit` to scope `project`, tier `global`, `plugin: kit@ac-workbench`, check on the project's `.claude/settings.json` (design D1), install `--scope project --json`; update its `reason` ("enabled per project"). Run `npm run registry`. Verify `npm run registry:check` passes and the lane map still gives the kit its phases (`tests/kit/lanes.test.mjs`)

## 2. Setup and start

- [x] 2.1 `setup.mjs` (design D3, spec tool-setup "Kit found installed at user level"): a user-level kit gets the safe-order warning; the marketplace entry is installed on a fresh machine and the kit is not. Verify with tests in `tests/kit/setup.test.mjs`: kit in user settings gives the warning text with "first install ... in each kit project, then uninstall --scope user"; `plan()` lists the marketplace as missing on an empty machine and skips the kit as project scope
- [x] 2.2 `start-plan.mjs` (design D2, spec project-starter "Kit installed per project"): the kit is chosen as a `global`-tier tool; present when `projectEnabled`; `install --scope project` when only a user-level install serves it; the summary line about removing the user-level install. Verify with tests in `tests/kit/start-plan.test.mjs` using a fake `claude plugin list` output for each case (project-enabled; user-level only)
- [x] 2.3 Skills `setup` and `start`: scope wording (the kit is per project; setup installs CLIs and marketplaces). Verify the install check in `npm test` and `npm run evals` for `setup` and `start` pass

## 3. Docs

- [x] 3.1 `README.md` Install and "Use it in a project": once per machine `claude plugin marketplace add CKamarakis/ac-workbench`; per project `claude plugin install kit@ac-workbench --scope project`, then `/kit:start`; one line on collaborators (they install it too; folder trust). `docs/setup.md` the same, including the local-path variant and its diagram. Verify `grep -rn "scope user" README.md docs/setup.md` finds only the "never" wording
- [x] 3.2 Repo `CLAUDE.md` rule: "Tools and kit per project" (roadmap principle 2). Verify by reading it against the roadmap

## 4. Proof

- [x] 4.1 Smoke step (design D5): in the smoke project, `start-plan` lists the kit as an `install` action with `--scope project`. Verify `npm run smoke` passes with the new step
- [x] 4.2 Real-CLI trial in `../temp` (design D5): marketplace from the local repo, `install --scope project`, `.claude/settings.json` enables the kit, `claude plugin list --json` shows `projectEnabled: true`, a sibling folder has no kit; uninstall afterwards. First check whether `CLAUDE_CONFIG_DIR` isolates it (unverified); if not, ask the user before touching the real config. Record in `evals/trials/kit-per-project.md`
- [x] 4.3 Full run: `npm test`, `npm run registry:check`, `npm run evals`, `npm run smoke`, `npm run smoke:check`. Record results in `evals/trials/kit-per-project.md`

## 5. Migration on this machine (with the user)

- [x] 5.1 After merge to `main`: `claude plugin update kit@ac-workbench`, then install the kit at project scope in ac-workbench, the Acme copy and the real Acme (show the `.claude/settings.json` diff first; ask for its path). Verify each with `claude plugin list --json` (`projectEnabled: true`)
- [x] 5.2 With the user's OK: `claude plugin uninstall kit@ac-workbench --scope user`. Verify a session in an unrelated folder lists no kit skill, and `/kit:setup` no longer warns. Record in `evals/trials/kit-per-project.md`
- [x] 5.3 Roadmap: drift entry's impact marked done, "Current position" updated, in the same commit as the change's last tasks
