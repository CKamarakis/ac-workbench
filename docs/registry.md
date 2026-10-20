# Toolkit registry

`toolkit.yaml` (repo root) is the single source of truth for every tool the kit knows. Kit scripts read the generated copy `plugins/kit/data/toolkit.json`, never the YAML.

```
 toolkit.yaml ──(npm run registry)──> validate ──ok──> plugins/kit/data/toolkit.json ──> setup, starter, next, cockpit
       ▲ edit by hand                     │
                                          └─fail─> errors printed, JSON left untouched, exit 1
```

## Edit → validate

```bash
npm run registry          # validate; on success, write plugins/kit/data/toolkit.json
npm run registry:check    # validate and check that the JSON is current (no write); exits 1 with "stale" if not
```

Commit `toolkit.yaml` and `toolkit.json` together. A stale JSON fails `registry:check` and the registry eval cases.

## Top level

| Key | Meaning |
|---|---|
| `version` | Format version (currently `1`) |
| `phases` | Workflow phases. Each gets one owner in the lane map |
| `project_types` | Test policy per project type (and `none`): `tests` (package.json scripts, each `required` or not), `missing_required` (`hard` or `advisory`), `advisory` (checks listed for the user). Used by `/kit:verify` |
| `situations` | Situation-to-skill guide: `when`, plus `use` and/or `phase` |
| `tools` | The entries (below) |

## Tool entry

| Field | Required | Values / notes |
|---|---|---|
| `name` | yes | Unique |
| `source` | yes | Where it installs from, e.g. `npm:…`, `github:…`, `winget:…` |
| `tier` | yes | `global`, `project` or `project-type:<type>` |
| `reason` | yes | Why it is in the kit |
| `cost` | yes | `free`, `free-tier`, `paid`, `uses-claude-quota` |
| `status` | yes | `trial`, `adopted`, `dropped`, `later`. Must equal the latest verdict's status |
| `rubric` | yes | Notes for `problem_fit`, `overlap`, `context_cost`, `run_cost`, `trust`, `reversibility`, `license` |
| `reviewed_version`, `reviewed_on` | yes | The version you assessed, and when |
| `installed_version` | no | When newer than `reviewed_version`, the entry is flagged **needs review** (a warning, not an error) |
| `scope` | adopted/trial | `machine` (installed once: CLIs, the kit, marketplaces) or `project` (enabled per project, never globally) |
| `check` | adopted/trial | Command that tells whether the tool is present (exit 0 = present) |
| `check_match` | no | Regex the check's output must match too, e.g. `'"kit@ac-workbench"'` on `claude plugin list --json` |
| `install` | adopted/trial | Install instructions by platform, e.g. `win32: …` |
| `install_note` | no | Steps the user must do, and anything unverified about the install |
| `interactive` | no | `true` when the install needs the user (OAuth, multi-step). `/kit:start` never runs it; it shows the steps and marks the tool pending |
| `plugin` | no | Claude Code plugin id (`name@marketplace`). `/kit:start` installs it with `claude plugin install <id> --scope project` |
| `phases` | no | Phases this tool owns |
| `skills` | no | Phase → the skill or command to use for it, e.g. `build: /opsx:apply`. Shown in the lane map and the CLAUDE.md routing block |
| `overlaps` | no | Tools it overlaps with. Two active tools owning one phase need this on at least one of them |
| `skip_skills` | no | That tool's skills which the kit does not use |
| `install_why` | no | One line for the user when the install reaches beyond the project (e.g. a machine-wide CLI): why it's installed that way. `/kit:start` shows it with the install and in its summary |
| `first_use` | no | One line for the user: a step the tool needs the first time it's used (e.g. its own init command). `/kit:start` lists it under "Later", never as a setup step |
| `recommend` | no | `yes` or `no`: the answer `/kit:start` recommends when it offers this opt-in (`project`-tier) tool. Without it the recommendation is `no` ("optional; add it later when a change needs it") |
| `recommend_why` | with `recommend` | One line shown with the recommendation, e.g. why most projects don't need it |
| `verdicts` | yes | Ordered history: `date`, `status`, `rationale`, optional `evidence` (path to an eval run or trial note). Append only; never rewrite old entries |

## Writing a good `check`

- The check must prove the **per-project** part is there, not only the machine part. Example: Playwright needs a global CLI *and* a project skill, so its check tests both. A CLI-only check made `/kit:start` skip the skill in a second project (found 2026-10-01).
- If the check's command succeeds before the tool is usable (e.g. `claude mcp get notion` before sign-in), add `check_match` on the output.

## Changing a verdict

1. Append a new item to `verdicts` with today's date, the new status, a one-line rationale and the `evidence` path.
2. Set `status` to the same value.
3. Run `npm run registry`.

Installed plugin versions can be read from `~/.claude/plugins/installed_plugins.json` (checked 2026-10-01). Copy them into `installed_version` to trigger review flags. Automating this is a later task.
