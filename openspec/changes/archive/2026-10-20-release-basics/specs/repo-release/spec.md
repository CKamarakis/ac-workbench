## ADDED Requirements

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
