---
name: prd
description: Draft or update a PRD (product requirements) in this project's knowledge folder from the user's notes, move it through Draft/Review/Ready, and hand a Ready PRD to /opsx:propose. Use when the user wants to write, shape, update or review a PRD or requirements, turn notes or an idea into a PRD, or mark a PRD ready.
---

# Kit PRD

Turns the project's notes into a PRD that **the user owns**: they edit it freely, and you propose changes. PRDs live in `<knowledge>/prds/<slug>.md`, with frontmatter `title`, `status` (Draft → Review → Ready → Building → Shipped), `sources` (note paths) and `change` (once a change uses it). The body follows `${CLAUDE_PLUGIN_ROOT}/templates/prd.md`.

All file work goes through the helper, run from the project folder:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" <command> --dir . [--json]
```
If it prints `error:`, show it and stop. Don't do the step by hand.

## Draft a PRD from chosen notes

1. **List the notes:** `list --json`. It never includes `archive/`.
2. **Shortlist.** Pick the notes relevant to the user's idea, and show each with a **one-line reason** ("mentions the checkout steps"). Skip the clearly unrelated ones.
   - If no note is relevant, say so, and offer to draft from the prompt alone with empty sources.
3. **The user picks one or more notes.** Ask with a **multi-select**: several notes can feed one PRD. Draft only from the notes they pick plus what they said. Ask about real gaps first, in one short batch: skip anything the notes already answer.
4. **Create the file:** `new-prd --title "<title>" --sources <path,path>`. It starts as `Draft` from the template, and refuses to overwrite.
5. **Fill each section** with `section-get` (for the hash) and then `section-set` (see below), section by section. Since the file is new, you can fill all sections after one yes on the whole draft.
   - **Anything not in the picked notes or the user's words is not a fact.** Mark it "Assumption:" or list it under Open questions. Never invent users, numbers or quotes.
   - Keep it short and plain: one or two pages, every line useful for deciding or building.
6. **Show the user** the result and the path.

## Update a PRD per section

Run this when the PRD exists and the user wants changes, or new notes should feed in. **Never rewrite the whole file.**

1. For each section you'd change: `section-get --file prds/<slug>.md --heading "<Heading>" --json`. Keep the returned `hash`.
2. Show the proposed new text **per section**, and ask yes or no for each one.
3. Only for approved sections: write the text to a scratch file, then run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" section-set --dir . --file prds/<slug>.md --heading "<Heading>" --text-file <tmp.md> --expect <hash>
   ```
4. **`CONFLICT` (exit 3):** the user edited that section after you read it. Don't retry blindly. Show their current text next to your proposal, and let them choose.
5. **New sources:** add them only after the user agrees, as one more `  - notes/...` line under `sources`. Change nothing else in the frontmatter. Then run `prd-check --file prds/<slug>.md`.

## Status and handoff

- **The status changes only on the user's yes.** Use `set-field --file prds/<slug>.md --key status --value <Status>`.
- **Before Ready:** run `prd-check --file prds/<slug>.md`, and fix what it reports with the user.
- **Ready → planning:** tell the user the next step is `/opsx:propose`. The project's routing rules make the proposal read the Ready PRD and record a line `PRD: <knowledge>/prds/<slug>.md @ <commit>`. The commit is `git log -1 --format=%h -- <file>`, or `uncommitted` if the file has uncommitted changes.
- **After the proposal exists:** offer to set `change` to the change name and the status to `Building`, both on a yes.
- **After `/opsx:archive`:** offer `Shipped`, on a yes.

## Rules

- You propose; the user decides. Nothing is written without a yes: no draft, no section, no status.
- Never read anything under `archive/`. Never delete files. Don't commit.
- The template and your wording are the kit's own words. Never paste text from licensed material (e.g. PM-OS) into a PRD.
