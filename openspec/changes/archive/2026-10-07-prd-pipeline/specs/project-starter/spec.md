# Spec Delta

## ADDED Requirements

### Requirement: Starter creates the knowledge folder
When the starter bootstraps or re-syncs a project, it SHALL ensure that the knowledge folder (default `knowledge/`) exists with `notes/`, `prds/`, `assets/` and `archive/`. Empty folders are kept in git with a placeholder file. It SHALL create only what is missing, and SHALL NOT move, rename or edit existing files in that folder.

#### Scenario: New project
- **WHEN** the starter runs in an empty folder
- **THEN** `knowledge/notes/`, `knowledge/prds/`, `knowledge/assets/` and `knowledge/archive/` exist afterwards, and the summary lists them

#### Scenario: Existing knowledge kept
- **WHEN** the starter re-syncs a project whose `knowledge/notes/` already holds notes
- **THEN** those notes are unchanged, and only missing subfolders are planned as `CREATE`

### Requirement: Routing rules include the PRD handoff
The routing rules the starter writes SHALL tell the agent where the knowledge folder is, and SHALL say that the proposal step reads a Ready PRD from it and records the PRD's path and commit. The starter templates (agent instructions and project context doc) SHALL point to the knowledge folder for PRDs and long-lived context.

#### Scenario: Routing block mentions PRDs
- **WHEN** a project is bootstrapped
- **THEN** its routing section names the knowledge folder and the Ready-PRD handoff to the proposal step

#### Scenario: Re-sync shows the change as a diff
- **WHEN** a project set up with an older kit version is re-synced
- **THEN** the routing block change is shown as a `CHANGE` diff, and is written only on a yes
