## Why

The release-candidate run on a real project (M13 T6, 2026-10-21, written about as Acme) and the README work found five things to fix before tagging v1.0.0-rc.1:
1. `/kit:start` asked the project type again on a re-sync, although `.claude/kit.json` already had it.
2. `/kit:docs` on a project with history drafted about 29 notes and cards and asked for each one: 29 approvals. The content was good; the asking wasn't.
3. The docs page showed backticks literally in "How it works", the Why notes and the cards.
4. The pre-commit privacy guard reads text lines, so image metadata (EXIF, XMP, PNG text) was never checked; a screenshot carried editor metadata.
5. The README's happy path left out `/kit:capture` and the "any time" commands.

`/kit:verify` took 10+ minutes on the real project. That's for investigation (M14 T4), not part of this change.

## What Changes

- **`/kit:start`:** the plan reports `savedType` from `.claude/kit.json`. A re-sync uses it, says so in one line, and asks only if the user says it changed.
- **`/kit:docs`:** more than 3 drafts → list them, ask once ("Write all", "One by one", "Not now"), and draft in parallel with the Agent tool (one agent per capability, then one per card). Then build, and the user reviews with `git diff`. Smaller batches keep the per-draft question.
- **Docs page:** `` `code` `` renders as code in How it works, Why and cards, still escaped, with card links kept.
- **Privacy guard:** for staged PNG, JPEG and WebP files, the hook reads their metadata (never the pixels) through `.githooks/image-text.mjs` and checks it against `.private-words`. `docs/images/kit-status.png` loses its editor metadata.
- **README:** the happy path starts at `/kit:capture` and lists status, next, docs, roadmap and loose ends under "Any time".
- **Release:** kit `1.0.0-rc.1`, a CHANGELOG entry, and the tag `v1.0.0-rc.1` (the M13 exit).

## Capabilities

### New Capabilities

### Modified Capabilities
- `project-starter`: saved type reused.
- `living-docs`: one yes for a big batch; code in notes.
- `repo-privacy`: image metadata checked.

## Impact

- `plugins/kit/scripts/start-plan.mjs`, `plugins/kit/skills/start/SKILL.md`, `plugins/kit/skills/docs/SKILL.md`, `plugins/kit/scripts/docs-page.mjs`, `.githooks/private-words.sh`, `.githooks/image-text.mjs` (new), `docs/images/kit-status.png`, `README.md`, `CHANGELOG.md`, tests and evals.
- Existing projects get the start and docs behaviour on `claude plugin update`. The hook applies to this repo only.
