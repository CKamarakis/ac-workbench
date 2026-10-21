---
name: start
description: Set up or re-sync the current project with the kit - git, .gitignore, OpenSpec, CLAUDE.md routing, project context doc, and the project's tools (per project only). Use when the user asks to start, bootstrap, set up or kit-ify a project, or to re-sync a project with the kit.
---

# Kit start

Sets up **this folder** as a kit project, or re-syncs one. Run it once per project (and again only to re-sync after a kit update). **On a first setup it asks one question: the project type** (a re-sync reuses the saved one). On a fresh setup it then offers to fill the project context doc, which can be skipped. It never overwrites or deletes the user's files: every change to an existing file is shown as a diff and needs a yes. Tools are installed **for this project only**, never for every session. That includes the kit itself: a project that still runs on a user-level kit gets its own install in the plan.

Scripts live at `${CLAUDE_PLUGIN_ROOT}/scripts/`. Run them from the project folder (`--dir .`).

## Steps

1. **Check prerequisites.**
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/prereqs.mjs"
   ```
   - `BLOCKED` (git or openspec missing): change nothing. Show the install hint and ask with the **AskUserQuestion** tool: "Install with /kit:setup now (Recommended)" or "Stop here". On the first, run `/kit:setup` in this session, then check again from step 1; on the second, stop.
   - `missing … machine tool`: name the tools and ask with the **AskUserQuestion** tool: "Install them now with /kit:setup (Recommended)" or "Continue without them". On the first, run `/kit:setup` in this session, then check again from step 1. On the second, go on.
   - **Offer setup once per run.** If the check still reports the same tool after `/kit:setup` (on Windows a new install is often not on this session's PATH yet), don't offer it again: say which tool is still not found and that a new session usually sees it, then stop on `BLOCKED` or go on for a machine tool.
   - `WARNING`: show it as is.

2. **Ask the one question: the project type.** Run the plan once with `--type none --json` (step 3's command) to get `typeOptions` and `savedType`; the text comes from there, never from memory.
   - **Ask with the AskUserQuestion tool** (clickable options), not as plain text. One option per type plus "none"; each option's description is its `about` (the tools it adds).
   - **Order:** types with `recommended: true` go first (in the plan's order), each with " (Recommended)" in its label and its `why` in the description. Otherwise `web-ui` goes first when it's offered, **without** "Recommended" (most kit projects are web apps, but nothing here shows it). "none" always goes last ("no type-specific tools; add a type later").
   - If the user passed a type as an argument, use it and don't ask.
   - **Re-sync: the type is already saved** (spec: project-starter "Saved type reused"). When the plan has `savedType` (from `.claude/kit.json`), use it and **don't ask**. Say it in one line: "Type: <savedType> (saved in `.claude/kit.json`; say if it changed)". Ask only when the user says it changed.
   - **Ask nothing else about tools.** Global and type tools install without questions. Opt-in tools (`offeredTools`, e.g. Superpowers) are **not** asked about and not installed: they're added on demand when a change needs them. Pass `--opt-in` only when the user explicitly asks for a tool.

3. **Plan** (nothing is written):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/start-plan.mjs" --dir . --type <type|none>
   ```
   Show the output to the user as is:
   - `CREATE` and `RUN`: what will be added.
   - `CHANGE`: an existing file with its diff.
   - `CONFLICT`: the kit can't safely edit the file; tell the user what to fix by hand.
   - `INSTALL` and `YOU` (tool steps that need the user).
   - `UPDATE`: a tool in this project is older than the version the kit tested; it updates to the latest release. Say so in plain words, with its note when it has one (e.g. `openspec update` also removes skills outside the OpenSpec profile). A tool shown as "newer than the kit tested" is fine as it is; it's never downgraded.
   - `WARNING`: e.g. the OpenSpec CLI on this machine is older than tested. Show it with its update command; don't run it.

   "Nothing to change" means the project is already in sync: say so and stop, after showing any `WARNING` line.

