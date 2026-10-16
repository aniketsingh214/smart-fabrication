> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Leads

## Source specification

- **Functional scope:** Name, mobile/WhatsApp, email, city/area/address, product, dimensions, material, requirement, uploaded design, source Google/Instagram/Facebook/WhatsApp/direct/referral/other; status, notes, assigned staff, call/WhatsApp, conversion.
- **Rules / acceptance:** Anti-spam, duplicate matching rules, source attribution, follow-up reminders, activity history.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.
