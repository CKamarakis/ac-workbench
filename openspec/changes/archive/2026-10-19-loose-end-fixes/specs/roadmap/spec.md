## ADDED Requirements

### Requirement: Roadmap writes never lose the user's text
A roadmap write SHALL NOT drop or replace text the user wrote. Adding a milestone or changing the order SHALL keep every line under `## Order` that isn't a milestone ID, where it was. Answering a waiting decision SHALL require a non-empty answer; without one, the write SHALL fail with an error and change no file.

#### Scenario: A note under Order survives an add
- **GIVEN** `## Order` holds the line "This order is my priority list" above `- M1`
- **WHEN** a milestone is added
- **THEN** that line is still there, unchanged, and the order lists `M1` and the new ID; no `- null` line is written

#### Scenario: A note under Order survives a reorder
- **GIVEN** `## Order` holds a line of the user's text and the IDs `M1`, `M2`
- **WHEN** the order is changed to `M2`, `M1`
- **THEN** the user's line is kept and only the ID lines change

#### Scenario: Answer without an answer
- **GIVEN** a waiting decision "Pick a database engine"
- **WHEN** `answer` runs with `--match "database"` and no `--answer`
- **THEN** it fails with an error naming `--answer`, the decision stays under Waiting on you, and the drift log is unchanged
