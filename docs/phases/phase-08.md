> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 08 — Materials, Rates & BOM

- **Objective / tasks:** Material variants, units, purchase/selling rates, effective history, product-material mapping, configurable rules.
- **Deliverables:** material APIs, BOM tables, module docs, history tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-08.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Rate changes preserve old quote/job snapshots. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Materials, append-only rates, BOM versions/items and immutable published pricing rules exist.

### Remaining acceptance

Validate real workshop unit/formula configuration and full history acceptance.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.
