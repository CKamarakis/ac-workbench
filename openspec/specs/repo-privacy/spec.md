# repo-privacy Specification

## Purpose
TBD - created by archiving change public-repo-scrub. Update Purpose after archive.

## Requirements

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

### Requirement: Image metadata checked
For staged PNG, JPEG and WebP files, the pre-commit hook SHALL read the images' text metadata (PNG text chunks, EXIF, XMP, comments) and block the commit when it holds a word from `.private-words`, naming the file but not the word. Pixel data SHALL NOT be scanned. Without Node, the hook SHALL warn and not block.

#### Scenario: Word in image metadata
- **GIVEN** `.private-words` lists a project name
- **WHEN** a staged PNG's text chunk, or a JPEG's XMP, contains that name
- **THEN** the commit is blocked, and the message names the image's metadata

#### Scenario: Word only in pixel bytes
- **WHEN** a staged PNG has no text metadata and its compressed pixel data happens to contain the letters of a listed word
- **THEN** the commit goes through
