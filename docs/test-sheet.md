# Test sheet: the kit's handoffs, by hand

You can enter the kit at any step: an old PRD, a fresh note, a half-done change. What must be right is what each step hands to the next. This sheet checks exactly that.

**How to run it**
- On a **fresh copy** of a real project (call it Acme), in `../temp/acme-<date>/`, with the kit installed per project. Never on the real project itself.
- **When:** once before a release, start to finish; and any single row whenever a step feels off.
- **Writing it down:** tell Claude what went wrong, or keep notes in `private/` (gitignored). Findings become loose ends (`/kit:loose-ends`) or a fix. Nothing about the real project goes into this repo: no name, features, file names or paths (CLAUDE.md, "Real projects stay private").

## 1. Idea → explore
| You type | Good looks like | What went wrong |
|---|---|---|
| "I have an idea: <one line>" (no slash command) | It starts `/opsx:explore`, not capture or propose. It reads notes in `knowledge/notes/` that relate, and says which. | |
| (keep talking until something is decided) | It asks one question at a time, gives a recommendation, writes no code. | |
| (end the explore) | It saves `knowledge/explore/<slug>.md` without asking, with the **decisions** and the **open questions**, and shows what it wrote. | |

## 2. Explore → PRD
| You type | Good looks like | What went wrong |
|---|---|---|
| `/kit:prd` | It offers the explore record first. Open questions left: it says so and offers to keep exploring; no PRD forced. | |
| (pick the record) | The draft uses the record's decisions; its notes become the PRD's `sources`. Facts the notes don't give appear as assumptions or open questions, never as facts. | |
| "add <a thing> to the PRD" | Section by section, each shown before it's written, written only on a yes. | |

## 3. PRD → propose
| You type | Good looks like | What went wrong |
|---|---|---|
| `/opsx:propose` | It takes one PRD: the one you name, else the most recent; it says which and names the others. A Draft PRD gets a one-line note, never a stop. | |
| (proposal written) | The proposal has a `PRD: knowledge/prds/<slug>.md @ <commit>` line. It offers to mark the PRD `Building`; the PRD is unchanged without your yes. | |
| (tasks written) | `tasks.md` has no "check in the browser" or by-hand tasks; behaviour is covered by tests. | |

## 4. Later handoffs (one row each)
| Step | You type | Good looks like | What went wrong |
|---|---|---|---|
| propose → ready | `/kit:ready` | Decisions asked in one batch, each with options and Later; safeguards rated with reasons. With a worktree and an uncommitted plan, it offers to commit the plan. | |
| ready → apply | `/opsx:apply` | Builds task by task; answers from `/kit:ready` are in the specs or design; it pauses on anything unplanned. | |
| apply → verify | `/kit:verify` | Tests run; security and code review recorded; every scenario mapped to a test or checked by hand; anything decided during the build is shown to you. | |
| verify → archive | `/opsx:archive` | Blocked while a HARD item is open; specs synced; the roadmap and the change committed together. | |

## Any time
| You type | Good looks like | What went wrong |
|---|---|---|
| `/kit:next` | One next step, from where you are. Nothing about notes. | |
| `/kit:status` | Where things stand, each row with its source; notes as a plain count. Writes nothing. | |
