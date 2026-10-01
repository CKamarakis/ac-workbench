# A/B trial setup (tasks 2.4, 4.2, 4.3)

Both setups start from the same seed commit `9f57652` (repo `ab-seed`). The seed holds the brief, the registry spec, the 12 acceptance cases and the eval runner.

| | A: plain OpenSpec | B: SuperSpec |
|---|---|---|
| Repo | `Projects/ab-openspec` | `Projects/ab-superspec` |
| Setup commit | `103319a` | `952b966` |
| OpenSpec | 1.13.2, schema `spec-driven`, `openspec init --tools claude` (core workflows) | 1.13.2, schema `superspec` (danielhanold/superspec `e1c8f41`), custom profile with `ff` and `verify` |
| Superpowers | off | on, in `.claude/settings.json` only |
| Flow | `/opsx:propose` → `/opsx:apply` | `/opsx:ff` → `/opsx:apply` → `/opsx:verify` (finalize/archive skipped: no remote) |
| Done when | `npm run evals` → pass 12, fail 0, or 60 min | same |

## Setting up B without global changes

SuperSpec's README configures OpenSpec **globally** (`openspec config profile/set` writes `%APPDATA%\openspec\config.json`). That conflicts with the kit rule "kit global, tools per project". Instead:
- `XDG_CONFIG_HOME` was pointed at a throwaway folder for the setup commands only, and the custom profile was written there.
- `openspec init --tools claude --profile custom --force` then generated the commands and skills into `ab-superspec/.claude/` only.
- The global config hash is unchanged: `531a261e2c2f…` before and after.
- Gotcha: PowerShell 5.1 `Set-Content -Encoding utf8` writes a BOM, and OpenSpec then rejects the JSON ("Invalid JSON … using defaults"). Write the file without a BOM.
- Caveat: running `openspec update` later in `ab-superspec` without the redirect would regenerate from the global profile, which lacks `ff`, `verify` and `bulk-archive`.
