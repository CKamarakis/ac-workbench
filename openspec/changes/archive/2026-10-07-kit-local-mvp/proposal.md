# Proposal: kit-local-mvp

## Why

Every new project costs about half a day of setup. Tool choices are made from guesswork rather than evidence, and there is no single place to see which projects exist, which tools are in use, or which practices to follow. The original prd-pipeline idea is one part of a bigger need: a **personal Claude Code kit** that bootstraps projects with good defaults, records what each tool is worth, and makes that visible. The first version is local-only and free, so we can learn before expanding.

## What Changes

> **Scope update 2026-10-01:** the cockpit, kit feedback and harness review moved to the change `kit-overview-feedback`. This change now ships the core kit: registry, evals, tool setup, routing, starter, `/kit:next`. Reason and order: `docs/roadmap.md` (drift log).

The repo becomes a personal kit: a marketplace repo that holds several plugins. This change ships the core, five local pieces:

```
 CKamarakis/ac-workbench (marketplace repo, plugin `kit`)
  |-- toolkit.yaml ........ registry: tools, tiers, scopes, verdicts, lanes
  |-- evals ............... test cases + run records for each kit skill (and A/B trials)
  |-- /kit:setup .......... one command: the machine toolset from the registry
  |-- lane map + /kit:next  one owner per phase; routing block; next-step suggestion
  +-- /kit:start .......... sets up a project in minutes; tools per project by tier
```

How the pieces connect:

```
                 toolkit.yaml  <------------- verdicts ------------+
              /       |        \                                   |
             v        v         v                                  |
     /kit:setup   /kit:start   lane map --> /kit:next     evals / trials
     (machine)    (project)    (routing)    (what next)   (prove) -+
```

The cockpit, kit feedback and harness review are in the change `kit-overview-feedback`.

- **Toolkit registry:** one file listing each tool with its tier (global / per project / by project type), the reason it's there, rubric notes (problem fit, overlap, context cost, run cost, trust, reversibility, license), cost, and status (trial / adopted / dropped / later).
- **Project starter:** one command in an empty folder sets up the Tier 2 basics (git, `.gitignore` incl. licensed-folder patterns, OpenSpec init + config context, CLAUDE.md starter, project-context doc) and optional Tier 3 add-ons by project type.
- **Skill evals:** every kit skill ships with fixed test cases and automatic checks. Results feed registry verdicts.
- **Tool setup:** one command (`/kit:setup`, also run by `/kit:start`) installs the machine toolset from the registry (CLIs, the kit plugin, known marketplaces). It is safe to re-run. Workflow plugins are enabled per project, never globally.
- **Skill routing:** a lane map (one owner per phase) stored in the registry and written into each project's routing rules, plus a `/kit:next` skill that suggests the next step based on the current OpenSpec change status.

### Update and feedback model

```
  PROJECT X                                  KIT REPO
  /kit:feedback --> KIT INBOX (private repo, Issues) --> triage --> /opsx:explore
                                                             --> change --> release (tag)
  project updates plugin <------------------------------------------------+
```

Rules:
1. **Add on top, never edit their files.** Third-party tools install from their own sources and update themselves. The kit only records them (reviewed version, verdict). Custom behavior lives in kit skills that wrap or combine theirs. A copied-in piece (e.g. from ECC) records its source and version.
2. **Projects report; only the kit repo changes the kit.** No committing to the kit from consuming projects.
3. **Capture feedback when it happens,** with context, so nothing needs re-explaining later.
4. **Dev mode vs stable mode.** On the main PC, the kit clone is added as a local-directory marketplace, so edits apply immediately (verified: in-place local plugins are not version-pinned). Elsewhere, install from GitHub pinned to a release. Exact update commands are **unverified**.
5. **Drift is visible.** Each project stores `.claude/kit.json` (kit version, setup date). The cockpit (change `kit-overview-feedback`) will show projects that are behind. Starter re-runs suggest changes as a diff and never overwrite files.
6. **Kit global, tools per project.** Only the kit plugin, CLIs and known marketplaces are installed for the whole machine. Workflow plugins (e.g. Superpowers) are enabled in each kit-set-up project's own settings, so repos the user works in but doesn't own are unaffected.

- The feedback part of this model (`/kit:feedback`, private inbox) is built in `kit-overview-feedback`.

### Skill routing and overlap

Several tools claim the same phase (e.g. Superpowers and OpenSpec both plan). Overlapping skill descriptions make Claude's choice unpredictable, and too many skills get silently cut from the skill list. Each phase therefore gets one owner.

The owners are registry data, not this proposal. After the A/B trial (2026-10-01), `npm run registry` shows:

```
 PHASE        OWNER: SKILL                         ALTERNATIVE
 brainstorm   openspec: /opsx:explore               superspec (trial)
 artifacts    openspec: /opsx:propose               superspec
 plan         openspec: /opsx:continue              superspec
 build        openspec: /opsx:apply                 superspec (worktree + subagent TDD)
 verify       openspec: validate + the change's tests   superspec: /opsx:verify
 review       unowned (decided in quality-gates, see docs/roadmap.md)
 ui-polish    impeccable (trial)                    emil-skills (motion)
 close        openspec: /opsx:archive               superspec
 kit-issues   kit: /kit:feedback
```

