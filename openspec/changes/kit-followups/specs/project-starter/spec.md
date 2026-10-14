# Spec Delta

## ADDED Requirements

### Requirement: Re-sync without tool installs
A re-sync SHALL be able to apply the project's file updates (such as the CLAUDE.md routing block, the `.gitignore` block and the kit stamp) without installing, updating or enabling any tool. The summary SHALL list the tools it left alone, so the user can install them later with a full re-sync.

#### Scenario: Taking a kit update without installs
- **GIVEN** a project set up with an older kit, whose routing block is out of date and whose project tools are not all installed
- **WHEN** the user re-syncs with files only and confirms the routing-block diff
- **THEN** the routing block and the stamp are updated, no install command runs, and the summary lists the tools left alone
