> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: implemented; verified locally

# Orders

## Source specification

- **Functional scope:** Customer, product, final dimensions/material, final price, advance/balance, delivery estimate, notes, status history.
- **Rules / acceptance:** Approved quote linkage, amount reconciliation, cancellation/refund policy.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract & verified behaviors

- **Quotation linkage & price immutability:** Accepted quotations convert to orders (`convert_quotation`), preserving the immutable version snapshot total, lead dimensions, and customer relationship. Conversion is idempotent.
- **Status state machine:** Sequential order transitions: `CONFIRMED -> ADVANCE_RECEIVED -> MEASUREMENT_CONFIRMED -> PRODUCTION_PENDING -> PRODUCTION_STARTED -> FABRICATION_COMPLETED -> FINISHING -> READY -> OUT_FOR_DELIVERY -> INSTALLATION -> COMPLETED`.
- **Advance receipt guard:** Advance transition strictly requires recorded customer receipt in `customer_payments`.
- **Measurement confirmation guard:** Measurement transition strictly requires on-site verified dimensions in `measurements` linked to the quotation's lead.
- **Concurrency protection:** Order version increments on each transition; optimistic concurrency rejects stale versions (`Record changed; refresh and retry`).
- **Cancellation & pre-production refunds:** Cancellation requires `orders.approve` permission and is restricted to pre-production stages (`CONFIRMED`, `ADVANCE_RECEIVED`, `MEASUREMENT_CONFIRMED`, `PRODUCTION_PENDING`). Orders with recorded receipts require a reviewed customer refund (`post_financial_adjustment` with `kind: 'customer_refund'`), which atomically issues the manual repayment and cancels the order.
- **Anti-IDOR customer isolation:** Customers track their owned orders on `/account` and view milestones on `/account/orders/[id]`. Direct API (`/api/v1/orders/[id]`) and timeline (`/api/v1/orders/[id]/timeline`) enforce customer ownership; stranger accounts receive 404/empty lists, and unauthenticated requests are denied with 401. Customer timeline DTOs exclude private internal staff notes.
- **Live verification evidence:** 5/5 real browser and API checks passed (`test-results/orders-browser-latest.json`). See [Phase 12](../phases/phase-12.md) and [test evidence](../testing/evidence.md).


## Order stage dropdown - 2026-10-31

Order details now show every configured order stage in one dropdown, with the current stage selected and only the next sequential stage enabled. Terminal/unknown stages have no enabled transition. The existing versioned transition API and payment/measurement/workshop guards remain unchanged. Due at is the optional order target completion/deadline timestamp, distinct from outstanding payment (balance due); an em dash means no target date is recorded. This UI change does not set or auto-advance deadlines/stages.

## Balance and final customer payments - 2026-10-31

Order Payments & Receipts distinguishes the first advance from later Record Balance Payment receipts. Completed orders with outstanding balances retain the collection form; partial installments and Full Balance are supported, with exact paise and an outstanding-balance maximum. Fully paid/cancelled orders do not offer collection. Requires both order/finance write permissions in the UI. Backend post_payment retains database permissions, order lock, cancellation and overpayment guards; completed-order receipts do not change the work stage. First payment on a CONFIRMED order retains its existing advance transition.

The browser reuses an Idempotency-Key for retries of the same mounted payment attempt; the route passes it to the existing posting RPC (legacy clients without a header retain prior behavior). Summary/PDF use the permission-filtered order receivable balance after reviewed corrections rather than a raw receipt sum. PDF wording covers advance, partial and final customer receipts. API/mobile OpenAPI and types document the existing summary/post/receipt routes. No migration, real payment gateway activation or real money posting was performed. Cross-reload recovery is outside this change; receipt history remains available for reconciliation.

## Payment processing feedback - 2026-11-03

Save confirmation no longer waits behind the balance refresh. After POST success, the form closes and shows Payment saved / Updating balance separately. Collection stays unavailable while refreshing; a failed balance read offers Refresh payment balance instead of allowing another payment against stale totals. Payment-summary order/receipt/net-balance reads run concurrently under existing permissions. Retry keys, posting locks and overpayment guards remain intact. No fixed latency improvement is claimed; provider/network cold-start time may still vary. Browser regression includes an artificial 1.5-second summary delay to verify the saved and refreshing states separately.
