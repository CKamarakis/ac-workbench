## ADDED Requirements

### Requirement: Blank context doc isn't the description
Status SHALL NOT describe the project from `docs/project-context.md` while it is still the kit's blank template; it SHALL use the next description file instead. When no file describes the project, it SHALL say "Project not described yet" and name `docs/project-context.md` as the place to fill.

#### Scenario: Blank doc and a README
- **GIVEN** a blank `docs/project-context.md` and a README that describes the app
- **WHEN** the user runs `/kit:status`
- **THEN** the project line comes from the README

#### Scenario: Nothing describes the project
- **GIVEN** a blank `docs/project-context.md` and no PRODUCT.md or README
- **WHEN** the user runs `/kit:status`
- **THEN** the project line says "Project not described yet" and names `docs/project-context.md`

### Requirement: First steps when the project is new
When nothing is under way or queued and the project has no notes, PRDs or changes, status SHALL end by offering two first steps: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea the user already has.

#### Scenario: Empty project
- **GIVEN** a project the kit just set up, with nothing in it yet
- **WHEN** the user runs `/kit:status`
- **THEN** the last line offers `/kit:capture` and `/opsx:explore`, each with what it's for

## MODIFIED Requirements

### Requirement: Overview block
The status skill SHALL open with what the project is, from `PRODUCT.md`, `docs/project-context.md` or `README.md` (the first that exists and describes the project, in that order; a context doc that is still the blank template doesn't count), and what's built, from the project's OpenSpec main specs and archived changes only. When none of those files exist, the overview SHALL say which were not found and name the command that fills the gap.

#### Scenario: Built from specs
- **GIVEN** a project with main specs `roadmap` and `harness-review`, and a PRD marked `Shipped` whose change is not archived
- **WHEN** the user runs `/kit:status`
- **THEN** "Built" lists `roadmap` and `harness-review`, and does not list the PRD

#### Scenario: Many capabilities built
- **GIVEN** a project with 15 main specs
- **WHEN** the user runs `/kit:status`
- **THEN** "Built" shows the count (15) and the 5 most recently archived capabilities by name, not all 15

#### Scenario: No project description
- **GIVEN** a project with no `PRODUCT.md`, no `docs/project-context.md` and no `README.md`
- **WHEN** the user runs `/kit:status`
- **THEN** the overview says none was found and suggests `/kit:start`

### Requirement: Handoff to next
Status SHALL end with one line naming the item to work on and the command `/kit:next` to copy. With one item under way, that item is named; with several, the line lists them and says `/kit:next` will ask which one; with none, it names the first item in Next and says to start it. Status SHALL NOT work out the step inside the item, and SHALL NOT decide the order: with several candidates and no roadmap, it SHALL give order hints only (almost done, how long it has waited) and the user chooses.

#### Scenario: One item under way
- **GIVEN** the active change `kit-status`
- **WHEN** the user runs `/kit:status`
- **THEN** the last line names the status report item and says "run `/kit:next`"

#### Scenario: Nothing under way, no roadmap
- **GIVEN** two Ready PRDs and no roadmap
- **WHEN** the user runs `/kit:status`
- **THEN** both are listed under Next with their age, and the last line asks the user to pick one and run `/kit:next`

#### Scenario: Nothing under way and nothing queued
- **GIVEN** no active change, no roadmap, no Ready PRD and no notes without a PRD, and it isn't a new project (it has an archived change, a PRD or a note)
- **WHEN** the user runs `/kit:status`
- **THEN** the last line says nothing is under way or queued and suggests `/kit:capture` or `/kit:roadmap`
