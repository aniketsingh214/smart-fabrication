> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 14 — Inventory & Stock Control

- **Objective / tasks:** Stock movement ledger, reservations, consumption, adjustments, alerts, concurrent operations.
- **Deliverables:** inventory APIs, RPC, reconciliation tests/docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-14.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** No silent negative/double stock; audit and concurrency pass. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Signed movement ledger, balances, reservation RPCs, partial-consumption/costing, reload recovery, and mobile/desktop inventory UI exist and are fully verified.

### Remaining acceptance

Physical quarterly warehouse stock-counts and barcode hardware scanner integrations remain future workshop floor operational enhancements.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md).

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

### Inventory browser retry remediation

StockForm previously generated a fresh key on every click. It now keeps one frozen key/body for an unconfirmed command, prevents overlapping submits, locks uncertain details, preserves failed-form values and parses unit cost as exact paise. Five focused regression scenarios pass. Existing database concurrency/actor/valuation logic is retained.

### Reload recovery continuation — 2026-10-16

Pending inventory commands now persist before dispatch in account-scoped tab storage and restore after reload/navigation. Storage failure/corruption fails closed; uncertain outcomes retain the exact key/body. Eight stock regression tests pass; earlier six desktop/mobile reliability checks include real login/reads plus intercepted writes and reload/retry.

## Work-order choice continuation — 2026-10-16

The inventory page reads a stable 100-row work-order window plus lookahead and exposes further choices through the existing authorized paginated API. Concurrent choice loads are suppressed, duplicates are removed and failures remain retryable.

## Verified acceptance — 2026-10-18

Executed `npm run test:inventory` (`scripts/test-inventory-browser.mjs`, artifact `test-results/inventory-browser-latest.json`):
1. **Ledger reconciliation & balances:** Positive stock adjustment recorded via `POST /api/v1/inventory/adjustments`; `/api/v1/inventory/balances` reconciles exact on-hand, reserved, and available quantities.
2. **Idempotency & conflict rejection:** Retrying identical stock adjustment with identical key returns exact same movement ID without duplicate ledger entries; conflicting payload with same key is rejected.
3. **Negative stock & reservation bounds:** Negative movements exceeding on-hand stock are rejected atomically; reservations reduce available quantity while preserving on-hand stock; adjustments cannot take reserved stock.
4. **Server-derived consumption valuation:** Job consumption movements derive unit cost authoritatively from ledger book values, ignoring spoofed client-provided costs.
5. **Reservation release & idempotency:** Releasing unused reservation restores available stock to on-hand without ledger discrepancy; idempotent re-release succeeds cleanly.
6. **Admin mobile UI inspection:** Owner logs in on mobile (`iPhone 13`), accesses `/admin/inventory`, and verifies responsive table columns (Material, Unit, On hand, Reserved, Available, Stock level badge) and operational movement form.

Phase 14 verification gate is complete for local development (`done (local)`).
