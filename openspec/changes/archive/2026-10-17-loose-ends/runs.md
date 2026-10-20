# Runs: loose-ends

## 4.3 Seed (2026-10-17, kit 0.14.0)

The user picked all 8 items from the end-of-step list and kept the agent's two important marks and the blocker (L1 blocks M12). Left out as owned elsewhere: judge keyword false positives (roadmap M12 T4) and the PRD sync for "seen again" / kind change (`/kit:prd`).

- `list`: must look at 2 (L1 check, L2 friction, both important), might do 4 (L5 cleanup, L6-L8 idea), nothing to do 2 (L3, L4 accepted).
- `/kit:status` Loose ends: L1 and L2 as rows, then "+ 1 cleanup, 3 idea (/kit:loose-ends)"; accepted hidden.
- `roadmap.mjs report` ends with "Loose ends: 8 open (2 important): /kit:loose-ends".

## 4.4 Full run (2026-10-17)

- `npm test`: 471 tests, 471 pass, 0 fail (476 after the verify fixes C1-C5)
- `npm run evals`: 0 fail in every skill (loose-ends 4 pass, status 4, next 9, roadmap 5)
- `npm run smoke`: passed, 49 steps (win32, OpenSpec 1.13.2)
