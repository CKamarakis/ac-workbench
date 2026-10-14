# Spec Delta

## ADDED Requirements

### Requirement: Tested versions live in the registry
Each tool's `reviewed_version` in the registry SHALL be the version the kit was last tested with. The smoke test SHALL read OpenSpec's tested version from the registry and print it next to the installed one. This repo's `CLAUDE.md` SHALL say: after updating a tool, run the smoke test, and when it passes, set that tool's `reviewed_version` to the new version.

#### Scenario: OpenSpec updated
- **GIVEN** the registry says OpenSpec `reviewed_version: 1.13.2` and 1.14.0 is installed
- **WHEN** the maintainer runs `npm run smoke`
- **THEN** it prints "OpenSpec 1.14.0 (kit tested with 1.13.2)", and after a pass the maintainer sets `reviewed_version: 1.14.0`

### Requirement: Unit tests clean up
Unit tests SHALL create their throwaway folders in the repo's test area (`../temp` when it exists, else the system temp folder, or `KIT_TEST_DIR` when set) and SHALL remove them when the test run ends.

#### Scenario: After npm test
- **GIVEN** no `kit-*` folders in the test area
- **WHEN** the user runs `npm test`
- **THEN** afterwards no `kit-*` folders are left in the test area or the system temp folder
