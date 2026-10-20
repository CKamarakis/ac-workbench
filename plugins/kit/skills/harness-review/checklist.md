# Harness review checklist

Eight layers. For each: the questions to ask, what the ratings mean, and where Claude Code's own checks go deeper. Every note names its evidence (a file, a count, a hook) from the scan or the project.

**Ratings:** **OK** = the layer is covered and fits the project. **PARTIAL** = something is there but a clear piece is missing or weak. **GAP** = nothing covers it.

## 1. Context: what the agent knows at the start
- Is there a `CLAUDE.md` (or `AGENTS.md`) that says what the project is, how to run it, and the rules that matter?
- Is it lean? Large instruction files (roughly over 10 KB together) crowd the context window and get followed less reliably.
- Do project rules live in the project, and personal preferences at user level?
- With the kit: is the routing block current?
- **OK:** a focused CLAUDE.md with commands and rules. **PARTIAL:** present but thin, stale or very large. **GAP:** none.
- **Go deeper:** `/doctor prompt-audit` finds outdated, broken or conflicting instructions; `/context` shows what fills the window.

## 2. Tools: what the agent can use
- Do the skills, subagents, commands, MCP servers and plugins match the work this project does?
- Are there tools that overlap (two skills or plugins for the same job)? With the kit: lane conflicts.
- Are there many tools that look unused for this project?
- **OK:** a small set that fits the work. **PARTIAL:** overlaps or clearly unused tools. **GAP:** the project needs a tool it lacks (e.g. a UI project with no way to check pages).
- **Go deeper:** `/skill-doctor` shows what each skill costs and how often it's used.

## 3. Memory: what carries over between sessions
- Is auto memory in use, and is each memory the right kind? Facts about the user or project fit memory; **steps for a recurring task belong in a skill**; rules everyone should follow belong in `CLAUDE.md`.
- Use the scan's signals: a memory with 3+ numbered steps, or one that names commands, is a candidate to move. Open it to confirm before flagging.
- Is `MEMORY.md` a short index, not a dump?
- **OK:** a few typed memories, none misplaced. **PARTIAL:** misplaced or overgrown memories. **GAP:** no memory and the project has repeated corrections that never stick.

## 4. Loops: how work moves from idea to done
- Is there a repeatable way of working (plan, then build, then check), written down or in a tool (e.g. OpenSpec, a task list)?
- Does the agent know where a piece of work stands (tasks, change status)?
- With the kit: any unresolved lane conflicts.
- **OK:** a written, followed workflow. **PARTIAL:** a workflow exists but steps are skipped or owned by two tools. **GAP:** every session starts from scratch.

## 5. Verification: what checks the agent's work
- Is there a test command, and does the agent run it before calling work done?
- Is there a verify step, review, or hook that runs checks after edits?
- **OK:** tests plus a step that runs them. **PARTIAL:** tests exist but nothing makes sure they run. **GAP:** no tests or checks.

## 6. Guardrails: what stops a harmful step
- Are there permission rules (deny for secrets like `.env`, ask for risky commands)?
- Are there hooks the scan marks "(can block)" (e.g. PreToolUse, PermissionRequest, Stop) for steps that must not happen, such as archiving unverified work or committing secrets? Count hooks from plugins too.
- Is there secret scanning before commits?
- **OK:** deny rules for sensitive files plus at least one blocking check. **PARTIAL:** one of them. **GAP:** none.

## 7. Feedback: where lessons land
- When the agent is corrected, does the lesson get written down (memory, a CLAUDE.md rule, a skill fix)?
- Is there a place to report problems with the tools themselves (an issues page)?
- **OK:** corrections are captured and reach the next session. **PARTIAL:** captured sometimes, or only in chat. **GAP:** nothing is kept.

## 8. Observability: what you can look back on
- Can you see what happened and why: decision records, verify reports, eval runs, commit messages that say why, logs?
- **OK:** decisions and checks leave a record you can read later. **PARTIAL:** some records, gaps for key steps. **GAP:** only the chat.

## Scorecard and fixes

```
| Layer         | Rating  | Note (evidence)                     |
|---------------|---------|-------------------------------------|
| context       | OK      | CLAUDE.md 2.4 KB with commands      |
| ...           |         |                                     |
```

Then **at most three fixes**, most impact first. Each: the layer, what to do (one or two lines), and why that layer matters. Prefer fixes the user can do in under an hour.
