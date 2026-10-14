# Verify: kit-per-project

result: pass
date: 2026-10-14
commit: 37c22c4
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | substitute | built-in /security-review diffs against main, which already holds half this change (merged mid-change); reviewed b3a48c1..HEAD by hand: fixed-string commands only, no input reaches a shell, no secrets; no findings |
| code | ran |  |

## Docs sync

docs last updated: 2026-10-14 (1a0f2a6); code commits since: 0; no apply receipt  (date: 2026-10-14)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 1 | 1 | 0 | 11 |

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

<!-- kit-verify-data {"change":"kit-per-project","date":"2026-10-14","commit":"37c22c4","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[],"overrides":[],"reviews":{"security":{"how":"substitute","note":"built-in /security-review diffs against main, which already holds half this change (merged mid-change); reviewed b3a48c1..HEAD by hand: fixed-string commands only, no input reaches a shell, no secrets; no findings","date":"2026-10-14"},"code":{"how":"ran","note":"","date":"2026-10-14"}},"docsSync":{"date":"2026-10-14","docsUpdated":{"commit":"1a0f2a6","date":"2026-10-14"},"codeCommitsSince":0,"receipt":false,"proposed":1,"written":1,"declined":0,"leftOut":11,"unplanned":[]},"resolved":[{"item":"C1","what":"code review (medium)","detail":"tools/evals/lib.test.mjs:198 pattern '\\|' in a single-quoted JS string becomes a bare '|' (alternation), so the isolation test passes even if CLAUDE_CODE_PLUGIN_CACHE_DIR is dropped","note":"fixed in edaa109","date":"2026-10-14"},{"item":"C3","what":"code review (medium)","detail":"tools/smoke.mjs:98 start: apply now runs the real 'claude plugin install kit' (design D5 said no CLI); smoke isolates HOME/USERPROFILE but not CLAUDE_CONFIG_DIR / plugin cache like evals do","note":"fixed in edaa109","date":"2026-10-14"},{"item":"C7","what":"code review (low)","detail":"tools/smoke.mjs:97 new step reruns the same start-plan as the step before only to match another line; could be a second expectation","note":"fixed in edaa109","date":"2026-10-14"},{"item":"C2","what":"code review (medium)","detail":"start-apply.mjs:101 + kit check: when the CLI install fails, the fallback writes kit=true to settings.json, later re-syncs say 'ok kit' with no project install; after removing the user-level kit the project has no /kit:start","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C4","what":"code review (low)","detail":"toolkit.yaml:300 kit check reads only .claude/settings.json; a local-scope install (settings.local.json) counts as missing and /kit:start plans a shared install","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C5","what":"code review (low)","detail":"toolkit.yaml:303 install_why says 'this project used your user-level kit' whenever settings lack the kit, without checking a user-level install exists (--plugin-dir, local scope, sandboxes)","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C9","what":"code review (low)","detail":"start-apply.mjs:102 plugin fallback writes enabledPlugins without extraKnownMarketplaces; a cloner can't resolve ac-workbench without adding the marketplace by hand","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C10","what":"code review (low)","detail":"setup.mjs:82 user-scope warning matches on the registry name ('kit'), not the entry's plugin id; kit@<other-marketplace> would get the kit migration text","note":"fixed in fd07c7c","date":"2026-10-14"},{"item":"C6","what":"code review (low)","detail":"tools/evals/lib.mjs:72 evals' empty CLAUDE_CONFIG_DIR means the real kit install always fails there and falls back; evals pass on a path that never works for real","note":"accepted and documented in design D5 (37c22c4): real install proven by the CLI trial and the migration","date":"2026-10-14"},{"item":"C8","what":"code review (low)","detail":"design.md D2 still says the kit's 'projectEnabled check fails'; D1 and toolkit.yaml use the settings.json check","note":"fixed in 37c22c4","date":"2026-10-14"}],"result":"pass"} -->
