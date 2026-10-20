## How it works, roughly
`/kit:ready` reads a planned change the way the builder will and lists gaps, differences, points to confirm and new tools, asked in one batch. Answers, and items put off as "Later", go into the change's `decisions.md`, which only a script writes.

## Why

- **Readiness never blocks**: you decide when to build. Anything put off comes back in `/kit:next`, `/kit:verify` and at archive instead of stopping the build.
- **Decision record**: one record is shared by `/kit:ready`, the docs sync, `/kit:next` and the archive gate. Its data block is the source and the table is re-rendered on every write, so it is edited only through the script.
