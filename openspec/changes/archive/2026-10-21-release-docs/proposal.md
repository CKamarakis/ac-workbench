## Why

M13 T2 and T5: a stranger landing on the repo needs to know in one screen who the kit is for, what it does, its status and limits, how to install it and what to do first. The README opened with an internal flow diagram and a "personal kit" line. There was no CHANGELOG, and the public history restarted at one commit (public-repo-scrub), so the version record has to live in a file.

## What Changes

- **README for strangers:** who it's for, a screenshot of the kit's own docs page, status, quickstart, the happy path ("start at any step"), limits, coming next, then the existing reference sections. The screenshots show only this repo: `docs/images/docs-page.png` (the kit's docs page, rebuilt from the current specs) and `docs/images/kit-status.png` (`/kit:status` on this repo). Nothing from the test project.
- **`CHANGELOG.md`:** every kit version from 0.1.0 to 0.21.1 with its date and what changed for users, taken from the private archive's history and written about Acme where needed.
- **Docs page rebuilt** (`knowledge/docs/index.html`, built from 2026-10-20-release-basics).
- The `v1.0.0-rc.1` tag (the M13 exit) waits for the user's test-sheet run (T6) and its fixes. It's not part of this change.

## Capabilities

### New Capabilities

### Modified Capabilities
- `repo-release`: README for strangers, changelog.

## Impact

- `README.md`, `CHANGELOG.md`, `docs/images/*.png`, `knowledge/docs/index.html`, a test.
