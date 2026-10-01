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
| `phases` | no | Phases this tool owns |
| `overlaps` | no | Tools it overlaps with. Two active tools owning one phase need this on at least one of them |
| `skip_skills` | no | That tool's skills which the kit does not use |
| `verdicts` | yes | Ordered history: `date`, `status`, `rationale`, optional `evidence` (path to an eval run or trial note). Append only; never rewrite old entries |

## Changing a verdict

1. Append a new item to `verdicts` with today's date, the new status, a one-line rationale and the `evidence` path.
2. Set `status` to the same value.
3. Run `npm run registry`.

Installed plugin versions can be read from `~/.claude/plugins/installed_plugins.json` (checked 2026-10-01). Copy them into `installed_version` to trigger review flags. Automating this is a later task.
