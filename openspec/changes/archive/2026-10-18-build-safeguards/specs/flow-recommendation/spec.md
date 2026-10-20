# Spec Delta

## REMOVED Requirements

### Requirement: Risk checklist
**Reason**: Matching words gave false positives ("session" for session start, "tokens" for AI usage, "unknown" from the PRD template), so the recommendation couldn't be relied on. SuperSpec is dropped (2026-10-18).
**Migration**: `/kit:ready` rates reach, undo and safety from the plan (build-readiness "Safeguards picked per change").

### Requirement: Flow recommendation
**Reason**: There is one flow (OpenSpec); SuperSpec is dropped. Safeguards are chosen per change instead of switching flows.
**Migration**: `/kit:ready` recommends safeguards and writes the user's choice into `design.md`.

### Requirement: Labelled eval set
**Reason**: The judge it tested is removed.
**Migration**: None; the readiness skill's eval cases cover the safeguards.
