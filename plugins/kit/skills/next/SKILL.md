---
name: next
description: Suggest the next workflow step for this project (which skill or command to run, and why) from its OpenSpec state and the kit's lane map. Use when the user asks what's next, what to do now, where they are, or which skill to use.
---

# Kit next

Tells the user the next step and the skill to use, with a one-line reason. The owners come from the kit's lane map, so the answer follows the registry and is never guessed.

## Steps

1. Run from the project folder:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/next.mjs" --dir .
   ```
2. Reply in a few lines:
   - **Next:** the `use` value as the command to run, plus the change name if there is one.
   - **Why:** the reason line.
   - `then`, `next artifact`, the alternative for big or risky changes, and other active changes: mention them only when the script prints them.
3. Don't run the suggested step yourself. Offer to run it; the user decides.

## Notes

- "No OpenSpec here yet": suggest `/kit:start`.
- "no owner yet" for a phase: say so plainly, and that the kit registry decides owners (`/kit:feedback` to raise it).
- If the script fails (e.g. OpenSpec missing), show the error and suggest `/kit:setup`.
