# Design

## Context

See proposal.md (Why, What Changes) and the five spec deltas for requirements. This doc covers only how. The order of work across changes is in `docs/roadmap.md`.

Constraints that shape the approach (updated 2026-10-01):
- Public repo `CKamarakis/ac-workbench`. `gh` 2.101.0, `jq` 1.8.2 and gitleaks 8.30.1 are installed; none of them is on the agent shells' PATH.
- Node v24 and npm are present. Python is not confirmed, so it is not a dependency.
- Windows 11, Git Bash + PowerShell. Global npm bins (`openspec`) live in `%APPDATA%\npm`, and `claude` lives in `%USERPROFILE%\.local\bin`. Neither is on the agent shells' PATH, so `locate.mjs` finds them.
- A plugin installed from GitHub has no `npm install` step, so runtime scripts cannot rely on `node_modules`. In dev mode the plugin runs in place from the repo (checked 2026-09-29). Whether a GitHub install runs from a cache copy is **unverified**.

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
- No hard-coded workflow choice. The A/B trial (2026-10-01) made OpenSpec the default and SuperSpec a trial alternative, but that lives only in registry data; the code reads the lane map.

## Decisions

### D1. Repo layout: one marketplace, one `kit` plugin

```
ac-workbench/
 |-- .claude-plugin/marketplace.json     lists plugins (kit now, prd-pipeline later)
 |-- toolkit.yaml                        registry source (hand-edited)
 |-- plugins/kit/
 |    |-- .claude-plugin/plugin.json     version = kit version
 |    |-- data/toolkit.json              generated from toolkit.yaml, committed
 |    |-- skills/  ping/ setup/ start/ next/        (feedback/, harness-review/: kit-overview-feedback)
 |    |-- scripts/ locate setup lanes prereqs start-plan start-apply next .mjs   zero-dependency runtime
 |    +-- templates/                     CLAUDE.md, project-context, .gitignore
 |-- tools/                             dev-only (may use npm deps)
 |    |-- validate-registry.mjs          toolkit.yaml -> errors | data/toolkit.json (+ lane map)
 |    |-- run-evals.mjs, compare-runs.mjs, evals/lib.mjs
 |-- tests/kit/*.test.mjs               unit tests for plugin scripts (node --test)
 +-- evals/<skill>/cases.yaml, runs/<date>-<setup>.json, trials/*.md
```

- **Why:** one plugin keeps skill names short (`/kit:start`, `/kit:next`, `/kit:feedback`) and has a single version for the drift check. A `plugins/` folder leaves room for prd-pipeline without another restructure.
- **Alternative:** one plugin per capability. Rejected because it multiplies versions and install steps for one user.

### D2. Registry: YAML source, generated JSON for runtime

- `toolkit.yaml` is the hand-edited file (it allows comments and is readable). `tools/validate-registry.mjs` validates it and, only on success, writes `plugins/kit/data/toolkit.json`.
- Runtime scripts (setup, starter, next, lanes; later the cockpit) read only the JSON, so they need no YAML parser.
- Validation rules are coded directly in the validator (required fields, enums, status == latest verdict, phase conflicts, reviewed vs installed version). This gives clearer error messages than a generic schema tool.
- **Alternatives:**
  - JSON only: no parser needed, but no comments and harder to edit by hand.
  - Vendoring a YAML library into the plugin: adds a third-party file to maintain.
- **Guard:** an eval case fails if `toolkit.json` is stale compared with `toolkit.yaml`.

### D3. Project list lives per machine, not in the kit repo

- File: `~/.claude/kit/projects.json` (name, path, links). The starter adds the project there; the cockpit (change `kit-overview-feedback`) will read it.
- The per-project stamp stays in `<project>/.claude/kit.json` (kit version, setup date, project type, applied entries).
- **Why:** proposal rule 2 says projects don't change the kit repo. Paths are also machine-specific.
- **Alternative:** scan a projects folder for stamps. Rejected because projects are scattered and a scan is slow. It can be added later as a "discover" helper.

### D4. Starter = plan / apply split

