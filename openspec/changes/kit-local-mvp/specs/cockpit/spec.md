# Spec Delta

## Purpose

One local page that answers "where am I and what should I use": the user's projects, the toolkit with its verdicts, the lane map and best-practice guidance, all built from registry and project data.

## ADDED Requirements

### Requirement: Cockpit shows projects
The cockpit SHALL list each known project with:
- name
- local path
- links (repo, and any others recorded)
- kit version from the project's stamp file

It SHALL mark projects whose kit version is older than the current kit version.

#### Scenario: Project behind on kit version
- **WHEN** a project's stamp records kit version 0.3.0 and the current kit is 0.5.0
- **THEN** the cockpit shows the project as behind and shows both versions

#### Scenario: Project without stamp
- **WHEN** a listed project has no kit stamp file
- **THEN** the cockpit shows it as "not bootstrapped" instead of failing

### Requirement: Cockpit shows the toolkit
The cockpit SHALL display every registry entry with its tier, status, cost, owned phases and latest verdict rationale. It SHALL support filtering by status and tier.

#### Scenario: Filter adopted tools
- **WHEN** the user filters by status `adopted`
- **THEN** only adopted entries are shown

### Requirement: Cockpit shows lane map and next-step guidance
The cockpit SHALL show the lane map (phase to owning tool) and a situation-to-skill guide (e.g. "something is broken" leads to the debugging skill), derived from registry data rather than written by hand in the page.

#### Scenario: Lane map reflects registry
- **WHEN** the registry changes the owner of phase `verify`
- **THEN** the regenerated cockpit shows the new owner

### Requirement: Cockpit is local, read-only and free
The cockpit v0 SHALL run with no network service, account or paid dependency. It SHALL be regenerated from source data by one command, and SHALL NOT modify the registry or projects.

#### Scenario: Offline use
- **WHEN** the machine has no internet connection
- **THEN** the cockpit still builds and opens with all local data

#### Scenario: Invalid registry
- **WHEN** the registry fails validation
- **THEN** the cockpit build reports the validation errors and does not produce a partial page
