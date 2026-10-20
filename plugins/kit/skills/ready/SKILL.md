---
name: ready
description: Check that a planned OpenSpec change is ready to build, before /opsx:apply - find gaps (missing error, empty, loading, permission or limit cases; vague wording), differences between the PRD, specs and design, points the user should confirm, and new tools the change would add - then ask the decisions in one batch and write the answers into the change; then rate reach, undo and safety and record the build safeguards (worktree, review against the spec, subagents only when justified) in design.md. Warns, never blocks. Use when planning is complete and the user asks whether a change is ready to build, wants to check the plan before apply, or when /kit:next suggests it.
---

# Kit ready

Reads the change the way the builder will, and brings up the decisions the build would otherwise make alone. **It warns and never blocks**: the user can build at any point, and anything left for "Later" stays open and comes back in `/kit:next`, `/kit:verify` and at archive.

Two scripts, run from the project folder. If either prints `error:`, show it and stop.
```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ready.mjs" scan --dir . --change <name> --json
node "${CLAUDE_PLUGIN_ROOT}/scripts/decisions.mjs" <command> --dir . --change <name>
```

## Steps

1. **Pick the change:** the one the user names, or the active change whose planning is complete. Ask if it's unclear.
2. **Scan:** `ready.mjs scan ... --json`.
   - `planningComplete: false`: say planning isn't complete, name `nextArtifact`, and stop. Check nothing.
   - Otherwise read every file it lists (proposal, design, tasks, each spec) and the linked PRD, if any, in full.
3. **Find the items.** Each one names where it was found (`file` or `file:line`).
   - **gap:** a behavior with no scenario, especially empty, error, loading, permission and limit cases, UI states and copy, and the data's shape. The scan's `vague` hits and requirements with 0 scenarios are leads; judge each one, and don't list a hit that's fine in context.
     - **In a web-ui project** (`node "${CLAUDE_PLUGIN_ROOT}/scripts/ready.mjs" web-ui --dir .`; spec: build-readiness "UI states and copy in the gap check"): for each screen the change touches, check the **empty, loading, error, permission and overflow** states, and **copy** (labels, error messages, empty-state text) that's unclear or missing. List each only when no scenario covers it.
   - **difference:** the PRD, the specs and the design disagree. Quote both sides with their paths.
   - **confirm:** a key assumption or high-impact behavior that looks decided but that the user should check, such as something that changes what users see, or could lose or hide data.
   - **new-tool:** a dependency the design or tasks plan to add. Compare it with the scan's `dependencies`. If the project has a tools inventory (`knowledge/docs/tools.md`), also match on each tool's `for:` purpose (e.g. "TipTap — rich text in stickies" covers another rich-text editor), and name the inventory entry. If an existing one covers the same purpose, recommend reusing it. If `dependencies` is `null`, say in one line that the tool check was skipped (no `package.json`).
   - **Leave out small or preference choices** (naming, a colour, a port). Don't invent items to fill the list; zero items is a fine result.
4. **Show the list first:** "N decisions for you", each in one line with its kind and where it came from. Order: confirm, difference, gap, new-tool. Then record each one:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/decisions.mjs" add --dir . --change <name> --kind gap --text "<question>" --from "<file:line>" --options "<a>|<b>|Later" --recommended "<a>"
   ```
5. **Ask in one go** with the **AskUserQuestion** tool: up to 4 questions per call, with the calls back to back in the same turn until all are asked.
   - Each question gets 2 or 3 real options plus **"Later"**. Put the recommended option first, with " (Recommended)" in its label, and the reason in its description.
   - With more than 4 items, the first question of the first call may offer "Later for all of the rest". If the user picks it, mark the rest `later` and stop asking.
6. **Write each answer into the change:**
   - **A behavior** → a scenario in the change's delta spec, with GIVEN/WHEN/THEN (`- **GIVEN** …` when there's a starting state).
     - If the requirement is already in the delta, add the scenario under it.
     - If it isn't, copy the **whole** requirement block (heading, text, every scenario) from `openspec/specs/<capability>/spec.md` under `## MODIFIED Requirements`, then add the scenario. A partial copy loses text at archive.
   - **A decision** (a tool, a trade-off, a limit) → `design.md` under Decisions, with its reason in one or two lines.
   - Then: `decisions.mjs decide --id <D#> --answer "<answer>" --written <path>`.
   - **"Later"** → `decisions.mjs later --id <D#>`. Edit nothing for it.
   - **"Other"** (the user typed an answer) → treat it like a picked option.
