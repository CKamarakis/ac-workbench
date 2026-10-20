## Context

Privacy so far meant secrets only (gitleaks pre-commit hook, design D15). Real project details were never in scope. The repo is public, with 0 stars and 0 forks (checked 2026-10-20), so nobody depends on its history or URL.

## Decisions

- **D1 Fresh repo over a history rewrite.** Rewriting with `git filter-repo` keeps the URL but can miss variants, in file content or commit messages, and old commits can stay reachable on GitHub. A new repo with one commit leaves nothing old to find. The old repo stays as a private archive.
- **D2 Guard before scrub.** The guard goes in first, so the scrub commit is itself checked.
- **D3 Word list stays local.** `.private-words` (gitignored) has one entry per line, matched case-insensitively as a whole word, with `#` comments. A plain substring was the first plan, but a short feature name on the list would then also block the longer words that contain it (64 files with one such word); `grep -iwF` was checked to separate them. The hook runs `git diff --cached` (added lines) and the commit message through it. A missing or empty list means a warning and no block, so a fresh clone still commits.
  - Whether gitleaks can load an extra local rules file is **unverified**. A small shell check in the hook needs no new tool, so that's the plan.
- **D4 Alias "Acme".** Product-specific features (the canvas feature, the notes feature) become generic ("a canvas feature", "the notes feature"). File names become generic paths (`src/components/canvas/input.ts` → "a canvas input file"). Local paths become relative (`../temp/...`).
- **D5 Private trial notes.** `private/` (gitignored) keeps the detailed trial notes. `evals/trials/<file>.md` keeps the kit findings, the evidence the tool choices cite, written about Acme.
- **D6 Same local folder.** This working folder stays and points `origin` at the new repo; the archive becomes a second remote (`archive`). Claude's memory folder for this path stays valid.
- **D7 Order of the GitHub steps:**
  1. rename the old repo to `ac-workbench-archive` and make it private;
  2. create the new public `ac-workbench`;
  3. push an orphan branch with one commit as its `main`.

  `gh` runs each step only after the user's yes, given right before that step.

- **D8 Author shown as the handle.** The user's surname is on the list. `marketplace.json` and `plugin.json` name the author as `CKamarakis` (the GitHub handle, which the whole-word match leaves alone). The new repo's one commit uses that name and GitHub's noreply email; the user confirms both at task 3.3.

## Risks

- **A missed variant in the scrub.** The word list is grepped across the whole tree (tracked files) before the first commit, and the user sees the list and the 0-hit result.
- **Lost history for CHANGELOG and evidence links.** Commit hashes cited in archived changes point to the private archive. That's acceptable: they're historical.
- **The memory folder still holds the real name.** It sits outside the repo and is never committed.

## Safeguards

- reach: high (every public file, the repo itself)
- undo: high (GitHub repo rename, visibility change and new repo are outside the repo)
- safety: high (user data: the user's private project details)
- chosen: scenario-check, the user's OK before each GitHub step, word-list grep at 0 before publishing