```
 /kit:start (skill)
   1. scripts/prereqs.mjs      -> locate.mjs + setup.mjs plan: missing git stops; other missing machine tools -> offer /kit:setup
   2. ask project type         (or take it as an argument); ask yes/no for each `project`-tier tool
   3. scripts/start-plan.mjs   -> JSON plan: files [{file, action: create|same|differs, diff}]
                                  + tools [{name, tier, why, install, interactive}]
   4. show summary + diffs     -> user confirms each "differs" and the tool list
   5. scripts/start-apply.mjs  -> writes the confirmed files only; runs openspec init; installs the tools; writes the stamp
```

- **Tool selection by tier** (spec: project-starter): scope `project` + status adopted/trial, then
  - `global`: always
  - `project`: only on a yes
  - `project-type:<t>`: when `<t>` is chosen
- **Installing a tool:**
  - plugins: `claude plugin install <p> --scope project --json` (D14)
  - MCP servers and skills: the entry's `install` command
  - each one is followed by its `check`
  - an entry with `install_note` (e.g. Notion OAuth) is shown to the user as a step to complete, and stays `pending` until its check passes
- Idempotency is a property of the planner: a re-run plans all `same`, so there is nothing to change.
- **Why:** makes "never overwrite" and "idempotent" testable without Claude, and keeps the skill thin.
- **Alternative:** the skill writes files directly. Rejected because it can't be checked deterministically and depends on model behavior.
- The prereq check runs before any write. A missing git stops the run (spec: project-starter).

### D5. Managed sections via markers

- The kit owns only text between `<!-- kit:routing:start -->` and `<!-- kit:routing:end -->` in CLAUDE.md. It uses the same pattern for `.gitignore` (`# kit:start` / `# kit:end`).
- Re-sync replaces only the block. If a file has no block, the planner proposes appending one.
- **Why:** meets "user edits preserved" with simple string handling and no merge logic.

### D6. Lane map and `/kit:next`

- `scripts/lanes.mjs` computes the lane map from `toolkit.json`: `phases`, `skills` (phase → skill or command), `overlaps` and `skip_skills` of adopted/trial entries. It renders it in the validator output and the CLAUDE.md routing block, and the cockpit (change `kit-overview-feedback`) will reuse it.
- **Owner rule** (spec: skill-routing), applied per phase:
  1. A claimant that lists another claimant under `overlaps` defers to it and becomes an alternative.
  2. Of the rest, adopted beats trial.
  3. A remaining tie is a conflict: owner `null`, shown, never guessed.

  With today's registry, OpenSpec owns the planning and build phases, SuperSpec is the alternative on each, and Superpowers owns nothing (it runs inside SuperSpec).
- **`skip_skills` names the tool's own skills that the kit doesn't use** (e.g. `superpowers:writing-plans`, or "SuperSpec as the default schema"). Never another tool's skills, because the routing block turns them into "don't use" lines.
- **Routing block:** a table of phase | use | owner | alternative, plus the skip list, between `<!-- kit:routing:start -->` and `<!-- kit:routing:end -->`. A golden-file test fixes its format.
- The next-step map is a small table in `scripts/next.mjs`:

  | OpenSpec state (`openspec status --json`) | suggested phase |
  |---|---|
  | no active change | brainstorm (e.g. `/opsx:explore`) |
  | first artifact `ready` | artifacts (name the artifact) |
  | `isPlanningComplete`, tasks unchecked | build |
  | all tasks checked | verify, then close |

  The owner for each phase is looked up in the lane map, never hard-coded.
- **Why:** the only part that changes when the SuperSpec trial wins is the registry data, not the code.

### D7. Moved

Cockpit moved to the change `kit-overview-feedback` on 2026-10-01 (see `docs/roadmap.md`, drift log).

### D8. Evals: kit-owned case format, pluggable runner

- `evals/<skill>/cases.yaml` has `id`, `setup`, `input`, `checks[]`. Each check is either `deterministic` (file-exists, command-exit, git-ignored, content-match) or `rubric` (named criteria).
- `tools/run-evals.mjs`:
  - creates a temp sandbox and runs deterministic checks on its own
  - records rubric checks as per-criterion pass/fail, filled in by a Claude-scored step or by hand
  - writes `evals/<skill>/runs/<date>-<setup>.json` with date, setup, per-case results, duration and interventions
