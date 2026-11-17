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
