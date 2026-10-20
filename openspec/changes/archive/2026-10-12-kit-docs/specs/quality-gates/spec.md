## ADDED Requirements

### Requirement: Docs page rebuild at archive
In a kit project that has a `knowledge/docs/` folder, when the archive gate lets an archive go ahead, it SHALL also tell the agent to ask the user, after the spec sync, whether to rebuild the docs page, and on a yes to run the build and include `knowledge/docs/index.html` in the archive commit. It SHALL NOT block for this. A project without `knowledge/docs/` SHALL get no such message.

#### Scenario: Project with a docs page
- **GIVEN** `verify.md` has result `pass` and the project has `knowledge/docs/index.html`
- **WHEN** the agent runs `openspec archive add-x`
- **THEN** the archive runs, and the agent is told to ask about rebuilding the docs page into the archive commit

#### Scenario: Project without docs
- **GIVEN** the project has no `knowledge/docs/` folder
- **WHEN** the archive goes ahead
- **THEN** no docs message is added
