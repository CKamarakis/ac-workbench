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
