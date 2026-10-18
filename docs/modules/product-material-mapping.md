> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Productâ€“Material Mapping

## Source specification

- **Functional scope:** Per-product BOM/configuration of materials and quantities, formula inputs, customer-visible flags.
- **Rules / acceptance:** Version BOM, validate units and dependencies, preview changes before publish.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.

## Step 2 implementation — 2026-10-17

Current fields, canonical units, area-BOM arithmetic, effective-rate history, non-persisted draft preview, protected issued history and customer-visible component flags are specified in [calculation configuration](../operations/calculation-configuration.md). New estimates retain exact material/rate UUIDs and effective timestamps; old snapshots/quotations/stock are not repriced. Missing/inactive components or incompatible service charges reject the whole estimate. Native 46-migration rehearsal passes 227 workflow/RLS checks and 15 committed concurrency assertions. Actual workshop data and reviewed examples have not been supplied; source-scope business acceptance remains open.