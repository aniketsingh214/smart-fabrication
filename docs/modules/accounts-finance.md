> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: implemented; local acceptance verified

# Accounts/Finance

## Source specification

- **Functional scope:** Sales, customer receipts, purchases, supplier payments, labour payments, operating expenses, receivables, payables, cash/bank future.
- **Rules / acceptance:** Document accounting assumptions, immutable entries, corrections via reversals, reconcile totals.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract & verified acceptance

- Verified automated acceptance suite: `npm run test:finance` (`scripts/test-finance-browser.mjs`).
- Artifact: `test-results/finance-browser-latest.json` (6/6 checks passing).
- Operating expenses: Draft entry -> approval -> immutable reversal (`expense_reversals`), preventing double-reversal.
- Owner withdrawals: Tracked under `owner_withdrawals_minor` without inflating operating expenses (`approved_expenses_minor`).
- Supplier payables & material returns: Rate, discount, and tax calculations, full payment, partial return generating credit, and reviewed cash refund settlement reconciling `payable_balances()` to zero.
- Customer receivables & reversals: Order receipts reduce outstanding balance; `customer_payment_reversal` cleanly restores receivables.
- Period closures: Prevent unconfirmed closures and reject backdated financial adjustments.
- Mobile UI: Verified responsive views for `/admin/expenses`, `/admin/owner-withdrawals`, and `/admin/financial-adjustments`.

## Finance and reporting follow-up — 2026-10-18

Implemented immutable source-linked corrections and actor-aware retries, supplier credit/refund caps, full pre-production customer refunds with atomic cancellation, active-work/reservation guards and reviewed past-period closure. Refunds record verified manual cash movement; no bank transfer occurs. See [refund and period policy](../operations/refunds-periods.md).

Current reconciliation exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Reports are provisional and independent of selected period dates. See [finance-reconciliation.md](../operations/finance-reconciliation.md) and [test evidence](../testing/evidence.md). Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending for live deployment.