7. **Safeguards** (spec: build-readiness "Safeguards picked per change"). Rate the change on three dimensions from `design.md` and `tasks.md`, each `low`, `medium` or `high`, with a one-line reason:
   - **reach**, what depends on what it touches. Low: one spec, and no file that other files import changes. Medium: two or more specs, or a shared module. High: a contract others rely on (command flags or output, file formats, skill names, hook behaviour). When the plan names a module but not who uses it, run `ready.mjs importers --dir . --file <path>` and say so in the reason.
   - **undo**, does reverting the commits undo it fully? Low: yes. High: it writes outside the repo (data, state, installed config, deleted user files, migrations).
   - **safety**: high only if it touches secrets, permissions, blocking hooks, user data or network writes; otherwise low.
   - **Never rate from a word alone.** "Session start" is not a session, "tokens" may be AI usage, "payments" in a sentence is not a payment flow. Rate what the plan changes.
   - **Subagents:** propose building with subagents only when the tasks are independent of each other and too long for one context; give that reason. Otherwise don't mention them.
   - **UI review** (spec: build-readiness "UI review safeguard"): only in a web-ui project (`ready.mjs web-ui`), and only when `design.md` or `tasks.md` names UI files: pages, components, styles, or code that generates pages users see. Never from a word alone ("button", "screen" in a sentence). Then pass the files as `--ui-why "<files>"`; `ui-review` is added to the recommendation (Impeccable `critique` + `audit` at verify). Say that it costs tokens, so the user can drop it for a small change.

   Show the three ratings with their reasons and the recommendation (all low: today's flow plus the scenario-to-test check; any medium: + worktree + review against the spec; any high: + edge-case probes, medium security findings blocking, your OK before merge). Ask once with **AskUserQuestion**: accept the recommendation (first, " (Recommended)") or change it (the user names what to add or drop). Then write it:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/ready.mjs" safeguards --dir . --change <name> --reach <l> --reach-why "..." --undo <l> --undo-why "..." --safety <l> --safety-why "..." [--choice scenario-check,worktree,...] [--subagents-why "..."] [--ui-why "<UI files>"]
   ```
   The change needs a `design.md` first (the script refuses to create a stub). Leave `--choice` out to keep the recommendation. When subagents are chosen and Superpowers isn't installed in the project, say so and offer `claude plugin install superpowers@claude-plugins-official --scope project` on a yes; install nothing without it.
8. **Validate** after any edit: `openspec validate <name> --strict`. Fix what it reports. Never leave the change invalid.
9. **Close:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/decisions.mjs" ready-done --dir . --change <name>
   ```
   Then say, in one line: "You can build now (`/opsx:apply`); K decisions still open." If none are open, say it's ready.

   **Worktree and an uncommitted plan** (spec: build-readiness "Worktree needs a committed plan"). Only when the chosen safeguards include `worktree`: run `git status --porcelain -- openspec/changes/<name>`. If it lists files, say "The worktree starts from your last commit, so it won't see this plan until it's committed." Then ask with **AskUserQuestion**: "Commit the plan now?", with "Yes (Recommended)" and "No".
   - **Yes:** `git add openspec/changes/<name>` and commit with `plan <name>`. Nothing else goes in that commit.
   - **No:** commit nothing. The build can run without the worktree.
   With no output, or no worktree chosen, say nothing about it.

## Rules

- Never block or delay apply over open items, and never call the change "not ready" as a gate. The user decides when to build.
- Don't edit a file for an item until the user has picked an answer for it.
- Don't edit `decisions.md` by hand; every entry goes through the script.
- Don't change the PRD here. If an answer contradicts it, say so and offer `/kit:prd` (per-section, on a yes).
- Don't commit, except the plan commit in step 9, on a yes.
