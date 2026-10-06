# Spec Delta

## ADDED Requirements

### Requirement: Setup asks one question
The starter SHALL ask only one question: the project type. Each type option SHALL show the tools it adds. When the project's files make a type likely, that type SHALL be recommended first, with the reason. Otherwise "none" is offered first.

The starter SHALL NOT ask about opt-in (`project`-tier) tools. It SHALL list them once in its summary as "available on demand", each with its one-line description. They are added later, when a change needs them.

Global and type tools SHALL be installed without further questions. Steps that need the user (for example a sign-in) SHALL be listed as the user's steps, as before.

Changes to existing files SHALL be shown with their diff, a one-line description and a recommendation, and confirmed together with one yes. The user MAY exclude any of them, and nothing SHALL be applied without that yes.

#### Scenario: Next.js project
- **WHEN** the starter runs in a folder with a `next.config.*` file
- **THEN** the only question is the project type, `web-ui` is offered first with the reason "found next.config.*: this is a web app", and each type lists the tools it adds

#### Scenario: Opt-in tools not asked
- **WHEN** the registry has active `project`-tier tools (e.g. SuperSpec)
- **THEN** the starter asks nothing about them, installs none of them, and its summary lists them as available on demand with their description

#### Scenario: Type tools installed silently
- **WHEN** the user picks `web-ui`
- **THEN** the global tools and the `web-ui` tools are installed without asking about each one

#### Scenario: File changes confirmed together
- **WHEN** the plan changes `CLAUDE.md` and `.gitignore`
- **THEN** both diffs are shown, each with what it adds and "Recommended: yes (<why>)", and one yes applies both, unless the user excludes one

### Requirement: Setup summary in three parts
The starter's summary SHALL have three parts:
- **Done:** what was written, installed or already in place.
- **Needs you:** only steps that block using the project now. Ideally there are none.
- **Later:** steps that matter only when a tool is first used (for example a tool's own init command), each phrased as "when you first <do X>".

An item SHALL appear in only one part. Wording SHALL be written for the user; internal notes (such as unverified install details) SHALL NOT be shown.

#### Scenario: Tool init deferred
- **WHEN** a type tool needs its own init command on first use (e.g. Impeccable's `/impeccable init`)
- **THEN** it is listed under Later ("when you first do UI polish …"), not under Needs you

#### Scenario: No duplicate items
- **WHEN** a file change is skipped
- **THEN** it appears once, with what the user can do about it, and not again elsewhere

### Requirement: OpenSpec config pointer added as a change
When `openspec/config.yaml` already has a block `context:` entry that doesn't mention the project context doc, the starter SHALL propose adding one line to that block as a `CHANGE` with a diff, instead of reporting a conflict. A `context:` that isn't a block (a one-line value) SHALL still be reported as a conflict.

#### Scenario: Existing context block
- **WHEN** `openspec/config.yaml` has `context: |` with two lines and no mention of `docs/project-context.md`
- **THEN** the plan shows a `CHANGE` that adds the pointer line at the end of that block, and nothing else in the file changes

## MODIFIED Requirements

### Requirement: Tools are applied by tier
The starter SHALL ask for the project type (or accept it as an argument). Among registry entries with scope `project` and status `adopted` or `trial`, it SHALL select tools by tier:
- `global`: applied to every project the kit sets up
- `project`: not asked about and not applied at setup; listed in the summary as available on demand, and applied only when the user explicitly asks for it (for example when a change needs it)
- `project-type:<type>`: applied only when that type is selected

Entries with status `dropped` or `later` SHALL NOT be applied or offered. The summary SHALL list each selected tool and why (its tier).

#### Scenario: Web UI project
- **WHEN** the user selects project type `web-ui`
- **THEN** the `global` tools and the `project-type:web-ui` tools with status adopted or trial are applied, other types' tools are not, and each applied tool is listed in the summary

#### Scenario: Opt-in tool
- **WHEN** a `project`-tier tool (e.g. SuperSpec) is adopted or trial
- **THEN** the starter does not ask about it or apply it, lists it as available on demand, and applies it only when the user explicitly asks for it

#### Scenario: Dropped tool excluded
- **WHEN** a registry entry for the selected type has status `dropped`
- **THEN** the starter neither applies nor offers it
