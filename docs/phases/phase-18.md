> Version: 0.1 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 18 — Dashboards, Reports, Permissions & Audit

- **Objective / tasks:** KPIs, filtered exports, alerts, staff permissions UI, audit logs, admin settings.
- **Deliverables:** reports APIs, audit logs, role tests, docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-18.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Every KPI reconciles to source data; exports scoped. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** Sequential local implementation authorized by user.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases without waiting for phase gates. All 6 acceptance checks verified via `npm run test:reporting-audit` (`scripts/test-reporting-audit-browser.mjs`):
1. **KPIs & trend charts reconciliation:** Verified `/reports/trends` returns `leads_by_source`, `orders_by_month`, and `net_customer_cash_by_month`. Reconciled net customer cash sum against `/reports/profit-loss` `customer_receipts_minor`. Verified customer role receives HTTP 403 on restricted reporting endpoints.
2. **Keyset balance pagination:** Keyset pagination verified for receivables (`/finance/receivables`), payables (`/finance/payables`), and worker balances (`/finance/workers`) with stable `nextCursor` tokens and limit parameters. Customer role strictly denied with HTTP 403.
3. **Filtered CSV streaming export:** Filtered CSV streaming verified for `/reports/expenses/export` enforcing date periods, `text/csv` headers, `attachment; filename="expenses.csv"`, and matching column definitions. Out-of-bounds date ranges (>366 days) rejected with HTTP 422; customer role denied with HTTP 403.
4. **Reminder dispatcher & internal notifications:** Verified `/api/internal/reminders` rejects unauthorized callers with HTTP 401; valid `CRON_SECRET` bearer token triggers `dispatch_due_notifications` and delivers due follow-up notifications to the assigned sales user (`/notifications` API).
5. **Staff permissions & immutable audit log:** Staff listing and role permission updates (`/admin/permissions`) verified. Database trigger `audit_change` automatically records immutable audit log entries (`entity_type = 'role_permission'`). Direct SQL updates and deletions to `audit_logs` are strictly prevented by RLS and immutable triggers.
6. **Mobile viewport UI:** Admin views `/admin/reports` and `/admin/users` load and render cleanly with responsive layout and headings under mobile viewport (`iPhone 13`).

Artifact registered: `test-results/reporting-audit-browser-latest.json`.

### Implemented

Permission-scoped overview, trend charts, keyset balance pagination, CSV exports, role matrix, immutable audit and internal notification/reminder dispatcher.

### Remaining acceptance

Hosted cron scheduler deployment and production email/SMS gateway rollout remain separate per local-only operating agreement.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), [reports module](../modules/reports.md) and [master plan](../MASTER_PLAN.md).

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

