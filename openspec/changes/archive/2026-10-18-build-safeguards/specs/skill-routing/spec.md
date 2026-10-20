# Spec Delta

## MODIFIED Requirements

### Requirement: Lane map derived from registry
The kit SHALL produce a lane map (each workflow phase to exactly one owning tool) from the registry's phase ownership data, among entries with status `adopted` or `trial`. For each phase it SHALL show the skill or command to use, when the registry records one. Phases without an owner SHALL be listed as unowned.

The owner SHALL be chosen as follows:
1. A tool that lists another claimant of the phase under `overlaps` defers to it, and is shown as an alternative for that phase.
2. Among the remaining claimants, an `adopted` tool wins over a `trial` tool.
3. If more than one claimant still remains, the phase SHALL be shown as a conflict naming those tools. No owner is guessed.

#### Scenario: Complete lane map
- **WHEN** the lane map is generated from a valid registry
- **THEN** every defined phase shows exactly one owner, or is marked unowned or as a conflict

#### Scenario: Deferring tool shown as alternative
- **WHEN** OpenSpec (adopted) and a trial tool both claim phase `build`, and the trial tool lists OpenSpec under `overlaps`
- **THEN** OpenSpec owns `build` with its recorded skill, and the trial tool is shown as the alternative for `build`

#### Scenario: Tie reported as conflict
- **WHEN** two adopted tools claim the same phase and neither lists the other under `overlaps`
- **THEN** the lane map shows that phase as a conflict naming both tools, with no owner

## ADDED Requirements

### Requirement: Safeguards rule in the routing block
The routing block SHALL tell the agent to follow the change's `design.md` Safeguards section during `/opsx:apply`: build in a native Claude Code worktree when the Safeguards choose one, and build with subagents only when they choose it. With no Safeguards section, the agent SHALL build as today and SHALL NOT add a worktree or subagents on its own. The routing block SHALL NOT mention a flow judge or a second flow.

#### Scenario: Worktree chosen
- **GIVEN** the change's Safeguards choose a worktree
- **WHEN** the agent starts `/opsx:apply`
- **THEN** it builds in a native worktree and says where the files are

#### Scenario: No Safeguards section
- **WHEN** the change has no Safeguards section
- **THEN** the agent builds in the current branch, with no worktree and no subagents
