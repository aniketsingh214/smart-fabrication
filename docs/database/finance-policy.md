> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: provisional reporting implemented; accounting approval pending

# Finance policy

Owner withdrawals separate from operating expenses. Distinguish cash flow, revenue recognition and consumed inventory costs. Integer minor units or PostgreSQL numeric; never floating point money. GST, recognition method and accountant approval pending; no exact-profit claim.

Approved-expense corrections use immutable full reversal records. Period expense totals equal approved expenses dated in the period minus reversals dated in the period, using India business dates. Payment/earning/drawing corrections, paid supplier returns with separate verified refunds, guarded full pre-production customer cancellation refunds and reviewed past-period closures are now implemented. They preserve source records and apply corrections in the posting period; they do not activate bank transfers. See [financial workflow rules](../operations/refunds-periods.md).

Purchase lines snapshot rounded subtotal less discount, then tax. Staff explicitly selects recoverable tax; otherwise tax is capitalized into inventory. Eligibility is not inferred by software. Exact stock book values avoid per-unit rounding drift; legacy movements use their original cost values. Commercial return credits use immutable invoice snapshots while stock return cost follows the weighted pool. Final variance/tax/WIP/depreciation treatment requires accountant approval. Partial customer commercial refunds, post-production/service refunds and reopening closed periods remain outside the implemented flow.

Current reconciliation now exposes exact stock book values, operational job-cost buckets for WIP review and tax snapshots after estimated returns. Missing domain scope is null; reports are explicitly provisional and independent of selected period dates. See ../operations/finance-reconciliation.md and ../testing/evidence.md for boundaries and checks. Accountant-approved opening balances, capitalization/depreciation and final tax policy remain pending.

