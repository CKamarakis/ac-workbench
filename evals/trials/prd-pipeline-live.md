# prd-pipeline trial (tasks 7.1, 7.2), 2026-10-06

Kit 0.2.0 from the working tree. Every run used a **copy** of Toughbubble: `git clone` of `Projects/Toughbubble` at `3363e51`, with origin removed. The copy now lives at `Projects/temp/Toughbubble` for the live part. The real repo was only read; `git status` there showed 0 changes afterwards.

## 7.2 Re-sync on a Toughbubble copy

The copy had never been through `/kit:start`, so the first plan also lists the M1 basics. That matches the earlier run in `start-sandbox.md`.

| Item | Plan | After apply with no confirmations |
|---|---|---|
| `knowledge/{notes,prds,assets,archive}/.gitkeep` | CREATE | written |
| `CLAUDE.md` | CHANGE (routing block, incl. "Knowledge and PRDs") | skipped: not confirmed, byte-identical (md5) |
| `.gitignore` | CHANGE | skipped: not confirmed, byte-identical (md5) |
| `openspec/config.yaml` | CONFLICT (existing `context:`) | skipped |
| `docs/project-context.md`, `.claude/kit.json` | CREATE | written (`knowledge_dir: knowledge`) |

- **Re-plan after apply:** the `knowledge/` folders and the stamp show as `same`. Only the unconfirmed `CLAUDE.md` change is left, and its diff adds the Knowledge section.
- `--home` pointed at the temp folder, so `~/.claude/kit/projects.json` was not touched.

## 7.1 Flow, scripted part (helpers only, no Claude session)

1. `knowledge.mjs new-note` ("Gift card purchase flow", source voice) → `notes/2026-10-06-gift-card-purchase-flow.md`.
2. `next.mjs` → the active change `add-mcp-connector` still wins (the notes-only rule needs no active change). Correct per spec.
3. `new-prd "Gift cards"` with that note as source → `prds/gift-cards.md` (Draft); `set-field status Ready`; `prd-check` ok.
4. `next.mjs` → `Next: /opsx:propose`, why `PRD "gift-cards" is Ready and no change uses it yet`, `prd: knowledge/prds/gift-cards.md`.

**Observation:** a Ready PRD takes priority over an active change that is still being planned. That's what the spec says ("before falling back"), but in a busy project it may feel pushy. Worth a look in the M6 usage review.

## UX findings from the live run

- **2026-10-06, `/kit:start` questions lack context (user).** The install asks several questions in a row (project type, SuperSpec, Superpowers, apply the plan, each `CHANGE` such as `.gitignore`). The user had to ask what each one meant before answering. **Fix idea:** each question carries one line on what the tool or change does, when to say yes, and a recommended default with the reason (e.g. "SuperSpec: alternative planning flow for big or risky changes. Recommended: no for most projects"). Input for the M6 usage review, or a small follow-up change to the start skill.

## 7.1 Live part (user, interactive session in `Projects/temp/Toughbubble`)

- `/kit:start` with type `none`, no SuperSpec, no Superpowers. Yes to the plan, `CLAUDE.md` and `.gitignore`.
- `/kit:capture` + `/voice` dictation → note created.
- `/kit:prd` → PRD drafted from the note → marked Ready.
- `/opsx:propose` → **the proposal contained the `PRD: knowledge/prds/<slug>.md @ <commit>` line** (user: "it worked like a charm"). The design D6 risk did not occur, so the `rules.proposal` fallback isn't needed.
- With two Ready PRDs, `/opsx:propose` **asked which one to use**, as the routing rule says.

**Follow-ups from the user (2026-10-06):**
1. **Fixed now:** the note pick in `/kit:prd` was single-select. Several notes can feed one PRD (P1), so the skill now asks with a multi-select; an eval checks the wording.
2. **Open: sort PRDs by most recently updated first** wherever they're listed or offered (`list`, the `/opsx:propose` choice, the `/kit:prd` shortlist, `/kit:next` "other Ready PRDs"). Needs last-modified time (git, or file mtime) in `knowledge.mjs list`.
3. **Parked (user): uncategorised notes pile up.** The user wants to use it on a real project first and see how they actually work before any change. Topic folders and tags exist, but only when asked. Ideas: `/kit:capture` proposes tags from the content; `list` groups by topic or tag; when the notes root passes ~15 files, offer a one-time "group these into topics?" (moves via `move`, PRD sources follow).
4. **Open: notes added by hand.** A `.md` file dropped into `notes/` is recognised (title from its first `# ` heading or the filename; no date unless the name starts with one). A `.txt` transcript is **ignored**. Ideas: `/kit:capture <file>` imports a transcript (proposes a title, adds frontmatter, keeps the text); or `list` also reads `.txt`.
5. The copy at `Projects/temp/Toughbubble` stays as the test bed before any change to the real Toughbubble.

**New need found (user):** late additions ("I forgot something") are normal. The flow exists (`/kit:capture` → `/kit:prd` update per section → `/kit:next` flags a Building PRD that changed), but you have to know to run the update. Added as task 3.3: after saving a note, `/kit:capture` offers to update a matching PRD.

## Follow-ups (0.3.0), 2026-10-06/07

**Live run 1 (`/kit:start` on the copy, user screenshot 2026-10-07):** the run worked, but the summary confused the user. Findings and fixes:
- `openspec/config.yaml` was listed as "Skipped" and again as a to-do. **Fixed:** an existing `context: |` block now gets the pointer line as a `CHANGE` with a diff.
- `/impeccable init` showed up as a setup step. **Fixed:** the new `first_use` registry field puts it under "Later".
- The context7 sign-in was a to-do nobody needed yet. **Fixed:** see below.
- Internal notes ("nobody has checked … on Windows") leaked to the user. **Fixed:** the summary is now Done / Needs you / Later, without install notes.

**context7 (tested 2026-10-07 in a temp folder):**
- `npx -y ctx7@latest library next.js …` and `docs /vercel/next.js "revalidatePath"` return current docs **logged out**.
- `ctx7 setup --claude --cli --project -y` still opens a browser sign-in (device code).
- **Decision (user):** no setup. A "Library docs" rule in the routing block (`npx ctx7`), with a library-error hook as the M3 backstop. The limit-hit message and the sign-in are deferred.
- **Unverified:** limits without a key.

**Impeccable hooks on Windows (copy, 2026-10-07):**
- It installs `SessionStart`, `PostToolUse` (Edit|Write) and `Stop` hooks into `.claude/settings.local.json`.
- Each hook was run through Git Bash with a simulated event on `src/app/(auth)/forgot-password/forgot-password-form.tsx`: exit 0, no output.
- **Unverified:** that it catches a real design issue (none was present).

**Mid-session skill discovery (tested in the ac-workbench session):**
- A skill created in `.claude/skills/` was "Unknown" until the session read its file; then it ran.
- The kit's own new skills (`kit:capture`, `kit:prd`) also appeared mid-session.
- **Not tested:** a full plugin install mid-session.

**Live run 2 (user, 2026-10-07, copy):** `/kit:start` passed ("excellent job on the initiation"): one question, one yes, a clear summary. With two Ready PRDs, `/opsx:propose` offered the newer one first ("propose worked"). `/kit:capture` offered to import a `.txt` dropped into `notes/`. A hand-made `.md` in `notes/` is a note as it is, so nothing reacts to it (by design). **Idea for later:** offer to tidy hand-made notes that have no frontmatter (title, date, dated file name).
