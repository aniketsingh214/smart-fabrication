> Version: 1.0 | Owner: project team | Updated: 2026-10-24 | Status: verified (local); engineering complete

# Product–Material Mapping

## Source specification

- **Functional scope:** Per-product BOM/configuration of materials and quantities, formula inputs, customer-visible flags.
- **Rules / acceptance:** Version BOM, validate units and dependencies, preview changes before publish.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- BOM structure: `bom_versions` and `bom_items` tables mapping products to materials with quantity formulas, unit mappings, and `is_customer_visible` flags.
- Lifecycle: Draft BOMs must be reviewed and published before calculation engines can reference them.
- Rate snapshot immutability: Quotations and estimates capture immutable rate snapshots from the active BOM at creation time.
- Confidentiality: Internal costing and component markup are redacted for unauthorized staff roles and public visitors.

## Verification record — 2026-10-18

Verified in Phase 08 Materials & BOM browser acceptance (`npm run test:materials-bom`, artifact: `test-results/materials-bom-browser-latest.json`):
1. BOM draft-before-publish lifecycle verified.
2. Confidential component redaction in public estimate responses verified.
3. Immutability of rate snapshots across BOM updates verified.
4. Unit dependency validation and margin caps verified.