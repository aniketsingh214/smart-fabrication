> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: verified (local); workshop formula approval pending

# Calculation Engine

## Source specification

- **Functional scope:** Width/height, optional depth, thickness, design, wastage, hardware, labour, finish, delivery, installation, margin; output material quantity, weight, estimated range.
- **Rules / acceptance:** All values approximate, server authoritative, versioned formulas, boundary/unit tests, final quote only after measurement.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.

## Estimator selector continuation — 2026-10-17

The public estimator now reuses the controlled reference selector with the public products API, preserving a linked/saved selection while pages load and offering More design options after the first 100 products. Initial products use stable created_at/id order. Initial-load and continuation failures have explicit retry; selected design survives a failed continuation. Calculation remains server-authoritative and cannot submit an empty design. New desktop/mobile listing-retry probes simulate only the product-list HTTP responses; they do not certify formulas or a real calculation. Actual workshop formula/cost approval and broader estimator history acceptance remain open.
## Step 2 implementation — 2026-10-17

Current fields, canonical units, area-BOM arithmetic, effective-rate history, non-persisted draft preview, protected issued history and customer-visible component flags are specified in [calculation configuration](../operations/calculation-configuration.md). New estimates retain exact material/rate UUIDs and effective timestamps; old snapshots/quotations/stock are not repriced. Missing/inactive components or incompatible service charges reject the whole estimate. Native 46-migration rehearsal passes 227 workflow/RLS checks and 15 committed concurrency assertions. Actual workshop data and reviewed examples have not been supplied; source-scope business acceptance remains open.