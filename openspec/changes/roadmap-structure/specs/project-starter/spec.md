# Spec Delta

## ADDED Requirements

### Requirement: Roadmap mentioned at setup
The starter SHALL NOT ask about a roadmap; the project type stays its only question. When the project has no `<knowledge>/roadmaps/roadmap.md`, the summary SHALL list `/kit:roadmap` once under Later, saying that it is optional and keeps the goals in order, what's left and the decisions waiting. The starter SHALL NOT create a `roadmaps/` folder.

#### Scenario: No roadmap yet
- **GIVEN** a project with no `knowledge/roadmaps/roadmap.md`
- **WHEN** the starter runs
- **THEN** it asks only the project type, its summary's Later part mentions `/kit:roadmap` once as optional, and no `roadmaps/` folder exists

#### Scenario: Roadmap already there
- **GIVEN** a project with `knowledge/roadmaps/roadmap.md`
- **WHEN** the starter re-runs
- **THEN** the summary doesn't mention `/kit:roadmap`
