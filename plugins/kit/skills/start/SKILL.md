---
name: start
description: Set up or re-sync the current project with the kit - git, .gitignore, OpenSpec, CLAUDE.md routing, project context doc, and the project's tools (per project only). Use when the user asks to start, bootstrap, set up or kit-ify a project, or to re-sync a project with the kit.
---

# Kit start

Sets up **this folder** as a kit project, or re-syncs one. Run it once per project (and again only to re-sync after a kit update). **It asks one question: the project type.** It never overwrites or deletes the user's files: every change to an existing file is shown as a diff and needs a yes. Tools are installed **for this project only**, never for every session.

Scripts live at `${CLAUDE_PLUGIN_ROOT}/scripts/`. Run them from the project folder (`--dir .`).

## Steps

1. **Check prerequisites.**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/prereqs.mjs"
   ```
   - `BLOCKED` (git or openspec missing): stop. Show the install hint and change nothing.
   - `missing … machine tool`: say so and offer `/kit:setup`. Continue only if the user wants to go ahead without it.
   - `WARNING`: show it as is.

2. **Ask the one question: the project type.** Run the plan once with `--type none --json` (step 3's command) to get `typeOptions`; the text comes from there, never from memory.
   - **Ask with the AskUserQuestion tool** (clickable options), not as plain text. One option per type plus "none"; each option's description is its `about` (the tools it adds).
   - If one has `recommended: true`, put it first and add " (Recommended)" to its label, with the `why` in its description; otherwise put "none" first ("no type-specific tools; add a type later").
   - If the user passed a type as an argument, use it and don't ask.
   - **Ask nothing else about tools.** Global and type tools install without questions. Opt-in tools (`offeredTools`, e.g. SuperSpec, Superpowers) are **not** asked about and not installed: they're added on demand when a change needs them. Pass `--opt-in` only when the user explicitly asks for a tool.

3. **Plan** (nothing is written):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/start-plan.mjs" --dir . --type <type|none>
   ```
   Show the output to the user as is:
   - `CREATE` and `RUN`: what will be added.
   - `CHANGE`: an existing file with its diff.
   - `CONFLICT`: the kit can't safely edit the file; tell the user what to fix by hand.
   - `INSTALL` and `YOU` (tool steps that need the user).

   "Nothing to change" means the project is already in sync: say so and stop.

4. **Confirm with one yes.**
   - One message: a one-line summary of what gets added (the `CREATE` items and tool installs), then each `CHANGE` with its diff, its `about` and `Recommended: <recommend> (<why>)` from the plan JSON.
   - Ask **one** question, **with the AskUserQuestion tool**: "Apply all (Recommended)", "Apply all except some files" (then ask which), "Cancel". The diffs are shown in your message above the question, never inside it.
   - Never apply a change the user didn't confirm. A recommendation is not an answer.

5. **Apply** with the same type, and only the confirmed changes:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/start-apply.mjs" --dir . --type <type|none> --accept <id,id|all>
   ```
   `--accept` lists only the confirmed `CHANGE` ids (e.g. `CLAUDE.md,.gitignore`). New files are always created. Tool installs can take a few minutes.

6. **Summarize in three parts, in plain words for the user.** Each item appears once.
   - **Done:** what was written or changed (e.g. "CLAUDE.md: workflow rules updated"), the knowledge folder (new or already there), and the tools now available with one line each on what they're for. A tool shown as `ok` or installed counts as done. When a tool has a `why:` line (an install that reaches beyond the project, such as a machine-wide CLI), repeat it in one plain sentence.
   - **Needs you:** only steps that block using the project **now**: a failed install (with its fix line), a `PENDING`/`YOU` step, or a skipped file change and what to do about it. If there's nothing, write "Nothing".
   - **Later:** the `LATER` lines ("when you first …"), and one line listing the tools available on demand.
   - Don't repeat internal install notes (e.g. "unverified on Windows"); they're for the kit, not the user.

   End with one next step: `/kit:next`, `/kit:capture` to save the first note, or `/opsx:explore` to start the first change.

## Rules

- Never pass `--scope user`, never edit `~/.claude/settings.json`, and never change a tool's global config.
- Never delete files. Never edit `docs/project-context.md` once it exists; it belongs to the user.
- Never run interactive installs yourself (OAuth, multi-step). Hand them to the user.
- If a script fails, show its error and stop. Don't improvise the steps by hand.
