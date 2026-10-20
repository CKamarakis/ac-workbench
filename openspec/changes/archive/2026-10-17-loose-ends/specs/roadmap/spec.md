# Spec Delta

## MODIFIED Requirements

### Requirement: Roadmap report
On request, the skill SHALL show a short report: the milestones in order with ID, title, status and the tasks left (or "n of m done"), Now, and Waiting on you. Broken findings, if any, SHALL be listed at the top. After Waiting on you, the report SHALL add one line for tidy-up findings and one for unplanned work when there are any, and SHALL mark the current milestone. When the project has open loose ends, the report SHALL end with one line giving their count and pointing to `/kit:loose-ends`; loose ends SHALL NOT be listed in the roadmap itself.

#### Scenario: Report
- **GIVEN** a roadmap with `M12` planned and 1 of 5 tasks done
- **WHEN** the user asks for the report
- **THEN** the row shows `M12 · Acme proof · planned`, the four open tasks, and "1 of 5 done"

#### Scenario: Unplanned work in the report
- **GIVEN** an active change `kanban-board` that no milestone links to
- **WHEN** the user asks for the report
- **THEN** it ends with "Unplanned work: kanban-board"

#### Scenario: Loose ends pointer
- **GIVEN** 7 open loose ends, 2 of them important
- **WHEN** the user asks for the report
- **THEN** its last line is "Loose ends: 7 open (2 important): /kit:loose-ends"

#### Scenario: No open loose ends
- **WHEN** the project has no open loose ends
- **THEN** the report has no loose ends line
