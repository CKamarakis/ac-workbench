# Setting up a machine

```
 new machine ──(2 lines, once)──> kit installed ──/kit:setup──> machine toolset ──/kit:start──> project tools
                                  (only global plugin)          git, gh, jq, gitleaks,          Superpowers etc.,
                                                                openspec, marketplaces          per project; heavy ones on demand
```

## 1. Bootstrap the kit (once per machine)

Needs Node and Claude Code. In a terminal:

```bash
claude plugin marketplace add CKamarakis/ac-workbench
claude plugin install kit@ac-workbench --scope user
```

On the main PC (dev mode), add the local clone instead, so edits apply immediately:

```bash
claude plugin marketplace add C:/Users/Chris/Documents/Projects/ac-workbench
claude plugin install kit@ac-workbench --scope user
```

## 2. Install the toolset

In any Claude Code session: `/kit:setup`. It shows what is missing, asks before installing, and installs with winget/npm. A second run reports "Nothing to do".

The same thing without Claude:

```bash
node plugins/kit/scripts/setup.mjs plan     # read-only
node plugins/kit/scripts/setup.mjs apply    # installs what is missing
```

What gets installed is defined by `toolkit.yaml`: entries with `scope: machine` and status `adopted` or `trial`. See `docs/registry.md`.

## Rules

- **Global = the kit, CLIs and known marketplaces only.** Project tools are installed per project by `/kit:start`; workflow plugins (Superpowers, …) are added on demand when a change needs them, never for every session. Setup warns if it finds one enabled at user scope.
- **Never configure a tool globally for one project's sake** (e.g. OpenSpec profiles). The kit applies such config per project.
- Plugin installs run with Windows Git (`C:\Program Files\Git\cmd`) first on PATH. Git Bash's git can't clone plugins with submodules (`evals/trials/plugin-cli.md`).
- After a winget install, open a new terminal so PATH refreshes. Kit scripts find the tools either way.
