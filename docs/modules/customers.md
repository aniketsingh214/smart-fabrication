> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Customers

## Source specification

- **Functional scope:** Contact info, multiple addresses, enquiry/quotation/order histories, totals, notes, attachments.
- **Rules / acceptance:** Guest leads may exist without auth account; later link identity safely.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.
