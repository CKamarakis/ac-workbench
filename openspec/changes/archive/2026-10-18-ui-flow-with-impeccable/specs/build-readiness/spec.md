# Spec Delta

## ADDED Requirements

### Requirement: Web-ui project
The kit SHALL treat a project as web-ui when its `.claude/kit.json` has `project_type: web-ui`. A type in `kit.json` SHALL win: any other type (for example `cli` or `none`) means not web-ui, whatever files exist. Only when `kit.json` names no type (or doesn't exist) SHALL files decide: Impeccable installed (`.claude/skills/impeccable`), or a web app's config file at the root (the same list `/kit:start` uses: `next`, `vite`, `astro`, `svelte`, `nuxt`). The same rule SHALL decide the `shape` offer, the `ui-review` safeguard and the UI gap check.

#### Scenario: Type in kit.json
- **GIVEN** `.claude/kit.json` says `project_type: web-ui`
- **WHEN** the kit checks the project
- **THEN** it is web-ui

#### Scenario: Impeccable installed, no type
- **GIVEN** there's no `.claude/kit.json` type, and `.claude/skills/impeccable` exists
- **WHEN** the kit checks the project
- **THEN** it is web-ui, and the reason names Impeccable

#### Scenario: Explicit type wins
- **GIVEN** `.claude/kit.json` says `project_type: cli`, and a `vite.config.ts` exists
- **WHEN** the kit checks the project
- **THEN** it is not web-ui, and the reason names the type

#### Scenario: Neither
- **WHEN** the project has no type in `kit.json`, no Impeccable and no web app config file
- **THEN** it is not web-ui

### Requirement: UI review safeguard
In a web-ui project, the readiness check SHALL recommend the `ui-review` safeguard when the change's `design.md` or `tasks.md` names UI files (pages, components, styles, or code that generates pages users see), with the files as the reason. A word in the text (for example "button" or "screen") SHALL NOT add it on its own. The user SHALL be able to drop it like any other safeguard, and the choice SHALL be written into the Safeguards section.

#### Scenario: UI files named
- **GIVEN** a web-ui project, and `tasks.md` names `src/app/board/page.tsx` and `src/components/Sticky.tsx`
- **WHEN** the readiness check runs
- **THEN** `ui-review` is recommended, and the reason names those files

#### Scenario: Generated page
- **GIVEN** a web-ui project, and `tasks.md` changes the script that generates the docs page's HTML and CSS
- **WHEN** the readiness check runs
- **THEN** `ui-review` is recommended, and the reason names the generator

#### Scenario: Word alone
- **GIVEN** a web-ui project, and the proposal says "the button label" but the plan only changes a script
- **WHEN** the readiness check runs
- **THEN** `ui-review` is not recommended

#### Scenario: Not web-ui
- **GIVEN** a project that isn't web-ui, and the plan names a page file
- **WHEN** the readiness check runs
- **THEN** `ui-review` is not recommended

### Requirement: UI states and copy in the gap check
In a web-ui project, the readiness check's gap list SHALL also cover, for each screen the change touches, the empty, loading, error, permission and overflow states and unclear copy (labels, error messages), each as a gap only when the specs don't already cover it.

#### Scenario: Missing empty state
- **GIVEN** a web-ui change that adds a board screen, and no scenario says what an empty board shows
- **WHEN** the readiness check runs
- **THEN** the empty board is listed as a gap
