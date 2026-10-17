# Runs: explore-stage

## 4.3 Full run (2026-10-17, kit 0.15.0)

- `npm test`: 493 tests, 493 pass, 0 fail (502 after the verify fixes)
- `npm run evals`: 0 fail in every skill (explore-record 3, next 11, prd 8 + 3 pending rubric, status 4)
- `npm run smoke`: passed, 52 steps (win32, OpenSpec 1.13.2), incl. explore save -> next says /kit:prd
- This repo, the no-change path on the real roadmap (`outsideChange` with `reportRoadmap`): "Next on the roadmap: M12a T4 /kit:next offers explore or PRD for a new note (Kit workflow). Start with /opsx:explore." (The live `/kit:next` shows the build step of this change while it's active.)

## Changed during apply

- Design D5 replaced: the routing block can't run a plugin script (`${CLAUDE_PLUGIN_ROOT}` isn't expanded in a project's CLAUDE.md), so a save-only skill `/kit:explore-record`; the save is automatic by default (user, 2026-10-17), with `undo` right after.
- New D8: UserPromptSubmit reminder hook (checked against the hooks reference, 2026-10-17).
