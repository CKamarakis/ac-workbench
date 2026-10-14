# kit-self-test Specification

## Purpose
Lets the kit's maintainer test the whole kit from this repo, on this machine, without AI or cost: an end-to-end smoke test run on request, a judge that says when it is due, and an install check that keeps the plugin's manifests valid.

## Requirements

### Requirement: End-to-end smoke test without AI
`npm run smoke` SHALL run the kit's scripts and hooks in workflow order in a new throwaway project in the system temp folder: project setup, a note, a PRD set to Ready, an OpenSpec change with a proposal, specs (including a nested capability path) and tasks, the flow judge, the readiness scan and decision record, the next-step suggestion at each stage, verify, the archive gate, the OpenSpec archive, and the docs page build and scan. It SHALL use the real OpenSpec CLI installed on the machine. Each step SHALL check its exit code and an expected output line or file, and the run SHALL stop at the first failed step, naming the step, the command, and what was expected and found. It SHALL make no model calls and need no API key or network service. It SHALL NOT write outside the throwaway project and a throwaway home folder, and SHALL delete them after a pass and keep them after a failure, printing their path.

#### Scenario: All steps pass
- **GIVEN** the kit's scripts work and OpenSpec is installed
- **WHEN** the user runs `npm run smoke`
- **THEN** every step prints `ok` with its name, the run ends with "smoke test passed" and the step count, and the throwaway folders are gone

#### Scenario: A step fails
- **GIVEN** a kit script whose output no longer contains the expected line
- **WHEN** the user runs `npm run smoke`
- **THEN** the run stops at that step, prints the step, the command, the expected line and the actual output, exits non-zero, and keeps the throwaway project for inspection

#### Scenario: OpenSpec missing
- **GIVEN** OpenSpec is not installed
- **WHEN** the user runs `npm run smoke`
- **THEN** it stops before creating anything and says OpenSpec is needed, with its install command

#### Scenario: Another OpenSpec version
- **GIVEN** OpenSpec 1.14.0 is installed and the kit was tested with 1.13.2
- **WHEN** the user runs `npm run smoke`
- **THEN** it prints "OpenSpec 1.14.0 (kit tested with 1.13.2)" before the first step and runs every step as usual

#### Scenario: Archive gate in order
- **GIVEN** the smoke project has a change with all tasks done
- **WHEN** the archive gate is given an `openspec archive` command before verify has passed, and again after
- **THEN** it denies the first and allows the second

### Requirement: Smoke test runs only on request
The smoke test SHALL NOT run as part of `npm test`, a git hook, or any kit skill. It SHALL run only when the user or the agent starts it.

#### Scenario: Unit tests stay fast
- **WHEN** the user runs `npm test`
- **THEN** the smoke test does not run

### Requirement: Last pass is recorded
After a pass, the smoke test SHALL record the current commit, the date and the operating system it ran on in a file that git ignores. A failed run SHALL NOT change the record. `npm run smoke:check` SHALL show the system of the last pass.

#### Scenario: Pass recorded
- **GIVEN** the repo is at commit `abc1234` on Windows
- **WHEN** `npm run smoke` passes
- **THEN** the record names `abc1234`, today's date and Windows, and `git status` does not list the record

#### Scenario: System shown by the judge
- **GIVEN** the last pass was on Windows
- **WHEN** the user runs `npm run smoke:check`
- **THEN** its output says the last pass was on Windows

### Requirement: Smoke-test judge
`npm run smoke:check` SHALL list the kit files changed since the commit of the last passing smoke run, including uncommitted changes, and SHALL say "smoke test recommended" with the count when any changed, or "not needed" when none did. Kit files are the plugin's scripts, hooks, skills, templates and data, its `plugin.json`, the marketplace manifest and `toolkit.yaml`. Docs, notes, roadmap, OpenSpec and eval-run files SHALL NOT count. With no recorded pass, or a recorded commit git no longer knows, it SHALL recommend a run and say why. It SHALL exit 0 when no run is needed and with a distinct non-zero code when a run is recommended, so a release step can stop on it. It SHALL be file-based only: no AI, no judgment of risk.

#### Scenario: Script changed since last pass
- **GIVEN** the last pass was at commit `abc1234` and `plugins/kit/scripts/verify.mjs` changed since
- **WHEN** the user runs `npm run smoke:check`
- **THEN** it prints "smoke test recommended: 1 kit file changed" and lists the file

#### Scenario: Only docs changed
- **GIVEN** only `docs/roadmap.md` and a note changed since the last pass
- **WHEN** the user runs `npm run smoke:check`
- **THEN** it prints "smoke test not needed" and exits 0

#### Scenario: Never passed
- **GIVEN** no smoke pass is recorded
- **WHEN** the user runs `npm run smoke:check`
- **THEN** it recommends a run because none is recorded

### Requirement: Agent checks the smoke judge on kit changes
This repo's `CLAUDE.md` SHALL tell the agent to run `npm run smoke:check` when verifying a change that touches kit files, to tell the user what it says, and to run the smoke test before a release.

#### Scenario: Verifying a kit change
- **GIVEN** a change in this repo edited `plugins/kit/scripts/next.mjs`
- **WHEN** the agent verifies the change
- **THEN** it runs `npm run smoke:check` and tells the user a smoke run is recommended

### Requirement: Install check
`npm test` SHALL include a check of the plugin as Claude Code loads it: the marketplace manifest parses, names the plugin and points to a folder that exists; `plugin.json` parses with a name and a semantic version; `hooks.json` parses, uses known hook events, and every command it runs points to a file that exists; every skill folder has a `SKILL.md` whose frontmatter has a `name` matching the folder and a non-empty `description`. Each problem SHALL be reported with the file and what is wrong.

#### Scenario: Broken skill frontmatter
- **GIVEN** a skill whose `SKILL.md` has no `description`
- **WHEN** the user runs `npm test`
- **THEN** the install check fails and names that `SKILL.md` and the missing field

#### Scenario: Hook points to a missing file
- **GIVEN** `hooks.json` runs `hooks/gone.mjs`, which doesn't exist
- **WHEN** the user runs `npm test`
- **THEN** the install check fails and names the hook command and the missing file

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
