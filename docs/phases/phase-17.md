> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 17 â€” Expenses, Withdrawals, Finance & P&L

- **Objective / tasks:** Expense categories, owner withdrawals, customer receipts, supplier payable, financial entries, profit calculations and reports.
- **Deliverables:** finance APIs, finance-policy.md, reconciliation examples/tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-17.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** No double counting; withdrawals excluded from operating expense. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Receipts/payments/expenses/withdrawals, balance RPCs and provisional period reporting exist.

### Remaining acceptance

Approved-expense reversal and net period reporting are implemented. Payment/labour/withdrawal/earning reversals, recorded supplier refunds, full pre-production customer refunds and reviewed closed periods are implemented. Remaining: accountant approval, WIP/opening inventory/tax/depreciation and post-production commercial refund policy.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

