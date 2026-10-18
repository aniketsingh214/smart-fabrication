> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: done (local)

# Phase 12 — Orders & Customer Tracking

- **Objective / tasks:** Order conversion, advance/balance, status timeline, customer order page, notifications.
- **Deliverables:** order APIs, migrations, UI, status transition docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-12.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Order totals reconcile and unauthorized users blocked. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-17. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented & Verified

Accepted-quote conversion, guarded order transitions, advance receipts, owned customer timeline, cross-account isolation, and atomic pre-production cancellation refunds verified locally.

Executed `npm run test:orders-browser` (`scripts/test-orders-browser.mjs`) against live server and development Supabase with 5/5 passing checks:
1. **Quotation conversion & initial state:** Accepted quotation converted idempotently (`POST /api/v1/admin/quotations/[id]/convert`), preserving exact line/tax snapshot total (`₹35,400.00`, 3540000 minor) and initial `order_status_history` milestone (`CONFIRMED`).
2. **Customer tracking & cross-account isolation (Anti-IDOR):** Linked customer logs in on mobile browser (`iPhone 13`), tracks order card on `/account` under "Your orders", navigates to `/account/orders/[id]`, and views milestone timeline. Stranger customer cannot view the order card, receives HTTP 404 navigating to `/account/orders/[id]`, receives 404 from `/api/v1/orders/[id]`, and receives an empty timeline (`[]`). Anonymous API request is rejected with HTTP 401. Customer timeline API excludes private internal staff notes.
3. **Advance payment & reconciled advance milestone:** Transition to `ADVANCE_RECEIVED` fails before payment with HTTP 409 (`Record advance receipt first`) in both API and admin UI. Staff records advance receipt (`POST /api/v1/admin/customer-payments`) with unique idempotency key; conflicting retry is rejected with 409. Transition to `ADVANCE_RECEIVED` succeeds in admin operations UI; customer mobile browser timeline displays the new milestone upon reload.
4. **Guarded site measurement & concurrency protection:** Transition to `MEASUREMENT_CONFIRMED` fails without verified on-site dimensions (`Verified measurements required`). Staff records verified measurements on the linked lead (`POST /api/v1/admin/measurements`). Stale version transition is rejected with concurrency conflict (`Record changed; refresh and retry`). Correct version transition succeeds, and order advances to `PRODUCTION_PENDING`. Customer timeline reflects all milestones.
5. **Pre-production refund & atomic order cancellation:** Direct order cancellation is blocked while receipts exist (`Recorded receipts require reviewed refund before cancellation`). Staff posts reviewed customer refund (`POST /api/v1/finance/adjustments` with `kind: 'customer_refund'`), which derives the net customer balance, records verified manual repayment, and atomically transitions the order to `CANCELLED` at version 5. Customer timeline shows `CANCELLED` milestone. Direct cancellation of an unpaid order with zero receipts succeeds immediately.

### Evidence and dependencies

Evidence saved to `test-results/orders-browser-latest.json`. All synthetic orders retained in cancelled state; generated test auth accounts retired via `retirePublicationFixture`. Typecheck, lint, 141 tests across 40 files, OpenAPI and secret checks passed cleanly. See [progress](../progress.md), [test evidence](../testing/evidence.md), and [master plan](../MASTER_PLAN.md).

### Change safety

All schemas are additive. Test fixtures cleanly roll back or cancel unpaid/refunded test orders. No real payment gateway, remote deployment or destructive migrations.

