## MODIFIED Requirements

### Requirement: Next-step suggestion
The next-step skill SHALL inspect the project's current state (active OpenSpec change and its artifact and task status) and SHALL suggest the next step with the owning skill from the lane map, with a one-line reason. When the active change has open decisions in its decision record, the suggestion SHALL add how many are open and the date of the oldest. When a PRD in `Draft` or `Review` has items under Open questions, the suggestion SHALL add a one-line reminder naming the PRD and the count. Both are reminders, never the next step itself.

#### Scenario: Planning incomplete
- **WHEN** the active change has a proposal but no specs
- **THEN** the suggestion is to continue the change with the artifact workflow, naming the next artifact

#### Scenario: Ready check before the build
- **GIVEN** planning is complete, no task is checked, and the change has no readiness check recorded
- **WHEN** the user asks what's next
- **THEN** the suggestion is the `ready` phase owner (`/kit:ready`), with the build phase owner named as the step after it

#### Scenario: Tasks ready
- **WHEN** planning is complete, a readiness check is recorded or a task is already checked, and tasks are unchecked
- **THEN** the suggestion is the build phase owner (e.g. apply with the TDD skill)

#### Scenario: Open decisions shown
- **GIVEN** the active change has one decision marked `later` on 2026-10-12
- **WHEN** the user asks what's next
- **THEN** the suggestion adds "1 decision still open since 2026-10-12"

#### Scenario: PRD questions put off for later
- **GIVEN** the Draft PRD `sidebar` has 4 open questions
- **WHEN** the user asks what's next
- **THEN** the suggestion is unchanged, and it adds "PRD "sidebar" has 4 open question(s) to answer before Ready"

#### Scenario: No active change
- **WHEN** the project has no active change
- **THEN** the suggestion is the brainstorm phase owner (e.g. `/opsx:explore`)

## ADDED Requirements

### Requirement: Ready phase in the lane map
The registry SHALL define a `ready` phase between `plan` and `build`. The kit SHALL own it, with the skill `/kit:ready`, by the same owner rules as every other phase. The routing rules SHALL say to run `/kit:ready` after planning is complete and before `/opsx:apply`, and that it warns and never blocks.

#### Scenario: Lane map shows the ready phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `ready` after `plan` and before `build`, owned by the kit with `/kit:ready`

### Requirement: Given/When/Then rule in the routing block
The routing rules SHALL tell the proposal step to write spec scenarios from the PRD's Given/When/Then stories when the PRD has them, and to add a `- **GIVEN**` line to a scenario whenever the behavior depends on a starting state.

#### Scenario: Story carried into a scenario
- **GIVEN** a Ready PRD with the story "Given a board with 1,000 stickies, when I zoom out, then panning stays smooth"
- **WHEN** the proposal step writes the specs
- **THEN** a scenario has GIVEN, WHEN and THEN lines that match the story