- **Placeholders:**
  - `{{kit}}`, `{{repo}}`, `{{sandbox}}` are built in.
  - A case file can set default `vars` (e.g. `validator: '{{repo}}/tools/validate-registry.mjs'`), and `--var name=value` overrides them per run. That's how one set of cases measured both A/B builds; the values are recorded in the run.
- **Time:** `duration_ms` is how long the checks ran. For trials, `--session-minutes` records the working session's wall time (spec: skill-evals "time taken by the setup under test"). `compare-runs.mjs` shows both.
- A run file path is what a registry verdict cites (`evidence:`).
- A missing `cases.yaml` for any skill in `plugins/kit/skills/` fails the run.
- **Why:** the case and result format is ours and stable. The engine that drives Claude sessions (`claude plugin eval`, which exists in 2.1.286, or the user's harness tool) can be swapped in later without changing cases or verdicts.

### D9–D10. Moved

Feedback (D9) and harness review (D10) moved to the change `kit-overview-feedback` on 2026-10-01 (see `docs/roadmap.md`, drift log).

### D11. Build order follows the Validation Plan

```
 secret-scan hook (D15) -> sandbox smoke test -> A/B build of registry+validator (D2) -> verdict
   -> tool setup (D13) -> lanes (D6) -> starter (D4,D5,D14) -> next -> integration + tag v0.1.0
   (cockpit, feedback, harness review: change kit-overview-feedback)
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

- Registry fields per entry:
  - `scope: machine | project`
  - `check`: a command; exit 0 means present
  - optional `check_match`: a regex the check output must also match, e.g. `"kit@ac-workbench"` in `claude plugin list --json`
  - `install`: commands keyed by platform, starting with `win32`
  - optional `install_note`: interactive steps (OAuth) and anything unverified about the install
- Commands run with a PATH built by `locate.mjs`: real tool folders prepended, with Windows Git (`Git\cmd`, `preferKnown`) first.
- **The plan also warns** when a project-scope plugin is enabled in `~/.claude/settings.json`, and gives the fix (spec: tool-setup). It changes nothing by itself.
- Machine scope covers CLIs (git, gh, jq, gitleaks, openspec), the kit plugin, and known marketplaces (`claude plugin marketplace add`).
- **Why:** it uses the same plan / confirm / apply pattern as the starter (D4), so it is idempotent and testable without Claude.
- **Bootstrap on a new machine:** `/kit:setup` needs the kit installed first. Two documented lines cover that: `claude plugin marketplace add CKamarakis/ac-workbench` and `claude plugin install kit@ac-workbench`. After that, everything goes through the kit.
- **Alternative:** a PowerShell/winget script outside Claude. Rejected because it can't read the registry without its own parser and duplicates the starter's logic.

### D14. Workflow plugins enabled per project

- The starter writes the project-scope entries for the chosen project type into `<project>/.claude/settings.json`: `enabledPlugins` plus `extraKnownMarketplaces` for their marketplaces.
- It merges these keys and never touches other keys (permissions, env, …). A key the kit set is recorded in the stamp (`.claude/kit.json`), so a re-run can tell kit keys from user keys.
- `~/.claude/settings.json` is never given project-scope plugins. Setup only registers marketplaces and the kit there.
- The same applies to a tool's own config. When a tool's docs say to configure it globally (e.g. SuperSpec's OpenSpec profile), the kit applies that config per project. For OpenSpec this means a redirected `XDG_CONFIG_HOME` during `openspec init`, which writes generated commands into the project only (`evals/trials/workflow-ab-setup.md`). The registry's install data for such tools must say which project-only form to use.
- **Why:** the user works in repos they don't own. Kit tools must be active only where the kit set the project up. This was the user's decision on 2026-09-29, after the Superpowers install defaulted to user scope.
- **Mechanism (verified 2026-10-01, `evals/trials/plugin-cli.md`):** the starter runs `claude plugin install <p> --scope project --json` for each project-scope plugin. That fetches the plugin into the shared cache, enables it in `<project>/.claude/settings.json` and records a project-scoped install, without prompts and without touching user settings. The kit always passes `--scope` explicitly, because the CLI's default is `user`. Writing `enabledPlugins` directly stays the fallback when the CLI fails.
- `claude plugin …` must run with `C:\Program Files\Git\cmd` first on PATH. Plugin installs clone with submodules, which fail from the agent's Git Bash environment.

### D15. Secret scanning from the start

- The kit repo is public (since 2026-09-29). A `gitleaks` pre-commit hook lives in `.githooks/`, enabled with `git config core.hooksPath .githooks`. It blocks commits that contain secrets.
- gitleaks is a registry entry (machine scope, free, MIT). The starter can offer the same hook to projects as a Tier 1 check.
- **Alternative:** a custom regex scan. Rejected because gitleaks is maintained and has far better rule coverage. The feedback scrub (D9) still uses its own patterns, since it runs on text, not commits.

## Risks / Trade-offs

- [Generated `toolkit.json` drifts from YAML] → Eval check plus the validator run as the documented edit step. A pre-commit hook can be added later.
- [Plugin script paths] → Checked 2026-09-29 (`evals/trials/plugin-install-check.md`). `${CLAUDE_PLUGIN_ROOT}` is replaced in the SKILL.md text, but it is **not** set as an environment variable for Bash. So skills pass the path in the command, and scripts find their own folder from `import.meta.url`. Whether a GitHub install copies the plugin into a cache is still **unverified**.
- [PATH resolution differs between Git Bash, PowerShell and the Claude shell] → One resolver, `locate.mjs` (PATH, npm prefix, Program Files, winget folders, app aliases), with unit tests. `prereqs.mjs` and `setup.mjs` both use it.
- [The secret scrub misses a pattern] → The user confirms the text before filing, and file contents are never included (paths only).
- [Marker blocks get hand-edited or deleted] → The planner treats a missing block as "append" and a damaged block (start marker without end) as a conflict to show, never to guess.
- [Rubric evals are subjective] → Named criteria with a reason each. Deterministic checks are preferred wherever the outcome allows.
- [Plugin installs need a working git with submodules] → Checked in 5.1. `locate.mjs` resolves Windows Git (`C:\Program Files\Git\cmd`) and setup prepends it to PATH for every `claude plugin` call. A setup check flags it when it's missing.
- [A user-scope install slips in, e.g. through `/plugin install` defaulting to user scope] → Setup's plan flags any project-scope plugin found in `~/.claude/settings.json` `enabledPlugins` and offers to move it.
- [Installed-version detection for "needs review"] → The manual `installed_version` field for now. The source for automating it is known: `~/.claude/plugins/installed_plugins.json` (checked 2026-10-01).
- [Unverified install commands for trial tools (Impeccable and Emil skill paths, Playwright skills, Context7 check)] → Task 7.6 runs each one in the sandbox and corrects the registry before any real project uses it.

## Migration Plan

- Nothing is deployed yet, so no migration is needed. On the main PC, add the repo as a local-directory marketplace (dev mode, proposal rule 4). Rollback: remove the marketplace entry.
- Existing projects (e.g. Toughbubble) run `/kit:start` in re-run mode, so they see diffs only and nothing is overwritten. The first such run is on a **copy** of Toughbubble (task 7.7), never the real project.

## Open Questions

- Which engine drives Claude-in-the-loop eval cases: `claude plugin eval` (it exists in 2.1.286: `case.yaml` or `prompt.md` + graders, with a no-plugin baseline) or the user's harness tool? This doesn't affect the case format (D8).
- ~~Exact location of Claude Code's installed plugin version data~~ Answered 2026-10-01: `~/.claude/plugins/installed_plugins.json` (version, scope, gitCommitSha per plugin). Automating `installed_version` from it remains a later step.
- ~~Whether per-project `enabledPlugins` alone is enough~~ Answered: yes for cached plugins (task 2.5), and `claude plugin install --scope project` handles fetch + enable in one step (task 5.1).
