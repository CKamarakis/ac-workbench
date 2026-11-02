# Proposal

Milestone: M17

## Why

After a worktree build is merged back (and the change archived), the worktree `.claude/worktrees/<change>` and its branch `wt/<change>` stay behind. The user has to remove them by hand and doesn't know whether keeping them matters. The kit already offers the merge back; it should also offer the clean-up.

## What Changes

- The routing block's `/opsx:apply` rule: right after a successful merge back from a worktree, offer to remove the worktree and delete its branch, on a yes. The removal never forces: `git worktree remove` refuses a worktree with uncommitted or untracked files (they are listed to the user instead), and `git branch -d` refuses a branch that isn't merged.
- On a No, both stay (more work may continue there). `/kit:next` reminds once, after the change is archived, that the worktree is still there and how to remove it.
- Projects pick up the new routing line on their next `/kit:start` re-sync.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `skill-routing`: the Safeguards rule gains the clean-up offer; the next-step skill gains a one-time reminder for a leftover worktree of an archived change.

## Impact

- `plugins/kit/scripts/lanes.mjs` (routing line), `plugins/kit/scripts/next.mjs` (reminder line).
- Tests: `tests/kit/lanes.test.mjs`, `tests/kit/next.test.mjs`.
- CHANGELOG, kit version.
