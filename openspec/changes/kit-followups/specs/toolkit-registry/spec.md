# Spec Delta

## ADDED Requirements

### Requirement: Nothing to install
An entry whose tool needs no installation (it is part of Claude Code, or it runs through `npx` on demand) SHALL declare `install: none` and a short `install_note` saying why. Setup and the starter SHALL report such a tool as needing nothing and SHALL never run its install. Validation SHALL accept `none` in place of the per-platform commands.

#### Scenario: Built-in tool missing its check
- **GIVEN** the entry `claude-code-builtins` with `install: none` and a check that fails on this machine
- **WHEN** setup runs
- **THEN** setup runs no install command for it and reports it as nothing to install, with its note
