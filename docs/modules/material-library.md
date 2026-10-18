> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: verified (local)

# Material Library

## Source specification

- **Functional scope:** Square/rectangular/round pipe, angle, flat, sheet, channel, bars, hinges, locks, wheels, hardware, paint, primer, coating; type, size, thickness, length, weight, unit, status.
- **Rules / acceptance:** Canonical unit conversion, unique material variant code, archived items retained for history.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Materials, variants, canonical units, dimensions, and specifications verified via `npm run test:materials-bom`.
- Validation: Negative thickness, length, or unit weight rejected with HTTP 422.
- State transitions: Active, archived; historical references in completed estimates/BOMs preserved.

## Verification record — 2026-10-18

Verified in Phase 08 acceptance (`test-results/materials-bom-browser-latest.json`). Seeded with real workshop materials: MS Square Pipes, SS 304 Round Pipes, MS Sheets, Toughened Glass, and Zinc Epoxy Primer.