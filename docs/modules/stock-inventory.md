> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Stock/Inventory

## Source specification

- **Functional scope:** IN/OUT/adjustment, on-hand, reserved, available, reorder threshold, low stock, work-order consumption.
- **Rules / acceptance:** Signed movement ledger, nonnegative constraints or approved override, reconciliation and concurrency tests.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.

## Current implementation contract — browser posting retries

POST /api/v1/inventory/adjustments validates a stock payload and Idempotency-Key, enforces production.write for consumption or inventory.approve for reviewed adjustments/returns, then calls post_stock under the user session. Existing database ledger/locking/costing/actor guards remain unchanged.

The inventory form now retains exact JSON bytes and one key while a result is unknown; locks details until that command is confirmed/rejected; blocks simultaneous submissions; and preserves fields on request failure. Known server rejections permit editing. Unit cost text is converted to integer paise without floating-point multiplication. The regression simulates a server commit followed by a lost response and verifies only one distinct command key.

The pending command lasts only while the form stays mounted. Reload/navigation/cross-tab recovery is not implemented: staff must retry here or check the ledger before recreating elsewhere. This limitation remains a phase acceptance item. Broader production load and reconciliation/workshop acceptance remain pending; prior bounded database concurrency checks are separate evidence.

Sources: [posting command](../../src/features/inventory/posting.ts), [form](../../src/features/inventory/stock-form.tsx), [focused tests](../../tests/unit/stock-posting.test.ts), [execution audit](../operations/completion-audit.md).

### Inventory recovery update — 2026-10-16

The mounted-form-only limitation above is historical. Pending commands now persist before dispatch in account-scoped sessionStorage and restore after same-tab reload/navigation. Storage failure prevents unrecorded dispatch; malformed saved requests fail closed until explicit ledger-review/reset. A successful response followed by failed local clearing retains the original key for retry. Cross-device and separate fresh commands are not deduplicated by business intent; verify the ledger before recreating an uncertain movement elsewhere. Eight focused stock tests cover posting, exact paise and storage/recovery failures. Earlier six desktop/mobile browser checks passed with a real account and intercepted writes, including reload/same-key replay. Broader stress/workshop acceptance remains pending.
