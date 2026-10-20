# Spec Delta

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
- **WHEN** the project has no active change, none of the PRD rules apply, no open explore record and no roadmap
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

### Requirement: Next-step suggestion uses PRD status
Before falling back to the OpenSpec-based suggestion, the next-step skill SHALL check the project's PRDs and SHALL suggest, with a one-line reason:
- the `artifacts` phase owner (e.g. `/opsx:propose`), naming the PRD, when a PRD is `Ready`, no change uses it, and no change is active;
- reviewing the plan, when a `Building` PRD's file changed after the commit its change recorded;
- marking the PRD `Shipped`, when the change named in a `Building` PRD is archived.

While a change is active, a `Ready` PRD without a change SHALL NOT replace the suggestion for the active change; the suggestion SHALL carry one line saying the PRD is waiting until the active change is done.

When none of these apply, the existing OpenSpec-based suggestion SHALL be unchanged. Notes alone SHALL NOT lead to any suggestion: a note is input that an explore reads, not a step. Invalid PRDs SHALL be reported, not guessed.

#### Scenario: Ready PRD without a change
- **WHEN** `prds/gift-cards.md` is `Ready`, no change names it, and no change is active
- **THEN** the suggestion is `/opsx:propose`, naming `gift-cards`

#### Scenario: Ready PRD waits for the active change
- **GIVEN** an active change `acme-canvas` with open tasks
- **AND** `prds/gift-cards.md` is `Ready` and no change names it
- **WHEN** the user runs `/kit:next`
- **THEN** the suggestion is `/opsx:apply` for `acme-canvas`, with the line "PRD gift-cards is Ready; it waits until acme-canvas is done"

#### Scenario: PRD changed since planning
- **WHEN** a `Building` PRD has commits after the commit its change recorded
- **THEN** the suggestion says the PRD changed since planning and names the change to review

#### Scenario: Archived change
- **WHEN** the change named in a `Building` PRD is archived
- **THEN** the suggestion is to mark that PRD `Shipped`, and nothing is written

#### Scenario: Notes but no PRD
- **WHEN** the project has notes, no PRDs, no explore record and no active change
- **THEN** the suggestion is not `/kit:prd` and says nothing about the notes; it is the step outside a flow (the roadmap's next step, or "Nothing open")

#### Scenario: No knowledge folder
- **WHEN** the project has no knowledge folder
- **THEN** the suggestion is the same as before this change

## ADDED Requirements

### Requirement: Explore rule in the routing block
The routing rules SHALL tell the agent that a flow starts at `/opsx:explore`, that notes are input it reads and never a step of their own, and that at the end of an explore it SHALL save or update the explore record through `/kit:explore-record` by default and show what it wrote.

#### Scenario: Rule present after a re-sync
- **WHEN** a kit project's routing block is written or re-synced
- **THEN** it contains the explore rule naming the explore record
