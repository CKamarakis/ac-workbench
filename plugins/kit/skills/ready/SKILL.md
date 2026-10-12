---
name: ready
description: Check that a planned OpenSpec change is ready to build, before /opsx:apply - find gaps (missing error, empty, loading, permission or limit cases; vague wording), differences between the PRD, specs and design, points the user should confirm, and new tools the change would add - then ask the decisions in one batch and write the answers into the change. Warns, never blocks. Use when planning is complete and the user asks whether a change is ready to build, wants to check the plan before apply, or when /kit:next suggests it.
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
   - **difference:** the PRD, the specs and the design disagree. Quote both sides with their paths.
   - **confirm:** a key assumption or high-impact behavior that looks decided but that the user should check, such as something that changes what users see, or could lose or hide data.
   - **new-tool:** a dependency the design or tasks plan to add. Compare it with the scan's `dependencies`. If an existing one covers the same purpose, recommend reusing it. If `dependencies` is `null`, say in one line that the tool check was skipped (no `package.json`).
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
7. **Validate** after any edit: `openspec validate <name> --strict`. Fix what it reports. Never leave the change invalid.
8. **Close:**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/decisions.mjs" ready-done --dir . --change <name>
   ```
   Then say, in one line: "You can build now (`/opsx:apply`); K decisions still open." If none are open, say it's ready.

## Rules

- Never block or delay apply over open items, and never call the change "not ready" as a gate. The user decides when to build.
- Don't edit a file for an item until the user has picked an answer for it.
- Don't edit `decisions.md` by hand; every entry goes through the script.
- Don't change the PRD here. If an answer contradicts it, say so and offer `/kit:prd` (per-section, on a yes).
- Don't commit.
