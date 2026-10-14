# Spec Delta

## ADDED Requirements

### Requirement: Re-sync without tool installs
A re-sync SHALL be able to apply the project's file updates (such as the CLAUDE.md routing block, the `.gitignore` block and the kit stamp) without installing, updating or enabling any tool. The summary SHALL list the tools it left alone, so the user can install them later with a full re-sync.

The starter SHALL ask whether to install tools only on a re-sync whose plan would install one; a fresh setup and a re-sync with nothing to install SHALL ask nothing beyond the project type.

#### Scenario: Re-sync with nothing to install
- **GIVEN** a project whose tools are all present
- **WHEN** the user re-syncs
- **THEN** the starter asks no question about tools

#### Scenario: Taking a kit update without installs
- **GIVEN** a project set up with an older kit, whose routing block is out of date and whose project tools are not all installed
- **WHEN** the user re-syncs with files only and confirms the routing-block diff
- **THEN** the routing block and the stamp are updated, no install command runs, and the summary lists the tools left alone
