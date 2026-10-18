> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: verified (local)

# Material Rates

## Source specification

- **Functional scope:** Purchase and selling rates, currency, unit, effective dates, previous/new rate, actor, version history.
- **Rules / acceptance:** Immutable historical rate snapshots; no silent retroactive repricing.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Append-only rate versioning with `rate_versions` table and effective date indexing.
- Historical snapshots in quotes and estimates are immutable: newly updated rates apply only to subsequent calculations.
- Negative rates rejected with HTTP 422.

## Verification record — 2026-10-18

Verified in Phase 08 acceptance (`test-results/materials-bom-browser-latest.json`). Rate updates apply forward only, preserving existing quotation and job cost snapshots. Rate histories populated with real vendor rates.