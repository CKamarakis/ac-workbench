## ADDED Requirements

### Requirement: Project context filled at setup
Right after a fresh setup creates `docs/project-context.md`, the starter SHALL offer to fill it. With enough to go on in the project (README, CLAUDE.md, AGENTS.md, the package.json description, docs), it SHALL show a draft in full; otherwise it SHALL ask five questions with hints and examples: the problem, the users, "I use it to ...", rules the agent can't see in the code, and what not to do yet. It SHALL write only on a yes; "later" leaves the template.

#### Scenario: Draft from the project
- **GIVEN** a fresh setup in a project whose README describes the app
- **WHEN** the files are applied
- **THEN** the starter shows a full draft of the context doc built from the README and writes it only on a yes

#### Scenario: Questions for an empty project
- **GIVEN** a fresh setup in a project with no README, CLAUDE.md content, AGENTS.md or docs
- **WHEN** the files are applied
- **THEN** the starter asks the five questions, each with a hint and an example, and writes the answers only on a yes

#### Scenario: Later
- **WHEN** the user says "later" to the offer
- **THEN** the template stays as it is and the summary says how to fill it

#### Scenario: Re-sync
- **GIVEN** `docs/project-context.md` already exists
- **WHEN** the starter re-syncs
- **THEN** it doesn't offer to fill or change the doc

### Requirement: First step after setup
The starter's summary SHALL end with one next step. On a project with no notes, PRDs or changes yet, it SHALL name two first steps: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea the user already has. Otherwise it SHALL name `/kit:next`.

#### Scenario: New project
- **GIVEN** a fresh setup in a project with no notes, PRDs or changes
- **WHEN** the summary ends
- **THEN** it names `/kit:capture` and `/opsx:explore`, each with what it's for, and not `/kit:next`

## MODIFIED Requirements

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

### Requirement: Setup asks one question
The starter SHALL ask only one setup question: the project type. Filling the project context doc after a fresh setup is an offer about the project, not a setup question, and can be skipped. Each type option SHALL show the tools it adds. When the project's files make a type likely, that type SHALL be recommended first, with the reason. Otherwise "none" is offered first.

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
