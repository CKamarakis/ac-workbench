# Design

## Context

See proposal.md (Why, What Changes) and the seven spec deltas for requirements. This doc covers only how.

Current state and constraints that shape the approach:
- Repo `ac-workbench` holds only OpenSpec planning files and `docs/`. No plugin files, no remote, no `gh`/`jq` yet.
- Node v24 and npm are present. Python is not confirmed, so it is not a dependency.
- Windows 11, Git Bash + PowerShell. Global npm bins (`openspec`, `claude`) live in `%APPDATA%\npm`, which is **not** on the PATH of the agent shells.
- A plugin installed from GitHub is a plain git checkout. There is no `npm install` step, so runtime scripts cannot rely on `node_modules`. (Inferred from the plugin docs read on 2026-09-29; the exact install behavior is **unverified**.)
- `openspec/config.yaml` and `docs/project-context.md` still describe prd-pipeline.

## Goals / Non-Goals

**Goals:**
- Put deterministic work (validation, file planning, diffing, HTML build) in small Node scripts, and use skills for the parts that need a conversation (questions, confirmation, judgement).
- Zero runtime dependencies in anything a consuming project executes.
- One source of truth per kind of data: the kit repo holds tool data, and each machine holds its own project list.
- Every script can be driven by an eval case with no Claude session.

**Non-Goals:**
- No build tooling (bundlers, TypeScript compile). Plain ESM `.mjs`.
- No cross-machine sync of the project list.
- No automatic changes to tool ownership or verdicts (see skill-routing spec).
- No choice between OpenSpec and SuperSpec here. That is decided by the Validation Plan trial, and the design must work with either.

## Decisions

### D1. Repo layout: one marketplace, one `kit` plugin

```
ac-workbench/
 |-- .claude-plugin/marketplace.json     lists plugins (kit now, prd-pipeline later)
 |-- toolkit.yaml                        registry source (hand-edited)
 |-- plugins/kit/
 |    |-- .claude-plugin/plugin.json     version = kit version
 |    |-- data/toolkit.json              generated from toolkit.yaml, committed
 |    |-- skills/  setup/ start/ next/ feedback/ harness-review/
 |    |-- scripts/ *.mjs                 zero-dependency runtime
 |    +-- templates/                     CLAUDE.md, project-context, .gitignore
 |-- tools/                             dev-only (may use npm deps)
 |    |-- validate-registry.mjs          toolkit.yaml -> errors | data/toolkit.json
 |    |-- build-cockpit.mjs
 |    +-- run-evals.mjs
 +-- evals/<skill>/cases.yaml, runs/<date>-<setup>.json
```

- **Why:** one plugin keeps skill names short (`/kit:start`, `/kit:next`, `/kit:feedback`) and has a single version for the drift check. A `plugins/` folder leaves room for prd-pipeline without another restructure.
- **Alternative:** one plugin per capability. Rejected because it multiplies versions and install steps for one user.

### D2. Registry: YAML source, generated JSON for runtime

- `toolkit.yaml` is the hand-edited file (it allows comments and is readable). `tools/validate-registry.mjs` validates it and, only on success, writes `plugins/kit/data/toolkit.json`.
- Runtime scripts (starter, next, cockpit) read only the JSON, so they need no YAML parser.
- Validation rules are coded directly in the validator (required fields, enums, status == latest verdict, phase conflicts, reviewed vs installed version). This gives clearer error messages than a generic schema tool.
- **Alternatives:**
  - JSON only: no parser needed, but no comments and harder to edit by hand.
  - Vendoring a YAML library into the plugin: adds a third-party file to maintain.
- **Guard:** an eval case fails if `toolkit.json` is stale compared with `toolkit.yaml`.

### D3. Project list lives per machine, not in the kit repo

- File: `~/.claude/kit/projects.json` (name, path, links). The starter adds the project there, and the cockpit reads it.
- The per-project stamp stays in `<project>/.claude/kit.json` (kit version, setup date, project type, applied entries).
- **Why:** proposal rule 2 says projects don't change the kit repo. Paths are also machine-specific.
- **Alternative:** scan a projects folder for stamps. Rejected because projects are scattered and a scan is slow. It can be added later as a "discover" helper.

### D4. Starter = plan / apply split

```
 /kit:start (skill)
   1. scripts/prereqs.mjs      -> resolve git, openspec, npm (PATH + %APPDATA%\npm + npm prefix -g)
   2. ask project type         (or take it as an argument)
   3. scripts/start-plan.mjs   -> JSON plan: [{file, action: create|same|differs, diff}]
   4. show summary + diffs     -> user confirms each "differs"
   5. scripts/start-apply.mjs  -> writes the confirmed items only; runs openspec init; writes stamp
```

- Idempotency is a property of the planner: a re-run plans all `same`, so there is nothing to change.
- **Why:** makes "never overwrite" and "idempotent" testable without Claude, and keeps the skill thin.
- **Alternative:** the skill writes files directly. Rejected because it can't be checked deterministically and depends on model behavior.
- The prereq check runs before any write. A missing git stops the run (spec: project-starter).

