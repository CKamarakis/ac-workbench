# Spec Delta

## MODIFIED Requirements

### Requirement: Next-step suggestion
The next-step skill SHALL inspect the project's current state (active OpenSpec change and its artifact and task status) and SHALL suggest the next step with the owning skill from the lane map, with a one-line reason. When the active change has open decisions in its decision record, the suggestion SHALL add how many are open and the date of the oldest. When a PRD in `Draft` or `Review` has items under Open questions, the suggestion SHALL add a one-line reminder naming the PRD and the count. Both are reminders, never the next step itself.

The next-step skill works inside one item; choosing the item belongs to the status skill. When nothing is under way (no active change and none of the PRD rules apply), the suggestion SHALL be the `status` phase owner. When several changes are active and none is named, the suggestion SHALL list them and the skill SHALL ask the user which one; when a change is named (`--change <name>`), the suggestion SHALL be that change's step.

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
- **WHEN** the project has no active change and none of the PRD rules apply
- **THEN** the suggestion is the `status` phase owner (`/kit:status`), saying nothing is in progress and to pick the next item there

#### Scenario: Nothing open, items left for later
- **GIVEN** no active change, no PRD in a flow, no new notes, 2 decisions left for later in archived changes and 1 PRD question put off for later
- **WHEN** the user runs `/kit:next`
- **THEN** it shows "Nothing open", the count "3 items left for later (2 from builds, 1 PRD question)", and the lines "run `/kit:status` to see what's next" and "`/kit:roadmap` to change the order"
- **AND** it runs no other skill or command by itself

#### Scenario: Ready PRD before status
- **GIVEN** no active change and the PRD `gift-cards` is `Ready` with no change
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/opsx:propose` naming `gift-cards`, not `/kit:status`

#### Scenario: Several active changes
- **GIVEN** active changes `notes-search` and `task-board`
- **WHEN** the user runs `/kit:next` without naming a change
- **THEN** the suggestion lists both and the skill asks which one
- **AND** after the user picks `task-board`, the suggestion is `task-board`'s step

#### Scenario: Named change not active
- **GIVEN** active changes `notes-search` and `task-board`
- **WHEN** the user runs `/kit:next --change nope`
- **THEN** it says no active change is named "nope" and lists both to choose from

#### Scenario: One active change
- **GIVEN** one active change with open tasks
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is the same as before this change, with no question asked

## ADDED Requirements

### Requirement: Status phase in the lane map
The registry SHALL define a `status` phase, owned by the kit with the skill `/kit:status`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the status phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `status`, owned by the kit with `/kit:status`
