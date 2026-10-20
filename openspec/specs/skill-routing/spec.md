# skill-routing Specification

## Purpose
Makes it predictable which tool or skill handles each phase of work, so overlapping tools don't compete, and tells the user what to do next without memorising hundreds of skills.

## Requirements

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

### Requirement: Projects receive routing rules
When a project is bootstrapped or re-synced, the kit SHALL write routing rules derived from the lane map into the project's agent instructions. The rules state which skill to use for each phase and which overlapping skills not to use. User-written instructions SHALL be preserved.

#### Scenario: Routing rules present
- **WHEN** a project is bootstrapped
- **THEN** its agent instructions contain a routing section matching the current lane map

#### Scenario: User edits preserved
- **WHEN** routing rules are re-synced in a project whose instructions contain user-written sections
- **THEN** only the routing section changes

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

### Requirement: Tool updates trigger lane review
When a registry entry's installed version is newer than its reviewed version, the kit SHALL flag the entry for review. Owners and verdicts SHALL NOT change automatically.

#### Scenario: Updated tool flagged
- **WHEN** Superpowers updates past its reviewed version
- **THEN** the entry is flagged "needs review" in validation output, and its lane ownership is unchanged

### Requirement: Capture and PRD phases in the lane map
The registry SHALL define the phases `capture` and `prd`. The lane map SHALL show their owner and skill (the kit: `/kit:capture` and `/kit:prd`) by the same owner rules as every other phase.

#### Scenario: Lane map shows the new phases
- **WHEN** the lane map is generated from the registry
- **THEN** `capture` is owned by `kit` with `/kit:capture`, and `prd` by `kit` with `/kit:prd`

### Requirement: Next-step suggestion uses PRD status
Before falling back to the OpenSpec-based suggestion, the next-step skill SHALL check the project's PRDs and SHALL suggest, with a one-line reason:
- the `artifacts` phase owner (e.g. `/opsx:propose`), naming the PRD, when a PRD is `Ready`, no change uses it, and no change is active;
- reviewing the plan, when a `Building` PRD's file changed after the commit its change recorded;
- asking whether the PRD is done or continues in another change (mark it `Shipped`, or link the next change), when the change named in a `Building` PRD is archived.

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
- **THEN** the suggestion asks whether that PRD is done or continues in another change, offering `/kit:prd` to mark it `Shipped` or link the next change, and nothing is written

