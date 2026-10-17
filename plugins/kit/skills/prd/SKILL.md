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
2. **Explore records first** (explore-stage): run `node "${CLAUDE_PLUGIN_ROOT}/scripts/explore.mjs" list --json`. If a record is `ready-for-prd`, offer it first: drafting from it uses its **decisions** as the main input and its `sources` (notes) as the PRD's sources. A record still `exploring` has open questions: say so, and offer to continue `/opsx:explore` instead. With no record (or the user declines), shortlist notes as below.
   **Shortlist.** Pick the notes relevant to the user's idea, and show each with a **one-line reason** ("mentions the checkout steps"). Skip the clearly unrelated ones.
   - If no note is relevant, say so, and offer to draft from the prompt alone with empty sources.
3. **The user picks one or more notes.** Ask with a **multi-select**: several notes can feed one PRD. Draft only from the notes they pick plus what they said. Ask about real gaps first, in one short batch: skip anything the notes already answer.
4. **Create the file:** `new-prd --title "<title>" --sources <path,path>`. It starts as `Draft` from the template, and refuses to overwrite.
   - Drafted from an explore record: then link it, `node "${CLAUDE_PLUGIN_ROOT}/scripts/explore.mjs" link-prd --dir . --slug <record> --prd prds/<slug>.md`. The record is then closed (`in-prd`); later changes go into the PRD.
5. **Fill each section** with `section-get` (for the hash) and then `section-set` (see below), section by section. Since the file is new, you can fill all sections after one yes on the whole draft.
   - **Anything not in the picked notes or the user's words is not a fact.** Mark it "Assumption:" or list it under Open questions. Never invent users, numbers or quotes.
   - Keep it short and plain: one or two pages, every line useful for deciding or building.
   - **Requirements as stories:** "Given <starting state>, when <the user does X>, then <what they see>", grouped by flow or screen. Replace the template's example line. Keep a short plain statement where there's no meaningful starting state or action (a limit, a rule). The proposal step turns these stories into spec scenarios.
6. **Show the user** the result and the path, in a few lines. Leave the open questions out of this report; they get their own step.
7. **Open questions, now or later.** If the PRD's Open questions section has items, say how many there are and that they must be answered before Ready. Then ask with **AskUserQuestion**: go through them now, or later?
   - **Now:** ask the questions in batches of up to 4. Give each 2–3 concrete options, with your recommendation first, plus a **Later** option for that one question. Write each answer into the section it belongs to (per-section update, below) and remove it from Open questions. Items answered Later stay there.
   - **Later:** change nothing. Say that the questions stay in the PRD's Open questions section, and that `/kit:next` will remind the user until they're answered.

Run step 7 again whenever an update leaves open questions, and before a PRD is marked Ready.

## Update a PRD per section

Run this when the PRD exists and the user wants changes, or new notes should feed in. **Never rewrite the whole file.**

**Which PRD:** if the user didn't name one, offer the PRDs from `list` **in its order: most recently updated first** (it already sorts them; don't re-sort). Show each one's status and its update date.

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
- **Before Ready:** run `prd-check --file prds/<slug>.md`, and fix what it reports with the user. If open questions remain, offer step 7 first.
- **Ready → planning:** tell the user the next step is `/opsx:propose`. The project's routing rules make the proposal read the Ready PRD and record a line `PRD: <knowledge>/prds/<slug>.md @ <commit>`. The commit is `git log -1 --format=%h -- <file>`, or `uncommitted` if the file has uncommitted changes.
- **After the proposal exists:** offer to set `change` to the change name and the status to `Building`, both on a yes.
- **After `/opsx:archive`:** offer `Shipped`, on a yes.

## Rules

- You propose; the user decides. Nothing is written without a yes: no draft, no section, no status.
- Never read anything under `archive/`. Never delete files. Don't commit.
- The template and your wording are the kit's own words. Never paste text from third-party material you don't own the rights to into a PRD.
