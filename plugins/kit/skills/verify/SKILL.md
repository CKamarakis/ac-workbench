---
name: verify
description: Check an OpenSpec change before it is archived - run the project's tests (by its type's test policy), list changed files without tests, run /security-review and /code-review on the change, and write a verify report; failing tests and high-severity security findings block the archive. Use when the user asks to verify, check or review a change before closing it, when all tasks of a change are done, or when an archive was blocked for a missing or failing verify report.
---

# Kit verify

Checks one change and writes `openspec/changes/<change>/verify.md`. **HARD** items block `/opsx:archive` (a kit hook enforces it); **ADVISORY** items are for the user to decide.

| HARD (blocks) | ADVISORY (user's call) |
|---|---|
| a required test script fails | changed source files without a matching test |
| a required test script is missing (when the project type's policy says so) | code-review findings, lower-severity security findings |
| a **high**-severity security finding | policy checks such as a browser check for UI flows |

All steps go through the script, run from the project folder:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" <command> --dir . --change <name> [--json]
```
If it prints `error:`, show it and stop.

## Steps

1. **Pick the change.** The one named by the user, or the active change whose tasks are all done. Ask if it's unclear.
2. **Run the tests and checks:** `verify.mjs run --dir . --change <name>`. It runs the policy's `npm run <script>` commands (which can take a while) and writes the report.
3. **Security review:** run `/security-review` on this change's files. For each finding, record it:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" finding --dir . --change <name> --source security --severity high|medium|low --text "<one line: what and where>"
   ```
   Map the review's own wording to **high** only for exploitable issues (injection, auth bypass, secret exposure, unsafe deserialisation…); otherwise medium or low.
   Then record **how** it ran:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" reviewed --dir . --change <name> --source security --how ran
   ```
   **If `/security-review` can't run** (an environment limit, an error): tell the user why, review the change's diff for security issues yourself, record those findings the same way, and mark it `--how substitute --note "<why the built-in couldn't run>"`. Only if neither is possible: `--how skipped --note "<why>"`. Never leave it unrecorded; the report shows a missing review.
4. **Code review:** run `/code-review` on this change's diff, record each finding the same way with `--source code` (code findings are advisory), then `reviewed --source code --how ran` (or `substitute` / `skipped` with a note, as above).
5. **Show the report:** **HARD items first**, each with what to do; then the advisory list. Then:
   - Result `pass`: say the change can be archived (`/opsx:archive`).
   - Result `fail`: offer to fix the HARD items, then re-run step 2. A fixed finding is cleared by re-running the review and not recording it again; for a stale one, say so.

## Overrides

- **Never override on your own.** Only when the user explicitly says to accept a HARD item, ask for their reason, then:
  ```bash
  node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" override --dir . --change <name> --item <id> --reason "<the user's reason>"
  ```
- The reason and date are kept in the report; the result becomes `overridden`, and the archive can go ahead.

## Pre-push (opt-in)

Only when the user asks to run tests before every push:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" prepush --install --dir .
```
It never overwrites an existing pre-push hook; report what it says.

## Rules

- Don't edit `verify.md` by hand; every entry goes through the script.
- Don't archive in this skill; the user runs `/opsx:archive` when it passes.
- Don't commit.
