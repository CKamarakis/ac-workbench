# Spec Delta

## Purpose

Gives each project one plain-Markdown home for its context (notes, PRDs, assets), and lets the user capture a note by voice or text in seconds without any external service.

## ADDED Requirements

### Requirement: Knowledge folder layout
A project's knowledge folder SHALL default to `knowledge/` at the project root, and its location SHALL be configurable per project. It SHALL contain:
- `notes/`
- `prds/`
- `assets/`
- `archive/`

Notes MAY be grouped in topic subfolders under `notes/`. Kit skills SHALL read `notes/` recursively and SHALL NOT read anything under `archive/`.

#### Scenario: Default location
- **WHEN** a project has no knowledge location configured
- **THEN** the kit uses `knowledge/` at the project root

#### Scenario: Configured location
- **WHEN** a project configures its knowledge folder as `docs/knowledge`
- **THEN** capture, PRD and next-step skills all read and write under `docs/knowledge/`

#### Scenario: Topic folder included
- **WHEN** a note sits in `knowledge/notes/checkout/`
- **THEN** it is listed and shortlisted like a note at the top of `notes/`

#### Scenario: Archive ignored
- **WHEN** a note sits in `knowledge/archive/`
- **THEN** no kit skill lists, shortlists or reads it

### Requirement: Note format
Each note SHALL be one Markdown file named `<YYYY-MM-DD>-<slug>.md`, where the slug comes from the title. Its frontmatter SHALL include:
- `title` and `date` (required)
- `tags` (optional list)
- `source` (optional: `voice`, `text`, or a pointer such as a URL or a path)

Two notes with the same date and slug SHALL NOT overwrite each other. The second one gets a numeric suffix.

#### Scenario: Note written
- **WHEN** the user captures "Gift card purchase flow" on 2026-10-06
- **THEN** `knowledge/notes/2026-10-06-gift-card-purchase-flow.md` exists with that title and date in its frontmatter

#### Scenario: Name collision
- **WHEN** a note with the same date and slug already exists
- **THEN** the new note is saved with a suffix such as `-2`, and the existing note is unchanged

### Requirement: Capture a note
The capture skill SHALL save the user's text (typed, dictated with `/voice`, or pasted) as a note. If the user gives no title, the skill SHALL propose one from the content and use it only after the user confirms or edits it. When the user names a topic, the note SHALL go into that topic folder under `notes/`, which is created if missing. A pointer note (a URL or a path to content stored elsewhere) SHALL record the pointer in `source` and SHALL NOT copy the pointed-to content.

#### Scenario: Title proposed
- **WHEN** the user captures text without a title
- **THEN** the skill proposes a title, and writes the note only after the user confirms or edits it

#### Scenario: Topic named
- **WHEN** the user says "save this under checkout"
- **THEN** the note is written in `knowledge/notes/checkout/`

#### Scenario: Pointer note
- **WHEN** the user captures a Figma link with a one-line description
- **THEN** the note has the link as `source` and the description as its body, and nothing is downloaded

#### Scenario: Image attached
- **WHEN** the user provides an image file with a note
- **THEN** the image is stored under `knowledge/assets/`, and the note links to it with a relative path

### Requirement: Offer to update a matching PRD after capture
After a note is saved, the capture skill SHALL check the project's PRDs that are not `Shipped` (excluding `archive/`). If the note plausibly belongs to one or more of them (by title, tags, topic or content), it SHALL name them with a one-line reason and offer to update one with the note through the PRD skill's per-section update. Nothing in a PRD SHALL change unless the user says yes. If no PRD matches, the skill SHALL say nothing about PRDs.

#### Scenario: Late addition to a PRD
- **WHEN** the user captures "gift cards also need an expiry date" and `prds/gift-cards.md` is `Ready`
- **THEN** after saving the note, the skill offers to update `gift-cards` with it, and changes nothing until the user agrees

#### Scenario: PRD already being built
- **WHEN** the matching PRD is `Building`
- **THEN** the offer also says that updating it will make `/kit:next` flag the change for review

#### Scenario: No matching PRD
- **WHEN** no PRD relates to the new note
- **THEN** the skill only reports the saved note

### Requirement: Move and archive notes on request
The kit SHALL move or archive notes only when the user asks. Archived files SHALL go to `archive/` and SHALL NOT be deleted. Before a note that a PRD cites as a source is moved or archived, the kit SHALL tell the user which PRDs cite it. After the move, it SHALL update those PRDs' source paths so that no PRD points at a missing file.

#### Scenario: Archive an unused note
- **WHEN** the user asks to archive a note that no PRD cites
- **THEN** the note is moved to `knowledge/archive/`, and no other file changes

#### Scenario: Archive a cited note
- **WHEN** the user asks to archive a note that `prds/gift-cards.md` cites
- **THEN** the kit names that PRD before moving the note, and afterwards the PRD's sources point to the note's new path

#### Scenario: Nothing deleted
- **WHEN** any move or archive completes
- **THEN** every file that existed before still exists somewhere under the knowledge folder
