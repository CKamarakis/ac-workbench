# Spec Delta

## MODIFIED Requirements

### Requirement: Setup asks one question
The starter SHALL ask about the project type, and then one optional yes/no: whether the project wants a roadmap. No other question SHALL be asked. Each type option SHALL show the tools it adds. When the project's files make a type likely, that type SHALL be recommended first, with the reason. Otherwise "none" is offered first.

The roadmap question SHALL say in one line what a roadmap is for (goals in order, what's left, decisions waiting) and that it is optional. It SHALL be asked only when the project has no `<knowledge>/roadmaps/roadmap.md`. On a yes, the roadmap is created from the kit's templates as one more file change in the plan. On a no, nothing is created and the summary mentions `/kit:roadmap` once under Later.

The starter SHALL NOT ask about opt-in (`project`-tier) tools. It SHALL list them once in its summary as "available on demand", each with its one-line description. They are added later, when a change needs them.

Global and type tools SHALL be installed without further questions. Steps that need the user (for example a sign-in) SHALL be listed as the user's steps, as before.

Changes to existing files SHALL be shown with their diff, a one-line description and a recommendation, and confirmed together with one yes. The user MAY exclude any of them, and nothing SHALL be applied without that yes.

#### Scenario: Next.js project
- **WHEN** the starter runs in a folder with a `next.config.*` file
- **THEN** the questions are the project type and the optional roadmap, `web-ui` is offered first with the reason "found next.config.*: this is a web app", and each type lists the tools it adds

#### Scenario: Roadmap declined
- **GIVEN** a project with no roadmap
- **WHEN** the user answers no to the roadmap question
- **THEN** no `roadmaps/` folder is created and the summary's Later part mentions `/kit:roadmap` once

#### Scenario: Roadmap accepted
- **GIVEN** a project with no roadmap
- **WHEN** the user answers yes
- **THEN** the plan shows the new `knowledge/roadmaps/` files as one more change, applied with the same single yes as the other file changes

#### Scenario: Roadmap already there
- **GIVEN** a project with `knowledge/roadmaps/roadmap.md`
- **WHEN** the starter re-runs
- **THEN** it does not ask the roadmap question

#### Scenario: Opt-in tools not asked
- **WHEN** the registry has active `project`-tier tools (e.g. SuperSpec)
- **THEN** the starter asks nothing about them, installs none of them, and its summary lists them as available on demand with their description

#### Scenario: Type tools installed silently
- **WHEN** the user picks `web-ui`
- **THEN** the global tools and the `web-ui` tools are installed without asking about each one

#### Scenario: File changes confirmed together
- **WHEN** the plan changes `CLAUDE.md` and `.gitignore`
- **THEN** both diffs are shown, each with what it adds and "Recommended: yes (<why>)", and one yes applies both, unless the user excludes one
