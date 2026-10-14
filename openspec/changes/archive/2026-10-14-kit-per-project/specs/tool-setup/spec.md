# Spec Delta

## MODIFIED Requirements

### Requirement: Workflow plugins are never enabled globally
Machine scope SHALL be limited to command-line tools and known plugin marketplaces. The kit plugin itself is not machine scope: it is installed per project. Registry entries with scope `project`, the kit included, SHALL NOT be enabled in the user-level Claude Code settings by setup; they are enabled per project by the project starter.

#### Scenario: Unrelated repository
- **WHEN** setup has run and the user opens a Claude Code session in a repository the kit did not set up
- **THEN** no project-scope workflow plugin from the registry is active in that session, and no kit skill is listed

#### Scenario: Plugin found enabled for every session
- **WHEN** a project-scope plugin from the registry is enabled in the user-level settings
- **THEN** setup reports it as a warning with the fix (enable it per project instead) and does not change any settings without confirmation

#### Scenario: Kit found installed at user level
- **GIVEN** the kit is enabled in the user-level settings
- **WHEN** setup runs
- **THEN** it warns that the kit belongs per project, and gives the fix in a safe order: first install the kit at project scope in each project set up with the kit, then remove the user-level install; it changes no settings itself

#### Scenario: Fresh machine gets the marketplace, not the kit
- **GIVEN** a machine without the kit's marketplace
- **WHEN** setup runs and the user confirms
- **THEN** the kit's marketplace is added, and the kit plugin is not installed at user level
