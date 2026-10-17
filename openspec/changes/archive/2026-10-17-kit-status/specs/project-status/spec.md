# Spec Delta

## Purpose

Shows the user, in plain words, what a project is, what's built, what's under way and which item to pick up next, read fresh from the sources that own each fact, so they can get back into a project after time away.

## ADDED Requirements

### Requirement: Status report sections
The status skill SHALL show an overview block, then one table with the sections Now, Next, We said we'd do, Tech debt and After, in that order. Each row SHALL have the columns Item, Left, Status and Source. Items SHALL be named by their title in plain words; IDs and branch names SHALL appear only in the Source column. Each section SHALL show at most 5 rows and a "+N more" line when there are more.

#### Scenario: Project with a roadmap
- **GIVEN** a roadmap whose current milestone is M12a "Kit workflow" with T2 and T3 open, and the next milestone is M12 "Toughbubble proof"
- **WHEN** the user runs `/kit:status`
- **THEN** Now shows "Kit workflow" with Left listing T2 and T3 and Source linking the milestone file
- **AND** Next shows "Toughbubble proof", in roadmap order

#### Scenario: Change named in plain words
- **GIVEN** an active change `kit-status` whose proposal links PRD "Kit status", and an active change `task-board` with no PRD link
- **WHEN** the user runs `/kit:status`
- **THEN** Now names them "Kit status" and "task board", with the change folders only in Source

#### Scenario: Long section
- **GIVEN** 8 decisions waiting on the user
- **WHEN** the user runs `/kit:status`
- **THEN** We said we'd do shows 5 rows and "+3 more"

### Requirement: Overview block
The status skill SHALL open with what the project is, from `PRODUCT.md`, `docs/project-context.md` or `README.md` (the first that exists, in that order), and what's built, from the project's OpenSpec main specs and archived changes only. When none of those files exist, the overview SHALL say which were not found and name the command that fills the gap.

#### Scenario: Built from specs
- **GIVEN** a project with main specs `roadmap` and `harness-review`, and a PRD marked `Shipped` whose change is not archived
- **WHEN** the user runs `/kit:status`
- **THEN** "Built" lists `roadmap` and `harness-review`, and does not list the PRD

#### Scenario: Many capabilities built
- **GIVEN** a project with 15 main specs
- **WHEN** the user runs `/kit:status`
- **THEN** "Built" shows the count (15) and the 5 most recently archived capabilities by name, not all 15

#### Scenario: No project description
- **GIVEN** a project with no `PRODUCT.md`, no `docs/project-context.md` and no `README.md`
- **WHEN** the user runs `/kit:status`
- **THEN** the overview says none was found and suggests `/kit:start`

### Requirement: Facts from their owners
Each section SHALL be filled from the source that owns its facts:
- Now: active OpenSpec changes (with their tasks left and the last commit), and the roadmap's current milestone when a roadmap exists;
- Next: the roadmap order when a roadmap exists; otherwise `Ready` PRDs with no change, then notes no change or PRD uses;
- We said we'd do: the roadmap's Waiting on you, PRD open questions, open decisions in active changes, and open decisions in archived changes;
- Tech debt: the backlog, once one exists;
- After: the roadmap's remaining open milestones after Next.

Every row SHALL name its source. The skill SHALL use only the facts the script reports and SHALL NOT add items, counts or states of its own.

#### Scenario: Waiting items with sources
- **GIVEN** a roadmap decision waiting on the user and a Draft PRD `sidebar` with 2 open questions
- **WHEN** the user runs `/kit:status`
- **THEN** We said we'd do lists both, with `drift-log`/`roadmap.md` and `prds/sidebar.md` as their sources

#### Scenario: Milestone and its change in Now
- **GIVEN** the current milestone M12a "Kit workflow" links the active change `kit-status`
- **WHEN** the user runs `/kit:status`
- **THEN** Now shows two rows: "Kit workflow" with its open milestone tasks, and the `kit-status` change with its open change tasks, each with its own Source

#### Scenario: Items left for later, with their owner command
- **GIVEN** a decision left for later in an archived change's `decisions.md`, and a PRD question put off for later
- **WHEN** the user runs `/kit:status`
- **THEN** We said we'd do lists both, each with its source and the command that answers it (`/kit:ready` for the change decision, `/kit:prd` for the PRD question)

