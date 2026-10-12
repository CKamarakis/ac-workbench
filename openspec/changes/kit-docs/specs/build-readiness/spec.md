## MODIFIED Requirements

### Requirement: New-tool check
The readiness check SHALL compare the tools the change plans to add (from its design and tasks) with the project's existing dependencies (`package.json` dependencies and devDependencies) and, when the project has one, with the tools inventory (`knowledge/docs/tools.md`), using the inventory's stated purposes. For each planned tool, it SHALL say whether an existing dependency already covers the same purpose, and SHALL offer to reuse it (recommended when one exists) or to add the new one. A tool kept as new SHALL have its reason written into `design.md`. A project without `package.json` SHALL get a one-line note that the tool check was skipped.

#### Scenario: Overlapping tool
- **GIVEN** the project already depends on `@dnd-kit/core`
- **WHEN** a change's design plans to add another drag-and-drop library
- **THEN** a `new-tool` item names `@dnd-kit/core` and recommends reusing it

#### Scenario: Truly new tool
- **WHEN** the user keeps a planned tool that nothing existing covers
- **THEN** `design.md` records why it is added, and the item is decided

#### Scenario: Purpose found in the inventory
- **GIVEN** `tools.md` lists TipTap under "Rich text" for Stickies
- **WHEN** a change's design plans to add another rich-text editor
- **THEN** the `new-tool` item names TipTap, says the inventory already has it for rich text, and recommends reusing it
