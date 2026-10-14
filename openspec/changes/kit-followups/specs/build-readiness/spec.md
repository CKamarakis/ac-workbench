# Spec Delta

## ADDED Requirements

### Requirement: Decisions after archive
A decision left `open` or `later` when its change is archived SHALL stay in the archived change's decision record and SHALL still be decidable: the decision record commands SHALL accept the archived change by its change name and find it under the archive. Deciding it SHALL record the answer and date as for an active change.

#### Scenario: Deciding a Later item after archive
- **GIVEN** change `storms-canvas` was archived with item D2 marked `later`
- **WHEN** the user decides D2 with the answer "keep full undo history"
- **THEN** the archived change's decision record shows D2 decided with that answer and today's date, and the docs page no longer lists it as undecided
