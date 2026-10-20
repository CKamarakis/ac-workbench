## ADDED Requirements

### Requirement: A note counts as used when its file is named
A change SHALL count as using a note only when its proposal or design names the note's file with `.md` (`2026-10-08-acme-canvas.md`) or its path (`notes/2026-10-08-acme-canvas.md`). A word that only matches the note's name without `.md` SHALL NOT count.

#### Scenario: Bare word
- **GIVEN** a note `notes/auth.md` and a proposal that says "the auth flow"
- **WHEN** status counts the notes nothing has read yet
- **THEN** `notes/auth.md` is counted as not read

#### Scenario: Named with .md
- **GIVEN** a design that says "from `knowledge/notes/auth.md`"
- **WHEN** status counts the notes nothing has read yet
- **THEN** `notes/auth.md` is counted as read
