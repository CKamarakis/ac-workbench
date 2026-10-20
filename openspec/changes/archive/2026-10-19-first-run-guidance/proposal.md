# Proposal

## Why

Test A on 2026-10-19 (a fresh Acme copy, kit 0.17.1 installed from GitHub with a clean Claude profile) showed what a new user meets after `/kit:start`: the next step loops (`/kit:start` -> `/kit:next` -> `/kit:status` -> "nothing to pick from") and never names a real first step (L25); the project context doc is a blank form, so proposals start with no product context and `/kit:status` describes the project with the form's hint text (L26); a status note is jargon ("roadmap.md has no commit git can read", L27); and missing machine tools are only pointed at, not offered (L24). The user asked to fix these before the Acme tests (drift entry 2026-10-19).

## What Changes

- **First steps (L25):** on a new project (no notes, PRDs or changes yet), `/kit:start` ends with, `/kit:next` suggests, and `/kit:status` offers two first steps: `/kit:capture` to save ideas and notes, or `/opsx:explore` to explore an idea you already have.
- **Project context at setup (L26):** right after a fresh setup creates `docs/project-context.md`, `/kit:start` offers to fill it: a draft from what the project already has (README, CLAUDE.md, AGENTS.md, package.json description, docs) shown in full, or five questions with hints and examples when there's too little to draft from. Written only on a yes; "later" is fine. The template's sections become those five questions (problem, users, what it does, rules the agent can't see in the code, not now).
- **Status description (L26):** a context doc that is still the blank form is skipped as the project's description (README is used instead when there is one), and status says "Project not described yet" with the fix when nothing describes it.
- **Plain note (L27):** "can't check whether Now is out of date until roadmap.md is committed".
- **Setup offered (L24):** when machine tools are missing, `/kit:start` offers to run `/kit:setup` now and continues after it.

```
/kit:start (fresh) -> offers to fill the context doc -> "Start with /kit:capture or /opsx:explore"
/kit:next  (new project) -> /kit:capture, or /opsx:explore
/kit:status (new project) -> "Nothing yet: /kit:capture or /opsx:explore"
```

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-starter`: setup offered on a yes; the context doc offered right after a fresh setup; the first step after setup.
- `skill-routing`: the first step on a new project.
- `project-status`: the blank context doc isn't used as the description; first steps when the project is new.
- `roadmap`: the "not committed yet" note in plain words.

## Impact

- **Code:** `plugins/kit/scripts/next.mjs`, `status.mjs`, `roadmap.mjs`; template `plugins/kit/templates/project-context.md`.
- **Skills (text):** `start`, `status`.
- **Tests:** `tests/kit/next.test.mjs`, `status.test.mjs`, `roadmap.test.mjs`, start tests if the template is checked; evals for `start` and `status`.
- **Existing projects:** their context docs are theirs and aren't touched; only new setups get the new template. Kit 0.17.2 -> 0.18.0 (new behaviour).
- **Then:** re-run test A on a fresh copy with the new kit.
