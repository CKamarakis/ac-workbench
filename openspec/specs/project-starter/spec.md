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
- **WHEN** a `project`-tier tool (e.g. Superpowers) is adopted or trial
- **THEN** the starter does not ask about it or apply it, lists it as available on demand, and applies it only when the user explicitly asks for it

#### Scenario: Dropped tool excluded
- **WHEN** a registry entry for the selected type has status `dropped`
- **THEN** the starter neither applies nor offers it

### Requirement: Machine tools are checked first
Before changing the project, the starter SHALL run the machine tool setup check. If machine-scope tools are missing, it SHALL offer to install them through tool setup, and SHALL continue with the project only when the required ones are present.

#### Scenario: Missing machine tool
- **WHEN** the starter runs on a machine where an adopted machine-scope tool is missing
- **THEN** it lists the tool, offers to install it, and does not change the project until the user has answered

#### Scenario: Setup runs on a yes
- **GIVEN** `openspec` is missing on the machine
- **WHEN** the user says yes to installing it
- **THEN** tool setup runs in the same session, and the starter then continues from its prerequisite check

#### Scenario: Tool still not found after setup
- **GIVEN** tool setup ran in this run, and the check still reports the same tool (for example, not on this session's PATH yet)
- **WHEN** the starter checks again
- **THEN** it doesn't offer setup a second time; it says which tool is still not found and that a new session usually sees it

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
The routing rules the starter writes SHALL tell the agent where the knowledge folder is, and SHALL say that the proposal step takes one PRD from it (the most recently updated by default, or the user's pick; never a blocker) and records the PRD's path and commit. The starter templates (agent instructions and project context doc) SHALL point to the knowledge folder for PRDs and long-lived context.

#### Scenario: Routing block mentions PRDs
- **WHEN** a project is bootstrapped
- **THEN** its routing section names the knowledge folder and the PRD handoff to the proposal step

#### Scenario: Re-sync shows the change as a diff
- **WHEN** a project set up with an older kit version is re-synced
- **THEN** the routing block change is shown as a `CHANGE` diff, and is written only on a yes

### Requirement: Setup asks one question
The starter SHALL ask only one setup question: the project type. Filling the project context doc after a fresh setup is an offer about the project, not a setup question, and can be skipped. Each type option SHALL show the tools it adds. When the project's files make a type likely, that type SHALL be recommended first, with the reason. Otherwise `web-ui` SHALL be offered first without a recommendation. "none" SHALL be offered last.

The starter SHALL NOT ask about opt-in (`project`-tier) tools. It SHALL list them once in its summary as "available on demand", each with its one-line description. They are added later, when a change needs them.

Global and type tools SHALL be installed without further questions. Steps that need the user (for example a sign-in) SHALL be listed as the user's steps, as before.

Changes to existing files SHALL be shown with their diff, a one-line description and a recommendation, and confirmed together with one yes. The user MAY exclude any of them, and nothing SHALL be applied without that yes.

#### Scenario: Next.js project
- **WHEN** the starter runs in a folder with a `next.config.*` file
- **THEN** the only question is the project type, `web-ui` is offered first with the reason "found next.config.*: this is a web app", and each type lists the tools it adds

#### Scenario: Opt-in tools not asked
- **WHEN** the registry has active `project`-tier tools (e.g. Superpowers)
- **THEN** the starter asks nothing about them, installs none of them, and its summary lists them as available on demand with their description

#### Scenario: Type tools installed silently
- **WHEN** the user picks `web-ui`
- **THEN** the global tools and the `web-ui` tools are installed without asking about each one

#### Scenario: File changes confirmed together
- **WHEN** the plan changes `CLAUDE.md` and `.gitignore`
- **THEN** both diffs are shown, each with what it adds and "Recommended: yes (<why>)", and one yes applies both, unless the user excludes one

#### Scenario: Empty folder type order
- **GIVEN** an empty folder, so no file makes a type likely
- **WHEN** the starter asks for the project type
- **THEN** `web-ui` is the first option, not marked "Recommended", and "none" is the last

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

#### Scenario: Kit lines kept when the file already has them
- **GIVEN** a `.gitignore` that already lists `.claude/settings.local.json`
- **WHEN** the starter adds its block
- **THEN** the block still lists it, so the settings file stays ignored even if the user later removes their own line, and a re-run changes nothing

### Requirement: Docs page mentioned at setup
The starter's summary SHALL list `/kit:docs` once under Later, saying that it is optional, suits projects that grow beyond a day or two, and can be started at any point, also mid-project: "optional: when you want a browsable page of what's built (worth it beyond a day or two of work), run /kit:docs, any time, also mid-project". The starter SHALL NOT create `knowledge/docs/` or `knowledge/foundations/`.

#### Scenario: Fresh project
- **WHEN** `/kit:start` finishes on a new project
- **THEN** the summary's Later part mentions `/kit:docs`, and no docs folder exists

### Requirement: Re-sync without tool installs
A re-sync SHALL be able to apply the project's file updates (such as the CLAUDE.md routing block, the `.gitignore` block and the kit stamp) without installing, updating or enabling any tool. The summary SHALL list the tools it left alone, so the user can install them later with a full re-sync.

The starter SHALL ask whether to install tools only on a re-sync whose plan would install one; a fresh setup and a re-sync with nothing to install SHALL ask nothing beyond the project type.

#### Scenario: Re-sync with nothing to install
- **GIVEN** a project whose tools are all present
- **WHEN** the user re-syncs
- **THEN** the starter asks no question about tools

#### Scenario: Taking a kit update without installs
- **GIVEN** a project set up with an older kit, whose routing block is out of date and whose project tools are not all installed
- **WHEN** the user re-syncs with files only and confirms the routing-block diff
- **THEN** the routing block and the stamp are updated, no install command runs, and the summary lists the tools left alone

### Requirement: Kit installed per project
The starter SHALL make sure the kit plugin is enabled for the project in the project's shared settings (`.claude/settings.json`), the same way as every other project tool. When the kit is running only from a user-level install, the starter SHALL install it at project scope for this project, and its summary SHALL say that the user-level install can be removed once every kit project has its own. The starter SHALL NOT remove the user-level install itself.

#### Scenario: New project
- **GIVEN** the user ran `claude plugin install kit@ac-workbench --scope project` in an empty folder
- **WHEN** the user runs `/kit:start`
- **THEN** the kit is listed as present for this project, and the project's `.claude/settings.json` enables it

#### Scenario: Project moved off a user-level kit
- **GIVEN** a kit project whose `.claude/settings.json` doesn't enable the kit, and the kit is installed at user level
- **WHEN** the user re-syncs the project with `/kit:start`
- **THEN** the kit is installed at project scope for this project, and the summary says the user-level install can be removed once every kit project has its own

#### Scenario: Repository the kit didn't set up
- **GIVEN** the kit is installed only at project scope in other folders
- **WHEN** the user opens a Claude Code session in a repository without it
- **THEN** no kit skill or hook is active in that session

### Requirement: Roadmap mentioned at setup
The starter SHALL NOT ask about a roadmap; the project type stays its only question. When the project has no `<knowledge>/roadmaps/roadmap.md`, the summary SHALL list `/kit:roadmap` once under Later, saying that it is optional and keeps the goals in order, what's left and the decisions waiting. The starter SHALL NOT create a `roadmaps/` folder.

#### Scenario: No roadmap yet
- **GIVEN** a project with no `knowledge/roadmaps/roadmap.md`
- **WHEN** the starter runs
- **THEN** it asks only the project type, its summary's Later part mentions `/kit:roadmap` once as optional, and no `roadmaps/` folder exists

#### Scenario: Roadmap already there
- **GIVEN** a project with `knowledge/roadmaps/roadmap.md`
- **WHEN** the starter re-runs
- **THEN** the summary doesn't mention `/kit:roadmap`

### Requirement: Project context filled at setup
Right after a fresh setup creates `docs/project-context.md`, the starter SHALL offer to fill it as its own step. When files describe the project, it SHALL name them and ask whether to draft from them, ask the questions instead, or leave it for later; with nothing or too little describing it, it goes to the questions. Files this run just wrote are not sources. A draft SHALL be in the message in full, each section with its source and guesses marked, before the user is asked whether it is right. It SHALL write only on a yes.

#### Scenario: Source first
- **GIVEN** a fresh setup in a project whose README and AGENTS.md describe the app
- **WHEN** the files are applied
- **THEN** the starter names those files and asks whether to draft from them, ask the questions instead, or leave it for later, before drafting anything

#### Scenario: Draft from the project
- **GIVEN** the user chose to draft from the project's files
- **WHEN** the starter has the draft
- **THEN** every section's text is in its message, each with where it came from and any guess marked, followed by the question "Is this right about your project?" (yes, change something, questions instead), and the doc is written only on a yes

#### Scenario: Never ask about unseen text
- **WHEN** the starter asks the user to approve a draft
- **THEN** the draft's full text is in the same message before the question, and not only in the question's options

#### Scenario: Questions for an empty project
- **GIVEN** a fresh setup in a project with no README, CLAUDE.md content, AGENTS.md or docs, or only a one-line README; the blank context doc and the kit's CLAUDE.md text this run wrote don't count
- **WHEN** the files are applied
- **THEN** the starter says nothing describes the project yet and asks the three core questions (problem, users, "I use it to ...") with a hint and an example each, mentions answering by voice (`/voice`), then offers the two optional ones (rules for the agent, not now), and writes the answers only on a yes

#### Scenario: Later
- **WHEN** the user says "later" at any point of the step, including after a draft or after changes
- **THEN** the template stays as it is and the summary says how to fill it

#### Scenario: Re-sync
- **GIVEN** `docs/project-context.md` already exists
- **WHEN** the starter re-syncs
- **THEN** it doesn't offer to fill or change the doc

#### Scenario: Where more context goes
- **WHEN** the context step ends, written or left for later
- **THEN** the starter says that specs, briefs or notes can go in `docs/` (or ideas through `/kit:capture`), and that the user can ask to update the context doc from them

### Requirement: First step after setup
The starter's summary SHALL end with one next step. On a project with no notes, PRDs or changes yet, it SHALL name two first steps: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea the user already has. Otherwise it SHALL name `/kit:next`. After the next step it SHALL add one line saying that the `/opsx:` commands come from OpenSpec, as a short link rather than the full URL, and that `/kit:next` guides the user through explore, propose, apply and archive, and then close with "**Have fun!**".

#### Scenario: New project
- **GIVEN** a fresh setup in a project with no notes, PRDs or changes
- **WHEN** the summary ends
- **THEN** it names `/kit:capture` and `/opsx:explore`, each with what it's for, and not `/kit:next`

#### Scenario: Where the opsx commands come from
- **WHEN** the summary ends, on a new project or not
- **THEN** after the next step there is one line naming OpenSpec as a link (not the full URL) and `/kit:next` as the guide through explore, propose, apply and archive, and the last line is "**Have fun!**"

### Requirement: Re-sync brings tools to the tested version
On a re-sync, a project tool whose recorded version is older than the version the kit tested SHALL be shown as an update with its command, and updated only on the same yes as installs. A newer one SHALL be named, never downgraded. OpenSpec skills older than the machine's CLI SHALL be updated the same way; a CLI older than tested SHALL be a warning.

#### Scenario: Old Impeccable
- **GIVEN** a kit project with Impeccable 4.5.0 and a registry that tested 4.6.0
- **WHEN** the starter plans a re-sync
- **THEN** the plan shows `UPDATE impeccable` from 4.5.0, tested 4.6.0, with its update command, and the tools question is asked

#### Scenario: Files only
- **WHEN** the user picks "Files only" on that re-sync
- **THEN** no update command runs and the summary lists Impeccable as left alone

#### Scenario: Newer than tested
- **GIVEN** Impeccable 4.7.0 and a tested 4.6.0
- **WHEN** the starter plans
- **THEN** Impeccable counts as present, the plan says it's newer than the kit tested, and nothing is updated

#### Scenario: Old OpenSpec skills
- **GIVEN** OpenSpec skills written by 1.13.2 and OpenSpec 1.14.3 on the machine
- **WHEN** the starter plans a re-sync
- **THEN** the plan shows `UPDATE openspec-skills` with `openspec update`, and says it also removes skills outside the machine's OpenSpec profile

#### Scenario: Old OpenSpec CLI
- **GIVEN** OpenSpec 1.13.0 on the machine and a tested 1.14.3
- **WHEN** the starter plans
- **THEN** the plan warns that the CLI is older than tested, with its install command, and runs nothing for it

### Requirement: OpenSpec tasks avoid manual checks
The starter SHALL add a `rules.tasks` entry to `openspec/config.yaml` saying that tasks must not need a running app, a browser or a check by hand. It SHALL add the entry only where it can be placed safely; otherwise it SHALL report a conflict that names the line to add. A config that already has the line SHALL be left as it is.

#### Scenario: Config without rules
- **WHEN** `openspec/config.yaml` has no `rules:` entry
- **THEN** the plan shows a `CHANGE` that appends `rules:` with a `tasks:` list holding the kit's line, and nothing else changes

#### Scenario: Config with rules for other artifacts
- **GIVEN** `openspec/config.yaml` has a `rules:` block with a `proposal:` list and no `tasks:` list
- **WHEN** the starter plans
- **THEN** it adds a `tasks:` list holding the kit's line inside that block, and keeps the proposal rules

#### Scenario: Rule already there
- **WHEN** the config already holds the kit's line
- **THEN** the config is reported unchanged

#### Scenario: Rules not placeable
- **WHEN** `rules:` is written on one line (e.g. `rules: {}`)
- **THEN** the config is reported as a conflict that names the line to add, and the file is not written

### Requirement: Setup committed before building
The setup summary SHALL end, when it wrote or changed files, by suggesting that the user commit the setup files on their own before starting a change, and SHALL offer to make that commit. It SHALL commit only on a yes.

#### Scenario: Files written
- **WHEN** a setup or re-sync wrote files
- **THEN** the summary suggests committing them now, in their own commit, and offers to commit on a yes

#### Scenario: Nothing written
- **WHEN** nothing changed
- **THEN** no commit is suggested

### Requirement: Saved type reused
On a re-sync, the starter SHALL take the project type saved in `.claude/kit.json` and SHALL NOT ask the type question. It SHALL say which type it uses and where it came from, and ask only when the user says the type changed. A first setup, or a stamp without a type, SHALL ask as before.

#### Scenario: Re-sync with a saved type
- **GIVEN** `.claude/kit.json` has `"project_type": "web-ui"`
- **WHEN** the user runs `/kit:start`
- **THEN** no type question is asked, and the summary says "Type: web-ui (saved in .claude/kit.json; say if it changed)"

#### Scenario: First setup
- **WHEN** the folder has no `.claude/kit.json`
- **THEN** the type question is asked
