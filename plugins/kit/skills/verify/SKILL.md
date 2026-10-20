---
name: verify
description: Check an OpenSpec change before it is archived - run the project's tests (by its type's test policy), list changed files without tests, run /security-review and /code-review on the change, sync the change's specs and design with what was built (docs sync), and write a verify report; failing tests and high-severity security findings block the archive. Use when the user asks to verify, check or review a change before closing it, when all tasks of a change are done, or when an archive was blocked for a missing or failing verify report.
---

# Kit verify

Checks one change and writes `openspec/changes/<change>/verify.md`. **HARD** items block `/opsx:archive` (a kit hook enforces it); **ADVISORY** items are for the user to decide.

| HARD (blocks) | ADVISORY (user's call) |
|---|---|
| a required test script fails | changed source files without a matching test |
| a required test script is missing (when the project type's policy says so) | code-review findings, lower-severity security findings |
| a **high**-severity security finding (and a **medium** one when the change's Safeguards choose medium security findings blocking) | policy checks such as a browser check for UI flows |
| | scenarios without a test, review-against-the-spec findings and edge-case probes, UI review findings, the user's OK before merge (when chosen) |

All steps go through the script, run from the project folder:
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" <command> --dir . --change <name> [--json]
```
If it prints `error:`, show it and stop.

## Steps

1. **Pick the change.** The one named by the user, or the active change whose tasks are all done. Ask if it's unclear.
2. **Run the tests and checks:** `verify.mjs run --dir . --change <name>`. It runs the policy's `npm run <script>` commands (which can take a while) and writes the report. If the change already had a `verify.md` the kit didn't write (e.g. another tool's), the script keeps it as `verify-earlier.md` and lists it (`E:report`): read it and tell the user about anything still open in it, such as unfinished tasks or sign-offs.
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
5. **Scenarios** (every change; spec: quality-gates "Scenario-to-test check"). The run already lists each scenario of the change's delta specs and marks the ones a test names. For each one still `missing` (`verify.mjs scenarios --dir . --change <name>`), look for a test that checks it and record it:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" scenario --dir . --change <name> --name "<capability>: <scenario>" --test <path>
   ```
   A scenario that can't be tested automatically (for example the wording of a message you write) is recorded `--by-hand --note "<how you checked it>"`, only after you really checked it. What's left stays listed as advisory; don't write tests here unless the user asks.
6. **Review against the spec** (only when the report's Safeguards section lists it; spec: quality-gates "Review against the spec"). The reviewer has no shell, so you get the diff for it: `git diff <base>..HEAD` (the change's base commit), or for an uncommitted change `git diff HEAD` plus the new files from `git status --short`. Dispatch the `kit:spec-reviewer` agent with the change name, that diff as text and whether the change is high-risk. Over about 2000 lines, save the diff to `$(git rev-parse --git-dir)/kit-review.diff` instead (inside `.git`: never committed, not the system temp folder), pass that path for the agent to read, and delete the file after the review. Record each finding it returns, then how it ran:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" finding --dir . --change <name> --source spec --text "<capability: scenario | file | spec says X; code does Y>"
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" finding --dir . --change <name> --source probe --text "<what to try | what the spec expects>"
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" reviewed --dir . --change <name> --source spec --how ran
   ```
   If the agent can't run, review the specs against the diff yourself and mark it `--how substitute --note "..."`. When the Safeguards choose the user's OK before merge, show the user the report and ask for it; on a yes, `verify.mjs ok --dir . --change <name> [--note "..."]`. It never blocks the archive.
6b. **UI review** (only when the report's Safeguards section lists `ui-review`; spec: quality-gates "UI review at verify").
   - **Design context first:** if the report lists `PRODUCT.md` or `DESIGN.md` as missing, offer `/impeccable init` (PRODUCT.md) or `/impeccable document` (DESIGN.md) before the review, on a yes.
   - **Impeccable not installed** (no `.claude/skills/impeccable`): offer the project-scope install from the registry (`npx -y impeccable install --providers=claude --scope=project`) on a yes; on a no, `reviewed --source ui --how skipped --note "Impeccable not installed"`.
   - **Run** `/impeccable critique` and `/impeccable audit` with **the change's UI files as the target** (the files in the Safeguards' "UI review because"), never the whole app.
   - **App can't run** (no dev server, missing env): review from the code and committed screenshots, and record `--how substitute --note "<why>"`.
   - Record each finding, with the path of Impeccable's report under `.impeccable/critique/` when it wrote one, then how it ran:
     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" finding --dir . --change <name> --source ui --severity high|medium|low --text "<what, where> | <.impeccable/critique/... report>"
     node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" reviewed --dir . --change <name> --source ui --how ran
     ```
   UI findings are advisory, like code-review findings.
7. **Docs sync** (advisory; spec: docs-sync). It brings the change's specs and `design.md` up to date with what was built, before archive copies them into the living specs.
   1. **Scan:** `verify.mjs docs-scan --dir . --change <name>`. Say when the docs were last updated and how many code commits followed. Then read:
      - the receipt items (if there's no `apply.md`, say so and work from `git log` and the diff since the docs commit);
      - the change's specs and `design.md`.
   2. **Sort each item.** Every receipt item gets exactly one place: proposed, or left out. Items under "Visible changes" are behaviors; never leave them out.
      - **Behavior** (the user can observe it) and not covered by a scenario → propose a scenario (`- **GIVEN**`/`WHEN`/`THEN`) under its requirement in the delta spec.
      - **Decision with depth** (it trades something, shapes more than one behavior, or would surprise someone later) and not in `design.md` → propose it with its reason.
        - Only in a project that uses the living docs (it has `knowledge/docs/`): if it shapes more than one sub-feature, or trades a limit for a gain across the product, **also** propose a foundation card (`knowledge/foundations/<slug>.md`, or `<product>/<slug>.md`; format in the `/kit:docs` skill), written only on a yes.
        - If it contradicts an existing card, propose setting that card to `status: replaced` with `replaced_by`, never deleting it.
      - **How the build ran** (push cadence, task dispatch, test ports, review batching) → left out. List these in one line; propose nothing.
      - Small or preference choices get no "why". Don't propose them for `design.md`.
   3. **Flag** an item when the built behavior changes what the user sees in a way the specs didn't plan, or could lose or hide data. Ask it first, as "this is what was built; is it what you want?":
      - **Keep it** → document it as is.
      - **Change it** → record it as open (`decisions.mjs add --kind confirm`, then `later`), and don't document it as final.
   4. **Unplanned dependencies:** for each `deps.added` entry with `planned: false`, ask whether to keep it. A kept one gets its reason in `design.md`.
   5. **Ask in one go** with the **AskUserQuestion** tool (up to 4 questions per call): the flags first, then the proposed updates. Show each update's full text and where it goes in your message first, numbered; the questions name them by number. Never put the text in an option preview: the box cuts long text off. **Write only on a yes.**
      - If the requirement isn't in the delta yet, copy the **whole** requirement block from `openspec/specs/<capability>/spec.md` under `## MODIFIED Requirements`, then add the scenario.
      - Run `openspec validate <name> --strict` after edits.
   6. **Record** each item through `decisions.mjs` (`add` with kind `behavior`, `decision` or `unplanned-tool`, then `decide --answer "documented" --written <path>`, or `--answer "not documented"` on a no). Then store the summary:
      ```bash
      node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" docs-sync --dir . --change <name> --proposed N --written N --declined N --left-out N [--unplanned a,b]
      ```
      Count per receipt item: proposed + left out must cover every receipt item, or the script stops and says how many are missing. Re-run step 2 so the report shows open decisions. The docs sync never adds a HARD item.
8. **Loose ends from this step** (spec: loose-ends "One batch at the end of a step"): collect the advisory findings the user keeps (not fixed), and anything else put aside during verify, as one end-of-step list for `/kit:loose-ends` (kept findings as kind `accepted`, origin `review`). Offer it once, after the report; ask nothing when the list is empty.
9. **Show the report:** **HARD items first**, each with what to do; then the advisory list (including the docs sync and any open decisions). Then:
   - Result `pass`: say the change can be archived (`/opsx:archive`).
   - Result `fail`: offer to fix the HARD items, then re-run step 2.
   - **After fixing an advisory finding** (only ones the user chose to fix), mark it resolved, naming the commit:
     ```bash
     node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" resolve --dir . --change <name> --item <id> --note "fixed in <commit>"
     ```
     It moves to the report's Resolved list. Findings the user decided to keep stay as they are. A fixed HARD **review finding** (security, code, spec) is resolved the same way, and then the re-run passes. A HARD item the run generates (a failing or missing test) clears only on a passing re-run, or with the user's override.

## Browser check (on request)

**Only when the user asks** (e.g. before a release, or after a big UI change). Never as part of a default verify.

In a web-ui project, the report may list one advisory item, `H:browser`: "a browser check is worth it", when the change adds a page or route, or new input handling (pointer, touch, key, wheel, gesture, paste, mouse, drag or drop handlers). It names what it found. Tell the user and offer the check; run it only on a yes. Those are the changes where bugs showed up after the build on Acme (`evals/trials/m12-t5-browser-check-thresholds.md`). The item goes away once a browser check is recorded.

1. Start the app with `npm run dev`, or reuse one that's already running, and wait until the page responds.
2. With the Playwright CLI skill, log in using the test credentials named in `.env.local` (e.g. `KIT_TRIAL_EMAIL` / `KIT_TRIAL_PASSWORD`). Read them from the file, and never print them.
3. Walk the flows this change touches, including pages behind login: click, use the keyboard (Tab, arrows, Escape), and check different widths when layout matters.
4. Save screenshots into `openspec/changes/<name>/browser/`.
5. Record the outcome. Issues are always advisory and never block:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.mjs" browser --dir . --change <name> --result pass|issues [--issue "<what, where>"]... --shots browser/a.png,browser/b.png
   ```
6. Report what you saw, with the screenshot paths, and say which issues the code reviews hadn't caught.

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
