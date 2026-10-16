> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Products

## Current implementation update — 2026-10-15

Variants/options have staff management screens and published-only public display. Private preview requires catalog read permission; idempotent duplication creates a separate draft and copies unarchived choices as drafts. BOM/rule configuration is deliberately reviewed separately. See [workflow guide](../operations/catalog-procurement-corrections.md) for exact behavior and catalog follow-up work. This is not full Phase 07 acceptance.

## Source specification

- **Functional scope:** SKU, name, slug, category/subcategory, description, images/video, size, material, finish, colour, weight, price range, custom-size/design, installation/delivery options; draft/preview/publish, duplicate, soft delete.
- **Rules / acceptance:** Uniqueness and SEO validation, Cloudinary assets, publication workflow, public API filtering.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.



## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.
