# Runs: ui-flow-with-impeccable

## 4.3 Full run (2026-10-18)

- **Built in a worktree** for the first time, as this change's Safeguards chose: `.claude/worktrees/ui-flow-with-impeccable` on branch `wt/ui-flow-with-impeccable`, created from `m12-next` with `git worktree add` and entered with `EnterWorktree` (the routing rule, design D3 of build-safeguards).
  - Friction: Claude Code's worktree isolation refuses commands it can't prove stay inside the worktree (a computed `$APPDATA` path for OpenSpec, a shell variable before `sed`). Plain commands with literal paths work.
  - This repo's own `.gitignore` doesn't list `.claude/worktrees/` (only the kit's template does, for projects set up by `/kit:start`); the worktree folder showed no untracked files in the main checkout here, but adding the line is worth it.
  - `ready.mjs web-ui` says "not web-ui" in the worktree: Impeccable is gitignored and reinstalled per clone, so a fresh checkout doesn't have `.claude/skills/impeccable`. The main checkout would say web-ui.
- **Safeguards** (recorded at `/kit:ready`): reach medium, undo low, safety low; chosen: scenario-to-test check, worktree, review against the spec. No `ui-review` (the plan names no UI files).
- **Full run:** `npm test` 542 pass, 0 fail; `npm run evals` 117 pass, 0 fail, 36 pending (rubric cases, not scored); `npm run smoke` passed, 55 steps (Windows, OpenSpec 1.13.2).
- **Not run here:** `/impeccable critique` and `audit` themselves (no UI change in this repo to review); the first real run is on Acme (M12).
