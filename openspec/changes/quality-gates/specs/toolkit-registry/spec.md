# Spec Delta

## ADDED Requirements

### Requirement: Test policy per project type
The registry SHALL define, for each project type (and for `none`), a test policy:
- the test commands to run, by `package.json` script name (e.g. `test`, `test:integration`), each marked required or optional;
- whether a missing required test command is a hard failure;
- advisory checks (e.g. a browser check for UI flows).

The registry validator SHALL reject a policy that names an unknown project type, or that has no commands.

#### Scenario: web-ui policy
- **WHEN** the registry is validated
- **THEN** `web-ui` has a required `test` command, an optional `test:integration` command, and an advisory browser check

#### Scenario: Invalid policy
- **WHEN** a policy names a type that no tool uses and that isn't `none`
- **THEN** validation fails, naming the type