### D5. Managed sections via markers

- The kit owns only text between `<!-- kit:routing:start -->` and `<!-- kit:routing:end -->` in CLAUDE.md. It uses the same pattern for `.gitignore` (`# kit:start` / `# kit:end`).
- Re-sync replaces only the block. If a file has no block, the planner proposes appending one.
- **Why:** meets "user edits preserved" with simple string handling and no merge logic.

### D6. Lane map and `/kit:next`

- The lane map is computed from `toolkit.json` (`phases` on adopted/trial entries plus `skip_skills`). It is rendered in three places: the validator output, the cockpit, and the CLAUDE.md routing block.
- The next-step map is a small table in `scripts/next.mjs`:

  | OpenSpec state (`openspec status --json`) | suggested phase |
  |---|---|
  | no active change | brainstorm/explore |
  | first artifact `ready` | artifacts (name the artifact) |
  | `isPlanningComplete`, tasks unchecked | build |
  | all tasks checked | verify, then close |

  The owner for each phase is looked up in the lane map, never hard-coded.
- **Why:** the only part that changes when the SuperSpec trial wins is the registry data, not the code.

### D7. Cockpit: static HTML built by one command

- `node tools/build-cockpit.mjs` validates the registry, reads `toolkit.json`, `projects.json` and each project stamp, and writes one self-contained `cockpit/index.html` (inline CSS/JS, gitignored). Filters (status, tier) are client-side JS.
- If validation fails, the build exits non-zero and writes nothing.
- **Why:** this decides the proposal's open item. The spec requires offline use, no account and no network, which rules out a published artifact for v0. An artifact can come later as an optional share view.
- The situation-to-skill guide comes from a `situations` list in `toolkit.yaml`, so no guidance is written by hand in the page.

### D8. Evals: kit-owned case format, pluggable runner

- `evals/<skill>/cases.yaml` has `id`, `setup`, `input`, `checks[]`. Each check is either `deterministic` (file-exists, command-exit, git-ignored, content-match) or `rubric` (named criteria).
- `tools/run-evals.mjs`:
  - creates a temp sandbox and runs deterministic checks on its own
  - records rubric checks as per-criterion pass/fail, filled in by a Claude-scored step or by hand
  - writes `evals/<skill>/runs/<date>-<setup>.json` with date, setup, per-case results, duration and interventions
