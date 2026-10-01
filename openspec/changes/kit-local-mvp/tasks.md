# Tasks

## 1. Housekeeping and kit scaffold

- [x] 1.1 Rewrite `openspec/config.yaml` context to the kit framing (ac-workbench, marketplace with `kit` plugin, local-only MVP) and verify `openspec instructions tasks --change kit-local-mvp --json` no longer mentions prd-pipeline as the project
- [x] 1.2 Update `docs/project-context.md` to the kit framing (goal, decided items from design D1–D12, prd-pipeline moved to "later") and verify it links to this change
- [x] 1.3 Create `.claude-plugin/marketplace.json` listing `kit` at `plugins/kit`, and `plugins/kit/.claude-plugin/plugin.json` with version `0.1.0`; verify both parse as JSON and the layout matches design D1
- [x] 1.4 Add root `package.json` (dev-only, `"type": "module"`, `yaml` dev dependency, `test` script using `node --test`) and verify `npm install` and `npm test` succeed with zero tests
- [x] 1.5 Extend `.gitignore` with `node_modules/`, `cockpit/` and eval sandboxes, and verify `git check-ignore` matches each while the PM-OS patterns still match `PM-OS-v2.1/`
- [x] 1.6 Install gitleaks (record the command), add `.githooks/pre-commit` running `gitleaks git --pre-commit --staged` (v8.30 dropped `protect`), enable it with `git config core.hooksPath .githooks`, document it in `docs/project-context.md`, and verify a commit with a fake `ghp_` token is blocked while a clean commit passes; run `gitleaks git .` on the full history and verify it reports no leaks (design D15)

## 2. Trial prerequisites and sandbox smoke test

- [x] 2.1 Install `jq` (winget or direct download; record the exact command) and verify `jq --version` runs in Git Bash; `gh` is already present (2.101.0, signed in); verify it is callable via its full path
- [x] 2.2 Create a throwaway `kit-sandbox` repo, add this repo as a local-directory marketplace there, install `kit`, and verify a stub skill in `plugins/kit/skills/` appears as `/kit:<name>` and can run a script via `${CLAUDE_PLUGIN_ROOT}` (resolves design risk on plugin install/script paths)
- [x] 2.3 Enable Superpowers in the sandbox only and run the smoke checks (session start time, input not frozen, skills listed); record results in `evals/trials/superpowers-smoke.md` with pass/fail per check
- [x] 2.4 If 2.3 passes, install SuperSpec's schema and the OpenSpec custom profile with verify in the sandbox, and verify `openspec schemas` lists it; if 2.3 fails, record the WSL2/drop decision in the same file and skip setup B in group 4
- [x] 2.5 Verify per-project enablement: with Superpowers only in `worklow-test/.claude/settings.json`, a new session there lists `superpowers:*` skills and a new session in another folder does not; record the result in `evals/trials/superpowers-smoke.md` (design D14)

## 3. Eval framework

- [x] 3.1 Define the eval case format (`evals/<skill>/cases.yaml`: id, setup, input, checks with `deterministic` kinds and `rubric` criteria) in `evals/README.md` and verify a sample case file loads with the documented fields
- [x] 3.2 Implement deterministic checks (file-exists, command-exit, git-ignored, content-match) in `tools/run-evals.mjs` with a temp sandbox per case, and verify with `node --test` unit tests for each check kind
- [x] 3.3 Implement run records (`evals/<skill>/runs/<date>-<setup>.json`: date, setup, per-case outcomes, duration, interventions, per-criterion rubric pass/fail with reason) and verify a test run writes a file matching the format
- [x] 3.4 Add the "skill without evals" check (every folder in `plugins/kit/skills/` needs `evals/<skill>/cases.yaml`) and verify the run fails naming the stub skill from 2.2 until it has a case
- [x] 3.5 Add `tools/compare-runs.mjs` that prints two runs side by side (per-case outcome, time, interventions) and verify it on two fixture runs

