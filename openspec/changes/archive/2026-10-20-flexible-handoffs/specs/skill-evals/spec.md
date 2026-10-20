## ADDED Requirements

### Requirement: Journey test sheet
The repo SHALL have a one-page test sheet (`docs/test-sheet.md`) for checking the handoffs between the kit's steps by hand. Each row SHALL give what the user types, what good looks like, and a place for what went wrong. Handoffs 1–3 (idea → explore, explore → PRD, PRD → propose) SHALL have detailed rows, and later handoffs one row each.

#### Scenario: Handoff rows
- **WHEN** someone opens the test sheet
- **THEN** it lists the handoffs in journey order, and each row has "you type", "good looks like" and "what went wrong"

#### Scenario: How to run it
- **WHEN** someone reads how to run the sheet
- **THEN** it says to run it on a copy of a real project (called Acme), once before a release and whenever a step feels off, and to keep that project's details out of the repo
