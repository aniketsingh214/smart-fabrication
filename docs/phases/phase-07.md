> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: done (local)

# Phase 07 — Catalog & Categories

- **Objective / tasks:** Category/subcategory CRUD, product draft/preview/publish, SKU, media, variants, filters/search, featured.
- **Deliverables:** catalog API, migrations, admin/public UI, module docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-07.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Admin publishes and visitor can filter products. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-17. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Category hierarchy, product drafts/publication/archive, search and verified product images are implemented.

### Remaining acceptance

Variants/options CRUD, published-only configuration, private preview and idempotent draft duplication are implemented. Video, weight/design metadata and immutable published-choice enquiry snapshots are implemented. Complete live publication/preview/customer acceptance remains.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.



## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.

## Public browse continuation — 2026-10-16

Catalog and consented gallery lists now use deterministic created_at/id ordering with a 48-row page and one-row lookahead. Continuation links preserve catalog search/category filters; first-page links clear only the cursor. Invalid cursors are rejected before database access and offer a reset. Draft/consent guards and media projection are unchanged. Two pagination boundary tests and three server-render integration tests cover timestamp precision, UUID tie ordering, filter continuation, consent scope and invalid cursors. The complete public desktop/mobile suite passed 28 checks. No API schema or database migration changed.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.
At that checkpoint, product-level delivery/installation availability and broader media acceptance remained open; the continuation below supersedes those implementation gaps.

## Services/media continuation — 2026-10-17

Migration 43 adds explicit delivery/installation availability with a confirmation default, copy preservation and database-enforced verified product-media associations. Public product detail and private preview show the configured service state. The corrected Step 1 catalog run passed seven checks; the latest combined catalog/calculator run passed eight real mobile checks, including product-photo association, draft preview, publication/filtering, configured enquiry and sales follow-up. Test products/categories/materials were archived/deactivated and generated logins retired; immutable labeled test history remains.

Current common gates: 141 unit/integration tests across 40 files, 34 public desktop/mobile checks and production build passed. Native restore verification passed all 46 migrations, 227 SQL/RLS checks and 15 committed concurrency assertions. See [services/media runbook](../operations/catalog-services.md) and [calculation configuration](../operations/calculation-configuration.md).

## Verified catalog & publication acceptance — 2026-10-17

Executed `node --env-file=.env.local scripts/test-publication-browser.mjs` against configured development Supabase and Cloudinary services. All 9 end-to-end browser and API checks passed (exit code 0; artifact: `test-results/publication-browser-latest.json`):
1. **Real mobile CMS publication:** Site sections publish and update live for anonymous mobile visitors.
2. **Category photo upload & admin association:** Category photo uploads through Cloudinary, confirms in database, and links via `/admin/categories`.
3. **Product-media association:** Public verified media attaches to product via `/admin/product-media` with database-enforced integrity guards.
4. **Draft hiding & authorized preview:** Unpublished products return 404 to anonymous visitors and remain accessible in `/admin/products/[id]/preview` only for authorized staff.
5. **Admin publication & catalog search/filtering:** Published products appear on `/` and `/catalog`; category filtering, search query matching, variant display, and delivery/installation flags work as configured.
6. **Live estimation integration:** Calculation engine uses active versioned material rates while preserving historical estimate records.
7. **Configured public enquiry handoff:** Visitor configures variant and options on product page and submits enquiry; server snapshot securely preserves chosen variant/option data.
8. **Sales CRM follow-up:** Assigned sales user accesses lead, appends follow-up note, schedules task, and transitions status.
9. **Archiving & snapshot preservation:** Archiving product immediately removes it from public catalog while preserving existing enquiry snapshots and audit trails.

All test catalog records, categories, and materials archived or deactivated; test logins disabled and banned. Phase 07 verification gate is complete for local development (`done (local)`). Production launch and real workshop inventory input remain separate commercial milestones.

