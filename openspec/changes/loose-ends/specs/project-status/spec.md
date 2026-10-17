# Spec Delta

## MODIFIED Requirements

### Requirement: Status report sections
The status skill SHALL show an overview block, then one table with the sections Now, Next, We said we'd do, Loose ends and After, in that order. Each row SHALL have the columns Item, Left, Status and Source. Items SHALL be named by their title in plain words; IDs and branch names SHALL appear only in the Source column. Each section SHALL show at most 5 rows and a "+N more" line when there are more.

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

### Requirement: Facts from their owners
Each section SHALL be filled from the source that owns its facts:
- Now: active OpenSpec changes (with their tasks left and the last commit), and the roadmap's current milestone when a roadmap exists;
- Next: the roadmap order when a roadmap exists; otherwise `Ready` PRDs with no change, then notes no change or PRD uses;
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
- **THEN** "Doesn't match" lists it with the fix `/kit:prd` (mark Shipped, on the user's yes)

#### Scenario: Everything agrees
- **WHEN** no copy disagrees with its owner
- **THEN** no "Doesn't match" list is shown

#### Scenario: Loose end blocks finished work
- **GIVEN** the open loose end `L4` blocks `M12`, and `M12` is done
- **WHEN** the user runs `/kit:status`
- **THEN** "Doesn't match" lists "L4 blocks M12, but M12 is done", naming `loose-ends.md` and the milestone file, with the fix "mark L4 done, drop it, or point it at what it blocks now (`/kit:loose-ends`)"
