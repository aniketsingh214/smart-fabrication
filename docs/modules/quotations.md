> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Quotations

## Current workflow — 2026-10-15

Open a quotation in `/admin/quotations` to read all price snapshots. Draft price versions support item removal/addition, fractional quantity, INR unit rates, discount and tax. Every saved version remains immutable. Client/PDF line rounding matches PostgreSQL decimal rounding, including 1.005 × 100 minor units = 101.

An actor with both `quotations.write` and `quotations.approve` can revise an approved/rejected/expired quote with a future expiry and customer-visible summary. `POST /api/v1/quotations/{id}/revise` requires a UUID `Idempotency-Key`; it atomically supersedes the source and creates a distinct draft with a copied price snapshot. Retry with the same actor/payload/key returns that draft. Conflicting reuse fails. Accepted quotes cannot be revised and superseded quotes cannot be accepted. A revision needs separate approval.

Copy customer link produces an authenticated `/account#quotation-{id}` link; it does not grant anonymous quotation access or send an external message. Staff must link a verified customer account first. The PDF shows subtotal, discount, tax and total; it remains a quotation, not a tax invoice. Latest-version PDF export exists; individually selecting a historical PDF is still pending.

See [verification evidence](../testing/evidence.md) for real SQL, browser simulations and rendering checks. Workshop-specific legal/commercial terms and full real customer PDF/download acceptance remain open.

## Source specification

- **Functional scope:** Lead conversion, versioned line items for material/labour/finish/hardware/transport/installation/other/discount/tax, PDF, send link, accepted/rejected/expired.
- **Rules / acceptance:** Quote snapshot, expiry, revision, authorized approval, idempotent convert-to-order.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.
