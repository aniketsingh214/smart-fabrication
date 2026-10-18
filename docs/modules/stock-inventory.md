> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: verified (local)

# Stock/Inventory

## Source specification

- **Functional scope:** IN/OUT/adjustment, on-hand, reserved, available, reorder threshold, low stock, work-order consumption.
- **Rules / acceptance:** Signed movement ledger, nonnegative constraints or approved override, reconciliation and concurrency tests.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Movements: `stock_movements` immutable ledger with `material_id`, signed `quantity`, `kind` ('adjustment', 'consumption', 'return'), `unit_cost_minor`, `book_value_minor`, `work_order_id`, and `idempotency_key`.
- Balances: `inventory_balances()` SQL function derives `on_hand`, `reserved`, and `available` dynamically from ledger movements and active reservations.
- Reservations: `reserve_stock` RPC and `/api/v1/stock-reservations` resource allow reserving materials for active fabrication jobs; reservations reduce available quantity without mutating on-hand stock.
- Consumption costing: Job consumption derives unit cost authoritatively from ledger book values, ignoring client inputs.
- Unused release: `release_reservation` RPC and `/api/v1/stock-reservations/[id]/release` action cleanly release unconsumed materials back to available inventory.
- UI & recovery: Account-scoped reload recovery in sessionStorage; responsive dashboard on `/admin/inventory`.

## Verification record — 2026-10-18

Verified in Phase 14 acceptance (`npm run test:inventory`, artifact: `test-results/inventory-browser-latest.json`):
1. Ledger reconciliation & balances: On-hand, reserved, and available quantities reconcile to signed movements.
2. Idempotency & conflict rejection: Exact key retry returns existing movement; conflicting payload rejected.
3. Negative stock prevention & reservation bounds: Nonnegative constraint enforced; reserved stock protected.
4. Server-derived valuation: Work order consumption derives cost from ledger book values.
5. Reservation release: Unconsumed reservations restored to available stock idempotently.
6. Mobile UI: Admin dashboard renders responsive inventory balances and operational stock form.
