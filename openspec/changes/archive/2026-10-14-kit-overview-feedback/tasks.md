# Tasks

## 1. Cockpit v0

- [ ] 1.1 Implement `tools/build-cockpit.mjs` (validate first, then read `toolkit.json`, `projects.json`, stamps) writing one self-contained `cockpit/index.html`; verify an invalid registry exits non-zero with errors and writes no file
- [ ] 1.2 Render projects (name, path, links, kit version, "behind" and "not bootstrapped" states) and verify with fixtures for 0.3.0 vs 0.5.0 and a missing stamp
- [ ] 1.3 Render toolkit table with client-side status/tier filters, lane map and situations guide; verify filtering by `adopted` shows only adopted rows and changing a phase owner in the registry changes the rebuilt page
- [ ] 1.4 Verify offline: build and open with network disabled and confirm the page has no external URLs (`grep` for `http` in resources); document the build command in `docs/cockpit.md`

## 2. Kit feedback

- [ ] 2.1 Create the private inbox repo `CKamarakis/ac-workbench-inbox` with a `feedback` label, store its slug in plugin data, and verify `gh repo view --json visibility` reports `PRIVATE`
- [ ] 2.2 Implement the draft + scrub step (description, project, path, kit version, component, file paths, session summary; strip secret-like patterns and env values) and verify tests for a draft containing an API key and file contents
- [ ] 2.3 Implement filing via `gh issue create --label feedback` on the inbox slug after a visibility check (refuse if not private), with fallback to `~/.claude/kit/feedback-pending/<timestamp>.md` and a `--flush` mode; verify the fallback when `gh` is absent and when the inbox reports `PUBLIC`
- [ ] 2.4 Write `skills/feedback/SKILL.md` (draft → show → confirm → file) and its eval cases, and verify a filed issue link to the inbox repo is shown and that no file in the kit repo or project changes

## 3. Harness review

- [ ] 3.1 Write `skills/harness-review/checklist.md` (8 layers with questions, memory types, scorecard template with OK/PARTIAL/GAP and max 3 fixes with reasons), adapting PM-OS reviewer logic in our own words only; verify no PM-OS text is copied (the kit repo is public)
- [ ] 3.2 Write `skills/harness-review/SKILL.md` (ASCII diagram first, read-only tools, overlap check via `lanes.mjs` under the loops layer) and verify it on a fixture project with a procedure stored in memory and two tools owning `plan`
- [ ] 3.3 Add rubric eval cases (diagram first, 8 sections, ≤3 fixes with reasons, memory misplacement flagged, overlap flagged, no files changed) and verify a scored run file exists

## 4. Integration

- [ ] 4.1 Run `npm test` and `node tools/run-evals.mjs` and verify cockpit, feedback and harness-review evals pass with no "missing evals"
- [ ] 4.2 Rebuild the cockpit after `/kit:feedback` was used in a throwaway project and verify the project appears with its kit version and the feedback reached the private inbox
