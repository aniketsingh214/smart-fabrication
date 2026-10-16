> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 18 — Dashboards, Reports, Permissions & Audit

- **Objective / tasks:** KPIs, filtered exports, alerts, staff permissions UI, audit logs, admin settings.
- **Deliverables:** reports APIs, audit logs, role tests, docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-18.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Every KPI reconciles to source data; exports scoped. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Permission-scoped overview, CSV exports, role matrix, immutable audit and internal notification/reminder code exist.

### Remaining acceptance

Filtered charts, balance keyset pagination and filtered CSV continuation are implemented. Remaining: reminder runtime, load/concurrency and full permission/export audit.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

