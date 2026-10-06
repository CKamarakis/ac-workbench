# ac-workbench

A personal Claude Code kit (marketplace repo, plugin `kit`). Public repo.

## Start every session here

1. Read `docs/roadmap.md`: the north star, the milestones, **Current position**, and the drift rules.
2. Work only on the current position or the next actions. Anything else: stop, add a drift-log entry with its reason, and ask the user. Reorders and scope changes are the user's decision.
3. Planning lives in OpenSpec (`openspec/changes/`). The roadmap and the OpenSpec change are updated together, in one commit.

## Rules

- **Tools per project, kit global.** Never enable workflow plugins, MCPs or tool configs at user scope or in global config. `claude plugin install` defaults to `--scope user`, so always pass `--scope project`.
- **Never touch real projects for tests.** Use throwaway folders, or a copy of the project.
- **Before a tool becomes a default:** read its full docs, trial it, and record the verdict and evidence in `toolkit.yaml` (`npm run registry`).
- Mark anything not checked against official docs as **unverified**.
- Commits pass the gitleaks hook (`git config core.hooksPath .githooks`, once per clone).

## Commands

```bash
npm test                    # unit tests
npm run evals               # eval cases for every kit skill
npm run registry            # validate toolkit.yaml, write plugins/kit/data/toolkit.json, print lane map
```

Windows: `openspec`, `gh`, `jq`, `gitleaks` may not be on the agent's PATH. Kit scripts find them via `plugins/kit/scripts/locate.mjs`. From PowerShell, prepend `$env:APPDATA\npm` for `openspec`.
