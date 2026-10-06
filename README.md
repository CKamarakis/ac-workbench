# ac-workbench

A personal Claude Code kit for building products: from an idea you dictate to a PRD, a plan and working code, with the right tools set up per project and evidence for every tool choice.

The repo is a Claude Code plugin marketplace with one plugin, `kit`.

```
 idea (/voice or text)
    |  /kit:capture
    v
 knowledge/notes/  -->  /kit:prd  -->  knowledge/prds/<slug>.md   (you edit freely; status Draft..Ready)
                                            |  Ready
                                            v
                         /opsx:propose  -->  OpenSpec change (proposal, specs, design, tasks)
                                            |
                         /opsx:apply   -->  code + tests   -->  /opsx:archive  -->  PRD Shipped
 Not sure what's next?  /kit:next
```

## Install

Needs Node and Claude Code. Once per machine:

```bash
claude plugin marketplace add CKamarakis/ac-workbench
claude plugin install kit@ac-workbench --scope user
```

Then, in any Claude Code session, run `/kit:setup`. It installs the machine tools (git, gh, jq, gitleaks, OpenSpec) and asks before installing anything. Details: [`docs/setup.md`](docs/setup.md).

## Use it in a project

Run `/kit:start` once in the project folder (again only to re-sync after a kit update).
- It asks **one question**: the project type. For a Next.js app it recommends `web-ui`.
- It sets up git, OpenSpec, the `CLAUDE.md` workflow rules, a project context doc, the `knowledge/` folder, and the tools for that type, all for this project only.
- Changes to files you already have are shown as diffs and need your yes.
- Heavier tools (SuperSpec, Superpowers) are listed as **available on demand**. They're added when a change needs them, not up front.

| Skill | What it does |
|---|---|
| `/kit:capture` | Save an idea, dictation, link or screenshot as a note; import a `.txt` transcript; archive or move notes. Offers to update a matching PRD |
| `/kit:prd` | Draft a PRD from the notes you pick, update it section by section (never overwriting your edits), and mark it Ready |
| `/kit:next` | Tell you the next step and which skill to use, from your PRDs and OpenSpec state |
| `/kit:setup` | Install or check the machine toolset |
| `/kit:start` | Set up or re-sync a project |

Planning and building use [OpenSpec](https://github.com/Fission-AI/OpenSpec): `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`.

### The knowledge folder

```
 knowledge/
   notes/      one Markdown file per note (<date>-<title>.md); optional topic folders
   prds/       one PRD per file, with status and the notes it came from
   assets/     images and screenshots
   archive/    moved here on request; the kit never reads it
```

Plain Markdown in your repo: no external service, no quota. Notes you add by hand as `.md` are picked up as they are.

## How tools are chosen

Every tool the kit knows lives in [`toolkit.yaml`](toolkit.yaml), with:
- why it's there;
- what it costs, in money and in context;
- whether it's adopted, in trial, later or dropped;
- the evidence behind that verdict (trial notes in [`evals/trials/`](evals/trials/)).

Run `npm run registry` to validate it and print the lane map (one owning tool per workflow phase). Field reference: [`docs/registry.md`](docs/registry.md).

## Developing the kit

```bash
npm test             # unit tests
npm run evals        # eval cases for every kit skill
npm run registry     # validate toolkit.yaml, regenerate plugins/kit/data/toolkit.json
```

- **Order of work, current position and the drift log:** [`docs/roadmap.md`](docs/roadmap.md).
- **Decisions and context:** [`docs/project-context.md`](docs/project-context.md).
- **Planned and active changes:** [`openspec/changes/`](openspec/changes/).
- **Secret scanning:** commits pass a gitleaks pre-commit hook. Enable it once per clone with `git config core.hooksPath .githooks`.
