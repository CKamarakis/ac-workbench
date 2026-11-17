# Proposal

## Why

A project often has two large, unrelated features in flight at once, e.g. Feature A (new, active) and Feature B v1 (paused part-way). Nothing in the roadmap marks the point where the user should choose between them again, there is no side-by-side view of what each has left, and a milestone's title and goal can't be changed without dropping it and losing its ID and history. The user leaves the switch to memory and, coming back, doesn't remember what they did last. Found on Acme, 2026-11-17.

## What Changes

- **Track = an active or paused milestone.** No new concept or `track:` field. A large feature spanning several milestones (Feature B v1, v2) follows the milestone order; a `track:` field is added later only if one feature ever has two milestones running at once.
- **Edit a milestone:** a new `roadmap.mjs edit --id <ID> [--title <t>] [--goal <g>]` keeps the ID, tasks, links and history. The old title is recorded in the drift log.
- **Checkpoints:** a milestone can carry a checkpoint, set per milestone:
  - after a task (`T<n>`), the default;
  - after an OpenSpec change is archived.
- **Reaching a checkpoint:** detected on `tick`, in `check`, and in `/kit:roadmap` after an archive or merge. The kit asks "Continue X or switch to Y?" and shows each competing track side by side, with the **text** of its last done task and next task (not just `T3`), plus its resume note. It never blocks and never switches on its own.
- **The answer is logged** in the drift log (continue or switch, and why).
- **Resume note on switch:** when the user switches away, the kit drafts a one-line note for the paused milestone (last ticked task, next task, open linked change) and asks to keep, correct or skip it. Saved as a `Resume:` line in the milestone's Notes.
- **Soft cap:** more than 2 active tracks gives one warning line in `check` and `report`; never blocks.
- **Coming back:** `/kit:status` lists each track with its last task, next task and resume note, and shows a pending checkpoint.

```
 M4 Feature A (active) --T1--T2--T3[checkpoint]--T4--T5
                                  |
          tick / check / after archive or merge
                                  v
 +--------------------------------------------------------+
 | Checkpoint reached on M4 Feature A                     |
 |   Feature A     last: T3 <text>   next: T4 <text>      |
 |   Feature B v1  last: T2 <text>   next: T3 <text>      |
 |                 resume: "<note>"                       |
 |   Continue Feature A or switch to Feature B v1?        |
 +--------------------------------------------------------+
        | continue                    | switch
        v                             v
  drift: kept Feature A       M4 -> paused (resume note drafted, skippable)
                              M1 -> active; drift: switched, why; Now updated
```

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `roadmap`: milestone edit (title, goal) keeping the ID; checkpoints after a task or an archive; the continue-or-switch prompt with both tracks' last and next task text; the drift entry for the answer; the resume note on switch; the soft cap of 2 active milestones.
- `project-status`: list active and paused tracks with last task, next task and resume note; show a pending checkpoint.

## Impact

- `plugins/kit/scripts/roadmap.mjs`: new `edit` and `checkpoint` commands; checkpoint detection in `tick` and `check`; side-by-side track view in `report`; the cap warning. Unit tests alongside.
- `plugins/kit/skills/roadmap/SKILL.md`: the continue-or-switch prompt after an archive or merge; the resume-note draft.
- `plugins/kit/skills/status/SKILL.md`: the tracks section.
- Milestone frontmatter gains an optional `checkpoint:` field. Existing roadmaps keep working unchanged.
- Evals for the roadmap and status skills; smoke test.
- **Unverified:** whether `/kit:roadmap` reliably runs after `/opsx:archive` in a real session today. The archive and merge hook depends on that (see the note `2026-11-09-after-archive-run-the-follow-up-steps-automatically`).
