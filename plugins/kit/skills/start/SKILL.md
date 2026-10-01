---
name: start
description: Set up or re-sync the current project with the kit - git, .gitignore, OpenSpec, CLAUDE.md routing, project context doc, and the project's tools (per project only). Use when the user asks to start, bootstrap, set up or kit-ify a project, or to re-sync a project with the kit.
---

# Kit start

Sets up **this folder** as a kit project, or re-syncs one. It never overwrites or deletes the user's files: every change to an existing file is shown as a diff and needs a yes. Tools are installed **for this project only**, never for every session.

Scripts live at `${CLAUDE_PLUGIN_ROOT}/scripts/`. Run them from the project folder (`--dir .`).

## Steps

1. **Check prerequisites.**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/prereqs.mjs"
   ```
   - `BLOCKED` (git or openspec missing): stop. Show the install hint and change nothing.
   - `missing … machine tool`: say so and offer `/kit:setup`. Continue only if the user wants to go ahead without it.
   - `WARNING`: show it as is.

2. **Ask the project type and the optional tools.**
   - Get the types from the plan's `types` (step 3 prints them in `--json`). Offer them plus "none". If the user passed a type as an argument, use it.
   - For each name under "Optional for this project", ask yes or no. These are the `project`-tier tools, e.g. a Notion connection or SuperSpec. Default to no.

3. **Plan** (nothing is written):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/start-plan.mjs" --dir . --type <type|none> --opt-in <a,b>
   ```
   Show the output to the user as is:
   - `CREATE` and `RUN`: what will be added.
   - `CHANGE`: an existing file with its diff.
   - `CONFLICT`: the kit can't safely edit the file; tell the user what to fix by hand.
   - `INSTALL` and `YOU` (tool steps that need the user).

   "Nothing to change" means the project is already in sync: say so and stop.

4. **Confirm.**
   - Ask for a yes on the whole plan.
   - Then, for each `CHANGE`, a separate yes or no. Default to no for files the user wrote, such as `CLAUDE.md`.
   - Never apply a change the user didn't confirm.

5. **Apply** with the same type and opt-ins, and only the confirmed changes:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/start-apply.mjs" --dir . --type <type|none> --opt-in <a,b> --accept <id,id|all>
   ```
   `--accept` lists only the confirmed `CHANGE` ids (e.g. `CLAUDE.md,.gitignore`). New files are always created. Tool installs can take a few minutes.

6. **Summarize** from the output:
   - written, ran, skipped (and why)
   - tools installed, present, enabled via settings, failed (with the fix line)
   - **PENDING steps the user must do**: show each command and note exactly, e.g. run `/mcp` to sign in to Notion. Don't claim these are done.

   End with the next step: `/kit:next`, or `/opsx:explore` to start the first change.

## Rules

- Never pass `--scope user`, never edit `~/.claude/settings.json`, and never change a tool's global config.
- Never delete files. Never edit `docs/project-context.md` once it exists; it belongs to the user.
- Never run interactive installs yourself (OAuth, multi-step). Hand them to the user.
- If a script fails, show its error and stop. Don't improvise the steps by hand.
