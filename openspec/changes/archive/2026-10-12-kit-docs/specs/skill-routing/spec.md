## ADDED Requirements

### Requirement: Docs phase in the lane map
The registry SHALL define a `docs` phase after `close` (the archive phase). The kit SHALL own it, with the skill `/kit:docs`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the docs phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `docs` after `close`, owned by the kit with `/kit:docs`

### Requirement: Stale docs page suggested
When the project has `knowledge/docs/index.html` and an archived change is newer than the page, the next-step suggestion SHALL add a one-line reminder to run `/kit:docs`. It SHALL be a reminder, never the next step itself. A project without the page SHALL get no reminder.

#### Scenario: Page behind the archive
- **GIVEN** the page was built on 2026-10-12 and a change was archived on 2026-10-14
- **WHEN** the user asks what's next
- **THEN** the suggestion adds "docs page is older than the last archive; run /kit:docs"

#### Scenario: No page yet
- **GIVEN** the project has no `knowledge/docs/index.html`
- **WHEN** the user asks what's next
- **THEN** no docs reminder is shown
