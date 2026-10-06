# Spec Delta

## ADDED Requirements

### Requirement: Import a transcript file as a note
The capture skill SHALL import an existing `.txt` or `.md` file as a note when the user points to it. It SHALL propose a title (and tags, when the content clearly suggests them) and SHALL write only after the user confirms. The note SHALL get the standard name and frontmatter, with `source` recording where the file came from. The text SHALL be kept unchanged: no rewording, no summarising.

When the file already sits under `notes/`, the imported note SHALL replace it: same text, new name and frontmatter, and nothing else left behind. When the file is outside the knowledge folder, the original SHALL be left where it is. An existing frontmatter title or date in a `.md` file SHALL be kept unless the user changes it.

#### Scenario: Transcript dropped into notes
- **WHEN** the user drops `knowledge/notes/call with anna.txt` and asks to import it, confirming the title "Call with Anna about gift cards"
- **THEN** `knowledge/notes/<date>-call-with-anna-about-gift-cards.md` exists with that title, the original text in its body, `source: call with anna.txt`, and the `.txt` file is gone

#### Scenario: File outside the knowledge folder
- **WHEN** the user imports `C:/Downloads/interview.txt`
- **THEN** a note is created with the file's text, and `C:/Downloads/interview.txt` still exists

#### Scenario: Text kept as is
- **WHEN** any file is imported
- **THEN** the note body, apart from line endings, is byte-identical to the file's text (minus any frontmatter it already had)

### Requirement: Unimported files are reported
Listing the knowledge folder SHALL report `.txt` files under `notes/` (excluding `archive/`) as not imported yet. They are not notes until they are imported. When there are any, the capture skill SHALL offer to import them.

#### Scenario: Stray transcript reported
- **WHEN** `knowledge/notes/raw.txt` exists
- **THEN** the listing shows it as not imported, and it is not counted or shortlisted as a note
