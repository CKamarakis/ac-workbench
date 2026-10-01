# Trial: Superpowers smoke test on Windows (task 2.3)

- **Date:** 2026-09-29
- **Claude Code:** 2.1.284
- **Sandbox:** `C:\Users\Chris\Documents\Projects\worklow-test`
- **Install:** `/plugin install superpowers@superpowers-marketplace` (transcript, 12:51 UTC)

| Check | Result | Evidence |
|---|---|---|
| Install succeeds | PASS | install command in the transcript; the plugin is enabled in settings |
| Session starts without hanging (#413) | PASS (user report) | the user reported "worked"; no timing recorded |
| Input not frozen (#419) | PASS (user report) | same as above |
| `superpowers:*` skills listed | PASS | user check 2026-10-01: listed in `worklow-test` |
| No hook/Git errors at start | PASS | user check 2026-10-01: no errors |

## Scope finding

The install landed at **user scope**: `~/.claude/settings.json` → `enabledPlugins` has `superpowers@superpowers-marketplace: true` (and `kit@ac-workbench: true`). The sandbox has no `.claude/settings.json`. So Superpowers now loads in every session, not only in the sandbox.

- Decision needed: keep it at user scope (a de-facto Tier 1 install) or move it to project scope in the sandbox.
- Input for the registry: the install command needs an explicit scope, because the default was not project scope. Whether `/plugin install` asked for a scope is unknown.

## Resolution (2026-09-29)

The user decided that workflow plugins are enabled **per project** by the kit, never globally, because they also work in repos that are not theirs.
- Removed `superpowers@superpowers-marketplace` from `~/.claude/settings.json` → `enabledPlugins`. The marketplace stays known, and `kit` stays global.
- Added `worklow-test/.claude/settings.json` → `enabledPlugins: { "superpowers@superpowers-marketplace": true }`.
- Still to verify (this also answers the proposal's open question on per-project `enabledPlugins`): a new session in `worklow-test` lists `superpowers:*` skills, and a new session in another project does not.

## Per-project check (task 2.5), 2026-10-01

| Session in | `superpowers:*` listed | Expected | Result |
|---|---|---|---|
| `worklow-test` (enabled in project settings) | yes | yes | PASS |
| `Toughbubble` (not enabled) | no | no | PASS |

Verdict: per-project `enabledPlugins` alone is enough to scope a plugin when the plugin is already installed in the cache. This answers the proposal's open question and confirms design D14. Whether a plugin that isn't installed yet gets fetched automatically is still open (task 5.1).
