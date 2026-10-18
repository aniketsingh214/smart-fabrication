> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 08 — Materials, Rates & BOM

- **Objective / tasks:** Material variants, units, purchase/selling rates, effective history, product-material mapping, configurable rules.
- **Deliverables:** material APIs, BOM tables, module docs, history tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-08.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Rate changes preserve old quote/job snapshots. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Materials, append-only rates, BOM versions/items and immutable published pricing rules exist and are fully verified with acceptance tests.

### Remaining acceptance

Physical supplier contract reconciliation and on-floor fabrication shop cut-lists remain ongoing workshop operational milestones.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md).

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

## Step 2 implementation — 2026-10-17

Current fields, canonical units, area-BOM arithmetic, effective-rate history, non-persisted draft preview, protected issued history and customer-visible component flags are specified in [calculation configuration](../operations/calculation-configuration.md). New estimates retain exact material/rate UUIDs and effective timestamps; old snapshots/quotations/stock are not repriced. Missing/inactive components or incompatible service charges reject the whole estimate. Native 46-migration rehearsal passes 227 workflow/RLS checks and 15 committed concurrency assertions.

## Verified acceptance — 2026-10-18

Executed `npm run test:materials-bom` (`scripts/test-materials-bom-browser.mjs`, artifact `test-results/materials-bom-browser-latest.json`):
1. **Material variants & specifications:** Material variants validate specifications and units; negative dimensions/thickness/weight rejected with HTTP 422.
2. **Append-only rate versioning:** Records purchase and selling rates; negative rates rejected; updates insert new version without modifying previous versions.
3. **BOM draft-before-publish enforcement:** Database triggers prevent inserting published BOMs without line items; line items enforce check constraint `wastage_percent <= 30`.
4. **Margin boundaries & overheads:** Calculation pricing rules enforce `margin_bps <= 10000` (100% max) and support versioned overhead items.
5. **Rate snapshot immutability:** Updating material rates dynamically updates subsequent estimate calculations while preserving existing estimate snapshots and historical quotes unchanged.
6. **Confidential component redaction:** Internal BOM components flagged `customer_visible = false` are redacted from customer responses while retained in full for admin history.
7. **Clean fixture lifecycle:** Test fixtures retired cleanly without cascading foreign key violations.

Phase 08 verification gate is complete for local development (`done (local)`).