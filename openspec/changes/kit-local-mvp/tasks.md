# Tasks

## 1. Housekeeping and kit scaffold

- [x] 1.1 Rewrite `openspec/config.yaml` context to the kit framing (ac-workbench, marketplace with `kit` plugin, local-only MVP) and verify `openspec instructions tasks --change kit-local-mvp --json` no longer mentions prd-pipeline as the project
- [x] 1.2 Update `docs/project-context.md` to the kit framing (goal, decided items from design D1–D12, prd-pipeline moved to "later") and verify it links to this change
- [x] 1.3 Create `.claude-plugin/marketplace.json` listing `kit` at `plugins/kit`, and `plugins/kit/.claude-plugin/plugin.json` with version `0.1.0`; verify both parse as JSON and the layout matches design D1
- [x] 1.4 Add root `package.json` (dev-only, `"type": "module"`, `yaml` dev dependency, `test` script using `node --test`) and verify `npm install` and `npm test` succeed with zero tests
- [x] 1.5 Extend `.gitignore` with `node_modules/`, `cockpit/` and eval sandboxes, and verify `git check-ignore` matches each while the PM-OS patterns still match `PM-OS-v2.1/`

## 2. Trial prerequisites and sandbox smoke test

- [ ] 2.1 Install `gh` and `jq` (winget; record the exact commands used) and verify `gh --version` and `jq --version` run in Git Bash
- [x] 2.2 Create a throwaway `kit-sandbox` repo, add this repo as a local-directory marketplace there, install `kit`, and verify a stub skill in `plugins/kit/skills/` appears as `/kit:<name>` and can run a script via `${CLAUDE_PLUGIN_ROOT}` (resolves design risk on plugin install/script paths)
- [ ] 2.3 Enable Superpowers in the sandbox only and run the smoke checks (session start time, input not frozen, skills listed); record results in `evals/trials/superpowers-smoke.md` with pass/fail per check
- [ ] 2.4 If 2.3 passes, install SuperSpec's schema and the OpenSpec custom profile with verify in the sandbox, and verify `openspec schemas` lists it; if 2.3 fails, record the WSL2/drop decision in the same file and skip setup B in group 4

## 3. Eval framework

- [x] 3.1 Define the eval case format (`evals/<skill>/cases.yaml`: id, setup, input, checks with `deterministic` kinds and `rubric` criteria) in `evals/README.md` and verify a sample case file loads with the documented fields
- [x] 3.2 Implement deterministic checks (file-exists, command-exit, git-ignored, content-match) in `tools/run-evals.mjs` with a temp sandbox per case, and verify with `node --test` unit tests for each check kind
- [x] 3.3 Implement run records (`evals/<skill>/runs/<date>-<setup>.json`: date, setup, per-case outcomes, duration, interventions, per-criterion rubric pass/fail with reason) and verify a test run writes a file matching the format
- [x] 3.4 Add the "skill without evals" check (every folder in `plugins/kit/skills/` needs `evals/<skill>/cases.yaml`) and verify the run fails naming the stub skill from 2.2 until it has a case
- [x] 3.5 Add `tools/compare-runs.mjs` that prints two runs side by side (per-case outcome, time, interventions) and verify it on two fixture runs

## 4. Toolkit registry + validator (A/B trial slice)

- [ ] 4.1 Write eval cases for the registry slice (valid entry, missing field, bad enum, status/verdict mismatch, unresolved phase conflict, resolved overlap, stale `toolkit.json`) and verify they fail before the validator exists
- [ ] 4.2 Setup A: build `toolkit.yaml` schema + `tools/validate-registry.mjs` in the sandbox with plain OpenSpec spec-driven; record time and interventions and verify an eval run file exists for setup A
- [ ] 4.3 Setup B: build the same slice from the same starting commit with SuperSpec (skip if 2.4 dropped it); verify an eval run file exists for setup B
- [ ] 4.4 Score both runs with `tools/compare-runs.mjs` plus the harness-review rubric criteria for artifact quality, and verify the comparison is saved in `evals/trials/workflow-ab.md`
- [ ] 4.5 Port the winning validator into `tools/validate-registry.mjs` here: required fields, enums with allowed values in the message, verdict history append-only, status == latest verdict, phase conflicts, `installed_version` > `reviewed_version` flagged "needs review"; verify all group-4 eval cases pass and exit code is non-zero on any error
- [ ] 4.6 Validator writes `plugins/kit/data/toolkit.json` only on success; verify a failing registry leaves the previous JSON untouched
- [ ] 4.7 Seed `toolkit.yaml` with the proposal's candidate tools (OpenSpec, Superpowers, SuperSpec, Playwright CLI, Context7, lint/secret-scan hooks), the phase list, the `situations` guide, and verdicts from group 4 citing the eval run as evidence; verify validation passes
- [ ] 4.8 Document the registry fields and the edit → validate step in `docs/registry.md` and verify the documented command runs as written

## 5. Lane map