- **Enforcement, strongest first:**
  1. An OpenSpec custom schema that calls the right skill at each step (SuperSpec, https://github.com/danielhanold/superspec, MIT), for changes that use it.
  2. Enabling tools per project (`enabledPlugins`; verified 2026-10-01: a plugin enabled in one project doesn't load elsewhere).
  3. Routing rules in the project's CLAUDE.md (generated routing block).
- **Registry lane fields:** `phases`, `skills`, `skip_skills`, `overlaps`, `reviewed_version`. The validator fails on unresolved overlaps; the harness review (`kit-overview-feedback`) also flags them in a project.
- **When a tool updates:** read its changelog. New lane claims get an owner decision; behavior changes trigger an eval re-run.
- **SuperSpec:** trial, per change for big or risky work (A/B result in `evals/trials/workflow-ab.md`). It needs git worktrees, `realpath`, `gh` and `jq` (all present), plus a project-only OpenSpec custom profile (`evals/trials/workflow-ab-setup.md`).

**Out of scope here (see `docs/roadmap.md` for when):** prd-pipeline + Notion (M2), quality gates (M3), cockpit, feedback and harness review (M5), CI deploys and previews, Sentry/PostHog, task-observer, ECC pieces (one at a time, never a bulk install).

**Tool choices:** recorded in `toolkit.yaml` with verdicts and evidence. This proposal no longer lists candidates; the full review of the user's tool list is `evals/trials/tool-review-2026-10-01.md`.

## Capabilities

### New Capabilities
- `toolkit-registry`: schema and rules for the tool registry (entries, tiers, rubric fields, status lifecycle, verdict history)
- `project-starter`: bootstrap of a new or empty project from the registry (Tier 2 basics, Tier 3 by project type), safe to re-run
- `skill-evals`: how kit skills declare eval cases, run them, and record results as verdicts
- `skill-routing`: lane map (one owner per phase), overlap detection, and `/kit:next` step suggestions
- `tool-setup`: one-command, registry-driven, idempotent install of the machine toolset; workflow plugins never enabled globally

Moved to `kit-overview-feedback` (2026-10-01): `cockpit`, `harness-review`, `kit-feedback`.

### Modified Capabilities
- None (no existing specs).

## Impact

- **Repo identity:** renamed to `ac-workbench` (done 2026-09-29); `openspec/config.yaml` and `docs/project-context.md` use the kit framing.
- **Plugin structure:** `.claude-plugin/marketplace.json` listing several plugins, each with its own `.claude-plugin/plugin.json` and `skills/`. Verified against the plugin docs on 2026-09-29.
- **Evals tooling:** the kit owns the case format. `claude plugin eval` exists (2.1.286) and is a candidate engine for Claude-in-the-loop cases, to be compared with the harness/evals tool the user will share.
- **Dependencies:** Node/npm and dev-only `yaml`. Trial tools (Playwright CLI, Context7, Impeccable, ...) are added per project only. No paid services.
- **Platform:** Windows 11 + Git Bash. CLIs off the agent PATH (`openspec`, `gh`, `jq`, `gitleaks`, `claude`) are found by `locate.mjs`.
- **Open items:**
  - Review the user's harness/evals tool.

## Validation Plan

The proposal is tested by building its first slice with it, not by debate.

```
 STEP 1  SMOKE TEST (throwaway kit-sandbox repo, Superpowers enabled there only)
         session starts fast? input not frozen? skills listed?
            | fail --> try WSL2 or drop Superpowers; record verdict
            v
 STEP 2  SAME TASK, TWO SETUPS
         A: OpenSpec spec-driven (current)
         B: SuperSpec (OpenSpec + Superpowers)
         task: first kit slice = toolkit.yaml + a validator
            v
 STEP 3  SCORE: manual interventions, time, tests written first,
         tests pass, Claude usage spent, Windows glitches,
         artifact quality (harness-review checklist)
            v
 STEP 4  VERDICT --> first toolkit.yaml entries
            v
 STEP 5  the winning setup becomes project-starter's default workflow
```

**Known Windows risks for Superpowers:** its session-start hook has had bugs on Windows:
- hang: https://github.com/obra/superpowers/issues/413 (closed)
- frozen input: https://github.com/obra/superpowers/issues/419
- per-user Git not found: https://github.com/obra/superpowers/issues/1863 (doesn't apply here; Git is at the standard path)
- update lost skills: https://github.com/obra/superpowers/issues/1082

Workaround suggested in those issues: WSL2. The smoke test (6.4.2, 2026-10-01) hit none of them; the fix status in the issues themselves stays **unverified**. A hook installed for the whole user profile would affect every session, so the trial stays isolated in the sandbox.

**Results (completed 2026-10-01, details in `evals/trials/`):**

| Step | Result | Evidence |
|---|---|---|
| 1 Smoke test | PASS: local plugin install works (`${CLAUDE_PLUGIN_ROOT}` is replaced in skill text, not an env var); Superpowers starts with no hang or frozen input, skills listed, **active only in the project that enables it** | `plugin-install-check.md`, `superpowers-smoke.md` |
| 2 Same task, two setups | both builds pass 12/12 acceptance cases and 12/12 extra probes | `evals/registry/runs/2026-10-01-*.json` |
| 3 Score | A (OpenSpec) 7.5 min, $1.96, 0 questions; B (SuperSpec) 28.5 min, ~$9–10 est., 2 questions, better audit trail | `workflow-ab.md` |
| 4 Verdict | OpenSpec adopted as the default; SuperSpec and Superpowers trial for big or risky changes; B's validator ported | `toolkit.yaml` |
| 5 Default workflow | the starter's routing block uses the lane map (OpenSpec default, SuperSpec alternative) | group 7 |
