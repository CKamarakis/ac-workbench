# Spec Delta

## ADDED Requirements

### Requirement: Roadmap phase in the lane map
The registry SHALL define a `roadmap` phase, owned by the kit with the skill `/kit:roadmap`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the roadmap phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `roadmap`, owned by the kit with `/kit:roadmap`
