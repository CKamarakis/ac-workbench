---
name: setup
description: Install the kit's machine toolset (git, gh, gitleaks, openspec, marketplaces) from the kit registry in one go. Use when the user asks to set up their tools, set up this machine, install the kit tools, or when /kit:start reports missing machine tools.
---

# Kit setup

Brings this machine up to the kit's toolset from the registry. It is safe to re-run: present tools are never reinstalled.

**Scope rule:** this skill installs machine-scope tools only (CLIs and plugin marketplaces, including the kit's own). Plugins, the kit included, are never enabled for the whole machine: the kit is installed in each project (`claude plugin install kit@ac-workbench --scope project` in its folder), and `/kit:start` enables the other tools per project.

## Steps

1. **Plan.** Run this and show the output to the user as is:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" plan
   ```
   - It ends with "Nothing to do": tell the user everything is present and stop.
   - It shows `WARNING` lines (a project-scope plugin enabled for every session): explain them and ask whether to move the plugin to per-project. Do not change settings without a yes. For the kit itself, keep the warning's order: per project first, the user-level uninstall last.

2. **Confirm.** List the `MISSING` tools with their install commands. Ask the user to confirm: all of them, some of them, or none. Install nothing before they answer.

3. **Apply** only what they confirmed (omit the names to install all missing tools):
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/setup.mjs" apply <name> <name>
   ```
   Installs (winget on Windows, Homebrew on macOS and Linux) can take a few minutes each. Use a long timeout.

4. **Summarize** using the script's output: installed, failed (with the fix line), present. A tool that failed with "Homebrew is not installed" needs the user to install Homebrew from https://brew.sh first; never install Homebrew yourself. If an install succeeded but its check fails, tell the user to open a new terminal so PATH refreshes, then run `/kit:setup` again.

## Notes

- Scripts locate tools outside PATH themselves (npm global folder; Program Files and winget on Windows; the Homebrew folders and `~/.local/bin` on macOS and Linux). Do not edit PATH or profiles.
- Never pass `--scope user` for a project-scope plugin, and never edit `~/.claude/settings.json` from this skill.
- The registry lives in the kit repo (`toolkit.yaml`). To change what gets installed, edit it there and run `npm run registry`. Never edit it from a consuming project; open an issue at github.com/CKamarakis/ac-workbench/issues instead.
