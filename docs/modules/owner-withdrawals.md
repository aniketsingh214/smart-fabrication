> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Owner Withdrawals

## Source specification

- **Functional scope:** Date, amount, reason, mode, note, owner; separate from operating expenses.
- **Rules / acceptance:** Show in cash/equity view, never subtract again in operating profit.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Withdrawal model: `owner_withdrawals` table tracking `amount_minor`, `withdrawal_date`, `mode`, `reason`, `owner_id`.
- Accounting separation: Owner withdrawals represent equity distributions and are strictly excluded from operating expenses and operating profit calculations.
- Cash & equity flow: Reflected in net cash flow statements and owner balance sheets without distorting project job-costing.
- Role boundaries: Strictly restricted to `owner` and `accounts` roles with full immutable audit history.

## Verification record — 2026-10-18

Verified in Phase 17 Finance acceptance (`npm run test:finance`, artifact: `test-results/finance-browser-latest.json`):
1. Owner withdrawal creation with date, mode, and reason verified.
2. Verified that owner withdrawals do NOT appear in `/admin/expenses` or operating expense sums.
3. Financial summary checks confirm operating profit remains independent of owner equity withdrawals.
4. RLS policies verified to prevent non-owner roles from accessing or modifying withdrawal records.
