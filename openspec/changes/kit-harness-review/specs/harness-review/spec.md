# Spec Delta

## Purpose

Gives any Claude Code user a read-only check-up of a project's agent setup: a map of what's there, a rating of eight harness layers, and at most three fixes with reasons, building on Claude Code's own checks instead of repeating them.

## ADDED Requirements

### Requirement: Setup scan
A scan SHALL list the current project's Claude Code setup without AI and without reading memory text: instruction files (`CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `.claude/rules/`) with their sizes; skills, subagents and commands at project and user level with name, description and size; hooks per event (project, local and user settings); permission rules; MCP servers; enabled plugins, each with the hooks and skills it turns on when its install folder is found (else marked "not inspected"); it SHALL NOT judge a plugin's own code; and the project's auto-memory files with their `type` and size. Each item SHALL name its file. A missing or unreadable file SHALL be reported, not fail the scan.

#### Scenario: Plain Claude Code project
- **GIVEN** a project with a `CLAUDE.md`, two skills in `.claude/skills/` and no kit
- **WHEN** the scan runs
- **THEN** it lists the `CLAUDE.md` with its size, both skills with name and description, and reports the kit as not present

#### Scenario: Plugin hooks count
- **GIVEN** the kit plugin is enabled and adds an archive-gate hook
- **WHEN** the scan runs
- **THEN** it lists the kit with its blocking hook and its skills, so the guardrails layer can count the gate

#### Scenario: Broken settings file
- **GIVEN** `.claude/settings.json` holds invalid JSON
- **WHEN** the scan runs
- **THEN** it reports that file as unreadable and lists everything else

### Requirement: Review starts with a map
The review SHALL begin with a plain-ASCII diagram of the setup built from the scan: the instruction files, skills, hooks, MCP servers, plugins and memory, and how they connect to a session, before rating any layer.

#### Scenario: Map first
- **WHEN** the user runs `/kit:harness-review`
- **THEN** the first section of the output is the ASCII map

### Requirement: Eight layers rated
The review SHALL rate eight layers (context, tools, memory, loops, verification, guardrails, feedback, observability) as OK, PARTIAL or GAP, each with a one-line note naming the evidence from the scan or the project. Each rating SHALL follow the questions in the review's checklist for that layer.

#### Scenario: Almost empty setup
- **GIVEN** a project with no `CLAUDE.md` and no `.claude` folder
- **WHEN** the review runs
- **THEN** it gives a short report: the map shows what's missing, most layers are GAP, and the first fix is writing a `CLAUDE.md`

#### Scenario: No verification
- **GIVEN** a project with no test script, no verify step and no hook that runs checks
- **WHEN** the review rates verification
- **THEN** verification is GAP, and the note says nothing checks the agent's work

### Requirement: Memory checked by type
The memory layer SHALL look at each auto-memory file's `type` and content shape, and SHALL flag knowledge kept as the wrong kind, for example step-by-step instructions for a recurring task stored as a memory instead of a skill, or project facts that belong in `CLAUDE.md`.

#### Scenario: Procedure stored as memory
- **GIVEN** a memory file holding numbered steps for a recurring task
- **WHEN** the review checks memory
- **THEN** it flags the file and suggests turning it into a skill

### Requirement: Built-in checks are pointed to, not repeated
The review SHALL NOT re-check what Claude Code's built-ins cover. The context layer SHALL recommend `/doctor prompt-audit` for outdated, broken or conflicting instructions, and the tools layer SHALL recommend `/skill-doctor` for skill cost and usage, each with one line on when it's worth running.

#### Scenario: Large instruction files
- **GIVEN** a project whose `CLAUDE.md` and rules add up to many kilobytes
- **WHEN** the review rates context
- **THEN** the note recommends running `/doctor prompt-audit`, and the review doesn't list instruction conflicts itself

### Requirement: Scorecard and top fixes
The review SHALL end with a scorecard of the eight layers and at most three fixes, ordered by impact, each naming its layer, what to do, and why that layer matters.

#### Scenario: Scorecard format
- **WHEN** a review completes
- **THEN** it shows eight rated layers and no more than three fixes, each with a reason

### Requirement: Kit checks only with the kit
When the project has `.claude/kit.json`, the review SHALL also check the kit's setup: unresolved tool overlaps from the lane map (under loops) and whether the CLAUDE.md routing block is present and current (under context). Without the kit it SHALL NOT mention the kit's tools or suggest installing the kit.

#### Scenario: Project without the kit
- **GIVEN** a project with no `.claude/kit.json`
- **WHEN** the review runs
- **THEN** no layer note or fix mentions the kit

#### Scenario: Kit overlap
- **GIVEN** a kit project whose registry has two active tools owning `plan` with no recorded overlap
- **WHEN** the review rates loops
- **THEN** it flags the overlap

### Requirement: Read-only, report on a yes
The review SHALL NOT create, change or delete any file in the project or in user settings. The report SHALL stay in the chat; it SHALL be saved as a note in the project's knowledge folder only when the user says yes.

#### Scenario: Saved note keeps personal setup private
- **GIVEN** the user has 12 skills and 2 plugins at user level
- **WHEN** the user says yes to saving the report
- **THEN** the note names only project-level items and shows the user-level ones as counts ("12 user skills, 2 plugins"); the chat report still shows them in full

#### Scenario: Read-only review
- **WHEN** a review runs and the user doesn't ask to save it
- **THEN** no file is created or changed
