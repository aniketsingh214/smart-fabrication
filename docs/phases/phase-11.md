> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 11 — Quotation Lifecycle & PDF

- **Objective / tasks:** Quote versions, line items, discounts/tax, expiry, approval, customer view, PDF, acceptance/rejection.
- **Deliverables:** quote APIs, templates, docs, integration tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-11.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Quote version immutable and converted once only. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Version history/editor, exact decimal line rounding, discount/tax breakdown, protected customer-link copying, issued-quote revision into a separate draft, approval/acceptance and idempotent conversion are implemented. Revision preserves historical snapshots, supersedes the source, rejects accepted sources and requires reapproval.

### Remaining acceptance

Workshop-specific terms, historical-version PDF selection and full live customer PDF/download acceptance remain. Customer links require a linked authenticated account; no automated external delivery is activated.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.
