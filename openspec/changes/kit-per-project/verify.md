# Verify: kit-per-project

result: pass
date: 2026-10-14
commit: 967bd2f
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | built-in diffs against main (half this change already merged); reviewed b3a48c1..HEAD by hand, incl. the post-verify commits 598a7c1 and d9d5ef8 |
| code | ran | also covers post-verify commits 598a7c1, d9d5ef8 |

## Docs sync

docs last updated: 2026-10-14 (37c22c4); code commits since: 2; no apply receipt  (date: 2026-10-14)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 13 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

None.

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| C1 | code review (medium) - tools/evals/lib.test.mjs:198 pattern '\\|' in a single-quoted JS string becomes a bare '\|' (alternation), so the isolation test passes even if CLAUDE_CODE_PLUGIN_CACHE_DIR is dropped | fixed in edaa109 | 2026-10-14 |
| C3 | code review (medium) - tools/smoke.mjs:98 start: apply now runs the real 'claude plugin install kit' (design D5 said no CLI); smoke isolates HOME/USERPROFILE but not CLAUDE_CONFIG_DIR / plugin cache like evals do | fixed in edaa109 | 2026-10-14 |
| C7 | code review (low) - tools/smoke.mjs:97 new step reruns the same start-plan as the step before only to match another line; could be a second expectation | fixed in edaa109 | 2026-10-14 |
| C2 | code review (medium) - start-apply.mjs:101 + kit check: when the CLI install fails, the fallback writes kit=true to settings.json, later re-syncs say 'ok kit' with no project install; after removing the user-level kit the project has no /kit:start | fixed in fd07c7c | 2026-10-14 |
| C4 | code review (low) - toolkit.yaml:300 kit check reads only .claude/settings.json; a local-scope install (settings.local.json) counts as missing and /kit:start plans a shared install | fixed in fd07c7c | 2026-10-14 |
| C5 | code review (low) - toolkit.yaml:303 install_why says 'this project used your user-level kit' whenever settings lack the kit, without checking a user-level install exists (--plugin-dir, local scope, sandboxes) | fixed in fd07c7c | 2026-10-14 |
| C9 | code review (low) - start-apply.mjs:102 plugin fallback writes enabledPlugins without extraKnownMarketplaces; a cloner can't resolve ac-workbench without adding the marketplace by hand | fixed in fd07c7c | 2026-10-14 |
| C10 | code review (low) - setup.mjs:82 user-scope warning matches on the registry name ('kit'), not the entry's plugin id; kit@<other-marketplace> would get the kit migration text | fixed in fd07c7c | 2026-10-14 |
| C6 | code review (low) - tools/evals/lib.mjs:72 evals' empty CLAUDE_CONFIG_DIR means the real kit install always fails there and falls back; evals pass on a path that never works for real | accepted and documented in design D5 (37c22c4): real install proven by the CLI trial and the migration | 2026-10-14 |
| C8 | code review (low) - design.md D2 still says the kit's 'projectEnabled check fails'; D1 and toolkit.yaml use the settings.json check | fixed in 37c22c4 | 2026-10-14 |
| S1 | security review (low) - harness.mjs (commit 598a7c1): plugin.json hook file paths are joined to the install folder without a containment check; '../' could make the scan read a JSON file outside the plugin (only event and program names are printed; Claude Code rejects such paths) | fixed in 967bd2f | 2026-10-14 |
| C11 | code review (medium) - harness.mjs:126 (598a7c1) program name: a hook starting with NAME=value (e.g. API_TOKEN=abc node x) reports the assignment as the program, leaking it; skip leading assignments | fixed in 967bd2f | 2026-10-14 |
| C12 | code review (medium) - harness.mjs:164 (598a7c1) dropping the entries[0] fallback: in a git worktree the project install (recorded for the main repo) isn't matched, so the plugin shows 'not inspected'; also match roots.shared | fixed in 967bd2f | 2026-10-14 |
| C13 | code review (low) - harness.mjs:25 BLOCKING_EVENTS: PermissionRequest can deny through a JSON decision (exit 2 isn't honored); check the hooks reference and mark it | fixed in 967bd2f | 2026-10-14 |
| C14 | code review (low) - harness.mjs:170 plugin.json hooks pointing at ./hooks/hooks.json are loaded twice; dedupe resolved paths | fixed in 967bd2f | 2026-10-14 |
| C15 | code review (low) - harness.mjs:177 plugin.json mcpServers given as a path or array of paths is ignored | fixed in 967bd2f | 2026-10-14 |
| C16 | code review (low) - harness.mjs:259 --home doesn't override CLAUDE_CONFIG_DIR from the environment | fixed in 967bd2f | 2026-10-14 |
| C17 | code review (low) - harness.mjs:44 YAML-escaped quotes ('Don''t', \") keep their outer quotes | fixed in 967bd2f | 2026-10-14 |
| C18 | code review (low) - skills/harness-review/checklist.md:41 still treats only PreToolUse as blocking; say 'hooks marked (can block)' | fixed in 967bd2f | 2026-10-14 |
| C19 | code review (low) - harness.mjs:4 header usage comment lacks --home | fixed in 967bd2f | 2026-10-14 |

<!-- kit-verify-data {"change":"kit-per-project","date":"2026-10-14","commit":"967bd2f","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"built-in diffs against main (half this change already merged); reviewed b3a48c1..HEAD by hand, incl. the post-verify commits 598a7c1 and d9d5ef8","date":"2026-10-14"},"code":{"how":"ran","note":"also covers post-verify commits 598a7c1, d9d5ef8","date":"2026-10-14"}},"docsSync":{"date":"2026-10-14","docsUpdated":{"commit":"37c22c4","date":"2026-10-14"},"codeCommitsSince":2,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":13,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"tools/evals/lib.test.mjs:198 pattern '\\|' in a single-quoted JS string becomes a bare '|' (alternation), so the isolation test passes even if CLAUDE_CODE_PLUGIN_CACHE_DIR is dropped","note":"fixed in edaa109","date":"2026-10-14"},{"item":"C3","what":"code review (medium)","detail":"tools/smoke.mjs:98 start: apply now runs the real 'claude plugin install kit' (design D5 said no CLI); smoke isolates HOME/USERPROFILE but not CLAUDE_CONFIG_DIR / plugin cache like evals do","note":"fixed in edaa109","date":"2026-10-14"},{"item":"C7","what":"code review (low)","detail":"tools/smoke.mjs:97 new step reruns the same start-plan as the step before only to match another line; could be a second expectation","note":"fixed in edaa109","date":"2026-10-14"},{"item":"C2","what":"code review (medium)","detail":"start-apply.mjs:101 + kit check: when the CLI install fails, the fallback writes kit=true to settings.json, later re-syncs say 'ok kit' with no project install; after removing the user-level kit the project has no /kit:start","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C4","what":"code review (low)","detail":"toolkit.yaml:300 kit check reads only .claude/settings.json; a local-scope install (settings.local.json) counts as missing and /kit:start plans a shared install","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C5","what":"code review (low)","detail":"toolkit.yaml:303 install_why says 'this project used your user-level kit' whenever settings lack the kit, without checking a user-level install exists (--plugin-dir, local scope, sandboxes)","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C9","what":"code review (low)","detail":"start-apply.mjs:102 plugin fallback writes enabledPlugins without extraKnownMarketplaces; a cloner can't resolve ac-workbench without adding the marketplace by hand","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C10","what":"code review (low)","detail":"setup.mjs:82 user-scope warning matches on the registry name ('kit'), not the entry's plugin id; kit@<other-marketplace> would get the kit migration text","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C6","what":"code review (low)","detail":"tools/evals/lib.mjs:72 evals' empty CLAUDE_CONFIG_DIR means the real kit install always fails there and falls back; evals pass on a path that never works for real","note":"accepted and documented in design D5 (37c22c4): real install proven by the CLI trial and the migration","date":"2026-10-14"},{"item":"C8","what":"code review (low)","detail":"design.md D2 still says the kit's 'projectEnabled check fails'; D1 and toolkit.yaml use the settings.json check","note":"fixed in 37c22c4","date":"2026-10-14"},{"item":"S1","what":"security review (low)","detail":"harness.mjs (commit 598a7c1): plugin.json hook file paths are joined to the install folder without a containment check; '../' could make the scan read a JSON file outside the plugin (only event and program names are printed; Claude Code rejects such paths)","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C11","what":"code review (medium)","detail":"harness.mjs:126 (598a7c1) program name: a hook starting with NAME=value (e.g. API_TOKEN=abc node x) reports the assignment as the program, leaking it; skip leading assignments","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C12","what":"code review (medium)","detail":"harness.mjs:164 (598a7c1) dropping the entries[0] fallback: in a git worktree the project install (recorded for the main repo) isn't matched, so the plugin shows 'not inspected'; also match roots.shared","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C13","what":"code review (low)","detail":"harness.mjs:25 BLOCKING_EVENTS: PermissionRequest can deny through a JSON decision (exit 2 isn't honored); check the hooks reference and mark it","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C14","what":"code review (low)","detail":"harness.mjs:170 plugin.json hooks pointing at ./hooks/hooks.json are loaded twice; dedupe resolved paths","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C15","what":"code review (low)","detail":"harness.mjs:177 plugin.json mcpServers given as a path or array of paths is ignored","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C16","what":"code review (low)","detail":"harness.mjs:259 --home doesn't override CLAUDE_CONFIG_DIR from the environment","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C17","what":"code review (low)","detail":"harness.mjs:44 YAML-escaped quotes ('Don''t', \\\") keep their outer quotes","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C18","what":"code review (low)","detail":"skills/harness-review/checklist.md:41 still treats only PreToolUse as blocking; say 'hooks marked (can block)'","note":"fixed in 967bd2f","date":"2026-10-14"},{"item":"C19","what":"code review (low)","detail":"harness.mjs:4 header usage comment lacks --home","note":"fixed in 967bd2f","date":"2026-10-14"}],"result":"pass"} -->
