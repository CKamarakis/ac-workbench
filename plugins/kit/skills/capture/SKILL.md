---
name: capture
description: Save an idea, note, link or screenshot into this project's knowledge folder (knowledge/notes/), or archive and move notes. Use when the user wants to note something down, capture an idea, save what they just dictated with /voice, keep a link or image for later, or archive, move or group notes.
---

# Kit capture

Saves notes as Markdown in the project's knowledge folder, so `/kit:prd` can build PRDs from them later. The format and layout are in `${CLAUDE_PLUGIN_ROOT}/templates/note.md`:
```
 knowledge/
   notes/      one file per note, optional topic folders (notes/checkout/)
   prds/       PRDs (see /kit:prd)
   assets/     images, screenshots
   archive/    moved here on request; never read by the kit
```

All file work goes through the helper. Run it from the project folder:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" <command> --dir . [--json]
```

## Capture a note

1. **Get the content.** It can be typed text, `/voice` dictation (clean up obvious transcription slips, but keep the user's meaning), a pasted text, a link or a path to content stored elsewhere, or an image file.
2. **Title.** If the user gave none, propose one short title from the content. **Write nothing until the user confirms or edits the title.**
3. **Optional:** tags (only ones the user says or clearly implies), and a topic folder if the user names one ("save this under checkout").
4. **Write** with a body file in your scratch space, so long text and quotes survive the shell:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" new-note --dir . --title "<title>" --body-file <tmp.md> [--tags a,b] [--source voice|text|<url or path>] [--topic <folder>] [--asset <image>]
   ```
   - **Pointer note:** pass the link or path as `--source`, and in the body write one or two lines on what it holds. Don't download or copy the pointed-to content.
   - **Image:** pass it with `--asset`. It's copied into `assets/` and linked from the note.
   - Same date and title as an existing note: the helper adds `-2`. It never overwrites.
5. **Reply** with the path it printed, in one line.
6. **Offer a PRD update.** Run `list --json` and look at the PRDs whose status isn't `Shipped`. If the new note plausibly belongs to one or more (title, tags, topic or content), name them, each with a one-line reason, and offer: "Update *<slug>* with this note now?"
   - On a yes, continue with `/kit:prd`'s **per-section update** for that PRD, using this note as a new source. Nothing in the PRD changes without a yes per section.
   - If the PRD is `Building`, add that updating it will make `/kit:next` flag its change for review.
   - If nothing matches, say nothing about PRDs.

## Archive or move notes

Only when the user asks. Nothing is ever deleted.

1. **Find who cites it:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" citing --dir . --note <notes/...md>
   ```
   If any PRD cites it, **name those PRDs to the user before moving**, and say their sources will be updated to the new path.
2. **Move:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/knowledge.mjs" move --dir . --from <notes/...md> --to archive|notes/<topic>
   ```
3. **Report** the new path and the PRDs whose sources were updated.

## Rules

- Confirm before you write: the title for a new note, and the target for a move.
- Never read, list or shortlist anything under `archive/`.
- Never delete a file, and never edit a note's body unless the user asks.
- If the helper prints `error:`, show it and stop. Don't do the step by hand.
- Don't commit. Committing is the user's choice.
