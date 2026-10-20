## MODIFIED Requirements

### Requirement: Routing rules include the PRD handoff
The routing rules the starter writes SHALL tell the agent where the knowledge folder is, and SHALL say that the proposal step takes one PRD from it (the most recently updated by default, or the user's pick; never a blocker) and records the PRD's path and commit. The starter templates (agent instructions and project context doc) SHALL point to the knowledge folder for PRDs and long-lived context.

#### Scenario: Routing block mentions PRDs
- **WHEN** a project is bootstrapped
- **THEN** its routing section names the knowledge folder and the PRD handoff to the proposal step

#### Scenario: Re-sync shows the change as a diff
- **WHEN** a project set up with an older kit version is re-synced
- **THEN** the routing block change is shown as a `CHANGE` diff, and is written only on a yes
