# Spec Delta

## ADDED Requirements

### Requirement: Tracks in Now
When a roadmap exists, Now SHALL list every `active` milestone and every `paused` one that has a done task or a resume note, each as its own row with its status. Each such row SHALL show the number and text of its last done task, its next open task, and its resume note when it has one. A milestone listed in Now SHALL NOT also be listed in Next or After.

#### Scenario: One active, one paused
- **GIVEN** `M4` "Feature A" active with `T3` done and `T4` open, and `M1` "Feature B v1" paused with `T2` done, `T3` open and the note `Resume: scoring weights still open`
- **WHEN** the user runs `/kit:status`
- **THEN** Now shows a row for each, with last `T3 <text>` and next `T4 <text>` for `M4`, and last `T2 <text>`, next `T3 <text>` and the resume note for `M1`
- **AND** neither appears under Next or After

#### Scenario: Paused but never started
- **GIVEN** `M2` paused with no done task and no resume note
- **WHEN** the user runs `/kit:status`
- **THEN** `M2` is not in Now, and shows under Next or After in roadmap order

### Requirement: Pending checkpoint in status
When a milestone's checkpoint is reached and not yet answered, its Now row SHALL say so in its status, and the handoff line SHALL name `/kit:roadmap` to choose: continue or switch. Status SHALL NOT answer the checkpoint or change any file.

#### Scenario: Checkpoint waiting
- **GIVEN** the `M4` checkpoint after `T3` is reached and not answered
- **WHEN** the user runs `/kit:status`
- **THEN** the `M4` row's status says "checkpoint reached: continue or switch", and the last line names `/kit:roadmap`
- **AND** no file is created or changed

## MODIFIED Requirements

### Requirement: Facts from their owners
Each section SHALL be filled from the source that owns its facts:
- Now: active OpenSpec changes (with their tasks left and the last commit), open explore records (`exploring`, with their open questions, or `ready-for-prd`), and, when a roadmap exists, its tracks: every active milestone and each paused one with a done task or a resume note (see Tracks in Now);
- Next: the roadmap order when a roadmap exists; otherwise `Ready` PRDs with no change; notes are never rows: with or without a roadmap, one plain count line after Next gives how many notes there are, with no call to action;
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
- **GIVEN** no roadmap, one Ready PRD and 5 notes
- **WHEN** the user runs `/kit:status`
- **THEN** Next shows the Ready PRD as a row and one line "5 notes", with no suggestion to read them
