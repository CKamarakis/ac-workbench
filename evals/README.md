# Kit evals

Every kit skill in `plugins/kit/skills/<skill>/` must have eval cases in `evals/<skill>/cases.yaml`. The runner fails if any skill has none (spec: skill-evals).

```
 evals/<skill>/cases.yaml ──> tools/run-evals.mjs ──> evals/<skill>/runs/<date>-<setup>.json
                                  │  temp sandbox per case                 │
                                  │  deterministic checks: automatic       ├─> registry verdict `evidence:`
                                  │  rubric checks: from --scores file     └─> tools/compare-runs.mjs (A/B)
```

## Case file format

```yaml
skill: ping                     # must match the folder name
cases:
  - id: prints-version          # unique within the file
    description: Ping script prints the kit version
    setup:                      # optional; prepares the temp sandbox (the working dir)
      git_init: true            #   run `git init` in the sandbox
      files:                    #   files to create: path -> content
        README.md: "hello"
      copy:                     #   repo-relative paths copied into the sandbox
        - plugins/kit/templates/CLAUDE.md
    input:                      # what the skill/script is given
      run: node "{{kit}}/scripts/ping.mjs"   # deterministic: shell command run in the sandbox
      # prompt: "..."           # Claude-in-the-loop: needs an engine (not wired yet), case is `pending`
    checks:
      - kind: file-exists       # path exists in the sandbox
        path: README.md
      - kind: command-exit      # command exits with `expect` (default 0); optional stdout regex
        command: git status
        expect: 0
        stdout_match: "On branch"
      - kind: git-ignored       # git ignores this path in the sandbox
        path: PM-OS-v2.1/notes.md
      - kind: content-match     # file content matches regex (or must NOT match with `negate: true`)
        path: .gitignore
        pattern: "kit:start"
      - kind: rubric            # judgement; each criterion scored pass/fail with a reason
        criteria:
          - name: diagram-first
            description: The first section is an ASCII system diagram
```

Placeholders in `run`, `command` and paths:
- `{{kit}}`: absolute path to `plugins/kit`.
- `{{repo}}`: the repo root.
- `{{sandbox}}`: the case's temp folder.

A case file may set default placeholders at the top level (`vars: { validator: '{{repo}}/tools/validate-registry.mjs' }`). Extra placeholders can be passed per run with `--var name=value`, e.g. `--var validator=C:/…/sandbox/tools/validate-registry.mjs`. This points the same cases at another build (A/B). The values are recorded in the run file.

Commands run through the platform shell (`cmd.exe` on Windows). Keep them simple, or call `node`.

## Case outcomes

- `pass`: every check passed.
- `fail`: at least one check failed.
- `pending`: nothing failed, but a rubric criterion has no score yet, or the input is a `prompt` and no engine is wired in.

## Running

```bash
node tools/run-evals.mjs                       # all skills, setup "default"
node tools/run-evals.mjs start next --setup superspec --interventions 2
node tools/run-evals.mjs harness-review --scores scores.yaml
node tools/run-evals.mjs --dry                 # run, but do not write run files
```

The run exits non-zero if any case fails or any skill is missing evals.

### Rubric scores file

```yaml
<case-id>:
  <criterion-name>: { pass: true, reason: "one line" }
```

Scores come from a person or a Claude-scored step. The engine that drives Claude sessions is still open (design D8).

## Run record

`evals/<skill>/runs/<YYYY-MM-DD>-<setup>.json`. If the name is taken, a `-2`, `-3` suffix is added.

```json
{
  "skill": "ping", "date": "2026-09-29T10:00:00.000Z", "setup": "default",
  "interventions": 0, "duration_ms": 120,
  "summary": { "pass": 1, "fail": 0, "pending": 0 },
  "cases": [
    { "id": "prints-version", "outcome": "pass", "duration_ms": 118,
      "checks": [ { "kind": "command-exit", "pass": true, "detail": "exit 0" } ],
      "rubric": [ { "name": "diagram-first", "pass": true, "reason": "..." } ] }
  ]
}
```

A registry verdict cites a run by its repo-relative path (`evidence: evals/ping/runs/2026-09-29-default.json`).

## Comparing setups

```bash
node tools/compare-runs.mjs evals/x/runs/2026-10-01-openspec.json evals/x/runs/2026-10-01-superspec.json
```

This prints the outcome of each case side by side, plus the duration and intervention count for each setup.
