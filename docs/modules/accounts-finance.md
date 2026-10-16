> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Accounts/Finance

## Source specification

- **Functional scope:** Sales, customer receipts, purchases, supplier payments, labour payments, operating expenses, receivables, payables, cash/bank future.
- **Rules / acceptance:** Document accounting assumptions, immutable entries, corrections via reversals, reconcile totals.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.


## Finance and reporting follow-up — 2026-10-15

Implemented immutable source-linked corrections and actor-aware retries, supplier credit/refund caps, full pre-production customer refunds with atomic cancellation, active-work/reservation guards and reviewed past-period closure. Refunds record verified manual cash movement; no bank transfer occurs. See [refund and period policy](../operations/refunds-periods.md). Official P&L, post-production commercial refunds and accountant acceptance remain open.

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

