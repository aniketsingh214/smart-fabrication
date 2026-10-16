> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Business Expenses

## Current implementation update — 2026-10-15

Finance approvers can record one full immutable reversal for an approved expense, with reason, India business date and retry protection. The amount is derived from the source; period reporting subtracts reversals in the correction period. This does not post a cash refund or complete other financial reversal policies. See [workflow guide](../operations/catalog-procurement-corrections.md).

## Source specification

- **Functional scope:** Electricity, rent, transport, repair, electrodes, gas, paint, tools, maintenance, phone/internet, packing, other; amount/date/category/mode/attachment.
- **Rules / acceptance:** Expense approval, cost-center/order attribution, prevent duplicate bills.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.
