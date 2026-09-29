# Spec Delta

## Purpose

One command brings a machine up to the kit's toolset, driven by the registry and safe to re-run, so starting or resuming a project never begins with manual installs.

## ADDED Requirements

### Requirement: One command installs the machine toolset from the registry
The setup command SHALL check every registry entry with status `adopted` or `trial` and scope `machine`, and SHALL install each missing one using the entry's install instructions. Entries with status `dropped` or `later` SHALL NOT be installed. It SHALL end with a summary listing each entry as installed, already present, or failed.

#### Scenario: Fresh machine
- **WHEN** setup runs on a machine where none of the machine-scope tools are present
- **THEN** each adopted or trial machine-scope tool is installed and the summary lists it as installed

#### Scenario: Dropped tool not installed
- **WHEN** a machine-scope registry entry has status `dropped`
- **THEN** setup does not install it and does not list it as missing

### Requirement: Setup is idempotent
Running setup again with no registry change SHALL install nothing and SHALL report that nothing needs to be done.

#### Scenario: Second run
- **WHEN** setup runs twice in a row
- **THEN** the second run reports every entry as already present and changes nothing

### Requirement: Installs are confirmed and failures are isolated
Before installing, setup SHALL list what it will install and wait for confirmation. A failed install SHALL be reported with the error and a suggested fix, and SHALL NOT stop the remaining installs.

#### Scenario: One install fails
- **WHEN** the install of one tool fails and two others are pending
- **THEN** the two others are still installed and the summary shows the failure with a fix hint

### Requirement: Workflow plugins are never enabled globally
Machine scope SHALL be limited to command-line tools, the kit plugin itself and known plugin marketplaces. Registry entries with scope `project` SHALL NOT be enabled in the user-level Claude Code settings by setup; they are enabled per project by the project starter.

#### Scenario: Unrelated repository
- **WHEN** setup has run and the user opens a Claude Code session in a repository the kit did not set up
- **THEN** no project-scope workflow plugin from the registry is active in that session

### Requirement: Tools outside PATH are detected
Setup SHALL treat a tool as present when it is installed in a known location outside the shell's PATH (such as the global npm folder or its standard install folder), and SHALL use that location rather than reinstalling.

#### Scenario: GitHub CLI installed but not on PATH
- **WHEN** the GitHub CLI is installed in its standard folder but not on the Git Bash PATH
- **THEN** setup reports it as present and does not reinstall it
