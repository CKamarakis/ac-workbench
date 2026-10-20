## MODIFIED Requirements

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
- **THEN** the starter says nothing describes the project yet and asks the five questions, each with a hint and an example, and writes the answers only on a yes

#### Scenario: Later
- **WHEN** the user says "later" at any point of the step, including after a draft or after changes
- **THEN** the template stays as it is and the summary says how to fill it

#### Scenario: Re-sync
- **GIVEN** `docs/project-context.md` already exists
- **WHEN** the starter re-syncs
- **THEN** it doesn't offer to fill or change the doc
