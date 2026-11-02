# Design

## Context

The routing block (`lanes.mjs`) tells the agent, at `/opsx:apply` with a worktree chosen, to create `.claude/worktrees/<change>` on branch `wt/<change>` and, after `/kit:verify`, to offer a fast-forward merge back. Nothing mentions the worktree after that, so it and its branch stay until the user removes them by hand.

## Goals / Non-Goals

**Goals:**
- One offer to clean up, at the moment the work is safe (right after the merge back).
- No way to lose work through the clean-up.

**Non-Goals:**
- Removing worktrees the kit didn't create (anything outside `.claude/worktrees/`).
- Repeating the reminder: it shows once per worktree.

## Decisions

### D1 Offer right after the merge back
The merge back is the point where the worktree has nothing left that the branch doesn't hold. `/opsx:archive` runs from the main folder, so the worktree isn't needed for it. Offering at archive instead would leave the agent sitting in a worktree that's about to go.

### D2 Never force
`ExitWorktree` first (the session leaves the folder), then `git worktree remove .claude/worktrees/<change>` and `git branch -d wt/<change>`, never `--force` or `-D`. Git refuses a worktree with uncommitted or untracked files and a branch that isn't merged; the agent then lists what's left and removes nothing. A note captured inside the worktree (untracked) is therefore never lost by this step.

### D3 One reminder in `/kit:next`, remembered in the git folder
When a worktree under `.claude/worktrees/<name>` is still there and change `<name>` is archived, `/kit:next` adds one line with the two commands. The names already shown are kept in `<git common dir>/kit-worktree-reminders` (inside `.git`: never committed, shared by every worktree), so the line shows once. Git being unavailable means no line, never an error.

## Risks / Trade-offs

- [The reminder is missed the one time it shows] → the routing offer at the merge is the main path; the reminder is a fallback.

## Safeguards

Written by `/kit:ready` (`ready.mjs safeguards`) on 2026-10-31. Re-run the readiness check to change it.

| Dimension | Rating | Why |
|---|---|---|
| Reach | low | one routing line and one reminder line; no flag, output contract or file format others rely on changes |
| Undo | low | reverting the commits undoes it; the reminders file lives inside .git |
| Safety | low | the clean-up runs only on a yes and never forces, so no work can be lost |

- **Recommended:** scenario-to-test check
- **Chosen:** scenario-to-test check

<!-- kit-safeguards-data {"date":"2026-10-31","ratings":{"reach":{"level":"low","why":"one routing line and one reminder line; no flag, output contract or file format others rely on changes"},"undo":{"level":"low","why":"reverting the commits undoes it; the reminders file lives inside .git"},"safety":{"level":"low","why":"the clean-up runs only on a yes and never forces, so no work can be lost"}},"recommended":["scenario-check"],"chosen":["scenario-check"]} -->
