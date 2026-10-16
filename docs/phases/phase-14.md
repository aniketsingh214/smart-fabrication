> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 14 â€” Inventory & Stock Control

- **Objective / tasks:** Stock movement ledger, reservations, consumption, adjustments, alerts, concurrent operations.
- **Deliverables:** inventory APIs, RPC, reconciliation tests/docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-14.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** No silent negative/double stock; audit and concurrency pass. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Signed movement ledger, balances, reservation RPCs and partial-consumption/costing forward fixes exist.

### Remaining acceptance

Partial consumption, server-derived costing, reservation release/retry and purchase returns passed SQL tests. Multi-session concurrency and broader reconciliation scenarios remain.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

### Inventory browser retry remediation

StockForm previously generated a fresh key on every click. It now keeps one frozen key/body for an unconfirmed command, prevents overlapping submits, locks uncertain details, preserves failed-form values and parses unit cost as exact paise. Five focused regression scenarios pass. Existing database concurrency/actor/valuation logic is retained. Pending state is currently mounted-form memory; navigation-safe recovery and broader workshop acceptance remain open. See [completion audit](../operations/completion-audit.md). Phase 14 remains in progress.

### Reload recovery continuation — 2026-10-16

Pending inventory commands now persist before dispatch in account-scoped tab storage and restore after reload/navigation. Storage failure/corruption fails closed; uncertain outcomes retain the exact key/body. Eight stock regression tests pass; earlier six desktop/mobile reliability checks include real login/reads plus intercepted writes and reload/retry. See the updated completion audit for boundaries. Database valuation/ledger rules and migration history are unchanged.
