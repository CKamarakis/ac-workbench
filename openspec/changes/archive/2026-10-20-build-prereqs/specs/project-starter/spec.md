## ADDED Requirements

### Requirement: OpenSpec tasks avoid manual checks
The starter SHALL add a `rules.tasks` entry to `openspec/config.yaml` saying that tasks must not need a running app, a browser or a check by hand. It SHALL add the entry only where it can be placed safely; otherwise it SHALL report a conflict that names the line to add. A config that already has the line SHALL be left as it is.

#### Scenario: Config without rules
- **WHEN** `openspec/config.yaml` has no `rules:` entry
- **THEN** the plan shows a `CHANGE` that appends `rules:` with a `tasks:` list holding the kit's line, and nothing else changes

#### Scenario: Config with rules for other artifacts
- **GIVEN** `openspec/config.yaml` has a `rules:` block with a `proposal:` list and no `tasks:` list
- **WHEN** the starter plans
- **THEN** it adds a `tasks:` list holding the kit's line inside that block, and keeps the proposal rules

#### Scenario: Rule already there
- **WHEN** the config already holds the kit's line
- **THEN** the config is reported unchanged

#### Scenario: Rules not placeable
- **WHEN** `rules:` is written on one line (e.g. `rules: {}`)
- **THEN** the config is reported as a conflict that names the line to add, and the file is not written

### Requirement: Setup committed before building
The setup summary SHALL end, when it wrote or changed files, by suggesting that the user commit the setup files on their own before starting a change, and SHALL offer to make that commit. It SHALL commit only on a yes.

#### Scenario: Files written
- **WHEN** a setup or re-sync wrote files
- **THEN** the summary suggests committing them now, in their own commit, and offers to commit on a yes

#### Scenario: Nothing written
- **WHEN** nothing changed
- **THEN** no commit is suggested
