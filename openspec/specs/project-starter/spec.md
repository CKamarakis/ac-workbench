# project-starter Specification

## Purpose
Sets up a new or empty project with the kit's basics in minutes instead of half a day, driven by the registry, safe to re-run, and never destructive to existing project files.

## Requirements

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

### Requirement: Machine tools are checked first
Before changing the project, the starter SHALL run the machine tool setup check. If machine-scope tools are missing, it SHALL offer to install them through tool setup, and SHALL continue with the project only when the required ones are present.

#### Scenario: Missing machine tool
- **WHEN** the starter runs on a machine where an adopted machine-scope tool is missing
- **THEN** it lists the tool, offers to install it, and does not change the project until the user has answered

### Requirement: Project tools are installed per project
The starter SHALL install the selected tools (plugins, MCP servers, skills) for this project only, and SHALL NOT enable or configure them at user level or in a tool's global configuration. It SHALL change only the settings entries it manages, leaving other settings in the project's files untouched. When a tool's install needs the user (for example an OAuth sign-in), the starter SHALL stop at that step, tell the user exactly what to do, and report the tool as pending rather than as installed.

#### Scenario: Interactive install step
- **WHEN** a selected tool's install requires an OAuth sign-in
- **THEN** the starter shows the user the step to complete, and the summary lists the tool as pending until its check passes

#### Scenario: Plugins active only in the bootstrapped project
- **WHEN** the starter has enabled Superpowers for a project
- **THEN** a session in that project lists Superpowers skills, and a session in a repository the kit did not set up does not

#### Scenario: Existing project settings preserved
- **WHEN** the project's settings file already contains user-written permissions
- **THEN** after the starter runs, those permissions are unchanged

### Requirement: Re-runs never overwrite existing files
If a file the starter would create already exists and differs, the starter SHALL show the proposed change as a diff and apply it only after explicit confirmation. It SHALL NOT delete project files.

#### Scenario: Existing CLAUDE.md
- **WHEN** the starter runs in a project whose CLAUDE.md was edited by the user
- **THEN** the starter shows a diff of its proposed additions and leaves the file unchanged unless the user confirms

#### Scenario: Idempotent re-run
- **WHEN** the starter runs twice in a row with the same choices
- **THEN** the second run reports nothing to change

### Requirement: Missing prerequisites are reported, not guessed
Before making changes, the starter SHALL check required command-line tools (e.g. git, openspec). For each missing tool it SHALL report the tool and a suggested install step. It SHALL resolve tools installed outside the shell's PATH where a known location exists.

#### Scenario: CLI not on PATH
- **WHEN** openspec is installed globally via npm but not on the Git Bash PATH
- **THEN** the starter locates and uses it rather than failing

#### Scenario: Tool missing entirely
- **WHEN** git is not installed
- **THEN** the starter stops before changing anything and reports git as missing with an install hint

### Requirement: Starter creates the knowledge folder
When the starter bootstraps or re-syncs a project, it SHALL ensure that the knowledge folder (default `knowledge/`) exists with `notes/`, `prds/`, `assets/` and `archive/`. Empty folders are kept in git with a placeholder file. It SHALL create only what is missing, and SHALL NOT move, rename or edit existing files in that folder.

#### Scenario: New project
- **WHEN** the starter runs in an empty folder
- **THEN** `knowledge/notes/`, `knowledge/prds/`, `knowledge/assets/` and `knowledge/archive/` exist afterwards, and the summary lists them

#### Scenario: Existing knowledge kept
- **WHEN** the starter re-syncs a project whose `knowledge/notes/` already holds notes
- **THEN** those notes are unchanged, and only missing subfolders are planned as `CREATE`

### Requirement: Routing rules include the PRD handoff
The routing rules the starter writes SHALL tell the agent where the knowledge folder is, and SHALL say that the proposal step reads a Ready PRD from it and records the PRD's path and commit. The starter templates (agent instructions and project context doc) SHALL point to the knowledge folder for PRDs and long-lived context.

#### Scenario: Routing block mentions PRDs
- **WHEN** a project is bootstrapped
- **THEN** its routing section names the knowledge folder and the Ready-PRD handoff to the proposal step

#### Scenario: Re-sync shows the change as a diff
- **WHEN** a project set up with an older kit version is re-synced
- **THEN** the routing block change is shown as a `CHANGE` diff, and is written only on a yes

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

### Requirement: Bootstrap installs the basics
When run in a project folder, the starter SHALL ensure the following exist:
- a git repository
- a `.gitignore` with the kit's managed block (personal Claude Code settings are not shared)
- an initialized OpenSpec setup whose config points to the project context doc
- a CLAUDE.md starter with routing rules
- a project context doc
- a kit stamp file recording the kit version and setup date
- the project's selected tools installed for this project only

#### Scenario: Empty folder
- **WHEN** the starter runs in an empty folder
- **THEN** all the basics exist afterwards, and a summary lists what was created

#### Scenario: Personal settings stay private
- **WHEN** a project has `.claude/settings.local.json`
- **THEN** git does not list it as untracked or stageable
