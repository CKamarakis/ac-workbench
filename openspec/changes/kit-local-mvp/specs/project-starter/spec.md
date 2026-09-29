# Spec Delta

## Purpose

Sets up a new or empty project with the kit's basics in minutes instead of half a day, driven by the registry, safe to re-run, and never destructive to existing project files.

## ADDED Requirements

### Requirement: Bootstrap installs Tier 2 basics
When run in a project folder, the starter SHALL ensure the following exist:
- a git repository
- a `.gitignore` including the licensed-material patterns
- an initialized OpenSpec setup whose config points to the project context doc
- a CLAUDE.md starter with routing rules
- a project context doc
- a kit stamp file recording the kit version and setup date

#### Scenario: Empty folder
- **WHEN** the starter runs in an empty folder
- **THEN** all Tier 2 basics exist afterwards and a summary lists what was created

#### Scenario: Licensed folder stays ignored
- **WHEN** a folder named like `PM-OS-v2.1` exists in the bootstrapped project
- **THEN** git does not list it as untracked or stageable

### Requirement: Project-type add-ons are opt-in
The starter SHALL ask for the project type (or accept it as an argument) and SHALL apply only the registry entries tiered for that type with status `adopted` or `trial`. Entries with status `dropped` or `later` SHALL NOT be applied.

#### Scenario: Web UI project
- **WHEN** the user selects project type `web-ui`
- **THEN** only registry entries tiered `project-type:web-ui` with status adopted or trial are applied, and each is listed in the summary

#### Scenario: Dropped tool excluded
- **WHEN** a registry entry for the selected type has status `dropped`
- **THEN** the starter does not apply it

### Requirement: Re-runs never overwrite existing files
If a file the starter would create already exists and differs, the starter SHALL show the proposed change as a diff and apply it only after explicit confirmation. It SHALL NOT delete project files.

#### Scenario: Existing CLAUDE.md
- **WHEN** the starter runs in a project whose CLAUDE.md was edited by the user
- **THEN** the starter shows a diff of its proposed additions and leaves the file unchanged unless the user confirms

#### Scenario: Idempotent re-run
- **WHEN** the starter runs twice in a row with the same choices
- **THEN** the second run reports nothing to change

### Requirement: Missing prerequisites are reported, not guessed
Before making changes, the starter SHALL check required command-line tools (e.g. git, openspec). For each missing tool it SHALL report the tool and a suggested install step. It SHALL resolve tools installed outside the shell's PATH where a known location exists.

#### Scenario: CLI not on PATH
- **WHEN** openspec is installed globally via npm but not on the Git Bash PATH
- **THEN** the starter locates and uses it rather than failing

#### Scenario: Tool missing entirely
- **WHEN** git is not installed
- **THEN** the starter stops before changing anything and reports git as missing with an install hint
