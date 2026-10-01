# A/B trial: plain OpenSpec vs SuperSpec (tasks 4.2–4.4)

- **Date:** 2026-10-01
- **Task:** build the toolkit registry validator from `BRIEF.md` (same seed `9f57652` for both; see `workflow-ab-setup.md`)
- **Order:** A ran first, B second

```
                 A  plain OpenSpec            B  SuperSpec (+ Superpowers)
 flow            propose -> apply             ff -> apply (worktree, 13 subagents) -> verify
 wall time       7.5 min                      28.5 min           (~3.8x)
 cost            $1.96 (measured)             ~$9-10 (estimated) (~5x)
 asked user      0                            2 (both: took the recommended option)
 acceptance      12/12                        12/12
 extra probes    12/12                        12/12
```

## Measurements

| Measure | A: plain OpenSpec | B: SuperSpec | Source |
|---|---|---|---|
| Wall time, first prompt → last activity | **7.5 min** (13:00–13:08 UTC) | **28.5 min** (13:04–13:32 UTC) | transcripts |
| … of which planning (to `/opsx:apply`) | ~4 min | ~10 min | transcripts; the user felt about 5 min for both |
| … of which apply | ~3.5 min | ~15 min, then verify ~3 min | transcripts; user: "about 5" vs "about 20" |
| Cost | **$1.96** | **≈ $9–10, estimated** | A: `/cost` screenshot. B: no screenshot; estimated from tokens, see below |
| API requests | 28 | 165 (94 Opus + 71 Sonnet subagents) | transcripts |
| Output tokens | 34.3k | 71.1k | transcripts |
| Cache read | 2.4M | 16.1M | transcripts |
| Questions to the user | 0 | 2: a design decision (how to enforce append-only verdict history) and an approval gate before writing the plan | transcripts |
| Corrections by the user | 0 | 0 | transcripts |
| Acceptance cases | **12/12** | **12/12** | `evals/registry/runs/2026-10-01-*.json` |
| Extra probes (12 edge cases outside the cases) | 12/12, no crashes | 12/12, no crashes | probe script, outside the repo |
| Own unit tests | 53, all pass | 49, all pass | `npm test` in each |
| Validator size | 286 lines (+431 test) | 237 lines (+358 test) | `wc -l` |
| Git hygiene | nothing committed | feature branch + worktree, 8 small TDD commits | `git log` |
| Artifacts | proposal, design, spec delta, tasks (16/16) | brainstorm, proposal, design, spec delta, tasks (20/20), plan, apply receipt, verify report | change folders |
| Windows glitches | none reported | none reported | user |

**B cost estimate:**
- A's measured $1.96 calibrates the Opus token price. That puts B's Opus share at ≈ $7.2–7.5.
- B's Sonnet subagents add at most ≈ $2.8 (if priced like Opus), and less at Sonnet rates.
- This is **unverified**. Re-running `/cost` is impossible because the session has ended.

## Artifact quality (light review, ahead of the harness-review checklist)

- **Both:** the spec deltas cover every requirement in `toolkit-registry`, and `openspec validate` passes.
- **B adds:**
  - a brainstorm record
  - an explicit micro-task plan
  - an apply receipt
  - a verify report that checks the code against the specs
  - surfacing a real design ambiguity (how "never rewrite history" can be enforced) instead of picking an answer silently
- **B's error messages name the exact path** (`openspec.verdicts[1].date`). A's name the entry and the field, but some failures first print a summary line ("registry invalid: N error(s)").
- **A** wrote slightly more tests.

## Reading

- **On this task the outcome is the same:** both builds are correct and robust. B cost ~5x more and took ~4x longer.
- **B's extra value is process, not results:** isolation (worktree), an audit trail (commits, plan, verify report) and decisions asked rather than guessed. That pays off on larger, riskier or less clearly specified changes. This one was small, and the 12 acceptance cases fully specified it.
- **Bias to note:**
  - One run each (n = 1).
  - The task had strong acceptance tests, which favors the light flow.
  - B's flow included a verify step that A's flow doesn't have.

## Proposed verdict (decision for the user)

| Entry | Proposed status | Rationale |
|---|---|---|
| OpenSpec `spec-driven` | **adopted**, the default workflow | Same result at about ¼ of the time and ⅕ of the cost |
| SuperSpec | **trial**, for large or risky changes only | The process value is real, but it's too heavy as a default; re-test on a bigger change |
| Superpowers | **trial**, per project via SuperSpec | No Windows issues; its value shows in the build phase |

Evidence for the registry verdicts: `evals/registry/runs/2026-10-01-openspec.json`, `evals/registry/runs/2026-10-01-superspec.json`, this file.
