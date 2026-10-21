## ADDED Requirements

### Requirement: Image metadata checked
For staged PNG, JPEG and WebP files, the pre-commit hook SHALL read the images' text metadata (PNG text chunks, EXIF, XMP, comments) and block the commit when it holds a word from `.private-words`, naming the file but not the word. Pixel data SHALL NOT be scanned. Without Node, the hook SHALL warn and not block.

#### Scenario: Word in image metadata
- **GIVEN** `.private-words` lists a project name
- **WHEN** a staged PNG's text chunk, or a JPEG's XMP, contains that name
- **THEN** the commit is blocked, and the message names the image's metadata

#### Scenario: Word only in pixel bytes
- **WHEN** a staged PNG has no text metadata and its compressed pixel data happens to contain the letters of a listed word
- **THEN** the commit goes through
