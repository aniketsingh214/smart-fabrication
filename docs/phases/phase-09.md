> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 09 — Estimation & Measurement

- **Objective / tasks:** Dimension form, validation, formula engine, wastage, approximate quantity/weight/price, site measurement records.
- **Deliverables:** estimate API, formula docs, examples, calculator UI.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-09.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Boundary/unit tests pass; output labelled approximate. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Configured server-authoritative approximate estimator, dimension validation and verified measurement records exist.

### Remaining acceptance

Business-approved formulas and live calculation boundary/history evidence remain required.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

## Estimator selector continuation — 2026-10-17

The public estimator now reuses the controlled reference selector with the public products API, preserving a linked/saved selection while pages load and offering More design options after the first 100 products. Initial products use stable created_at/id order. Initial-load and continuation failures have explicit retry; selected design survives a failed continuation. Calculation remains server-authoritative and cannot submit an empty design. New desktop/mobile listing-retry probes simulate only the product-list HTTP responses; they do not certify formulas or a real calculation. Actual workshop formula/cost approval and broader estimator history acceptance remain open.
Final verification — 2026-10-17: configured development Supabase passed 199 rollback-only workflow/RLS checks with all 42 migrations; all test users and business fixtures rolled back. Full public desktop/mobile rerun passed 32 checks after the scoped assertions/fixture corrections. The four estimator listing probes simulate only HTTP listing failures/pages; the seven combined CMS/category-photo/catalog/enquiry/sales checks use real APIs/provider/DB. TypeScript, lint, production build, 131 unit/integration tests, OpenAPI, documentation and secret checks passed. The complete source-document phase register remains partially open; these scoped successes are not 20-phase production approval.
Current fields, canonical units, area-BOM arithmetic, effective-rate history, non-persisted draft preview, protected issued history and customer-visible component flags are specified in [calculation configuration](../operations/calculation-configuration.md). New estimates retain exact material/rate UUIDs and effective timestamps; old snapshots/quotations/stock are not repriced. Missing/inactive components or incompatible service charges reject the whole estimate. Native 46-migration rehearsal passes 227 workflow/RLS checks and 15 committed concurrency assertions.

## Verified estimation & calculator acceptance — 2026-10-18

Executed `npm run test:e2e` (34 Playwright checks) and `npm run test:publication-browser` (real calculator workflow with live database services):
1. **Approximate price labeling:** Calculator outputs are explicitly labelled approximate (`Approximate estimate`); no binding commercial contract is created until quotation review.
2. **Dimension validation:** Negative, zero, or unfeasible dimensions are rejected with server validation errors (`VALIDATION_ERROR`).
3. **Design continuation & error recovery:** Selector paginates through products via stable cursor continuation, retains selected design on network interruption, and provides explicit listing retry.
4. **Handoff to quotation enquiry:** Calculating approximate price generates a pre-filled link (`/contact?product=[id]&width_mm=...&height_mm=...`) carrying chosen product and exact dimensions into the enquiry form.
5. **Rate provenance & versioned history:** Calculator derives prices using effective material rates at calculation time; subsequent material price updates do not mutate historical estimate snapshots (`estimate_history`).
6. **Internal BOM protection:** Components flagged with `customer_visible: false` are safely redacted from the customer's response while preserved in internal staff records.
7. **Draft calculation preview:** Authorized staff can preview draft calculation rules (`/admin/calculation-preview`) before publishing.

Phase 09 verification gate is complete for local development (`done (local)`). Bespoke architectural engineering calculations and on-site millimeter tolerances remain separate workshop milestones.