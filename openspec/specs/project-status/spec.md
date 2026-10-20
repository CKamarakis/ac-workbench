# project-status Specification

## Purpose
Shows the user, in plain words, what a project is, what's built, what's under way and which item to pick up next, read fresh from the sources that own each fact, so they can get back into a project after time away.

## Requirements

### Requirement: Status report sections
The status skill SHALL show an overview block, then one table with the sections Now, Next, We said we'd do, Loose ends and After, in that order. Each row SHALL have the columns Item, Left, Status and Source. Items SHALL be named by their title in plain words; IDs and branch names SHALL appear only in the Source column. Each section SHALL show at most 5 rows and a "+N more" line when there are more.

#### Scenario: Project with a roadmap
- **GIVEN** a roadmap whose current milestone is M12a "Kit workflow" with T2 and T3 open, and the next milestone is M12 "Acme proof"
- **WHEN** the user runs `/kit:status`
- **THEN** Now shows "Kit workflow" with Left listing T2 and T3 and Source linking the milestone file
- **AND** Next shows "Acme proof", in roadmap order

#### Scenario: Change named in plain words
- **GIVEN** an active change `kit-status` whose proposal links PRD "Kit status", and an active change `task-board` with no PRD link
- **WHEN** the user runs `/kit:status`
- **THEN** Now names them "Kit status" and "task board", with the change folders only in Source

#### Scenario: Long section
- **GIVEN** 8 decisions waiting on the user
- **WHEN** the user runs `/kit:status`
- **THEN** We said we'd do shows 5 rows and "+3 more"

