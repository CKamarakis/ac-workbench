# repo-release Specification

## Purpose
TBD - created by archiving change release-basics. Update Purpose after archive.

## Requirements

### Requirement: Open-source license
The repo SHALL carry an MIT `LICENSE` at its root, naming the copyright holder by the GitHub handle, and the plugin manifest SHALL declare `"license": "MIT"`.

#### Scenario: License present
- **WHEN** someone opens the repo root
- **THEN** `LICENSE` holds the MIT text with "Copyright (c) 2026 CKamarakis", and `plugin.json` says `"license": "MIT"`

### Requirement: Issue templates
The repo SHALL offer a bug template and an idea template. The bug template SHALL ask for the kit version, the OS, the Claude Code version, the steps, the expected and the actual result. Both templates SHALL warn not to paste secrets or private project details.

#### Scenario: Bug report fields
- **WHEN** someone opens a new bug issue
- **THEN** the form asks for kit version, OS, Claude Code version, steps, expected and actual, and shows the privacy warning

### Requirement: Honest descriptions
The plugin manifest, the marketplace entry and the repo's GitHub description SHALL say what the kit does today and SHALL NOT name features the kit doesn't have.

#### Scenario: No dropped features
- **WHEN** the descriptions are read
- **THEN** none mentions a feedback inbox or another feature the kit doesn't ship

### Requirement: README for strangers
The README SHALL open with who the kit is for, a screenshot, its status, a quickstart, the happy path, its limits and what's coming next, before any reference material. Every image and local link it uses SHALL exist in the repo, and no screenshot SHALL show a private project.

#### Scenario: Opening sections
- **WHEN** someone opens the README
- **THEN** the sections Status, Quickstart, The happy path, Limits and Coming next come before the Reference part, and every image and local link resolves

### Requirement: Changelog
The repo SHALL keep a `CHANGELOG.md` listing kit versions newest first, each with its date and what changed for users. Its newest entry SHALL match the plugin's version.

#### Scenario: Newest entry matches the plugin
- **WHEN** the plugin's version is read from `plugin.json`
- **THEN** the first version heading in `CHANGELOG.md` is that version
