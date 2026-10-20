# Spec Delta

## ADDED Requirements

### Requirement: Ready PRDs picked newest-updated first
When several PRDs are Ready and no change uses them, the next-step suggestion SHALL name the most recently updated one, and SHALL list the others in the same newest-first order.

#### Scenario: Two Ready PRDs
- **WHEN** `prds/old.md` and `prds/new.md` are both Ready, and `new` was updated more recently
- **THEN** the suggestion names `new`, and lists `old` under the other Ready PRDs

### Requirement: Library docs rule in the routing block
The routing rules SHALL tell the agent to look up current library documentation with context7 through `npx` (no install, no sign-in) before writing code against a library API it isn't sure of for the project's installed version, and after a build, type or test error that comes from a library. The starter SHALL NOT require a context7 setup or sign-in.

#### Scenario: Rule present
- **WHEN** a project is bootstrapped
- **THEN** its routing section contains the library docs rule with the `npx -y ctx7@latest` commands

#### Scenario: No sign-in step
- **WHEN** the starter sets up any project
- **THEN** no context7 step appears under "Needs you"
