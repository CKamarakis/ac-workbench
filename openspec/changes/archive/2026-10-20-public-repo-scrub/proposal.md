## Why

The repo is public, and the M13 T7 privacy read (2026-10-20) found that the user's real test project is named and described throughout it:
- 127 tracked files and 19 commit messages give its name;
- they describe its features, stack and file names, local paths, and one business plan.

There are no secrets, but none of this belongs in a builder kit's repo. Renaming in today's files doesn't help, because the git history keeps every old version. Every future trial on a real project would leak the same way.

The user decided (2026-10-20):
- publish a **fresh public repo** from a scrubbed tree, and make the old repo private;
- add a **guard for this repo only** that blocks real names at commit;
- turning the guard into a kit feature can come after v1, if wanted.

## What Changes

- **Guard:**
  - a gitignored word list holds the real names, feature names, folder names and local paths;
  - the pre-commit hook checks staged changes against it, and a new commit-msg hook checks the commit message;
  - the list itself is never committed.
- **Alias:** any real test project is "Acme" in committed text, and its feature details are generic.
- **Scrub of the current tree:**
  - names, features and file names are anonymised, and local paths made relative;
  - the business-plan line is removed;
  - detailed trial notes move to a gitignored `private/` folder, and a short Acme summary stays in their place;
  - tests and fixtures are renamed too.
- **Fresh repo:**
  - the old GitHub repo is renamed and made private, keeping the full history and the `v0.1.0` tag;
  - a new public `ac-workbench` gets one first commit from the scrubbed tree.
  - Each GitHub action is confirmed by the user right before it runs.
- `CLAUDE.md` gets a rule: real project names, features and paths never go into committed text.

```
 guard --> scrub --> check (0 hits, tests pass) --> new public repo (1 commit)
                                                     old repo -> private archive
```

## Capabilities

### New Capabilities
- `repo-privacy`: real project names stay out of commits (word-list guard, alias rule).

### Modified Capabilities

## Impact

- `.githooks/pre-commit`, new `.githooks/commit-msg`, `.gitignore`, `CLAUDE.md`, ~127 tracked files (text only), `evals/trials/`.
- GitHub: old repo renamed and made private; new public repo. Clone URLs keep working only for the new repo.
- Releases: history restarts at one commit; `CHANGELOG.md` (M13 T5) is written from the private archive's history.
