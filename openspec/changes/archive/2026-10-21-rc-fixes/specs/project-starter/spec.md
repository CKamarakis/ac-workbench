## ADDED Requirements

### Requirement: Saved type reused
On a re-sync, the starter SHALL take the project type saved in `.claude/kit.json` and SHALL NOT ask the type question. It SHALL say which type it uses and where it came from, and ask only when the user says the type changed. A first setup, or a stamp without a type, SHALL ask as before.

#### Scenario: Re-sync with a saved type
- **GIVEN** `.claude/kit.json` has `"project_type": "web-ui"`
- **WHEN** the user runs `/kit:start`
- **THEN** no type question is asked, and the summary says "Type: web-ui (saved in .claude/kit.json; say if it changed)"

#### Scenario: First setup
- **WHEN** the folder has no `.claude/kit.json`
- **THEN** the type question is asked
