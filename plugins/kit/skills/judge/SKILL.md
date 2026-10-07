---
name: judge
description: Recommend plain OpenSpec or SuperSpec for a change from a risk checklist (payments, auth, personal data, data migration, hard to undo, wide reach, vague spec), with the reasons. Use at /opsx:propose time, or when the user asks which flow to use, whether a change is big or risky, or whether to use SuperSpec.
---

# Kit judge

Gives a flow recommendation the user can check: the matched risk items and the words that matched. **The user decides**; never switch flows on your own.

1. Get the text: the Ready PRD file (preferred), the proposal, or the user's description.
2. Run:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/judge.mjs" --file <path>
   # or
   node "${CLAUDE_PLUGIN_ROOT}/scripts/judge.mjs" --text "<description>"
   ```
3. Show the result as printed (recommended flow, why, the matched items), and ask which flow to use.
   - **OpenSpec:** continue with `/opsx:propose` as usual.
   - **SuperSpec:** say it's added for this project on demand (it isn't installed by `/kit:start`), and that its setup needs the user's steps; don't install anything without a yes.
4. The checklist is conservative: a cosmetic change in a risky area (a typo on the login page) can be flagged. Say so when it looks like that, and let the user pick.
