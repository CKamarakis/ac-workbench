## How it works, roughly
Plan first, then apply: the starter works out the files, tools and diffs, asks one question (the project type) and one yes, then writes. In `CLAUDE.md` and `.gitignore` the kit owns only the text between its own markers.

## Why

- **Re-runs never overwrite existing files**: the kit edits only its marked blocks, so your edits survive with simple string handling and no merge logic.
- **Setup asks one question**: in the live trial, setup questions with no need in sight were noise. Tools that cost context while idle wait until a change needs them.
- **Project tools are installed per project**: [[tools-per-project]]