4. **Confirm with one yes.**
   - One message: a one-line summary of what gets added (the `CREATE` items and tool installs), then each `CHANGE` with its diff, its `about` and `Recommended: <recommend> (<why>)` from the plan JSON.
   - Ask **one** question, **with the AskUserQuestion tool**: "Apply all (Recommended)", "Apply all except some files" (then ask which), "Cancel". The diffs are shown in your message above the question, never inside it.
   - Never apply a change the user didn't confirm. A recommendation is not an answer.
   - **Tool installs or updates pending** (a re-sync, where the project already has `.claude/kit.json`, whose plan shows `INSTALL` or `UPDATE` lines; or any run whose plan shows `UPDATE` lines, since an update changes what's already there): add one more question in the same call: "Files and tools (Recommended)" or "Files only (no installs or updates now)". Files only passes `--files-only` in step 5, and the summary lists those tools as left alone. A fresh setup with no `UPDATE` line, or a re-sync with no `INSTALL` or `UPDATE` line, asks nothing about tools.

5. **Apply** with the same type, and only the confirmed changes:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/start-apply.mjs" --dir . --type <type|none> --accept <id,id|all> [--files-only]
   ```
   `--accept` lists only the confirmed `CHANGE` ids (e.g. `CLAUDE.md,.gitignore`). New files are always created. Tool installs can take a few minutes.

6. **Your project** (its own stage, only when this run created `docs/project-context.md`: it was a `CREATE` in the plan). Start the message with the heading **"Your project"** and one line on why: OpenSpec reads `docs/project-context.md` before every proposal, so it should say what the project is for, who uses it, and the rules the agent can't see in the code.
   - **Look first** at what the project already says about itself: `README.md`, `CLAUDE.md` (outside the kit's block), `AGENTS.md`, the `description` in `package.json`, and other files in `docs/`. **Not sources:** what this run just wrote (the blank `docs/project-context.md`, the kit's `CLAUDE.md` text and block, `openspec/config.yaml`).
   - **Enough to go on** (the sources say what the project is for and who uses it): name them, and ask **before drafting anything**, with the **AskUserQuestion** tool: "Draft it from <files> and show me (Recommended)", "Ask me the questions instead", "Later".
   - **Too little to go on** (no sources, or only thin ones such as a one-line README): say so in one line ("nothing here describes the project yet", or what the sources lack), and go to the questions. Say any question can be skipped, and that "later" is fine.
   - **The draft is a review, not a click.** Write each section (Problem, Users, What it does, Rules the agent must follow, Not now) as text in your message (see the rule below), each with where it came from (e.g. "from README") and every guess marked "(guess)". Then ask with **AskUserQuestion**: "Is this right about your project?": "Yes, write it (Recommended)", "Change something", "Ask me the questions instead", "Later".
   - **The questions, in two rounds.** Put a blank line between questions, and give each its hint and its example from the template on its own line.
     - **Round 1, the core three** (they matter most). Open with: "Three questions about your project. Short answers are fine, and you can answer by voice (`/voice`): I'll tidy it up."
       1. **Problem:** what does it solve? What do people do today without it, and what's annoying about that?
       2. **Users:** who is it for (you alone, a team, customers; who pays, if someone else)? One typical user in a sentence.
       3. **What it does:** finish "I use it to …".
     - **Round 2, two optional ones**, after the user answers round 1: "Two more, both optional: answer, or say skip."
       4. **Rules the agent must follow:** things it can't see in the code: platform, money, data, a deadline, tools to use or avoid, the language for docs.
       5. **Not now:** what it should deliberately not do yet. Example: "No mobile app and no sharing with others yet."
     Put the answers into those sections and show the result as text in your message. Then ask "Is this right about your project?": "Yes, write it (Recommended)", "Change something", "Later".
   - **After the doc is written** (or left for later), add one line: "Have specs, briefs or notes about the project? Put them in `docs/`, or save ideas with `/kit:capture`. Ask me to update the context doc from them any time."
   - **Change something:** ask what, show the changed text, and ask the same question again. "Later" stays an option every time, so the step can always be left.
   - **Later** leaves the template as it is; the summary then says to fill `docs/project-context.md` (or to ask for a draft).
   - **Hard rule: never ask the user to approve text they can't see.** Every draft or result goes in your message, in full, above the question that approves it. Never only inside the question or its options, and never "the draft above" when nothing is above. A yes to unseen text isn't a yes. Write the doc only on a yes.

7. **Summarize in three parts, in plain words for the user.** Each item appears once.
   - **Done:** what was written or changed (e.g. "CLAUDE.md: workflow rules updated"), the knowledge folder (new or already there), and the tools now available with one line each on what they're for. A tool shown as `ok`, installed or updated counts as done (an update with its old version, e.g. "Impeccable updated from 4.5.0"). When a tool has a `why:` line (an install that reaches beyond the project, such as a machine-wide CLI), repeat it in one plain sentence.
   - **Needs you:** only steps that block using the project **now**: a failed install (with its fix line), a `PENDING`/`YOU` step, or a skipped file change and what to do about it. If there's nothing, write "Nothing".
   - **Later:** the planner's "Later" lines as printed (including its `/kit:docs` and `/kit:roadmap` lines, when shown), and one line listing the tools available on demand. Don't create `knowledge/docs/`, `knowledge/foundations/` or `knowledge/roadmaps/`, and don't ask about a roadmap.
   - Don't repeat internal install notes (e.g. "unverified on Windows"); they're for the kit, not the user.

   **Commit the setup first** (spec: project-starter "Setup committed before building"). Only when this run wrote or changed files, in a git repo: say in one line "Commit the setup on its own before you start a change, so it doesn't mix with your work (a worktree build also starts from the last commit)." Then ask with **AskUserQuestion**: "Commit the setup now?", with "Yes (Recommended)" and "No".
   - **Yes:** commit only what this run wrote or changed: the apply result's written files, plus what its tool installs and updates changed (`.claude/`, `package.json` and its lockfile). If `git status` shows other changes, leave them out and name them. Message: `kit setup <kit version>`.
   - **No**, or nothing written: commit nothing.

   End with one next step, from the same test `/kit:next` uses: run `node "${CLAUDE_PLUGIN_ROOT}/scripts/next.mjs" --dir . --json`.
   - **It suggests `/kit:capture`** (a new project: no notes, PRDs or changes yet): give the two first steps, each with what it's for: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea you already have. Not `/kit:next`: it has nothing to suggest yet.
   - **Otherwise:** `/kit:next`.

   Then close with these two lines, as written (the link shows as the word OpenSpec, not the full URL):
   - "The `/opsx:` commands come from [OpenSpec](https://github.com/Fission-AI/OpenSpec). `/kit:next` guides you through them: explore, propose, apply, archive."
   - "**Have fun!**"

## Rules

- Never pass `--scope user`, never edit `~/.claude/settings.json`, and never change a tool's global config.
- Never delete files. Never edit `docs/project-context.md` on your own once it exists; it belongs to the user. Two exceptions, both written only on the user's yes after showing the change: step 6 (filling the template this same run created), and an update the user asks for (for example from new files in `docs/`).
- Never run interactive installs yourself (OAuth, multi-step). Hand them to the user.
- If a script fails, show its error and stop. Don't improvise the steps by hand.
