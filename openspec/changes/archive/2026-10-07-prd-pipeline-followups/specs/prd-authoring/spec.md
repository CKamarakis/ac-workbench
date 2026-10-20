# Spec Delta

## ADDED Requirements

### Requirement: PRDs ordered by most recent update
Wherever the kit lists PRDs or asks the user to choose one, it SHALL order them by when they were last updated, newest first. This covers the knowledge listing, the PRD skill, and the proposal step's choice between several Ready PRDs. A PRD's last update is:
- the file's modification time, when it has uncommitted changes or is not tracked by git;
- otherwise, the time of the last commit that touched it;
- the file's modification time, when git is not available.

Ties are broken by slug.

#### Scenario: Recently edited PRD first
- **WHEN** `prds/a.md` was last committed yesterday and `prds/b.md` has uncommitted edits from today
- **THEN** `b` is listed before `a`

#### Scenario: Proposal choice ordered
- **WHEN** two PRDs are Ready and the proposal step asks which to use
- **THEN** the options are ordered newest-updated first

#### Scenario: No git
- **WHEN** the project is not a git repository
- **THEN** PRDs are ordered by file modification time, newest first
