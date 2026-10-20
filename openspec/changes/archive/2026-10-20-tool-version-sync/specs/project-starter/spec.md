## ADDED Requirements

### Requirement: Re-sync brings tools to the tested version
On a re-sync, a project tool whose recorded version is older than the version the kit tested SHALL be shown as an update with its command, and updated only on the same yes as installs. A newer one SHALL be named, never downgraded. OpenSpec skills older than the machine's CLI SHALL be updated the same way; a CLI older than tested SHALL be a warning.

#### Scenario: Old Impeccable
- **GIVEN** a kit project with Impeccable 4.5.0 and a registry that tested 4.6.0
- **WHEN** the starter plans a re-sync
- **THEN** the plan shows `UPDATE impeccable` from 4.5.0, tested 4.6.0, with its update command, and the tools question is asked

#### Scenario: Files only
- **WHEN** the user picks "Files only" on that re-sync
- **THEN** no update command runs and the summary lists Impeccable as left alone

#### Scenario: Newer than tested
- **GIVEN** Impeccable 4.7.0 and a tested 4.6.0
- **WHEN** the starter plans
- **THEN** Impeccable counts as present, the plan says it's newer than the kit tested, and nothing is updated

#### Scenario: Old OpenSpec skills
- **GIVEN** OpenSpec skills written by 1.13.2 and OpenSpec 1.14.3 on the machine
- **WHEN** the starter plans a re-sync
- **THEN** the plan shows `UPDATE openspec-skills` with `openspec update`, and says it also removes skills outside the machine's OpenSpec profile

#### Scenario: Old OpenSpec CLI
- **GIVEN** OpenSpec 1.13.0 on the machine and a tested 1.14.3
- **WHEN** the starter plans
- **THEN** the plan warns that the CLI is older than tested, with its install command, and runs nothing for it
