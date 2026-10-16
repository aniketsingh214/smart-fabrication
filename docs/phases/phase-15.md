> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 15 â€” Labour, Work Orders & Production

- **Objective / tasks:** Workers/rates/work entries/payments, production jobs/stages, material usage, QC.
- **Deliverables:** labour/production APIs, UI, documents, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-15.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Job costing and worker outstanding match ledger. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Workers, rates, job cards, stages, QC, idempotent earning entries and payment caps are implemented.

### Remaining acceptance

Historical rates, earning retries, overpayment denial, wage privacy and production-to-installation SQL flow passed. Real-role browser acceptance and broader allocation/history cases remain.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.
