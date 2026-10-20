# Runs: build-safeguards

## 3.2 Spec reviewer on a planted bug (2026-10-18)

- **Fixture:** `Projects/temp/spec-review-fixture`, change `reminder`: a delta spec "the line shows when the oldest `reviewed_on` is more than 30 days old" (scenarios "Review due", "Not due"), and `reminder.mjs` that compares with **3** days.
- **How it ran:** the prompt of `plugins/kit/agents/spec-reviewer.md`, given to a general-purpose subagent with the change name, the range `e462afa..HEAD` and "high-risk: yes". `kit:spec-reviewer` itself wasn't loaded in this session (plugin agents load at session start); `claude plugin validate plugins/kit` passes with the agent in place.
- **Result:** 3 findings, 5 probes; about 44k tokens, 21 s, 7 tool calls.
  - Found the planted bug: "the spec says more than **30** days; the code shows it when `days > 3`", naming the requirement, `reminder.mjs:5` and the "Not due" scenario it breaks.
  - Two more real gaps, not planted: the line doesn't name the tool ("Review due" says it does), and nothing calls the function at session start (marked "spec unclear", since `tasks.md` had only one task).
  - Probes worth having: an unparseable date next to a due one hides the reminder (NaN); exactly 30 vs 31 days; a future date; two tools with the same oldest date.
- **Reading:** the prompt works on a small change: findings name the scenario and the file, and it separated a bug from an unclear spec. Noise: none. To check later: a real, larger change (M12).

## 5.3 Dogfood and full run (2026-10-18)

- **Safeguards for this change** (`ready.mjs safeguards`, written into `design.md`): reach high, undo high, safety low. Chosen: scenario-to-test check, review against the spec, edge-case probes, medium security findings block, the user's OK before merge. The worktree was left out on the user's choice: the build was already done in `m12-next`.
- **Full run:** `npm test` 524 pass, 0 fail; `npm run evals` 110 pass, 0 fail, 31 pending (rubric cases, not scored); `npm run smoke` passed, 54 steps (Windows, OpenSpec 1.13.2).
- **Found during the run:** `evals/start` still checked the deleted judge skill (`questions-are-clickable`). Fixed, and the guard test now also scans the live eval cases (not their run records).
- **Real tool scan** (`tool-review.mjs scan` on this repo): OpenSpec 1.13.2 -> 1.14.3, git and gh a minor behind, Impeccable tags renamed (`engine-v0.1.9` vs `cli-v4.6.0`, needs judgement), Superpowers up to date. First real `/kit:tool-review` is the place to act on these.
