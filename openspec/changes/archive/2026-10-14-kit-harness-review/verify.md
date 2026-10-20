# Verify: kit-harness-review

result: pass
date: 2026-10-14
commit: 8c9f02b
type: none

## Tests

| Script | Required | Result |
|---|---|---|
| test | no | pass |

## Reviews

| Review | How | Note |
|---|---|---|
| security | ran |  |
| code | ran |  |

## Docs sync

docs last updated: 2026-10-14 (97d2d01); code commits since: 5; no apply receipt  (date: 2026-10-14)

| Proposed | Written | Declined | Left out |
|---|---|---|---|
| 2 | 1 | 0 | 12 |

unplanned dependencies: none

## HARD (blocks archive)

None.

## ADVISORY (your call)

| Id | Item | Detail |
|---|---|---|
| S1 | security review (low) | harness.mjs:112 --json includes each hook's full command text; a hook embedding a token could reach agent context / saved note (plain-text output omits it) |
| C3 | code review (low) | harness.mjs:131 ~/.claude.json read from home even when CLAUDE_CONFIG_DIR is set (unverified where Claude Code keeps it then); MCP servers may be missed |
| C4 | code review (low) | harness.mjs:112 only PreToolUse hooks marked as blocking; Stop, UserPromptSubmit, SubagentStop, PermissionRequest can block too |
| C5 | code review (low) | harness.mjs:155 autoMemoryDirectory honoured from shared project settings; Claude Code may accept it only from user/local/policy settings (unverified) |
| C6 | code review (low) | harness.mjs:225 --home flag from task 3.1 not implemented; silently ignored |
| C7 | code review (low) | harness.mjs:143 plugin install falls back to entries[0], possibly another project's project-scope install (wrong version/skills/hooks) |
| C8 | code review (low) | harness.mjs:146 plugin hooks read only from hooks/hooks.json; hooks inline in plugin.json and plugin MCP servers not scanned |
| C9 | code review (low) | harness.mjs:34 frontmatter block scalars cut at first blank line; quote strip removes leading/trailing quotes independently |
| C10 | code review (low) | tests/kit/harness.test.mjs:12 tests run bare git via spawnSync without locate('git') or checking init succeeded |

## Overrides

None.

## Resolved

| Id | Item | Note | Date |
|---|---|---|---|
| C1 | code review (medium) - harness.mjs:185 routing-block check passes raw kit.json knowledge_dir (no trim/slash normalise, no DEFAULT_DIR fallback) unlike start-plan.mjs:159; can report 'outdated' while /kit:start says same | fixed in a147860 | 2026-10-14 |
| C2 | code review (medium) - harness.mjs:60 memory slug from git rev-parse --show-toplevel; in a git worktree that is the worktree path, not the shared repo root (D2a), so memory shows not found | fixed in a147860 | 2026-10-14 |

<!-- kit-verify-data {"change":"kit-harness-review","date":"2026-10-14","commit":"8c9f02b","type":"none","tests":[{"script":"test","required":false,"result":"pass"}],"items":[{"id":"S1","level":"ADVISORY","what":"security review (low)","detail":"harness.mjs:112 --json includes each hook's full command text; a hook embedding a token could reach agent context / saved note (plain-text output omits it)","source":"security","severity":"low"},{"id":"C3","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:131 ~/.claude.json read from home even when CLAUDE_CONFIG_DIR is set (unverified where Claude Code keeps it then); MCP servers may be missed","source":"code","severity":"low"},{"id":"C4","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:112 only PreToolUse hooks marked as blocking; Stop, UserPromptSubmit, SubagentStop, PermissionRequest can block too","source":"code","severity":"low"},{"id":"C5","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:155 autoMemoryDirectory honoured from shared project settings; Claude Code may accept it only from user/local/policy settings (unverified)","source":"code","severity":"low"},{"id":"C6","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:225 --home flag from task 3.1 not implemented; silently ignored","source":"code","severity":"low"},{"id":"C7","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:143 plugin install falls back to entries[0], possibly another project's project-scope install (wrong version/skills/hooks)","source":"code","severity":"low"},{"id":"C8","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:146 plugin hooks read only from hooks/hooks.json; hooks inline in plugin.json and plugin MCP servers not scanned","source":"code","severity":"low"},{"id":"C9","level":"ADVISORY","what":"code review (low)","detail":"harness.mjs:34 frontmatter block scalars cut at first blank line; quote strip removes leading/trailing quotes independently","source":"code","severity":"low"},{"id":"C10","level":"ADVISORY","what":"code review (low)","detail":"tests/kit/harness.test.mjs:12 tests run bare git via spawnSync without locate('git') or checking init succeeded","source":"code","severity":"low"}],"overrides":[],"reviews":{"security":{"how":"ran","note":"","date":"2026-10-14"},"code":{"how":"ran","note":"","date":"2026-10-14"}},"docsSync":{"date":"2026-10-14","docsUpdated":{"commit":"97d2d01","date":"2026-10-14"},"codeCommitsSince":5,"receipt":false,"proposed":2,"written":1,"declined":0,"leftOut":12,"unplanned":[]},"result":"pass","resolved":[{"item":"C1","what":"code review (medium)","detail":"harness.mjs:185 routing-block check passes raw kit.json knowledge_dir (no trim/slash normalise, no DEFAULT_DIR fallback) unlike start-plan.mjs:159; can report 'outdated' while /kit:start says same","note":"fixed in a147860","date":"2026-10-14"},{"item":"C2","what":"code review (medium)","detail":"harness.mjs:60 memory slug from git rev-parse --show-toplevel; in a git worktree that is the worktree path, not the shared repo root (D2a), so memory shows not found","note":"fixed in a147860","date":"2026-10-14"}]} -->
