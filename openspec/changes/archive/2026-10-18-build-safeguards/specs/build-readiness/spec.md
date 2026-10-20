# Spec Delta

## ADDED Requirements

### Requirement: Safeguards picked per change
The readiness check SHALL rate the change on three dimensions, each low, medium or high, with the reason for each rating:
- **reach**: what depends on what the change touches. Low: one spec, and no file that other files import changes. Medium: two or more specs, or a shared module changes. High: a contract others rely on changes (command flags or output, file formats, skill names, hook behaviour).
- **undo**: whether reverting the commits undoes the change fully. Low: it does. High: the change writes outside the repository (data, state, installed configuration, deleted user files, migrations).
- **safety**: low, unless the change touches secrets, permissions, blocking hooks, user data or network writes, which is high.

The ratings SHALL come from `design.md` and `tasks.md`; the check SHALL read the files they name only when the plan doesn't say. A word in the text (for example "payments" or "session") SHALL NOT change a rating on its own. The cut-offs are defaults, to be calibrated on real changes.

From the ratings it SHALL recommend safeguards:
- all low: the current flow (build in the branch, verify as today, plus the scenario-to-test check);
- any medium: also a worktree for the build, and a review against the spec at verify;
- any high: also edge-case probes, medium-severity security findings blocking, and the user's OK before merge.

Building with subagents SHALL be recommended only when the tasks are independent of each other and too long for one context, with that reason stated. The user SHALL be able to accept the recommendation or change any part of it. The choice and the ratings with their reasons SHALL be written into a `## Safeguards` section of `design.md`; when the change has no `design.md` yet, the check SHALL say to write the design first and SHALL NOT create one.

#### Scenario: Low-risk change
- **GIVEN** the design changes one skill's text and its one spec, and no shared module
- **WHEN** the readiness check runs
- **THEN** reach, undo and safety are low, each with its reason, and the recommendation is the current flow plus the scenario-to-test check

#### Scenario: Shared module
- **GIVEN** the tasks change a module that three other scripts import
- **WHEN** the readiness check runs
- **THEN** reach is medium with that reason, and the recommendation adds a worktree and the review against the spec

#### Scenario: Keyword alone
- **GIVEN** the proposal mentions "session start" but nothing touches sessions or permissions
- **WHEN** the readiness check runs
- **THEN** safety stays low

#### Scenario: User changes the recommendation
- **GIVEN** the recommendation includes a worktree
- **WHEN** I choose to build in the branch instead
- **THEN** `design.md`'s Safeguards section records the ratings, the recommendation and my choice

#### Scenario: No design yet
- **GIVEN** the change has no `design.md`
- **WHEN** the safeguards are recorded
- **THEN** I'm told to write the design first, and no `design.md` is created

#### Scenario: Plan doesn't say
- **GIVEN** the design names a module but not who uses it
- **WHEN** the readiness check rates reach
- **THEN** it reads which files import that module, and the reason says so
