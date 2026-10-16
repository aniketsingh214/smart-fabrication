> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Dashboard

## Source specification

- **Functional scope:** KPI cards: total/new leads, follow-ups, quotations, orders, work orders, completed, revenue, purchases, expenses, labour, business profit, owner withdrawals; charts by date/source/product; recent leads and quick actions.
- **Rules / acceptance:** KPI definition dictionary, date filters, permission-scoped totals, drilldowns, loading/empty/error states.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.


## Finance and reporting follow-up — 2026-10-15

Added permission-scoped filtered trends, cursor-paged balances and filtered multi-batch CSV downloads with explicit continuation. Cancelled orders are excluded from open-order counts. See [reporting and exports](../operations/reporting-exports.md). Load, reminder-runtime and complete role acceptance remain open.
