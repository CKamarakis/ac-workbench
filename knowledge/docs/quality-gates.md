## How it works, roughly
`/kit:verify` runs the project's tests by its type's policy, `/security-review`, `/code-review`, a changed-files-without-tests check and the docs sync, and writes `verify.md`. A kit hook blocks `openspec archive` until that report passes or is overridden with a reason. Each test command gets up to 15 minutes; one that runs longer is stopped and reported as "ran out", not failed.

## Why

- **Archive gate**: the hook matches the `openspec archive` command, not a skill, because every archive route ends in that command. It ships in the kit plugin, so nothing is written into projects, and it does nothing outside kit projects. It is a guard rail, not security. [[tools-per-project]]
- **Test command time limit**: a real project's integration suite (about 13.5 minutes) showed as failed in every report under the old 10-minute limit, and the user couldn't tell a time-out from a broken test. The limit is one number in `verify.mjs`, not a project setting: simpler, but a kit update resets a local edit (the message says so). The message shows the path with `~` for the home folder, because projects commit `verify.md`.
