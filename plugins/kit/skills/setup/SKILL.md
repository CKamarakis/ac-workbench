---
name: setup
description: Install the kit's machine toolset (git, gh, jq, gitleaks, openspec, marketplaces) from the kit registry in one go. Use when the user asks to set up their tools, set up this machine, install the kit tools, or when /kit:start reports missing machine tools.
---

# Kit setup

Brings this machine up to the kit's toolset from the registry. It is safe to re-run: present tools are never reinstalled.

**Scope rule:** this skill installs machine-scope tools only (CLIs, the kit plugin, plugin marketplaces). It never enables workflow plugins such as Superpowers for the whole machine; `/kit:start` enables those per project.

## Steps

1. **Plan.** Run this and show the output to the user as is:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" plan
   ```
   - It ends with "Nothing to do": tell the user everything is present and stop.
   - It shows `WARNING` lines (a project-scope plugin enabled for every session): explain them and ask whether to move the plugin to per-project. Do not change settings without a yes.

2. **Confirm.** List the `MISSING` tools with their install commands. Ask the user to confirm: all of them, some of them, or none. Install nothing before they answer.

3. **Apply** only what they confirmed (omit the names to install all missing tools):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" apply <name> <name>
   ```
   winget installs can take a few minutes each. Use a long timeout.

4. **Summarize** using the script's output: installed, failed (with the fix line), present. If an install succeeded but its check fails, tell the user to open a new terminal so PATH refreshes, then run `/kit:setup` again.

## Notes

- Scripts locate tools outside PATH themselves (npm global folder, Program Files, winget). Do not edit PATH or profiles.
- Never pass `--scope user` for a project-scope plugin, and never edit `~/.claude/settings.json` from this skill.
- The registry lives in the kit repo (`toolkit.yaml`). To change what gets installed, edit it there and run `npm run registry`. Never edit it from a consuming project; use `/kit:feedback` instead.
