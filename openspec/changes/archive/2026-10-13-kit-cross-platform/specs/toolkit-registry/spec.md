# Spec Delta

## MODIFIED Requirements

### Requirement: Entries declare how to check and install
Each entry with status `adopted` or `trial` SHALL declare:
- a scope: `machine` (installed once per machine: command-line tools, the kit plugin, plugin marketplaces) or `project` (enabled per project by the starter)
- a check that tells whether the tool is present
- install instructions for each supported platform: Windows (`win32`), macOS (`darwin`) and Linux (`linux`). A platform key gives that platform's command; an `all` key gives one command for every platform that has no key of its own.

Validation SHALL fail when an adopted or trial entry lacks any of these, has no install instructions for one of the three platforms, or has a scope value other than `machine` or `project`. Install keys other than `win32`, `darwin`, `linux` and `all` SHALL fail validation.

#### Scenario: Missing install data
- **WHEN** an adopted entry has no check or no install instructions
- **THEN** validation fails and names the entry and the missing field

#### Scenario: Later entry without install data
- **WHEN** an entry with status `later` has no install instructions
- **THEN** validation passes for that entry

#### Scenario: Platform missing
- **GIVEN** an adopted entry with `win32` and `darwin` install commands and no `linux` or `all`
- **WHEN** the registry is validated
- **THEN** validation fails and names the entry and `install.linux`

#### Scenario: One command for every platform
- **GIVEN** an adopted entry whose only install key is `all: npm install -g @fission-ai/openspec`
- **WHEN** the registry is validated
- **THEN** validation passes, and setup uses that command on Windows, macOS and Linux

#### Scenario: Unknown platform key
- **GIVEN** an entry with an install key `mac`
- **WHEN** the registry is validated
- **THEN** validation fails and names `install.mac` as unknown
