> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: verified (local); workshop photos pending

# Gallery

## Source specification

- **Functional scope:** Product/workshop/installation/completed project photos/videos, categories, reorder, featured, alt text.
- **Rules / acceptance:** Cloudinary cleanup policy, consent for customer site photos.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.

## Public browse continuation — 2026-10-16

Catalog and consented gallery lists now use deterministic created_at/id ordering with a 48-row page and one-row lookahead. Continuation links preserve catalog search/category filters; first-page links clear only the cursor. Invalid cursors are rejected before database access and offer a reset. Draft/consent guards and media projection are unchanged. Two pagination boundary tests and three server-render integration tests cover timestamp precision, UUID tie ordering, filter continuation, consent scope and invalid cursors. The complete public desktop/mobile suite passed 28 checks. No API schema or database migration changed.
