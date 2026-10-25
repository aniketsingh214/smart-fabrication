> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Dashboard

## Source specification

- **Functional scope:** KPI cards: total/new leads, follow-ups, quotations, orders, work orders, completed, revenue, purchases, expenses, labour, business profit, owner withdrawals; charts by date/source/product; recent leads and quick actions.
- **Rules / acceptance:** KPI definition dictionary, date filters, permission-scoped totals, drilldowns, loading/empty/error states.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Current operational dashboard: `/api/v1/dashboard` provides permission/RLS-scoped daily tasks, counts, order stages and recent activity. `/admin` has daily-work and business-overview tabs; finance remains on finance/report pages. [Definitions and acceptance](../operations/daily-work-dashboard.md).
- Role-based views: Role grants filter cards automatically (e.g. sales role sees leads/quotes; production sees work orders; accounts sees financial figures).
- Trend charts: Time-series analytics with customizable date range filters (7d, 30d, 90d, 1y).
- Performance & security: one SECURITY INVOKER SQL response supplies scoped aggregations and a ten-row task page; denied metrics are null. No privileged database client or persistent aggregate cache is used for this dashboard.

## Verification record — 2026-10-18

Verified in Phase 18 Dashboards, Reports & Audit acceptance (`npm run test:reporting-audit`, artifact: `test-results/reporting-audit-browser-latest.json`):
1. KPI card aggregation and financial reconciliation verified.
2. Keyset pagination on customer receivables, supplier payables, and worker ledger balances verified.
3. Streamed CSV report export generation with continuation verified.
4. Responsive desktop and mobile layout on `/admin` dashboard verified.
