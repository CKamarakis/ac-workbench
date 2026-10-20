## ADDED Requirements

### Requirement: First step on a new project
When nothing is open and the project has no notes, PRDs, explore records or changes (active or archived), the next-step skill SHALL suggest the capture lane's owner (`/kit:capture`) for ideas and notes, and name the brainstorm lane's owner (`/opsx:explore`) for an idea the user already has, instead of "Nothing open", keeping the count of items left for later.

#### Scenario: Empty project after setup
- **GIVEN** a project set up by the kit with no notes, PRDs, explore records or changes
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/kit:capture`, and the reason also names `/opsx:explore` for an idea they already have

#### Scenario: Project with history
- **GIVEN** a project with archived changes and nothing open
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is "Nothing open" as before

## MODIFIED Requirements

### Requirement: Next-step suggestion
The next-step skill SHALL inspect the project's current state (active OpenSpec change and its artifact and task status) and SHALL suggest the next step with the owning skill from the lane map, with a one-line reason. When the active change has open decisions in its decision record, the suggestion SHALL add how many are open and the date of the oldest. When a PRD in `Draft` or `Review` has items under Open questions, the suggestion SHALL add a one-line reminder naming the PRD and the count. Both are reminders, never the next step itself.

The next-step skill works inside one item; choosing the item belongs to the status skill. After the change and PRD rules, the suggestion SHALL follow the explore stage: an explore record `ready-for-prd` -> the `prd` phase owner, naming the record; an explore record `exploring` -> the `brainstorm` phase owner (`/opsx:explore`), naming its open questions; with several open records and none named, the suggestion SHALL list them and the skill SHALL ask which one (`--explore <slug>`). When nothing is under way (no active change, none of the PRD rules apply, no open explore record) and the project has a roadmap, the suggestion SHALL name the current milestone's next open task and suggest starting with `/opsx:explore`; when every task of the current milestone is ticked, it SHALL say the milestone is done, name the next milestone, and point to `/kit:roadmap` to mark it done. It SHALL NOT write the roadmap. With no roadmap, the suggestion SHALL be the `status` phase owner. When several changes are active and none is named, the suggestion SHALL list them and the skill SHALL ask the user which one; when a change is named (`--change <name>`), the suggestion SHALL be that change's step. Open loose ends (except `accepted` ones) SHALL be included in the "Nothing open" count. When a loose end blocks the change the suggestion is for, the suggestion SHALL add it as a one-line reminder, never as the next step.

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
- **WHEN** the project has no active change, none of the PRD rules apply, no open explore record and no roadmap, and it isn't a new project (it has notes, PRDs or changes, or no knowledge folder)
- **THEN** the suggestion is the `status` phase owner (`/kit:status`), saying nothing is in progress and to pick the next item there

#### Scenario: Nothing open, items left for later
- **GIVEN** no active change, no PRD in a flow, no open explore record, no roadmap, 2 decisions left for later in archived changes and 1 PRD question put off for later
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

#### Scenario: Loose ends in the Nothing open count
- **GIVEN** no active change, no PRD in a flow, no open explore record, no roadmap, and 4 open loose ends of which 1 is `accepted`
- **WHEN** the user runs `/kit:next`
- **THEN** the message counts 3 loose ends among the items left for later

#### Scenario: Loose end blocking the change
- **GIVEN** the active change `tables-in-notes` with open tasks, and the open loose end `L3` "Check paste from Word" blocking `tables-in-notes`
- **WHEN** the user runs `/kit:next`
- **THEN** the step is unchanged, and a reminder line names `L3` as blocking this change

#### Scenario: Explore with open questions
- **GIVEN** no active change, no PRD in a flow, and the explore record `kit-status` with open questions Q1 "one command or two" and Q2 "status vs roadmap report"
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/opsx:explore`, naming the record and both questions

#### Scenario: Explore ready for a PRD
- **GIVEN** no active change, no PRD in a flow, and the explore record `kit-status` with no open question and no PRD
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/kit:prd`, naming the record

#### Scenario: Next task on the roadmap
- **GIVEN** nothing in a flow, and the roadmap's current milestone M12a active with T4 "/kit:next offers explore or PRD" open
- **WHEN** the user runs `/kit:next`
- **THEN** it names M12a T4 and suggests starting with `/opsx:explore`

#### Scenario: Milestone done, next milestone
- **GIVEN** nothing in a flow, every task of the active milestone M12a ticked, and M12 "Acme proof" next in the order
- **WHEN** the user runs `/kit:next`
- **THEN** it says M12a is done, names M12, and points to `/kit:roadmap` to mark M12a done
- **AND** the roadmap files are unchanged
