---
name: ping
description: Smoke test for the kit plugin. Use only when the user asks to ping the kit or check that the kit plugin is installed.
---

# Kit ping

Run this command and report its output verbatim:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ping.mjs"
```

If `CLAUDE_PLUGIN_ROOT` is empty or the script is not found, say so. That result answers the sandbox check in task 2.2.
