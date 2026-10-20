## MODIFIED Requirements

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