#### Scenario: Notes but no PRD
- **WHEN** the project has notes, no PRDs, no explore record and no active change
- **THEN** the suggestion is not `/kit:prd` and says nothing about the notes; it is the step outside a flow (the roadmap's next step, or "Nothing open")

#### Scenario: No knowledge folder
- **WHEN** the project has no knowledge folder
- **THEN** the suggestion is the same as before this change

### Requirement: Ready PRDs picked newest-updated first
When several PRDs are Ready and no change uses them, the next-step suggestion SHALL name the most recently updated one, and SHALL list the others in the same newest-first order.

#### Scenario: Two Ready PRDs
- **WHEN** `prds/old.md` and `prds/new.md` are both Ready, and `new` was updated more recently
- **THEN** the suggestion names `new`, and lists `old` under the other Ready PRDs

### Requirement: Library docs rule in the routing block
The routing rules SHALL tell the agent to look up current library documentation with context7 through `npx` (no install, no sign-in) before writing code against a library API it isn't sure of for the project's installed version, and after a build, type or test error that comes from a library. The starter SHALL NOT require a context7 setup or sign-in.

#### Scenario: Rule present
- **WHEN** a project is bootstrapped
- **THEN** its routing section contains the library docs rule with the `npx -y ctx7@latest` commands

#### Scenario: No sign-in step
- **WHEN** the starter sets up any project
- **THEN** no context7 step appears under "Needs you"

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

### Requirement: Docs phase in the lane map
The registry SHALL define a `docs` phase after `close` (the archive phase). The kit SHALL own it, with the skill `/kit:docs`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the docs phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `docs` after `close`, owned by the kit with `/kit:docs`

### Requirement: Stale docs page suggested
When the project has `knowledge/docs/index.html` and an archived change is newer than the page, the next-step suggestion SHALL add a one-line reminder to run `/kit:docs`. It SHALL be a reminder, never the next step itself. A project without the page SHALL get no reminder.

#### Scenario: Page behind the archive
- **GIVEN** the page was built on 2026-10-12 and a change was archived on 2026-10-14
- **WHEN** the user asks what's next
- **THEN** the suggestion adds "docs page is older than the last archive; run /kit:docs"

#### Scenario: No page yet
- **GIVEN** the project has no `knowledge/docs/index.html`
- **WHEN** the user asks what's next
- **THEN** no docs reminder is shown

### Requirement: Assess phase in the lane map
The registry SHALL define an `assess` phase, owned by the kit with the skill `/kit:harness-review`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the assess phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `assess`, owned by the kit with `/kit:harness-review`

### Requirement: Kit issues go to GitHub
The `kit-issues` phase SHALL route to the kit repo's GitHub issues page. No routing text, skill or README SHALL name `/kit:feedback`.

#### Scenario: Routing block after a re-sync
- **GIVEN** a kit project whose routing block names `/kit:feedback`
- **WHEN** the project is re-synced with `/kit:start`
- **THEN** the new block points kit issues to the GitHub issues page, and `/kit:feedback` appears nowhere in it

### Requirement: Roadmap phase in the lane map
The registry SHALL define a `roadmap` phase, owned by the kit with the skill `/kit:roadmap`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the roadmap phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `roadmap`, owned by the kit with `/kit:roadmap`

### Requirement: Status phase in the lane map
The registry SHALL define a `status` phase, owned by the kit with the skill `/kit:status`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the status phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `status`, owned by the kit with `/kit:status`

### Requirement: Loose ends phase in the lane map
The registry SHALL define a `loose-ends` phase, owned by the kit with the skill `/kit:loose-ends`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the loose ends phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `loose-ends`, owned by the kit with `/kit:loose-ends`

### Requirement: Loose ends rule in the routing block
The routing rules SHALL tell the agent to collect what it puts aside during a step (apply, verify, archive, or a long chat) and, at the end of the step, to offer them once as loose ends through `/kit:loose-ends`, pointing items that belong to a change, a PRD or the roadmap to that owner instead.

#### Scenario: Rule present after a re-sync
- **WHEN** a kit project's routing block is written or re-synced
- **THEN** it contains the end-of-step loose ends rule naming `/kit:loose-ends`

### Requirement: Explore rule in the routing block
The routing rules SHALL tell the agent that a flow starts at `/opsx:explore`, that notes are input it reads and never a step of their own, and that at the end of an explore it SHALL save or update the explore record through `/kit:explore-record` by default and show what it wrote.

#### Scenario: Rule present after a re-sync
- **WHEN** a kit project's routing block is written or re-synced
- **THEN** it contains the explore rule naming the explore record

### Requirement: Safeguards rule in the routing block
The routing block SHALL tell the agent to follow the change's `design.md` Safeguards section during `/opsx:apply`: build in a native Claude Code worktree when the Safeguards choose one, and build with subagents only when they choose it. With no Safeguards section, the agent SHALL build as today and SHALL NOT add a worktree or subagents on its own. The routing block SHALL NOT mention a flow judge or a second flow.

#### Scenario: Worktree chosen
- **GIVEN** the change's Safeguards choose a worktree
- **WHEN** the agent starts `/opsx:apply`
- **THEN** it builds in a native worktree and says where the files are

#### Scenario: No Safeguards section
- **WHEN** the change has no Safeguards section
- **THEN** the agent builds in the current branch, with no worktree and no subagents

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
