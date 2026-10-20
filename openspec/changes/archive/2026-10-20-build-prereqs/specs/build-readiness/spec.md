## ADDED Requirements

### Requirement: Worktree needs a committed plan
When the chosen safeguards include a worktree and the change's planning files have uncommitted changes, the readiness close SHALL say that a worktree starts from the last commit and won't see them. It SHALL offer to commit the planning files, and commit only on a yes. With everything committed, or without a worktree, it SHALL say nothing about it.

#### Scenario: Worktree with an uncommitted plan
- **GIVEN** the safeguards include a worktree
- **WHEN** `openspec/changes/<name>/` has uncommitted files at the close
- **THEN** the close says the worktree won't see them and offers to commit them

#### Scenario: Plan committed
- **WHEN** the safeguards include a worktree and the change folder has no uncommitted files
- **THEN** the close says nothing about committing
