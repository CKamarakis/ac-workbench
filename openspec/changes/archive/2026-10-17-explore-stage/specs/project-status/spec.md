# Spec Delta

## MODIFIED Requirements

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
