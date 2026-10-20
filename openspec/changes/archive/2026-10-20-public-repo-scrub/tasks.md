## 1. Guard

- [x] 1.1 Show the user the full `.private-words` list (names, feature names, folder names, local paths) and write it only on a yes; `.gitignore` lists `.private-words` and `private/`; verified with `git check-ignore`
- [x] 1.2 `.githooks/private-words.sh` (shared check), called from `pre-commit` (added lines of `git diff --cached`) and a new `commit-msg` hook; tests in `tests/repo/private-words.test.mjs` cover each "Private words blocked at commit" scenario in a throwaway git repo and pass
- [x] 1.3 `CLAUDE.md` rule: real project names, features and paths never go into committed text; test projects are "Acme"

## 2. Scrub

- [x] 2.1 Move the detailed trial notes that describe the real project to `private/trials/`; leave an Acme summary in `evals/trials/` where the kit findings or a tool choice cite them; tests and evals that read those files still pass
- [x] 2.2 Anonymise every other hit (docs, roadmap, notes, PRDs, archived changes, toolkit.yaml, PRODUCT.md, skills, tests, fixtures): name → Acme, features → generic, file names → generic, local paths → relative; drop the business-plan line
- [x] 2.3 Grep every `.private-words` entry across tracked files: 0 hits, shown to the user; `npm test`, `npm run evals`, `npm run registry` and `npm run smoke` pass

## 3. Fresh repo (each step only after the user's yes, asked right before it)

- [x] 3.1 Commit the scrub on the branch (the guard checks it); ff-merge to main; push to the old repo is skipped
- [x] 3.2 Rename the old GitHub repo to `ac-workbench-archive` and make it private (`gh repo rename`, `gh repo edit --visibility private`); check with `gh repo view`
- [x] 3.3 Create the new public `ac-workbench`; build an orphan branch with one commit from the scrubbed tree; push it as `main`; `origin` points to the new repo, `archive` to the old one; check the new repo has 1 commit and 0 grep hits for the word list
- [x] 3.4 Roadmap: M13 T7 ticked with a note; Now updated
