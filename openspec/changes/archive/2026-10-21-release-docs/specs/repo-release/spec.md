## ADDED Requirements

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
