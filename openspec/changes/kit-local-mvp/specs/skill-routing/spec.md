# Spec Delta

## Purpose

Makes it predictable which tool or skill handles each phase of work, so overlapping tools don't compete, and tells the user what to do next without memorising hundreds of skills.

## ADDED Requirements

### Requirement: Lane map derived from registry
The kit SHALL produce a lane map (each workflow phase to exactly one owning tool or skill) from the registry's phase ownership data. Phases without an owner SHALL be listed as unowned.

#### Scenario: Complete lane map
- **WHEN** the lane map is generated from a valid registry
- **THEN** every defined phase shows exactly one owner or is marked unowned

### Requirement: Projects receive routing rules
When a project is bootstrapped or re-synced, the kit SHALL write routing rules derived from the lane map into the project's agent instructions. The rules state which skill to use for each phase and which overlapping skills not to use. User-written instructions SHALL be preserved.

#### Scenario: Routing rules present
- **WHEN** a project is bootstrapped
- **THEN** its agent instructions contain a routing section matching the current lane map

#### Scenario: User edits preserved
- **WHEN** routing rules are re-synced in a project whose instructions contain user-written sections
- **THEN** only the routing section changes

### Requirement: Next-step suggestion
The next-step skill SHALL inspect the project's current state (active OpenSpec change and its artifact and task status) and SHALL suggest the next step with the owning skill from the lane map, with a one-line reason.

#### Scenario: Planning incomplete
- **WHEN** the active change has a proposal but no specs
- **THEN** the suggestion is to continue the change with the artifact workflow, naming the next artifact

#### Scenario: Tasks ready
- **WHEN** planning is complete and tasks are unchecked
- **THEN** the suggestion is the build phase owner (e.g. apply with the TDD skill)

#### Scenario: No active change
- **WHEN** the project has no active change
- **THEN** the suggestion is the explore phase owner

### Requirement: Tool updates trigger lane review
When a registry entry's installed version is newer than its reviewed version, the kit SHALL flag the entry for review. Owners and verdicts SHALL NOT change automatically.

#### Scenario: Updated tool flagged
- **WHEN** Superpowers updates past its reviewed version
- **THEN** the entry is flagged "needs review" in validation output and the cockpit, and its lane ownership is unchanged
