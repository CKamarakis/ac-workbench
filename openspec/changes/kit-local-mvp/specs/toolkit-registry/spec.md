# Spec Delta

## Purpose

A single source of truth listing every tool the kit knows about: why it is there, how it scored, what it costs, which phase it owns and its current verdict. Other kit capabilities read from it.

## ADDED Requirements

### Requirement: Registry entries carry required fields
Each registry entry SHALL include:
- name
- source (where it installs from)
- tier: `global`, `project` or `project-type:<type>`
- reason (why it is in the kit)
- cost: `free`, `free-tier`, `paid` or `uses-claude-quota`
- status: `trial`, `adopted`, `dropped` or `later`
- rubric notes covering problem fit, overlap, context cost, run cost, trust, reversibility and license
- reviewed version and review date

#### Scenario: Complete entry passes validation
- **WHEN** the registry contains an entry with every required field filled
- **THEN** validation reports the entry as valid

#### Scenario: Missing field is reported
- **WHEN** an entry lacks a required field (e.g. `reason`)
- **THEN** validation fails and names the entry and the missing field

#### Scenario: Invalid enum value is reported
- **WHEN** an entry has `status: maybe`
- **THEN** validation fails and lists the allowed status values

### Requirement: Registry records verdict history
Each entry SHALL keep an ordered history of verdicts. Each verdict records its date, the resulting status, a short rationale, and optionally a reference to the eval results that support it. Existing history entries SHALL NOT be rewritten when a new verdict is added.

#### Scenario: New verdict appended
- **WHEN** a trial ends and a verdict is recorded for a tool
- **THEN** the verdict is appended to that tool's history and the entry's status matches the latest verdict

#### Scenario: Status without supporting verdict
- **WHEN** an entry's status differs from its latest verdict's status
- **THEN** validation fails and reports the mismatch

### Requirement: Registry declares phase ownership
Entries MAY declare the workflow phases they own, the skills of theirs that are skipped, and the tools they overlap with. Validation SHALL fail when two `adopted` or `trial` entries own the same phase without an overlap resolution recorded on at least one of them.

#### Scenario: Unresolved phase conflict
- **WHEN** two adopted tools both declare ownership of phase `plan` and neither records the overlap
- **THEN** validation fails and names both tools and the phase

#### Scenario: Resolved overlap passes
- **WHEN** two tools touch the same phase and one lists the other under `overlaps` with the conflicting skill under `skip_skills`
- **THEN** validation passes

### Requirement: Entries declare how to check and install
Each entry with status `adopted` or `trial` SHALL declare:
- a scope: `machine` (installed once per machine: command-line tools, the kit plugin, plugin marketplaces) or `project` (enabled per project by the starter)
- a check that tells whether the tool is present
- install instructions for the supported platform

Validation SHALL fail when an adopted or trial entry lacks any of these, or has a scope value other than `machine` or `project`.

#### Scenario: Missing install data
- **WHEN** an adopted entry has no check or no install instructions
- **THEN** validation fails and names the entry and the missing field

#### Scenario: Later entry without install data
- **WHEN** an entry with status `later` has no install instructions
- **THEN** validation passes for that entry

### Requirement: Registry is human-readable and hand-editable
The registry SHALL be a single plain-text file in the kit repository that a person can read and edit in any text editor, and SHALL be validated by one command that exits non-zero on any error.

#### Scenario: Validation command result
- **WHEN** the validation command runs on a registry with at least one error
- **THEN** it prints each error with its location and exits with a non-zero code
