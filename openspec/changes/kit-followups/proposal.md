# Proposal

## Why

v1 means a stranger installs the kit and goes from an idea to an archived change with a docs page, without hitting basic bugs. The usage review (M6, `evals/trials/usage-review-1.md`), the M8 reviews and the `kit-cross-platform` build left a list of small bugs and rough edges that a stranger would hit. The user triaged them on 2026-10-14 (roadmap drift log) to these 10 items, keeping the change small.

## What Changes

1. **`/kit:next` order:** with an active change, a Ready PRD no longer takes over the suggestion; it is shown as waiting until the change is done (usage review finding 4).
2. **Verify clears fixed findings:** a new `resolve` command marks an advisory finding as fixed, with a note; the report lists it under "Resolved" instead of open (M8 leftover; seen again in `kit-cross-platform`).
3. **Later decisions stay visible after archive:** the docs page also shows open and Later decisions from archived changes, labelled with their change, and `decisions.mjs` can decide them there.
4. **Remove the Context7 library-error hook.** It never fired in real use (chained commands exit 0; PowerShell not matched) and the A/B showed no benefit (`evals/trials/context7-ab.md`). The routing rule that tells the agent to look up docs stays. **BREAKING** for nobody: the hook never produced output.
5. **Installs that are sentences:** registry entries with nothing to install say `install: none` instead of a prose sentence, so setup can never run text as a command.
6. **Unit-test folders:** tests create their throwaway folders in `../temp` (as the smoke test does) and remove them afterwards.
7. **Routing-only re-sync:** `/kit:start` can apply file updates (such as the CLAUDE.md routing block) without running tool installs, so an existing project can take a kit update (usage review finding 2).
8. **Docs page fixes:** same-day archives in the right order; sorting that doesn't depend on the machine's locale; following a link into a collapsed product opens it; the missing `living-docs` and `kit-self-test` notes for this repo's page.
9. **`/kit:start` docs line from the script:** the Later line about `/kit:docs` is printed by the planner, not composed by the skill.
10. **Tool versions:** the registry's `reviewed_version` is the "tested with" version; the smoke test reads OpenSpec's from it instead of a constant, and this repo's `CLAUDE.md` says to bump it after updating a tool and passing the smoke test. Users get updates through Claude Code's plugin update (auto-update is off by default for third-party marketplaces; the README telling users to turn it on goes to M13). No notice is built.

```
 v1 bar: stranger installs -> idea -> archived change -> docs page, no basic bugs
   |
   +-- wrong step suggested ........ 1 /kit:next order
   +-- stale report items .......... 2 verify resolve
   +-- decisions vanish ............ 3 Later after archive
   +-- dead code ................... 4 remove hook
   +-- latent crash ................ 5 install: none
   +-- leftover folders ............ 6 unit-test temp
   +-- can't take a kit update ..... 7 routing-only re-sync
   +-- page rough edges ............ 8 docs fixes, 9 docs line
   +-- which versions were tested .. 10 reviewed_version
```

Not in this change (roadmap 2026-10-14): the browser-check recommendation (M12), scoring the judgment evals (M13), the "what's waiting" list (after v1), the 7 low build-readiness findings (dropped).

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `skill-routing`: Ready PRDs wait while a change is active; the library-error hook is removed.
- `quality-gates`: advisory findings can be resolved with a note.
- `living-docs`: open decisions from archived changes stay on the page; links into a collapsed product open it; ordering is stable across machines.
- `build-readiness`: decisions in archived changes can still be decided.
- `project-starter`: a re-sync can apply files without tool installs. (Item 9 changes no behavior: the same docs line, printed by the planner; design only.)
- `toolkit-registry`: `install: none` for entries with nothing to install.
- `kit-self-test`: the smoke test takes the tested OpenSpec version from the registry; unit tests keep their folders in the test area and clean up.

## Impact

- Code: `plugins/kit/scripts/next.mjs`, `verify.mjs`, `decisions.mjs`, `docs.mjs`, `docs-page.mjs`, `setup.mjs`, `start-plan.mjs`, `start-apply.mjs`; `plugins/kit/hooks/` (remove `library-hint.mjs` and its `hooks.json` entry); skills `start`, `verify`, `docs`; `toolkit.yaml`, `tools/validate-registry.mjs`, `tools/smoke.mjs`; a shared test helper and ~17 test files; `CLAUDE.md`; `knowledge/docs/` notes; kit version 0.9.0.
- No new dependencies, no cost.
- Unverified: how Claude Code's update check behaves for users who installed the kit before a version bump (to see in M14).
