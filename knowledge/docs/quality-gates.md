## How it works, roughly
`/kit:verify` runs the project's tests by its type's policy, `/security-review`, `/code-review`, a changed-files-without-tests check and the docs sync, and writes `verify.md`. A kit hook blocks `openspec archive` until that report passes or is overridden with a reason.

## Why

- **Archive gate**: the hook matches the `openspec archive` command, not a skill, because every archive route ends in that command. It ships in the kit plugin, so nothing is written into projects, and it does nothing outside kit projects. It is a guard rail, not security. [[tools-per-project]]