### Requirement: Overview block
The status skill SHALL open with what the project is, from `PRODUCT.md`, `docs/project-context.md` or `README.md` (the first that exists and describes the project, in that order; a context doc that is still the blank template doesn't count), and what's built, from the project's OpenSpec main specs and archived changes only. When none of those files exist, the overview SHALL say which were not found and name the command that fills the gap.

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
- Now: active OpenSpec changes (with their tasks left and the last commit), open explore records (`exploring`, with their open questions, or `ready-for-prd`), and the roadmap's current milestone when a roadmap exists;
- Next: the roadmap order when a roadmap exists; otherwise `Ready` PRDs with no change; notes are never rows: with or without a roadmap, the notes no explore record, PRD or change uses are one count line after Next;
- We said we'd do: the roadmap's Waiting on you, PRD open questions, open decisions in active changes, and open decisions in archived changes;
- Loose ends: the open items of the loose ends file: as rows, the ones marked important and the ones blocking the current milestone or an active change, important first; every other open item, except `accepted` ones, as one count line per kind;
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

#### Scenario: Loose ends shown by importance and blockers
- **GIVEN** open loose ends: `L1` important `check`, `L2` `friction` blocking the current milestone M12a, `L3` and `L4` `idea`, `L5` `accepted`
- **WHEN** the user runs `/kit:status`
- **THEN** Loose ends shows `L1` and `L2` as rows (each with its source and `/kit:loose-ends`), then one line "2 idea"
- **AND** `L5` does not appear

#### Scenario: No backlog yet
- **WHEN** the project has no loose ends file (the backlog the first version of status waited for)
- **THEN** Loose ends shows one line saying there are none yet, and `/kit:loose-ends` adds them

#### Scenario: Explore under way
- **GIVEN** the explore record `kit-status` with 2 open questions, and no active change
- **WHEN** the user runs `/kit:status`
- **THEN** Now shows "Kit status" with Left listing the 2 questions, status "exploring", and its record as Source
- **AND** the handoff names it as the item under way

#### Scenario: Unused notes as one line
- **GIVEN** no roadmap, one Ready PRD and 5 notes no explore record, PRD or change uses
- **WHEN** the user runs `/kit:status`
- **THEN** Next shows the Ready PRD as a row and one line "5 notes nothing has read yet (start an explore: /opsx:explore)"

### Requirement: Status without a roadmap
When the project has no roadmap, status SHALL still show the overview, Now from active changes and Next from Ready PRDs, with unused notes as one count line, and SHALL add one line saying `/kit:roadmap` can set the order. It SHALL NOT create a roadmap.

#### Scenario: Acme-like project
- **GIVEN** a project with `PRODUCT.md`, PRDs, notes, archived changes, no active change and no roadmap
- **WHEN** the user runs `/kit:status`
- **THEN** the overview and Built are filled, Now says nothing is under way, Next lists the Ready PRDs and one count line for the notes nothing has read yet, and one line mentions `/kit:roadmap`
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
- the roadmap check's "Now may be stale" and unplanned-work findings;
- an open loose end that blocks a milestone that is done or dropped, a change that is archived, or a loose end that is done or dropped.

When there are no mismatches, the list SHALL NOT appear.

#### Scenario: Now with nothing under way
- **GIVEN** the roadmap's current milestone M12a is active with T2 open, and no change is active and no branch is linked to it
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists it, naming `roadmap.md` and OpenSpec, with the fix "propose a change for it, or update Now (`/kit:roadmap`)"

#### Scenario: PRD not marked Shipped
- **GIVEN** PRD `roadmap-structure` is `Building` and its change is archived
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists it as a question, whether the PRD is done or continues in another change, with the fix `/kit:prd` (mark it Shipped, or link the next change, on the user's yes); it does not advise Shipped

#### Scenario: Everything agrees
- **WHEN** no copy disagrees with its owner
- **THEN** no "Doesn't match" list is shown

#### Scenario: Loose end blocks finished work
- **GIVEN** the open loose end `L4` blocks `M12`, and `M12` is done
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists "L4 blocks M12, but M12 is done", naming `loose-ends.md` and the milestone file, with the fix "mark L4 done, drop it, or point it at what it blocks now (`/kit:loose-ends`)"

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
- **GIVEN** no active change, no roadmap, no Ready PRD and no notes without a PRD, and it isn't a new project (it has an archived change, a PRD or a note)
- **WHEN** the user runs `/kit:status`
- **THEN** the last line says nothing is under way or queued and suggests `/kit:capture` or `/kit:roadmap`

### Requirement: A note counts as used when its file is named
A change SHALL count as using a note only when its proposal or design names the note's file with `.md` (`2026-10-08-acme-canvas.md`) or its path (`notes/2026-10-08-acme-canvas.md`). A word that only matches the note's name without `.md` SHALL NOT count.

#### Scenario: Bare word
- **GIVEN** a note `notes/auth.md` and a proposal that says "the auth flow"
- **WHEN** status counts the notes nothing has read yet
- **THEN** `notes/auth.md` is counted as not read

#### Scenario: Named with .md
- **GIVEN** a design that says "from `knowledge/notes/auth.md`"
- **WHEN** status counts the notes nothing has read yet
- **THEN** `notes/auth.md` is counted as read

### Requirement: Blank context doc isn't the description
Status SHALL NOT describe the project from `docs/project-context.md` while it is still the kit's blank template; it SHALL use the next description file instead. When no file describes the project, it SHALL say "Project not described yet" and name `docs/project-context.md` as the place to fill.

#### Scenario: Blank doc and a README
- **GIVEN** a blank `docs/project-context.md` and a README that describes the app
- **WHEN** the user runs `/kit:status`
- **THEN** the project line comes from the README

#### Scenario: Nothing describes the project
- **GIVEN** a blank `docs/project-context.md` and no PRODUCT.md or README
- **WHEN** the user runs `/kit:status`
- **THEN** the project line says "Project not described yet" and names `docs/project-context.md`

### Requirement: First steps when the project is new
When nothing is under way or queued and the project has no notes, PRDs or changes, status SHALL end by offering two first steps: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea the user already has.

#### Scenario: Empty project
- **GIVEN** a project the kit just set up, with nothing in it yet
- **WHEN** the user runs `/kit:status`
- **THEN** the last line offers `/kit:capture` and `/opsx:explore`, each with what it's for