#### Scenario: Change with every task done
- **GIVEN** an active change whose 14 tasks are all checked
- **WHEN** the user runs `/kit:status`
- **THEN** its Now row says "0 of 14 tasks open" with the status "tasks done: verify, then archive"

#### Scenario: No backlog yet
- **WHEN** the project has no backlog
- **THEN** Tech debt shows one line saying there is no backlog yet

### Requirement: Status without a roadmap
When the project has no roadmap, status SHALL still show the overview, Now from active changes and Next from Ready PRDs and notes, and SHALL add one line saying `/kit:roadmap` can set the order. It SHALL NOT create a roadmap.

#### Scenario: Toughbubble-like project
- **GIVEN** a project with `PRODUCT.md`, PRDs, notes, archived changes, no active change and no roadmap
- **WHEN** the user runs `/kit:status`
- **THEN** the overview and Built are filled, Now says nothing is under way, Next lists the Ready PRDs and notes without a PRD, and one line mentions `/kit:roadmap`
- **AND** no file is created

### Requirement: Several items under way
When more than one OpenSpec change is active, Now SHALL list every active change, each with its own Left and Source.

#### Scenario: Two changes on different agents
- **GIVEN** active changes `notes-search` and `task-board`
- **WHEN** the user runs `/kit:status`
- **THEN** Now lists both, each with its open tasks and its source folder

### Requirement: Mismatches shown, never resolved
When a copy disagrees with its owner, status SHALL show a "Doesn't match" list with each mismatch, the sources involved and the fix, and SHALL NOT choose one source over the other. Mismatches SHALL include at least:
- the roadmap has an active milestone with open tasks while no OpenSpec change is active and no milestone branch exists;
- a `Building` PRD whose change is archived;
- the roadmap check's "Now may be stale" and unplanned-work findings.

When there are no mismatches, the list SHALL NOT appear.

#### Scenario: Now with nothing under way
- **GIVEN** the roadmap's current milestone M12a is active with T2 open, and no change is active and no branch is linked to it
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists it, naming `roadmap.md` and OpenSpec, with the fix "propose a change for it, or update Now (`/kit:roadmap`)"

#### Scenario: PRD not marked Shipped
- **GIVEN** PRD `roadmap-structure` is `Building` and its change is archived
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists it with the fix `/kit:prd` (mark Shipped, on the user's yes)

#### Scenario: Everything agrees
- **WHEN** no copy disagrees with its owner
- **THEN** no "Doesn't match" list is shown

### Requirement: Status is read-only
Status SHALL NOT create, change or delete any file, and SHALL NOT keep its own record; every run SHALL compute the report fresh. When a source can't be read (OpenSpec or git missing), status SHALL say which source was skipped and still show the rest.

#### Scenario: Files unchanged
- **WHEN** the user runs `/kit:status` in a git project
- **THEN** `git status` shows the same output before and after

#### Scenario: OpenSpec missing
- **GIVEN** the OpenSpec CLI can't be found
- **WHEN** the user runs `/kit:status`
- **THEN** the report shows the sections it could fill from files and says OpenSpec was skipped, suggesting `/kit:setup`

### Requirement: Handoff to next
Status SHALL end with one line naming the item to work on and the command `/kit:next` to copy. With one item under way, that item is named; with several, the line lists them and says `/kit:next` will ask which one; with none, it names the first item in Next and says to start it. Status SHALL NOT work out the step inside the item, and SHALL NOT decide the order: with several candidates and no roadmap, it SHALL give order hints only (almost done, how long it has waited) and the user chooses.

#### Scenario: One item under way
- **GIVEN** the active change `kit-status`
- **WHEN** the user runs `/kit:status`
- **THEN** the last line names the status report item and says "run `/kit:next`"

#### Scenario: Nothing under way, no roadmap
- **GIVEN** two Ready PRDs and no roadmap
- **WHEN** the user runs `/kit:status`
- **THEN** both are listed under Next with their age, and the last line asks the user to pick one and run `/kit:next`

#### Scenario: Nothing under way and nothing queued
- **GIVEN** no active change, no roadmap, no Ready PRD and no notes without a PRD
- **WHEN** the user runs `/kit:status`
- **THEN** the last line says nothing is under way or queued and suggests `/kit:capture` or `/kit:roadmap`
