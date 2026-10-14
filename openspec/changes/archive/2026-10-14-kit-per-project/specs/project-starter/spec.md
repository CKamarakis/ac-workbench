# Spec Delta

## ADDED Requirements

### Requirement: Kit installed per project
The starter SHALL make sure the kit plugin is enabled for the project in the project's shared settings (`.claude/settings.json`), the same way as every other project tool. When the kit is running only from a user-level install, the starter SHALL install it at project scope for this project, and its summary SHALL say that the user-level install can be removed once every kit project has its own. The starter SHALL NOT remove the user-level install itself.

#### Scenario: New project
- **GIVEN** the user ran `claude plugin install kit@ac-workbench --scope project` in an empty folder
- **WHEN** the user runs `/kit:start`
- **THEN** the kit is listed as present for this project, and the project's `.claude/settings.json` enables it

#### Scenario: Project moved off a user-level kit
- **GIVEN** a kit project whose `.claude/settings.json` doesn't enable the kit, and the kit is installed at user level
- **WHEN** the user re-syncs the project with `/kit:start`
- **THEN** the kit is installed at project scope for this project, and the summary says the user-level install can be removed once every kit project has its own

#### Scenario: Repository the kit didn't set up
- **GIVEN** the kit is installed only at project scope in other folders
- **WHEN** the user opens a Claude Code session in a repository without it
- **THEN** no kit skill or hook is active in that session
