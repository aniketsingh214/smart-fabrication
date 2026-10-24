> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Profit & Loss

## Source specification

- **Functional scope:** Revenue, consumed material cost, labour, overhead, gross/net operating profit, separate withdrawals, period/product/job filters.
- **Rules / acceptance:** Avoid purchase-vs-consumption double counting; account for stock and accrual/cash differences.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Revenue recognition: Confirmed and delivered customer order values with accurate GST separation.
- Cost of Goods Sold (COGS): Derived from actual consumed material batches from inventory movements and staged work order labour entries, preventing purchase vs consumption double counting.
- Overhead calculation: Aggregates approved business expenses (utilities, consumables, maintenance, rent).
- Gross & net profit: Gross profit = Revenue - COGS; Net operating profit = Gross profit - Overheads. Owner withdrawals are shown separately on equity summaries.
- Period closures: `period_closures` table locks closed accounting intervals, strictly rejecting backdated transactions or reversals via database triggers.

## Verification record — 2026-10-18

Verified in Phase 17 & 18 acceptance (`npm run test:finance`, `npm run test:reporting-audit`):
1. Revenue and expense ledger calculation reconciliation verified.
2. Direct material consumption costing separate from raw purchases verified.
3. Operating profit calculation excluding owner withdrawals verified.
4. Period closure enforcement and backdate mutation rejection verified.
5. Filtered trend reporting and CSV financial exports verified.

