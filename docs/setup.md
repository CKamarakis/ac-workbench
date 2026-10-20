# Setting up a machine

```
 new machine ──(once)──> kit marketplace ──(per project)──> kit in this project ──/kit:setup──> machine toolset ──/kit:start──> project tools
                         (enables nothing)                  (--scope project)     (first time)  git, gh, jq, gitleaks,          Superpowers etc.,
                                                                                                 openspec, marketplaces          per project; heavy ones on demand
```

## 1. Bootstrap the kit

Needs Node and Claude Code. In a terminal, once per machine:

```bash
claude plugin marketplace add CKamarakis/ac-workbench
```

Then in each project folder where you want the kit (it is never installed for the whole machine):

```bash
claude plugin install kit@ac-workbench --scope project
```

This adds the kit to the project's `.claude/settings.json`. Anyone who clones the project sees "enabled in project settings but isn't installed here" until they run the same install, and the kit loads only after they trust the folder (Claude Code plugin loading reference).

On the main PC (dev mode), add the local clone as the marketplace instead, so edits apply immediately:

```bash
claude plugin marketplace add ../ac-workbench
claude plugin install kit@ac-workbench --scope project
```

## 2. Install the toolset

In a Claude Code session in a project with the kit: `/kit:setup` (once per machine). It shows what is missing, asks before installing, and installs with winget/npm. A second run reports "Nothing to do".

The same thing without Claude:

```bash
node plugins/kit/scripts/setup.mjs plan     # read-only
node plugins/kit/scripts/setup.mjs apply    # installs what is missing
```

What gets installed is defined by `toolkit.yaml`: entries with `scope: machine` and status `adopted` or `trial`. See `docs/registry.md`.

## Rules

- **Global = CLIs and known marketplaces only.** The kit is installed per project (above); project tools are installed per project by `/kit:start`; workflow plugins (Superpowers, …) are added on demand when a change needs them, never for every session. Setup warns if it finds one, or the kit, enabled at user scope.
- **Never configure a tool globally for one project's sake** (e.g. OpenSpec profiles). The kit applies such config per project.
- Plugin installs run with Windows Git (`C:\Program Files\Git\cmd`) first on PATH. Git Bash's git can't clone plugins with submodules (`evals/trials/plugin-cli.md`).
- After a winget install, open a new terminal so PATH refreshes. Kit scripts find the tools either way.
