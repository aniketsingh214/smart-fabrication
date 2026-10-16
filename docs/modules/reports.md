> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Reports

## Source specification

- **Functional scope:** Lead/source/product, sales, purchases, supplier outstanding, labour, expenses, stock, P&L; filters and CSV/PDF exports.
- **Rules / acceptance:** Permission-aware exports, metric definitions, large report pagination.
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

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

