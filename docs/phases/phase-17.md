> Version: 0.1 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 17 — Expenses, Withdrawals, Finance & P&L

- **Objective / tasks:** Expense categories, owner withdrawals, customer receipts, supplier payable, financial entries, profit calculations and reports.
- **Deliverables:** finance APIs, finance-policy.md, reconciliation examples/tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-17.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** No double counting; withdrawals excluded from operating expense. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** Sequential local implementation authorized by user.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases without waiting for phase gates. All 6 acceptance checks verified via `npm run test:finance` (`scripts/test-finance-browser.mjs`):
1. **Operating expenses lifecycle:** Draft expense creation, approval, and full reversal entry (`expense_reversals`) preserving immutable audit trail and preventing double reversals.
2. **Owner withdrawals exclusion:** Owner drawings correctly tracked separately under `owner_withdrawals_minor` in `finance_summary` / `/reports/profit-loss` without inflating operating expenses (`approved_expenses_minor`).
3. **Supplier payables & returns:** Tax, discount, and line item calculations, full bill payment, partial material return generating supplier credit, and reviewed cash refund settlement reconciling `payable_balances()` to zero.
4. **Customer receivables & payment reversals:** Advance/progress payment crediting order balance, and idempotent payment reversal (`customer_payment_reversal`) restoring receivable balance in `receivable_balances()`.
5. **Period closure enforcement:** Finance period closure (`/finance/periods/close`) prevents unconfirmed closures, rejects backdated adjustments dated on or before `closed_through`, and supports idempotent retries.
6. **Mobile viewport UI:** Admin views `/admin/expenses`, `/admin/owner-withdrawals`, and `/admin/financial-adjustments` load and render cleanly in mobile viewport.

Artifact registered: `test-results/finance-browser-latest.json`.

### Implemented

Receipts, supplier payments, draft/approved expenses, immutable expense reversals, owner withdrawals, balance RPCs (`payable_balances`, `receivable_balances`), financial corrections, and provisional completed-order reporting periods.

### Remaining acceptance

Provisional completed-order accrual policy is documented. Accountant review of WIP, opening inventory, capitalization/depreciation, and formal tax policy remain deferred to production operations as noted in [finance-reconciliation.md](../operations/finance-reconciliation.md).

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), [accounts-finance](../modules/accounts-finance.md) and [master plan](../MASTER_PLAN.md).

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

