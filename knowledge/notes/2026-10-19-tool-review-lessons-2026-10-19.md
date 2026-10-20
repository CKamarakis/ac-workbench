---
title: Tool review lessons 2026-10-19
date: 2026-10-19
tags:
  - tool-review
  - process
source: text
---

Lessons from the 2026-10-19 tool review, to improve `/kit:tool-review`. Discuss before building.

1. **Verify the effect, not the release notes.** Two wrong claims came from notes alone: the Impeccable "user-level hook" and "long OpenSpec requirements break our changes". A fresh install in `../temp` and one test change disproved both. Per update: *affects us / doesn't / unverified*, with how it was checked.
2. **Decisions need the facts.** For each: what it is in plain words, what changes for us, whether it can be undone, and a recommendation. No bare "on or off?".
3. **Findings first, then options.** No new change or process without a yes (`spec-length-split` was created on an unverified claim).
4. **Windows actions:** warn before winget installs (admin prompt, apps holding files open). Check the version afterwards, because winget printed success while the Git installer had aborted. Check for processes holding the tool open beforehand.
5. **"Tested with" is weaker than it reads.** Smoke doesn't exercise project tools (Impeccable, playwright-cli, emil-skills). Options: run each tool's registry `check` after its update, or say plainly that the version is "kit still works with".
6. **An update has steps beyond the install:** OpenSpec needs `openspec update` per project to refresh its skills. The registry could list each tool's after-update steps.
7. **False signals in the scan:** comparing a tag from one release series with another made a false "major" (Impeccable's engine tag vs its CLI tag). Kit 0.17 shows as 0.1.0 because it was never tagged (M13 T5).
8. **Pinning:** `npx impeccable@4.5.2 install` still pulled the latest skill. Note per tool whether a version can be pinned, and how to roll back.
9. **Back up before an update:** a copy of the settings files, and the old tool folder, kept until smoke passes.
