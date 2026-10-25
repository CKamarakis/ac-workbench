---
name: prd
description: Draft or update a PRD (product requirements) in this project's knowledge folder from the user's notes, move it through Draft/Review/Ready, and hand a Ready PRD to /opsx:propose. Use when the user wants to write, shape, update or review a PRD or requirements, turn notes or an idea into a PRD, or mark a PRD ready.
---

# Kit PRD

Turns the project's notes into a PRD that **the user owns**: they edit it freely, and you propose changes. PRDs live in `<knowledge>/prds/<slug>.md`, with frontmatter `title`, `status` (Draft → Review → Ready → Building → Shipped, or `Dropped` when it won't be built), `sources` (note paths) and `change` (once a change uses it). The body follows `${CLAUDE_PLUGIN_ROOT}/templates/prd.md`.

**Parts** (spec: prd-authoring "PRD parts"). A PRD built over several changes can be split: the parent `prds/<slug>.md` keeps Problem, Users, Goals, Out of scope and a Parts table; each part `prds/<slug>/<part>.md` has `part-of: <slug>`, its own status and `change`, and the part template's sections (Scope, Requirements, Done when, Open questions). Name a part as `<slug>/<part>` (the helper's `name`). Everything below works on a part as on a PRD; a parent with parts is never proposed itself, and needs no `change` to be Building.

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
6b. **Shape offer** (spec: prd-authoring "Shape offered for screens"). Only when all hold: the project is web-ui (`node "${CLAUDE_PLUGIN_ROOT}/scripts/ready.mjs" web-ui --dir .`), the PRD's requirements or UX notes describe a screen users see, and the PRD has no `shape` field yet. Then offer once, with **AskUserQuestion**: run `/impeccable shape` for this PRD (an interview about purpose, people, states and content; it costs tokens), or not.
   - **Yes:** run it; show its confirmed brief as the proposed new "UX notes and assets" section (per-section update below). Only after that section is written: `set-field --file prds/<slug>.md --key shape --value done`. If the user doesn't want the brief written, set nothing, so the offer can come back.
   - **No:** `set-field --file prds/<slug>.md --key shape --value declined`. Never offer it again for this PRD.
   - Never run `shape` without the yes. Run this step again on a per-section update of a PRD that still has no `shape` field.
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

## Parts: add one, or split a PRD

- **Add a part** on request: `new-prd --part-of <parent slug> --title "<title>" [--sources ...]`. It creates `prds/<parent>/<part>.md` as Draft and adds a row to the parent's Parts table. Fill it per section like any PRD.
- **Split a PRD into parts** (spec: prd-authoring "Split a PRD into parts"), only when the user asks:
  1. Read the PRD. Propose the parts (title each) and, per part, which sections, requirements or rows move to it. Show it all in your message. **Write nothing until the user says yes** to the split.
  2. For each part: `new-prd --part-of <slug> --title "<title>"`, then fill its sections with `section-get` / `section-set`.
  3. Trim the parent **per section** (Requirements and the slice-specific rows move out; Problem, Users, Goals and Out of scope stay), each section on a yes. Never delete the parent and never rewrite it whole.
  4. If the parent has a `change` of its own, offer to remove it (the parts carry the changes now): `set-field --file prds/<slug>.md --key change --value ""`, on a yes.
  5. Run `prd-check`. If a part's status should differ from Draft, offer it, on a yes.
- **Drop a part** (or a PRD) that won't be built: `set-field --key status --value Dropped`, on a yes. A parent can then be Shipped once every other part is Shipped.
- **`WARNING ... is Shipped while ...`** from `prd-check` or `set-field`: the parent was marked Shipped with open parts. Name them; offer to ship or drop each, or to set the parent back. It's a warning, never a block.

## Status and handoff

- **The status changes only on the user's yes.** Use `set-field --file prds/<slug>.md --key status --value <Status>`.
- **Before Ready:** run `prd-check --file prds/<slug>.md`, and fix what it reports with the user. If open questions remain, offer step 7 first.
- **Ready → planning:** tell the user the next step is `/opsx:propose`. The project's routing rules make the proposal read the Ready PRD and record a line `PRD: <knowledge>/prds/<slug>.md @ <commit>`. The commit is `git log -1 --format=%h -- <file>`, or `uncommitted` if the file has uncommitted changes. From a part, the proposal also records `PRD parent: <knowledge>/prds/<parent>.md @ <commit>`, so `/kit:next` warns when the part or the parent changes, not when another part does.
- **After the proposal exists:** offer to set `change` to the change name and the status to `Building`, both on a yes.
- **After `/opsx:archive`:** ask whether the PRD is done or continues in another change. A PRD can be built across several changes. Done: offer `Shipped`. Continues: keep `Building`, and once the next change is proposed, offer to set `change` to it. Either way, only on a yes.

## Rules

- You propose; the user decides. Nothing is written without a yes: no draft, no section, no status.
- Never read anything under `archive/`. Never delete files. Don't commit.
- The template and your wording are the kit's own words. Never paste text from third-party material you don't own the rights to into a PRD.
