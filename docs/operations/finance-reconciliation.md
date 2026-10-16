# Current finance reconciliation

Local implementation, 2026-10-15. `/admin/reports` and `GET /api/v1/finance/reconciliation` expose the same current operational snapshot. It is independent of the reporting page's selected date interval and does not post accounting entries.

`finance.read` is required. Missing section permissions return null, never a fabricated zero. Inventory requires inventory read; job costs require inventory, production, orders and workers read; purchase tax requires purchases read. Customer access is denied. The vetted database function checks these grants before reading underlying ledgers.

## Inventory and job costs

Inventory value sums exact signed stock book values, falling back to the original rounded quantity × unit cost for legacy movements. Counts expose negative quantity/value pools and legacy movement coverage for review. Values do not invent an opening inventory balance or depreciation policy.

Job costs combine consumed material with worker earnings after work-entry reversals, classified by the order's current state: open, completed, cancelled or unallocated. Buckets reconcile to the complete recorded cost ledger. Open-job costs are evidence for WIP review; the report does not capitalize them, change recognized profit or assume a WIP method. Later order-state changes move costs between current buckets; this is not a historical as-of report.

## Purchase tax snapshots

Received invoice-line tax is shown separately from estimated tax on returned quantities. Return tax uses cumulative quantity against the frozen original line, rounded once. Net tax splits by the staff-selected recoverable flag. Legacy lines without a frozen tax snapshot are counted and excluded from invented amounts. Actual supplier credit-note rounding, eligibility, filings and final accountant reconciliation remain external acceptance requirements.

Amounts in this endpoint are exact integer **minor-unit strings**, including zero and negative adjustments, unlike older resource fields that return JSON numbers. Native clients should preserve them as strings/BigInt. UI formatting preserves paise beyond JavaScript's safe-integer range. The response marks `official_accounts:false` and includes its current timestamp.

Verification: 162 live rollback-only database checks passed, including stock/ledger reconciliation, bucket totals, tax splits, customer denial and finance-only role null scopes. Unit tests cover large/negative amount formatting and prevent an official-accounting claim. Browser/build evidence is recorded in [test evidence](../testing/evidence.md).
