## ADDED Requirements

### Requirement: Private words blocked at commit
The repo's hooks SHALL block a commit when an added line in the staged changes, or the commit message, contains an entry of the local word list `.private-words`, matched case-insensitively as a whole word (so "art" never matches "start"). The block message SHALL name the file (or "commit message") but SHALL NOT print the matched word. The word list SHALL be gitignored and never committed.

#### Scenario: Listed word in a staged file
- **GIVEN** `.private-words` lists a project name
- **WHEN** a staged file adds a line containing that name in any letter case
- **THEN** the commit is blocked, and the message names the file without printing the word

#### Scenario: Listed word in the commit message
- **GIVEN** `.private-words` lists a project name
- **WHEN** the commit message contains that name
- **THEN** the commit is blocked

#### Scenario: Removing a listed word is allowed
- **WHEN** a staged change only deletes lines containing a listed word
- **THEN** the commit goes through

#### Scenario: No word list
- **WHEN** `.private-words` is missing or has only comments and blank lines
- **THEN** the hook prints one warning and lets the commit through

#### Scenario: Word list never committed
- **WHEN** someone runs `git add .private-words`
- **THEN** git ignores it, because `.gitignore` lists it

### Requirement: Test projects named by alias
Committed text SHALL name a real project used for kit tests only by the alias "Acme" (or "the test app"), with no product features, file names or local paths of that project. Detailed trial notes about a real project SHALL stay in the gitignored `private/` folder.

#### Scenario: Tree clean before publishing
- **WHEN** every entry in `.private-words` is searched across the tracked files
- **THEN** there are 0 hits