- A run file path is what a registry verdict cites (`evidence:`).
- A missing `cases.yaml` for any skill in `plugins/kit/skills/` fails the run.
- **Why:** the case and result format is ours and stable. The engine that drives Claude sessions (`claude plugin eval`, **unverified**, or the user's harness tool) can be swapped in later without changing cases or verdicts.

### D9. Feedback: `gh` first, local pending file as fallback

- The skill drafts the issue and scrubs it: paths only; drop anything matching key/token/`=`-secret patterns and env values. The user confirms the text.
- Then `gh issue create --label feedback` runs on the **inbox repo** (`ac-workbench-inbox`, private). Its slug is read from plugin data. Before filing, the skill checks that the repo is private (`gh repo view --json visibility`), because the kit repo itself is public and project details must not leak.
- On any failure (no `gh`, not signed in, offline) the draft is saved to `~/.claude/kit/feedback-pending/<timestamp>.md` and the user gets the install and retry steps. A later `/kit:feedback --flush` files the pending items.
- **Why:** feedback must never be lost, and no kit files are ever written from a project.

### D10. Harness review: skill-only checklist

- `skills/harness-review/SKILL.md` plus `checklist.md` (questions per layer, memory types, scorecard template).
- The skill uses read-only tools only, and says so in its instructions. The overlap check calls `scripts/lanes.mjs` against the project's enabled plugins.
- **Why:** the spec says checklist-only for the MVP. Automation is out of scope.

### D11. Build order follows the Validation Plan

```
 secret-scan hook (D15) -> sandbox smoke test -> A/B build of registry+validator (D2) -> verdict
   -> tool setup (D13) -> lanes (D6) -> starter (D4,D5,D14) -> next -> cockpit (D7) -> feedback (D9) -> harness-review (D10)
   evals (D8) scaffold first, and each skill's cases ship with it
```

- The registry and validator come first because every other piece reads them, and they are the A/B trial task.
- Tool setup comes right after the registry because it reads `toolkit.json`. Its fields (`scope`, `check`, `install`) are in the registry spec, so the validator covers them from the start.

### D12. Rename housekeeping

- Update `openspec/config.yaml` context and `docs/project-context.md` to the kit framing as the first task, so later artifacts stop receiving the stale prd-pipeline context.

### D13. Tool setup: one command, registry-driven

```
 /kit:setup  (also step 0 of /kit:start)
   scripts/setup.mjs plan   -> for each adopted|trial entry with scope: machine
                                 run entry.check  -> present | missing
                                 (known locations too: npm prefix -g, Program Files)
   show list, confirm
   scripts/setup.mjs apply  -> run entry.install for each missing one; one failure never stops the rest
   summary: installed / present / failed (+ fix hint)
```

- Registry fields per entry: `scope: machine | project`, `check` (a command, exit 0 = present) and `install` (commands keyed by platform, starting with `win32`).
- Machine scope covers CLIs (git, gh, jq, gitleaks, openspec), the kit plugin, and known marketplaces (`claude plugin marketplace add`).
- **Why:** it uses the same plan / confirm / apply pattern as the starter (D4), so it is idempotent and testable without Claude.
- **Bootstrap on a new machine:** `/kit:setup` needs the kit installed first. Two documented lines cover that: `claude plugin marketplace add CKamarakis/ac-workbench` and `claude plugin install kit@ac-workbench`. After that, everything goes through the kit.
- **Alternative:** a PowerShell/winget script outside Claude. Rejected because it can't read the registry without its own parser and duplicates the starter's logic.

### D14. Workflow plugins enabled per project

- The starter writes the project-scope entries for the chosen project type into `<project>/.claude/settings.json`: `enabledPlugins` plus `extraKnownMarketplaces` for their marketplaces.
- It merges these keys and never touches other keys (permissions, env, …). A key the kit set is recorded in the stamp (`.claude/kit.json`), so a re-run can tell kit keys from user keys.
- `~/.claude/settings.json` is never given project-scope plugins. Setup only registers marketplaces and the kit there.
- **Why:** the user works in repos they don't own. Kit tools must be active only where the kit set the project up. This was the user's decision on 2026-09-29, after the Superpowers install defaulted to user scope.
- **Alternative:** `claude plugin install --scope project`. Its flags and non-interactive behavior are **unverified** (task 5.1). Writing the settings directly works either way. The CLI is only needed to fetch the plugin into the cache, if Claude Code doesn't offer that itself when it sees an enabled plugin that isn't installed (**unverified**).

### D15. Secret scanning from the start

- The kit repo is public (since 2026-09-29). A `gitleaks` pre-commit hook lives in `.githooks/`, enabled with `git config core.hooksPath .githooks`. It blocks commits that contain secrets.
- gitleaks is a registry entry (machine scope, free, MIT). The starter can offer the same hook to projects as a Tier 1 check.
- **Alternative:** a custom regex scan. Rejected because gitleaks is maintained and has far better rule coverage. The feedback scrub (D9) still uses its own patterns, since it runs on text, not commits.

## Risks / Trade-offs

- [Generated `toolkit.json` drifts from YAML] → Eval check plus the validator run as the documented edit step. A pre-commit hook can be added later.
- [Plugin script paths] → Checked 2026-09-29 (`evals/trials/plugin-install-check.md`). `${CLAUDE_PLUGIN_ROOT}` is replaced in the SKILL.md text, but it is **not** set as an environment variable for Bash. So skills pass the path in the command, and scripts find their own folder from `import.meta.url`. Whether a GitHub install copies the plugin into a cache is still **unverified**.
- [PATH resolution differs between Git Bash, PowerShell and the Claude shell] → Keep one resolver in `prereqs.mjs` (PATH, `%APPDATA%\npm`, `npm prefix -g`) and cover it with an eval case.
- [The secret scrub misses a pattern] → The user confirms the text before filing, and file contents are never included (paths only).
- [Marker blocks get hand-edited or deleted] → The planner treats a missing block as "append" and a damaged block (start marker without end) as a conflict to show, never to guess.
- [Rubric evals are subjective] → Named criteria with a reason each. Deterministic checks are preferred wherever the outcome allows.
- [Plugin cache fetch for per-project plugins, **unverified**] → Task 5.1 checks it. If Claude Code doesn't install a missing enabled plugin by itself, setup pre-fetches every project-scope plugin into the cache without enabling it.
- [A user-scope install slips in, e.g. through `/plugin install` defaulting to user scope] → Setup's plan flags any project-scope plugin found in `~/.claude/settings.json` `enabledPlugins` and offers to move it.
- [Installed-version detection for "needs review" depends on where Claude Code records plugin versions, **unverified**] → Start with a manual `installed_version` field and automate once the location is confirmed.

## Migration Plan

- Nothing is deployed yet, so no migration is needed. On the main PC, add the repo as a local-directory marketplace (dev mode, proposal rule 4). Rollback: remove the marketplace entry.
- Existing projects (e.g. Toughbubble) run `/kit:start` in re-run mode, so they see diffs only and nothing is overwritten.

## Open Questions

- Which engine drives Claude-in-the-loop eval cases: `claude plugin eval` or the user's harness tool? This doesn't affect the case format (D8).
- Exact location of Claude Code's installed plugin version data (for automating "needs review").
- Whether per-project `enabledPlugins` alone is enough, or plugins also need a cache fetch. Task 2.5 and task 5.1 settle this; D14 works either way.
