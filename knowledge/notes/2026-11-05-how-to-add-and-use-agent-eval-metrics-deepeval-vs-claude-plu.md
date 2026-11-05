---
title: "How to add and use agent eval metrics: DeepEval vs claude plugin eval (or something else)"
date: 2026-11-05
tags:
  - evals
  - tools
  - agent-metrics
source: text
---

From an /opsx:explore on 2026-11-05: can the kit use DeepEval (https://deepeval.com/) and industry agent metrics, without paying for an external API?

## The metrics (DeepEval's names)

- **Task completion**: was the job done (final file, reply, test outcome).
- **Tool correctness**: the right tools called, wrong ones not called.
- **Argument correctness**: right tool with the right inputs (path, command, flags).
- **Plan adherence**: steps in the expected order (tests before "done", read before edit).
- **Step efficiency**: turns or tool calls used; fewer for the same result is better.
- Check each one by code where possible (free, stable); use a judge model only for judgement (costs usage, varies). One result grader plus one steps grader per case.
- Source: https://deepeval.com/docs/metrics-introduction

## DeepEval

- Apache 2.0, ~19.3k stars, Python (pytest) first; TS package (Vitest) is partial.
- Rich agent metrics (Task Completion, Tool Correctness, Argument Correctness, Plan Adherence/Quality, Step Efficiency).
- Judge = LLM calls; Anthropic as judge documented only in the TS tab (`ANTHROPIC_API_KEY`, API billing). Using `claude -p` as judge would need a custom `DeepEvalBaseLLM` class: unverified.
- Telemetry on by default (PostHog); `DEEPEVAL_TELEMETRY_OPT_OUT=1` (https://deepeval.com/docs/faq).
- Does not run Claude Code; it only scores outputs.
- Community: no Reddit thread found (thin intel). Complaints: judge token cost and breaking changes (lightly sourced, https://altaitools.com/deepeval-vs-promptfoo/); vendor admits judge inconsistency (https://news.ycombinator.com/item?id=43121129); tech radar "Trial" (https://rubinlake.com/en/technology-radar/data-platforms-and-mlops/deepeval).

## claude plugin eval (the best fit found)

Built into Claude Code (2.1.318 installed here). Docs: https://code.claude.com/docs/en/plugin-evals.md

```
industry metric        claude plugin eval grader             cost
---------------------  ------------------------------------  -----------
tool correctness       tool_used (min/max, max:0 = never)    free
argument correctness   tool_used + input_match (regex)       free
                       mock MCP `expect:` (input types)      free
plan adherence         tool_order (before / after)           free
task completion        file_exists, regex on a file          free
                       llm (rubric, 2 of 3 votes)            judge call
plan quality           llm with focus: trace                 judge call
step efficiency        tool_used max:N, max_turns cap        free (rough)
"did the plugin help?" WITH vs W/OUT baseline (the delta)    2x runs
```

- Runs and judge calls use the Claude Code login: "count against your plan's usage limits or your API bill". No external API needed.
- Each case runs 3 times by default; `--ablation none` halves the cost; `--judge-model` picks the judge.
- Gaps: no custom-code graders; step efficiency is only a cap; it tests a plugin, not a whole app. Help text says "skills-dir plugins" also resolve (project `.claude/skills`?): unverified.
- Not run or trialled yet. Only one third-party write-up found (https://www.aicodex.to/articles/claude-code-plugin-eval).

## Fit per project (problem -> opportunity -> tool)

- **Kit**: problem is that `prompt:` eval cases stay `pending` ("no engine wired", evals/README.md) and rubric scores are hand-written. `claude plugin eval` is that engine, and its WITH vs W/OUT delta answers "does the kit help Claude?". Example for /kit:next: `tool_used` on next.mjs, `tool_order` before the reply, `tool_used Edit max:0`. Format differs from `evals/<skill>/cases.yaml`: keep deterministic checks in run-evals.mjs, put judgement cases in plugin eval via `--eval-dir`.
- **Acme**: the app has no AI feature today, so no agent in the product to measure. Revisit only if it gets one; then promptfoo or DeepEval apply. Don't add a feature to use a tool.
- **Own eval project**: not needed for now; it would duplicate plugin eval.

## Alternatives

- **promptfoo** Claude Agent SDK provider (https://www.promptfoo.dev/docs/providers/claude-agent-sdk/): records every tool call with inputs, tokens and cost; can use the local Claude Code session (`apiKeyRequired: false`, "Claude Code monthly plans"); JavaScript assertions allow custom checks. Whether its `llm-rubric` judge can also run on the subscription: unverified.
- **DeepEval**: keep for a future AI feature in an app.
- **skill-creator evals**: same idea for one skill inside a chat, own format (https://code.claude.com/docs/en/skills.md#run-evals-with-skill-creator).

## Proposed next step (not decided)

Trial in ../temp: 2-3 plugin-eval cases for /kit:next, `--ablation none` first, record tokens; verdict in toolkit.yaml. Outside Now (M17): needs a drift entry and the user's decision.
