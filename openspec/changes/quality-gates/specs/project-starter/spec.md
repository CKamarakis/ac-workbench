# Spec Delta

## REMOVED Requirements

### Requirement: Bootstrap installs Tier 2 basics
**Reason**: Its `.gitignore` item and the "Licensed folder stays ignored" scenario protected licensed third-party material that the project no longer uses (user decision, 2026-10-07).
**Migration**: Replaced by "Bootstrap installs the basics" below, which keeps every other item. Re-synced projects see the kit's `.gitignore` block shrink, shown as a `CHANGE` with a diff.

## ADDED Requirements

### Requirement: Bootstrap installs the basics
When run in a project folder, the starter SHALL ensure the following exist:
- a git repository
- a `.gitignore` with the kit's managed block (personal Claude Code settings are not shared)
- an initialized OpenSpec setup whose config points to the project context doc
- a CLAUDE.md starter with routing rules
- a project context doc
- a kit stamp file recording the kit version and setup date
- the project's selected tools installed for this project only

#### Scenario: Empty folder
- **WHEN** the starter runs in an empty folder
- **THEN** all the basics exist afterwards, and a summary lists what was created

#### Scenario: Personal settings stay private
- **WHEN** a project has `.claude/settings.local.json`
- **THEN** git does not list it as untracked or stageable
