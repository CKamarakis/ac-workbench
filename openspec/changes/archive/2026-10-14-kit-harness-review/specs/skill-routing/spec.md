# Spec Delta

## ADDED Requirements

### Requirement: Assess phase in the lane map
The registry SHALL define an `assess` phase, owned by the kit with the skill `/kit:harness-review`, by the same owner rules as every other phase.

#### Scenario: Lane map shows the assess phase
- **WHEN** the lane map is built from the registry
- **THEN** it lists `assess`, owned by the kit with `/kit:harness-review`

### Requirement: Kit issues go to GitHub
The `kit-issues` phase SHALL route to the kit repo's GitHub issues page. No routing text, skill or README SHALL name `/kit:feedback`.

#### Scenario: Routing block after a re-sync
- **GIVEN** a kit project whose routing block names `/kit:feedback`
- **WHEN** the project is re-synced with `/kit:start`
- **THEN** the new block points kit issues to the GitHub issues page, and `/kit:feedback` appears nowhere in it
