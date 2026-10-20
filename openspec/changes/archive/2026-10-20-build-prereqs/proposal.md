## Why

The M12 T2 run on a Acme copy (export a note as Markdown, 2026-10-20) hit three kit gaps, none of them the user's mistake:

1. `/kit:ready` chose a worktree, but the plan wasn't committed. A worktree starts from the last commit, so the build couldn't see the plan; the user had to skip the worktree.
2. The `/kit:start` upgrade was never committed, so it got mixed with the feature on the same branch, and verify's diff included it.
3. OpenSpec's tasks instruction asks each task to state how it's verified ("observable behavior"), so propose wrote a manual task "Verify in the browser". The build stopped at 7 of 8 tasks, which goes against the kit's rule that a browser check runs only on request.

## What Changes

- `/kit:ready`: when the safeguards include a worktree and the change's planning files aren't committed, the close says so and offers to commit them (only on a yes).
- `/kit:start`: the Done part ends by suggesting a commit of the setup files before any change starts, and offers it (only on a yes).
- `/kit:start` adds a `rules.tasks` entry to `openspec/config.yaml`, saying not to add tasks that need a running app, a browser or a check by hand. It goes in only when it can be placed safely; otherwise the plan says which line to add.
  - OpenSpec documents per-artifact `rules:` (docs/customization.md). That `tasks` is a valid key is checked in the 1.14.3 source (project-config.js, instruction-loader.js) and in a throwaway run; a docs example names only proposal and specs.
- Kit 0.20.1.

```
/kit:start ──> config.yaml rules.tasks ──> propose writes no browser tasks
     └─ Done: "commit the setup first"
/kit:ready ──> worktree chosen + plan uncommitted ──> offer to commit plan ──> /opsx:apply in a worktree sees it
```

## Capabilities

### New Capabilities

### Modified Capabilities
- `project-starter`: setup files are committed before a build starts; OpenSpec tasks avoid manual checks.
- `build-readiness`: a worktree needs a committed plan.

## Impact

- `plugins/kit/scripts/start-plan.mjs`, `start-apply.mjs` (config rule), `plugins/kit/skills/start/SKILL.md`, `plugins/kit/skills/ready/SKILL.md`, tests, evals, plugin version.
- Existing projects get the rule on their next `/kit:start` re-sync, shown as a `CHANGE` to `openspec/config.yaml`.
