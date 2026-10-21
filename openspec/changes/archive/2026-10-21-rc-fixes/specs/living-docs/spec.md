## ADDED Requirements

### Requirement: One yes for a big batch
When more than 3 notes, cards or tools entries need drafting, the docs skill SHALL list them and ask once whether to write all, go one by one, or stop. On "write all" it SHALL draft them in parallel where the agent can (one agent per capability, then one per card), write them as uncommitted files, rebuild the page, and tell the user to review with git. Batches of 3 or fewer SHALL keep the question per draft.

#### Scenario: First run on a project with history
- **GIVEN** 8 capabilities without notes and several card candidates
- **WHEN** the user runs `/kit:docs` and answers "Write all"
- **THEN** one question was asked, the files are written uncommitted, the page is rebuilt, and the report says to review them with `git diff`

#### Scenario: A few new drafts
- **WHEN** 2 notes are missing
- **THEN** each draft is shown and asked about, as before

### Requirement: Code in notes renders as code
Text between backticks in a capability note's "How it works", its Why entries and foundation cards SHALL render as code on the page, escaped like all other text, with `[[card]]` links still working.

#### Scenario: Command in How it works
- **WHEN** a note's How it works says "Run `/kit:ready` first"
- **THEN** the page shows `/kit:ready` as code, with no backticks
