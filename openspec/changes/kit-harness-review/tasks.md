# Tasks

## 1. Setup

- [ ] 1.1 Close the M5 change: `openspec archive kit-overview-feedback --skip-specs -y` (design D7). Verify `openspec list` no longer shows it and `openspec/specs/` has no `cockpit`, `kit-feedback` or `harness-review` spec from it
- [ ] 1.2 Bump the kit to `0.10.0` in `plugins/kit/.claude-plugin/plugin.json`. Verify with `node plugins/kit/scripts/ping.mjs`

## 2. Routing

- [ ] 2.1 `toolkit.yaml` (design D6): add phase `assess` (kit owns it, `/kit:harness-review`); route `kit-issues` to the GitHub issues page; update the situations entry and the `kit` entry's reason; run `npm run registry`. Verify with `tests/kit/lanes.test.mjs`: the lane map lists `assess` with `/kit:harness-review`, and the routing block contains no `/kit:feedback`
- [ ] 2.2 Remove `/kit:feedback` from the next and setup skills. Verify `grep -r "kit:feedback" plugins README.md` finds nothing and `npm run evals` for `next` and `setup` pass

## 3. Scan script

- [ ] 3.1 `plugins/kit/scripts/harness.mjs scan --dir . [--home <dir>] [--json]` (design D1, D2; spec "Setup scan"): instruction files, rules, skills, subagents, commands (project and user), hooks per event, permissions, MCP servers, enabled plugins, kit present, auto-memory files with type, size and shape signals, the memory folder found per design D2a (settings override, config dir, project-dir name, git root); unreadable files reported. Verify with `tests/kit/harness.test.mjs` on fixture projects in the test area: plain project without the kit; kit project; broken `settings.json`; a memory file with numbered steps; no memory folder; `autoMemoryDirectory` set; a subfolder of a git repo uses the root's memory folder; an enabled plugin's hooks and skills listed from a fake `installed_plugins.json`, and "not inspected" when its folder is missing; an almost empty project
- [ ] 3.2 Kit checks (design D4, spec "Kit checks only with the kit"): `laneMap` conflicts and routing-block status in the scan output when `.claude/kit.json` exists, absent otherwise. Verify with the same test file: overlap fixture reported; no kit fields without the kit
- [ ] 3.3 Read-only check: run the scan on a fixture and compare the file tree and modified times before and after. Verify in the test

## 4. Skill and checklist

- [ ] 4.1 `skills/harness-review/checklist.md` (design D3): the 8 layers, 3-5 questions each, what OK / PARTIAL / GAP means, the built-in to point to. Verify by reading it against the spec's layer requirements
- [ ] 4.2 `skills/harness-review/SKILL.md`: scan, map first, rate with the checklist, built-in pointers, kit checks only with the kit, scorecard and top 3 fixes, read-only, save as a note on a yes with user-level items as counts only; the short report for an almost empty setup (design D5). Verify the install check in `npm test` passes (frontmatter, name matches folder)
- [ ] 4.3 Evals `evals/harness-review/cases.yaml`: script cases (scan output on fixtures, nothing written) and rubric cases (map first, 8 layers, at most 3 fixes with reasons, no kit mention without the kit, built-ins pointed to). Verify `npm run evals` for `harness-review` passes its script cases

## 5. Trials

- [ ] 5.1 Run `/kit:harness-review` on this repo. Record the report, time and tokens in `evals/trials/kit-harness-review.md`; check nothing changed (`git status`)
- [ ] 5.2 Run it on the Toughbubble copy (`../temp/Toughbubble`). Record the report and check nothing changed in the copy
- [ ] 5.3 The user judges both reports (exit criterion: findings useful). Record the verdict and any changes asked for

## 6. Wrap-up

- [ ] 6.1 Full run: `npm test`, `npm run registry:check`, `npm run evals`, `npm run smoke`, `npm run smoke:check`. Record results in `evals/trials/kit-harness-review.md`
- [ ] 6.2 README: one short section on `/kit:harness-review` (what it does, that it works without the rest of the kit, that it changes nothing). Roadmap: M11 row and "Current position" updated, in the same commit as the change's last tasks
