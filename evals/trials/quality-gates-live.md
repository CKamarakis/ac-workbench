# Quality-gates live trial (task 7.1), 2026-10-07

**Setup:** the user's interactive session in `Projects/temp/Toughbubble` (a copy), with the working-tree kit loaded via `claude --plugin-dir …/plugins/kit` and `npm install` done. Small change: `add-sidebar-collapse`.

| Step | Result |
|---|---|
| `/kit:start` re-sync | routing gained "Quality gates"; the `.gitignore` block shrank |
| `/opsx:propose` + `/kit:judge` | **OpenSpec** recommended (user confirmed) |
| `/opsx:apply` | built (151 lines added, 8 removed, at the first snapshot) |
| `/opsx:archive` before verify | **blocked**; the agent was told to run `/kit:verify` first (user confirmed) |
| `/kit:verify` | **pass**. Required `npm test` passed. Optional `test:integration` failed on its own `APP_ENV=development` guard, so it's advisory, as the policy intends. 2 changed files without tests (advisory). `/code-review`: 7 findings, 2 medium (`aria-expanded` always true; the expand bar pushes content down ~37px), all advisory |
| `/opsx:archive` after verify | allowed; `verify.md` archived with the change |

**Usage** (the user's `/cost` snapshots, before and after verify + archive; subscription, so tokens matter):
- Verify + archive: **+6m53s wall** (+3m19s API), **+16.8k output** and +4.8k input tokens, +4.7M cache read, +86k cache write.
- Whole session: 25m33s wall, 43.6k output tokens, 10.4M cache read.

**Findings, and what was fixed:**
1. **`/security-review` didn't run** (local environment reasons, per the user), and the agent did its own security check. Neither was recorded, so the report showed no security findings, which looked clean.
   - **Fixed:** a new `verify.mjs reviewed --source security|code --how ran|substitute|skipped --note …` command, and a "Reviews" table in the report.
   - A review that isn't recorded shows as an advisory item, "security review not recorded (did it run?)".
   - The skill now says: if the built-in can't run, review the diff yourself, record the findings, and mark it `substitute` with the reason.
2. **The failing test's detail pasted raw terminal output** (box drawing, code excerpts). **Fixed:** `failureDetail()` keeps only readable error lines, capped at 200 characters.