- [ ] 5.1 Implement `plugins/kit/scripts/lanes.mjs` (zero-dependency): lane map from `toolkit.json`, unowned phases listed, overlaps and skip_skills; verify `node --test` cases for complete map, unowned phase and resolved overlap
- [ ] 5.2 Render the lane map as a CLAUDE.md routing block between `<!-- kit:routing:start -->` / `<!-- kit:routing:end -->` (use / don't-use per phase) and verify the output matches a golden file
- [ ] 5.3 Print the lane map and "needs review" flags from the validator and verify both appear in its output for a fixture with an updated tool

## 6. Project starter

- [ ] 6.1 Implement `plugins/kit/scripts/prereqs.mjs` resolving git, openspec, npm via PATH, `%APPDATA%\npm` and `npm prefix -g`; verify tests for "on PATH", "only in npm prefix" and "missing → install hint"
- [ ] 6.2 Add templates (`CLAUDE.md` with routing block, `project-context.md`, `.gitignore` kit block with licensed-folder patterns) in `plugins/kit/templates/` and verify the `.gitignore` block ignores `PM-OS-v2.1/` in a temp repo
- [ ] 6.3 Implement `start-plan.mjs` (create / same / differs + diff per file, marker-block replace or append, damaged block = conflict, project-type entries filtered to adopted/trial) and verify tests for empty folder, edited CLAUDE.md, dropped tool excluded and damaged marker
- [ ] 6.4 Implement `start-apply.mjs` (write confirmed items only, `git init`, `openspec init` with config pointing to the context doc, stamp `.claude/kit.json`, add to `~/.claude/kit/projects.json`) and verify it never deletes files and a second plan is all `same`
- [ ] 6.5 Write `skills/start/SKILL.md` (prereqs → ask type → plan → show diffs → confirm → apply → summary) and verify its eval cases (empty folder, idempotent re-run, missing git stops before writes) pass in a sandbox
- [ ] 6.6 Re-run `/kit:start` on Toughbubble in re-run mode and verify it only shows diffs and changes nothing without confirmation

## 7. Next-step skill

- [ ] 7.1 Implement `plugins/kit/scripts/next.mjs` mapping `openspec status --json` states to phases (design D6) and owners from the lane map; verify tests for no active change, planning incomplete (names next artifact), tasks ready, all tasks done
- [ ] 7.2 Write `skills/next/SKILL.md` and its eval cases and verify `/kit:next` in the sandbox gives a suggestion with owner and one-line reason

## 8. Cockpit v0

- [ ] 8.1 Implement `tools/build-cockpit.mjs` (validate first, then read `toolkit.json`, `projects.json`, stamps) writing one self-contained `cockpit/index.html`; verify an invalid registry exits non-zero with errors and writes no file
- [ ] 8.2 Render projects (name, path, links, kit version, "behind" and "not bootstrapped" states) and verify with fixtures for 0.3.0 vs 0.5.0 and a missing stamp
- [ ] 8.3 Render toolkit table with client-side status/tier filters, lane map and situations guide; verify filtering by `adopted` shows only adopted rows and changing a phase owner in the registry changes the rebuilt page
- [ ] 8.4 Verify offline: build and open with network disabled and confirm the page has no external URLs (`grep` for `http` in resources); document the build command in `docs/cockpit.md`

## 9. Kit feedback

- [ ] 9.1 Implement the draft + scrub step (description, project, path, kit version, component, file paths, session summary; strip secret-like patterns and env values) and verify tests for a draft containing an API key and file contents
- [ ] 9.2 Implement filing via `gh issue create --label feedback` on the kit repo slug from plugin data, with fallback to `~/.claude/kit/feedback-pending/<timestamp>.md` and a `--flush` mode; verify the fallback when `gh` is absent from PATH
- [ ] 9.3 Write `skills/feedback/SKILL.md` (draft → show → confirm → file) and its eval cases, and verify a filed issue link is shown once the kit repo has a GitHub remote, and that no file in the kit repo or project changes

## 10. Harness review

- [ ] 10.1 Write `skills/harness-review/checklist.md` (8 layers with questions, memory types, scorecard template with OK/PARTIAL/GAP and max 3 fixes with reasons), adapting PM-OS reviewer logic in our own words only; verify no PM-OS text is copied
- [ ] 10.2 Write `skills/harness-review/SKILL.md` (ASCII diagram first, read-only tools, overlap check via `lanes.mjs` under the loops layer) and verify it on a fixture project with a procedure stored in memory and two tools owning `plan`
- [ ] 10.3 Add rubric eval cases (diagram first, 8 sections, ≤3 fixes with reasons, memory misplacement flagged, overlap flagged, no files changed) and verify a scored run file exists

## 11. Integration

- [ ] 11.1 Run `npm test` and `node tools/run-evals.mjs` for all skills and verify everything passes with no "missing evals"
- [ ] 11.2 End-to-end on a fresh empty folder: `/kit:start` → `/kit:next` → `/kit:feedback` → rebuild cockpit, and verify the new project appears in the cockpit with the current kit version
- [ ] 11.3 Tag `v0.1.0` in the kit repo and verify `plugin.json` version matches the tag and the cockpit shows no project as behind
