> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Business Expenses

## Source specification

- **Functional scope:** Electricity, rent, transport, repair, electrodes, gas, paint, tools, maintenance, phone/internet, packing, other; amount/date/category/mode/attachment.
- **Rules / acceptance:** Expense approval, cost-center/order attribution, prevent duplicate bills.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Expense model: `expenses` table with `name`, `category`, `amount_minor`, `expense_date`, `mode`, `reference`, `status` (`draft`, `approved`, `reversed`).
- Approval workflow: Draft expenses must be reviewed and approved by `owner` or `accounts` roles before impacting ledger totals.
- Reversal lifecycle: Approved expenses can be reversed once with an immutable reason and reversal date via `POST /api/v1/admin/expense-reversals` using `Idempotency-Key`.
- Period boundary guards: Expenses cannot be added to or reversed in closed financial periods.

## Verification record — 2026-10-18

Verified in Phase 17 Finance acceptance (`npm run test:finance`, artifact: `test-results/finance-browser-latest.json`):
1. Draft expense creation and validation verified.
2. Approval transition (`draft` -> `approved`) verified.
3. Full immutable reversal with audit trail and duplicate reversal rejection verified.
4. Closed period lock prevention for expense postings and reversals verified.
