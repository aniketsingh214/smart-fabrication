> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 09 — Estimation & Measurement

- **Objective / tasks:** Dimension form, validation, formula engine, wastage, approximate quantity/weight/price, site measurement records.
- **Deliverables:** estimate API, formula docs, examples, calculator UI.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-09.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Boundary/unit tests pass; output labelled approximate. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Configured server-authoritative approximate estimator, dimension validation and verified measurement records exist.

### Remaining acceptance

Business-approved formulas and live calculation boundary/history evidence remain required.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.
