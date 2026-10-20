# Proposal

## Why

Test A on kit 0.18.0 (2026-10-19, `temp/acme-fresh-2`, clean profile) showed the context step can pass unseen. The session's record shows the agent asked "Write this draft into docs/project-context.md?" with an option saying "Write the draft above", but no draft was in the message and none in the options; the user answered "Write it (Recommended)" without having seen what it says about the project, and later didn't recall being asked about the project at all. The user decided the step must be impossible to miss, and must first ask whether to use what the project already has.

## What Changes

- The context step becomes its own stage, "Your project", with one line on why it matters.
- **Source first:** when the project has files that describe it, the starter names them and asks whether to draft from them, ask the questions instead, or leave it for later. An empty project goes straight to the questions and says why.
- **The draft as a review:** every section's text is in the message, each with where it came from and any guess marked, before the question "Is this right about your project?" (yes, change something, questions instead). The starter never asks about text the user can't see, and never puts it in the question's options.
- The five questions are unchanged (hints and examples); answers are shown and written on a yes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-starter`: "Project context filled at setup" asks about the source first and shows the draft in full before asking about it.

## Impact

- **Skill text:** `plugins/kit/skills/start/SKILL.md` step 6. No script changes.
- **Evals:** content checks for the source question, the shown draft and the "never ask about unseen text" rule.
- **Kit version:** 0.18.0 -> 0.18.1.
- **Then:** test both paths: a fresh Acme copy (draft) and an empty folder (questions).
