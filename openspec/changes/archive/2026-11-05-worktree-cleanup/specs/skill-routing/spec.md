## MODIFIED Requirements

### Requirement: Safeguards rule in the routing block
The routing block SHALL tell the agent to follow the change's `design.md` Safeguards section during `/opsx:apply`: build in a native Claude Code worktree when the Safeguards choose one, and build with subagents only when they choose it. With no Safeguards section, the agent SHALL build as today and SHALL NOT add a worktree or subagents on its own. The routing block SHALL NOT mention a flow judge or a second flow.

After a successful merge back from a worktree, the routing block SHALL tell the agent to offer, once, to remove the worktree and delete its branch, and to do it only on a yes. The removal SHALL never force: when git refuses (uncommitted or untracked files, or a branch that isn't merged), the agent SHALL list what's left and remove nothing. On a no, both SHALL stay.

#### Scenario: Worktree chosen
- **GIVEN** the change's Safeguards choose a worktree
- **WHEN** the agent starts `/opsx:apply`
- **THEN** it builds in a native worktree and says where the files are

#### Scenario: No Safeguards section
- **WHEN** the change has no Safeguards section
- **THEN** the agent builds in the current branch, with no worktree and no subagents

#### Scenario: Clean-up offered after the merge back
- **GIVEN** change `acme-part-a` was built in `.claude/worktrees/acme-part-a` on branch `wt/acme-part-a`
- **WHEN** the merge back succeeds
- **THEN** the agent asks whether to remove the worktree and its branch, and removes them only on a yes, without `--force` or `-D`

#### Scenario: Clean-up refused by git
- **GIVEN** the worktree still has an untracked note
- **WHEN** the user says yes to the clean-up
- **THEN** git refuses, the agent names the file, and nothing is removed

## ADDED Requirements

### Requirement: Leftover worktree reminder
When a worktree under `.claude/worktrees/<name>` still exists and change `<name>` is archived, the next-step skill SHALL add one reminder line with the commands to remove the worktree and its branch, alongside any suggestion. It SHALL show the line once per worktree, and SHALL never make it the next step.

#### Scenario: Worktree left after archive
- **GIVEN** change `acme-part-a` is archived and `.claude/worktrees/acme-part-a` still exists
- **WHEN** the user runs `/kit:next`
- **THEN** the output has a line naming the worktree, with `git worktree remove .claude/worktrees/acme-part-a` and `git branch -d wt/acme-part-a`

#### Scenario: Reminder shown once
- **GIVEN** the reminder for `.claude/worktrees/acme-part-a` was shown before
- **WHEN** the user runs `/kit:next` again
- **THEN** there is no reminder line for it

#### Scenario: Worktree of an active change
- **GIVEN** change `acme-part-b` is active and `.claude/worktrees/acme-part-b` exists
- **WHEN** the user runs `/kit:next`
- **THEN** there is no reminder line for it
