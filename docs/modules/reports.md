> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: implemented; local acceptance verified

# Reports

## Source specification

- **Functional scope:** Lead/source/product, sales, purchases, supplier outstanding, labour, expenses, stock, P&L; filters and CSV/PDF exports.
- **Rules / acceptance:** Permission-aware exports, metric definitions, large report pagination.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract & verified acceptance

- Verified automated acceptance suite: `npm run test:reporting-audit` (`scripts/test-reporting-audit-browser.mjs`).
- Artifact: `test-results/reporting-audit-browser-latest.json` (6/6 checks passing).
- KPIs & trend charts: Verified `/reports/trends` returns leads, orders, purchases, and net customer cash trends reconciled against `/reports/profit-loss`.
- Keyset balance pagination: Cursor pagination verified for receivables, payables, and workers with boundary checks and permission gating.
- Filtered CSV exports: Resource endpoints stream CSV with date range validation, `text/csv` headers, `Link` continuation, and role-scoped permissions.
- Reminders dispatcher: `/api/internal/reminders` with `CRON_SECRET` processes due follow-ups and delivers in-app notifications.
- Staff permissions & immutable audit: `/admin/users` and `/admin/permissions` update roles and permissions with automatic immutable audit logging.
- Mobile UI: Verified responsive views for `/admin/reports` and `/admin/users`.

## Finance and reporting follow-up — 2026-10-18

Added permission-scoped filtered trends, cursor-paged balances and filtered multi-batch CSV downloads with explicit continuation. Cancelled orders are excluded from open-order counts. See [reporting and exports](../operations/reporting-exports.md).

Current reconciliation exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are provisional and independent of selected period dates. See [finance-reconciliation.md](../operations/finance-reconciliation.md) and [test evidence](../testing/evidence.md). Hosted cron scheduler and external SMS/email gateways remain deferred to production deployment.

