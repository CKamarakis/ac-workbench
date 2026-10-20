---
name: ping
description: Smoke test for the kit plugin. Use only when the user asks to ping the kit or check that the kit plugin is installed.
---

# Kit ping

Run this command and report its output verbatim:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ping.mjs"
```

- **Output starts with `kit ok:`:** the kit is installed and working; say which version.
- **The script isn't found, or the command fails:** the kit isn't installed correctly; suggest `claude plugin update kit@ac-workbench` and a restart.
- `CLAUDE_PLUGIN_ROOT` is never set as a shell variable in the Bash tool; that's by design (Claude Code fills the path into this skill when it loads). Don't report it as a problem.
