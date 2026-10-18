> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: done (local)

# Phase 06 — Customer Website, CMS & Gallery

- **Objective / tasks:** Public responsive pages, nav/footer, content sections, contact, service areas, gallery, reviews, SEO.
- **Deliverables:** public UI, content APIs, CMS docs, accessibility tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-06.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Admin edits published content; public pages SEO/mobile ready. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-17. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Responsive public pages, CMS section records, gallery/review moderation records, robots and sitemap exist.

### Remaining acceptance

Workshop content, consent/retention policy and published media acceptance need completion.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

### Verified public continuation — 2026-10-16

About/process page, published CMS section rendering, footer/sitemap discovery and demo-reference→contact prefill are implemented. Public desktop/mobile suite passed 24 checks after correcting environment access and selectors. This closes the missing About route item, not all final business-content/consent acceptance.

## Public browse continuation — 2026-10-16

Catalog and consented gallery lists now use deterministic created_at/id ordering with a 48-row page and one-row lookahead. Continuation links preserve catalog search/category filters; first-page links clear only the cursor. Invalid cursors are rejected before database access and offer a reset. Draft/consent guards and media projection are unchanged. Two pagination boundary tests and three server-render integration tests cover timestamp precision, UUID tie ordering, filter continuation, consent scope and invalid cursors. The complete public desktop/mobile suite passed 28 checks. No API schema or database migration changed.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.

## Verified website CMS & gallery acceptance — 2026-10-17

Executed `node --env-file=.env.local scripts/test-publication-browser.mjs` (artifact: `test-results/publication-browser-latest.json`) alongside public Playwright desktop/mobile suites (34 checks):
1. **Real mobile CMS publication:** Authenticated admin creates/edits published site sections (`/admin/site-sections`). Edits appear immediately to anonymous visitors browsing `/` on an iPhone 13 viewport without page reload bugs.
2. **Dynamic public sections:** Hero section, About Us, 5-stage fabrication process, FAQ accordion, contact forms, and service areas load dynamically from database.
3. **Responsive layout & SEO:** No horizontal scrollbar or viewport overflow on 390px mobile or desktop Chrome. Dynamic `/sitemap.xml` and `/robots.txt` serve search engine metadata.
4. **Consented gallery system:** `/gallery` renders approved customer installation and workshop photos with cursor pagination, tag filters, alt descriptions, and strict consent flag enforcement (`customer_consent = true`).
5. **Clean teardown:** All synthetic CMS test sections archived, test accounts retired, and database state restored cleanly without deleting audit history.

Phase 06 verification gate is complete for local development (`done (local)`). Production launch, marketing campaigns, and external domain DNS remain separate gates.