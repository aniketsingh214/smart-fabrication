> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 12 — Orders & Customer Tracking

- **Objective / tasks:** Order conversion, advance/balance, status timeline, customer order page, notifications.
- **Deliverables:** order APIs, migrations, UI, status transition docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-12.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Order totals reconcile and unauthorized users blocked. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Accepted-quote conversion, guarded order transitions, advance receipts and owned order timeline exist.

### Remaining acceptance

Full customer/staff browser journey and cancellation/refund policy acceptance remain.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Finance and reporting follow-up — 2026-10-15

Implemented immutable source-linked corrections and actor-aware retries, supplier credit/refund caps, full pre-production customer refunds with atomic cancellation, active-work/reservation guards and reviewed past-period closure. Refunds record verified manual cash movement; no bank transfer occurs. See [refund and period policy](../operations/refunds-periods.md). Official P&L, post-production commercial refunds and accountant acceptance remain open.