## 4. Toolkit registry + validator (A/B trial slice)

- [x] 4.1 Write eval cases for the registry slice (valid entry, missing field, bad enum, status/verdict mismatch, unresolved phase conflict, resolved overlap, missing install data on an adopted entry, `later` entry without install data, stale `toolkit.json`) and verify they fail before the validator exists
- [x] 4.2 Setup A: build `toolkit.yaml` schema + `tools/validate-registry.mjs` in the sandbox with plain OpenSpec spec-driven; record time and interventions and verify an eval run file exists for setup A
- [x] 4.3 Setup B: build the same slice from the same starting commit with SuperSpec (skip if 2.4 dropped it); verify an eval run file exists for setup B
- [x] 4.4 Score both runs with `tools/compare-runs.mjs` plus the harness-review rubric criteria for artifact quality, and verify the comparison is saved in `evals/trials/workflow-ab.md`
- [x] 4.5 Port the winning validator into `tools/validate-registry.mjs` here: required fields, enums with allowed values in the message, verdict history append-only, status == latest verdict, phase conflicts, `scope`/`check`/`install` required for adopted and trial entries, `installed_version` > `reviewed_version` flagged "needs review"; verify all group-4 eval cases pass and exit code is non-zero on any error
- [x] 4.6 Validator writes `plugins/kit/data/toolkit.json` only on success; verify a failing registry leaves the previous JSON untouched
- [x] 4.7 Seed `toolkit.yaml` with the proposal's candidate tools (OpenSpec, Superpowers, SuperSpec, Playwright CLI, Context7, lint hook, gitleaks), each with scope, check and install data, plus the phase list, the `situations` guide, and verdicts from group 4 citing the eval run as evidence; verify validation passes
- [x] 4.8 Document the registry fields (including scope, check and install) and the edit → validate step in `docs/registry.md` and verify the documented command runs as written

## 5. Tool setup

- [x] 5.1 Verify the non-interactive plugin CLI (`claude plugin marketplace add`, `claude plugin install` and any scope flag) and whether Claude Code fetches an enabled-but-missing plugin by itself; record the results in `evals/trials/plugin-cli.md` and update design D13/D14 if they differ
- [x] 5.2 Implement `plugins/kit/scripts/locate.mjs` (zero-dependency) finding tools via PATH, `npm prefix -g`, `%APPDATA%\npm` and standard `Program Files` folders; verify tests for "on PATH", "only in npm prefix", "only in Program Files" (gh) and "missing"
- [x] 5.3 Implement `plugins/kit/scripts/setup.mjs` plan/apply: machine-scope adopted/trial entries only, check → present/missing, install after confirmation, one failure never stops the rest, summary with fix hints, and a flag for project-scope plugins found in `~/.claude/settings.json`; verify tests for fresh machine, partial, all present (nothing to do), dropped entry skipped and one failing install
- [x] 5.4 Add registry entries for the machine toolset (git, gh, jq, gitleaks, openspec, the kit plugin, the Superpowers marketplace) with check and install data for `win32`; verify validation passes
- [x] 5.5 Write `skills/setup/SKILL.md` (plan → show → confirm → apply → summary) and its eval cases, document the two-line bootstrap for a new machine in `docs/setup.md`, and verify `/kit:setup` on this machine installs what is missing and a second run reports nothing to do

## 6. Lane map

- [x] 6.1 Implement `plugins/kit/scripts/lanes.mjs` (zero-dependency): lane map from `toolkit.json`, unowned phases listed, overlaps and skip_skills; verify `node --test` cases for complete map, unowned phase and resolved overlap
- [x] 6.2 Render the lane map as a CLAUDE.md routing block between `<!-- kit:routing:start -->` / `<!-- kit:routing:end -->` (use / don't-use per phase) and verify the output matches a golden file
- [x] 6.3 Print the lane map and "needs review" flags from the validator and verify both appear in its output for a fixture with an updated tool

## 7. Project starter

- [x] 7.1 Implement `plugins/kit/scripts/prereqs.mjs` on top of `locate.mjs`, running the setup check first and stopping before any write if git is missing; verify tests for "missing machine tool → offer setup" and "missing git → stop with install hint"
- [x] 7.2 Add templates (`CLAUDE.md` with routing block, `project-context.md`, `.gitignore` kit block with licensed-folder patterns) in `plugins/kit/templates/` and verify the `.gitignore` block ignores `PM-OS-v2.1/` in a temp repo
- [x] 7.3 Implement `start-plan.mjs` (create / same / differs + diff per file, marker-block replace or append, damaged block = conflict) with tool selection by tier (`global` always, `project` only on opt-in, `project-type:<t>` for the chosen type; adopted/trial only) and verify tests for empty folder, edited CLAUDE.md, damaged marker, web-ui selection, an opt-in declined, and a dropped tool excluded
- [x] 7.4 Plan the per-project tool installs: plugins via `claude plugin install <p> --scope project --json` (fallback: merge `enabledPlugins`/`extraKnownMarketplaces` into `.claude/settings.json`, touching no other keys), MCP servers and skills via the entry's `install`, each followed by its `check`; entries with `install_note` become pending user steps; record the kit-managed items in the stamp. Verify tests for a new settings file, existing user permissions preserved, an interactive tool reported as pending, and a re-run planning `same` (design D4, D14)
- [x] 7.5 Implement `start-apply.mjs` (write confirmed items only, `git init`, `openspec init` with config pointing to the context doc, stamp `.claude/kit.json`, add to `~/.claude/kit/projects.json`) and verify it never deletes files, never writes `~/.claude/settings.json`, and a second plan is all `same`
- [ ] 7.6 Write `skills/start/SKILL.md` (setup check → ask type → plan → show diffs → confirm → apply → summary) and verify its eval cases (empty folder, idempotent re-run, missing git stops before writes, plugins enabled only in the project) pass, then run `/kit:start` live in a fresh throwaway folder `Projects/kit-start-sandbox` (never a real project). In the same sandbox, run each trial tool's `install` and `check` (Impeccable, Emil skills, Playwright CLI skills, Context7, Notion MCP) and correct their registry entries (`install_note` paths, checks) before any real project uses them
- [ ] 7.7 Clone Toughbubble into a temp folder and run `/kit:start` on the **copy** in re-run mode; verify it only shows diffs and changes nothing without confirmation. The real Toughbubble is never touched

## 8. Next-step skill

- [ ] 8.1 Implement `plugins/kit/scripts/next.mjs` mapping `openspec status --json` states to phases (design D6) and owners from the lane map; verify tests for no active change (→ brainstorm owner, e.g. `/opsx:explore`), planning incomplete (names next artifact), tasks ready, all tasks done
- [ ] 8.2 Write `skills/next/SKILL.md` and its eval cases and verify `/kit:next` in the sandbox gives a suggestion with owner and one-line reason

## 9. Integration

- [ ] 9.1 Run `npm test` and `node tools/run-evals.mjs` for all skills and verify everything passes with no "missing evals"
- [ ] 9.2 End-to-end on a fresh empty throwaway folder: `/kit:start` (including setup check) → `/kit:next`, and verify the project gets its stamp and routing block, appears in `~/.claude/kit/projects.json`, and its workflow plugins are active only there
- [ ] 9.3 Tag `v0.1.0` in the kit repo and verify `plugin.json` version matches the tag
- [ ] 9.4 After about two weeks of real use (target 2026-10-13), review the change against actual use: feedback inbox items, eval runs, registry verdicts, scoping and setup friction; record the findings in `evals/trials/usage-review-1.md` and open `/opsx:explore` for any follow-up change

> Groups formerly 9–11 (cockpit, kit feedback, harness review) moved to the change `kit-overview-feedback` on 2026-10-01; see `docs/roadmap.md`.
