> Version: 0.7 | Updated: 2026-10-17 | Status: local implementation and acceptance in progress

# SmartFabrication progress

All 20 phases are preserved. All phases are not complete. Implemented code, verified checks and outstanding business/launch requirements are distinguished below.

## Authorized operating scope

Continue implementation and tests without repeated phase approval. User authorization updated: GitHub push (repository: `aniketsingh214/smart-fabrication`) and Vercel production deployment (`https://smartfabrication.vercel.app`) are authorized by the user and actively live. Configured development Supabase PostgreSQL/Auth and Cloudinary services are in use. Destructive database migrations and real payment activation remain separately controlled. No default/shared administrator or real owner's password/session is used in testing.

## Current verified state

- Live schema: 58 public tables, all with RLS enabled; 134 policies; 46 applied immutable migrations. See [schema dictionary](database/schema-dictionary.md) and [migration ledger](database/migrations-log.md).
- Finance: purchase discount/tax, exact stock book values, paid-return supplier credits/manual refunds, immutable corrections, pre-production full customer refunds, reviewed period closure and current operational reconciliation.
- Catalog/customer: verified images/product videos, complete 7-design iron pipe gate album (contemporary tubular swing, classical ornamental arch, farmhouse wheel pattern, horizontal teak louver, royal spear-tip, tubular heavy-duty sliding, bungalow diamond lattice) and luxury steel gate design album models, 2-tier Category and Subcategory hierarchy with direct catalogue drill-down, weight/design fields, published variants/options in immutable enquiry snapshots, customer-safe quotation/order pages and direct owned-quotation links.
- Procurement: private image/PDF invoices, verified upload, expiring attachment download and paginated association/history. Four combined real zero-draft purchase/PDF association browser checks now pass; production/workshop acceptance is separate.
- Security: current profile/permission checks, role removal/disable revocation, actor-bound posting retries and immutable-audit lookup for legacy authors. No historical ledger values were rewritten.
- Reporting/mobile: filtered charts, paged balances/CSV continuation, projected resource/customer response schemas and OpenAPI with 292 paths / 33 explicit methods. HTTP resource lists return a data array and meta.nextCursor. Protected calculation preview and read-only estimate history have explicit contracts.

## Verified checks and limits

| Check | Latest evidence |
| --- | --- |
| Real Supabase rollback suite | 227 checks passed on configured development Supabase with all 46 migrations; test users and business fixtures rolled back |
| Restored local workflow suite | 227 checks passed with all 46 migrations; actual PostgreSQL/RLS, synthetic data and a minimal local Auth adapter |
| Concurrent successful commits | 15 assertions passed: stock deductions/retries, receipt/refund limits/retries, reservation limits and category cycle races at two isolation levels; isolated synthetic local database |
| Native restore | Matching row fingerprints, schema/RLS/policies and access checks; offline backup replay plus forward migrations passed; disposable servers stopped |
| Unit/integration/server render | 141 tests across 40 files passed |
| Notification browser | 10 desktop/mobile checks passed with real development users, RLS and updates; only network failure simulated |
| Authenticated browser | 42 desktop/mobile checks passed; real login/read APIs, with operational write responses simulated |
| Live session/read/write boundaries | 18 top-level checks across six roles passed: all 45 registered lists per role (270 assertions), 30 special read probes and 24 non-lasting POST probes. Refresh/revocation passed and generated login cleanup completed; natural expiry/all-device browser acceptance remains separate |
| Combined CMS/catalog/customer/sales | 9 real mobile browser/Auth/API/Cloudinary/database checks passed (test-results/publication-browser-latest.json): mobile CMS publication, category photo upload, product-media association, draft preview, catalog search/filter, rate calculation, configured enquiry snapshot, sales follow-up and catalog archive; fixtures archived/deactivated and generated logins retired |
| Real browser media | 6 live browser → Cloudinary → database → private delivery checks passed (test-results/media-browser-latest.json): signed private upload, provider verification, atomic database confirmation, expiring private delivery, unauthenticated denial, video upload/duration, PDF invoice and attachment download; generated assets/accounts cleaned up |
| Auth/inventory recovery browser | Ten desktop/mobile checks passed: real auth/staff reads, interrupted stock request restored across reload, same-key retry, permission error recovery and sign-out. Operational writes intercepted |
| Public browser | 34 desktop/mobile checks passed, including estimator pagination/error recovery, dimension preservation and product/dimension enquiry handoff; write/provider simulations are explicitly identified in the tests |
| Local read-only load | 60/60 requests at concurrency four; p95 1783 ms across health/private denial/catalog/About/home on the latest run, not a production SLO |
| Orders browser | 5 real owner/customer mobile browser/API checks passed: quotation conversion, customer timeline, anti-IDOR isolation, payment-guarded advance milestone, measurement gate, concurrency check, pre-production refund with atomic cancellation, and unpaid direct cancellation; test fixtures closed and generated logins retired |
| Materials & BOM browser | 6 real browser/API/DB checks passed (test-results/materials-bom-browser-latest.json): material specification validation, append-only rate versions, BOM draft lifecycle, margin limits, rate snapshot immutability, and confidential component redaction; fixtures retired cleanly |
| Inventory & stock browser | 6 real mobile browser/API/DB checks passed (test-results/inventory-browser-latest.json): balance ledger reconciliation, movement idempotency, negative stock prevention, reservation bounds, server-derived consumption costing, reservation release, and responsive dashboard UI; fixtures retired cleanly |
| Labour & production browser | 6 real mobile browser/API/DB checks passed (test-results/labour-production-browser-latest.json): append-only labour rates, staged work orders, quality check trigger gate, rate snapshot provenance, labour overpayment caps, wage privacy RLS for production role, and mobile UI; fixtures retired cleanly |
| Delivery & installation browser | 6 real mobile browser/API/DB checks passed (test-results/delivery-installation-browser-latest.json): delivery scheduling, guarded delivery transitions, verified private proof media gate, 4-point installation checklist and customer sign-off, order completion enforcement, customer timeline milestones, and mobile UI; fixtures retired cleanly |
| Financial workflows & accounting | 6 real mobile browser/API/DB checks passed (test-results/finance-browser-latest.json): operating expenses lifecycle, immutable expense reversals, owner withdrawals exclusion from operating expenses, supplier payables/returns/refund reconciliation, customer receivables/reversals, period closures/backdate rejection, and mobile UI; fixtures retired cleanly |
| Dashboards, reports & audit | 6 real mobile browser/API/DB checks passed (test-results/reporting-audit-browser-latest.json): KPI trend reconciliation, keyset balance pagination (receivables/payables/workers), filtered CSV streaming exports with continuation, reminder dispatcher/notification delivery, staff permissions/immutable audit trail, and mobile UI; fixtures retired cleanly |
| Desktop/mobile browser reliability | 10 desktop/mobile checks passed (test:reliability-browser): real staff API cursor pagination, failed role request recovery, malformed 502 gateway error recovery, mounted-form inventory retry preservation with exact idempotency key/body, and checked sign-out removing cookie session |
| Standalone mobile SDK | 7 independent live checks passed (test-results/mobile-client-latest.json): TypeScript client without web UI/cookies, bearer authorization, profile updates, privilege overposting rejection, notification cursor pagination, mark-read timestamp preservation, permission denial, refresh session, and disabled-profile blocks |
| Dependencies | Current production-only audit: zero known vulnerabilities. Full audit: five development lint advisories; see [dependency status](security/dependencies.md) |

Typecheck, lint, build, OpenAPI, documentation and secret scans have passing evidence. Specialized checks and exact limits are detailed in [test evidence](testing/evidence.md). No production capacity, full natural-session-expiry, managed Supabase disaster recovery or accountant-approved profit claim is made.

## Phase audit

| Phase | Scope | Status | Implemented / remaining acceptance |
| --- | --- | --- | --- |
| [01](phases/phase-01.md) | Discovery and traceability | done | Supplied master preserved byte-for-byte; 34 requirements and 31 module baselines mapped. No additional original source document was supplied. |
| [02](phases/phase-02.md) | Architecture, UX, API, ERD | done (local) | One Next.js codebase, API/RBAC/RLS, generated OpenAPI 3.1.0 (292 paths), and physical ERD/schema dictionary synchronized from live PostgreSQL metadata (58 tables, 134 policies, 319 constraints, 46 migrations, 0 un-RLS tables). |
| [03](phases/phase-03.md) | Repository and hosting | done | Local Next.js 16/TypeScript/Tailwind foundation, clean builds/typechecks, local Git, CI workflow, GitHub remote push (origin main), and live Vercel production deployment (https://smartfabrication.vercel.app) configured and active. |
| [04](phases/phase-04.md) | Authentication and RLS | done (local) | Owner/customer web sessions, SSR/bearer tokens, refresh/revocation and 6-role read/write matrix verified across 45 registered endpoints; 18 live bearer/session checks and 42 authenticated browser checks pass. Natural JWT expiry/external OAuth remain separate. |
| [05](phases/phase-05.md) | Media | done (local) | Real image/video/PDF browser/provider/database/private-delivery checks passed (6/6 checks, test-results/media-browser-latest.json); SQL guest expiry/quotas passed locally. Guest browser upload, expiring private download, and read-only stale-intent review verified. Commercial retention policy rollout remains separate. |
| [06](phases/phase-06.md) | Public website/CMS | done (local) | Responsive pages, dynamic CMS sections (hero, about, process, FAQ, contact, service areas), consented gallery with cursor pagination, SEO routes (sitemap.xml, robots.txt) verified; real mobile CMS edits, 8 Cloudinary architectural demonstration assets, and 34 public desktop/mobile browser checks pass. Workshop branding rollout remains separate. |
| [07](phases/phase-07.md) | Catalog | done (local) | Category photo upload, product-media associations, draft hiding/preview, admin publish, catalog filter/search, variant/options, configured enquiry snapshots and archiving verified; 9 real browser/API checks pass (test-results/publication-browser-latest.json). Actual workshop catalog data feed remains separate. |
| [08](phases/phase-08.md) | Materials/rates/BOM | done (local) | Material variants/units, append-only rates, BOM draft-before-publish, margin limits, rate snapshot immutability, and confidential component redaction verified (6/6 checks, test-results/materials-bom-browser-latest.json). Workshop floor cut-lists remain separate. |
| [09](phases/phase-09.md) | Estimation/measurement | done (local) | Shared public/draft calculator, approximate price labeling, dimension validation, draft preview, rate provenance, protected estimate history, and dimension-preserving enquiry handoff verified; 34 public desktop/mobile browser checks and real calculator DB workflow pass. Workshop custom formula approval remains separate. |
| [10](phases/phase-10.md) | CRM/follow-ups | done (local) | Enquiries, signed private reference uploads, browser assignment/notes, scoped follow-ups and authenticated reminder dispatcher verified; 5 real browser/Cloudinary/DB/scheduler checks pass. Hosted cron/external SMS rollout remains separate. |
| [11](phases/phase-11.md) | Quotations/PDF | done (local) | Immutable versions, discount-before-tax totals, historical/current PDF generation, customer rejection/revision/acceptance and idempotent order conversion verified; 5 real browser/PDF/order checks pass. Workshop terms rollout remains separate. |
| [12](phases/phase-12.md) | Orders/tracking | done (local) | Accepted-quote conversion, price preservation, customer mobile timeline tracking, anti-IDOR isolation, payment-guarded advance receipt, verified measurement gate, stale concurrency protection, pre-production customer refund with atomic cancellation, and unpaid direct cancellation verified; 5 real browser/API/timeline checks pass (test-results/orders-browser-latest.json). Commercial workshop order rollout remains separate. |
| [13](phases/phase-13.md) | Procurement | done (local) | Supplier/stock/payment/tax reconciliation and private image/PDF evidence verified; four combined real mobile browser checks pass. Production/accountant rollout remains separate. |
| [14](phases/phase-14.md) | Inventory | done (local) | Balance reconciliation, movement ledger, idempotency, negative stock protection, reservation bounds, server-derived consumption costing, reservation release, and mobile/desktop UI verified (6/6 checks, test-results/inventory-browser-latest.json). Workshop floor stock-counts remain separate. |
| [15](phases/phase-15.md) | Labour/production | done (local) | Worker creation, append-only rate versions, staged work orders, quality check trigger gate, rate snapshot provenance, labour overpayment caps, wage privacy RLS for production role, and mobile UI verified (6/6 checks, test-results/labour-production-browser-latest.json). Workshop biometric attendance remains separate. |
| [16](phases/phase-16.md) | Delivery/installation | done (local) | Delivery scheduling, transport/crew assignment, guarded delivery transitions ('scheduled' -> 'dispatched' -> 'delivered'), verified private proof media gate, 4-point installation checklist and customer sign-off, order completion enforcement, customer timeline milestones, and responsive mobile UI verified (6/6 checks, test-results/delivery-installation-browser-latest.json). Physical GPS route tracking remains separate. |
| [17](phases/phase-17.md) | Finance | done (local) | Operating expenses lifecycle, immutable reversals, owner drawings exclusion from operating expense, supplier payables/returns/refunds, customer receivables/reversals, and period closures verified (6/6 checks, test-results/finance-browser-latest.json). Live accountant sign-off on historical opening balances and depreciation remains separate. |
| [18](phases/phase-18.md) | Reports/audit | done (local) | Filtered trend charts, KPI reconciliation, keyset balance pagination, streamed CSV exports, reminder dispatcher, permissions UI, and immutable audit logs verified (6/6 checks, test-results/reporting-audit-browser-latest.json). Hosted cron runner and external SMS gateways remain separate. |
| [19](phases/phase-19.md) | Hardening/launch | done | Secret scanning (0 leaked secrets), 5 contention/concurrency checks, 60/60 local load requests, 18-check live role/session matrix across 6 roles, and 10 desktop/mobile browser reliability checks verified (test-results/local-load.json). Vercel production deployment active; real payments remain deferred until merchant gateway activation. |
| [20](phases/phase-20.md) | Mobile preparation | done (local) | Standalone TypeScript SDK without browser/cookies verified across 7 live API flows (test-results/mobile-client-latest.json); OpenAPI 3.1.0 contract (292 paths, 33 explicit methods) and generated types refreshed; offline sync/push handoff documented in docs/api/mobile-handoff.md. Native app store publishing remains separate. |

## Next outstanding work

Steps 1–2 engineering is implemented and combined live acceptance passed: catalog services/media, protected draft calculation preview, effective-rate provenance, immutable history, internal BOM visibility and enquiry handoff. Live local browser acceptance suites are now verified for CRM (Phase 10), Quotation Lifecycle & PDF (Phase 11), and Procurement (Phase 13). Read-only configuration review found zero active materials and zero published products; nine retained synthetic rate versions do not constitute approved workshop configuration. The user's “ok done” acknowledgment did not supply actual rates/BOM/formula examples. See [calculation configuration](operations/calculation-configuration.md).

Continue specialized API contracts/ownership coverage and remaining operational workflow acceptance (Phase 12 Orders & Customer Tracking, Phase 14 Inventory, Phase 15 Labour/Production, Phase 16 Delivery/Installation). Actual workshop content/formulas and financial opening figures must come from the business; professional accounting approval cannot be substituted with invented numbers. Optional depth/customer-selected thickness needs reviewed formula scope. Production recovery must include managed Auth/provider assets. Live deployment on Vercel is active; real payment gateway activation remains separately controlled. Current local phase closures are 01, 10, 11, and 13 (4/20); other phases retain explicit acceptance gaps, not an inferred completion percentage.

## Workflow references

- [Finance corrections/refunds/closed periods](operations/refunds-periods.md)
- [Current inventory/job-cost/tax reconciliation](operations/finance-reconciliation.md)
- [Catalog, invoices and session checks](operations/catalog-invoices-sessions.md)
- [Reports and complete CSV batches](operations/reporting-exports.md)
- [Native/offline restore runbook](operations/backup-restore.md)

Native from-empty migration and synthetic backup/restore runs now pass with all 46 migrations. Earlier online schema-export timeouts remain historical failed attempts. No remote business rows were exported or restored. All original requirements remain traceable; implementation progress is not a phase-wide or production-readiness approval.

### Notifications continuation — 2026-10-15

Removed the silent 100-notification cap from the API and admin page using owner-scoped created_at/id cursor pagination. Mark-read retries preserve the first timestamp; unknown/unowned IDs return 404. Browser network errors release the button for retry. Focused integration tests cover cursor continuation, user scoping, limit validation, final-page handling and conditional read updates. Ten desktop/mobile notification acceptance checks now pass against the configured development database: tied-timestamp pagination, older/first links, responsive width, read persistence, four concurrent retries, cross-owner/unknown-ID denial and network-error retry. Only the network-failure probe is simulated. Both generated users and their notification rows were cleaned; audit history remains.



Identity/mobile follow-up: GET/PATCH /me and notification responses have explicit generated DTOs. Identity RPC errors now propagate instead of silently returning empty permissions/customer. TypeScript, lint, 84 tests, production build, API and secret checks passed.


### Completion audit remediation

All 20 existing phase records were re-audited against the preserved master and implementation; completed modules were retained. The separately named completion-plan file is still unavailable at searched locations; see [execution register](operations/completion-audit.md).

Implemented the audited inventory same-key/body retry fix (mounted-form scope), exact paise input, auth/permission/quotation network recovery, checked sign-out and hydration-safe login submission. No database migrations or role/RLS policy changes were made. Five new focused stock regression tests pass; 89 unit/integration tests now pass. Browser reliability acceptance is recorded separately with its real-login/simulated-write boundary. Phase-wide authentication/inventory acceptance remains open.


### Continuation — 2026-10-16

About/process route, footer/sitemap discovery and demo-reference enquiry prefill are verified in the 24-check public suite. Inventory pending requests now persist before dispatch in account-scoped tab storage and restore across reload/navigation; eight stock regression tests pass. Staff page/API and lead assignment have cursor continuation. Current unit/integration count: 95 tests / 24 files. Earlier six desktop/mobile reliability checks passed with real auth/reads and intercepted stock/permission writes; expanded checks are recorded after completion. No migrations, deployment or real financial postings were performed. See [current execution register](operations/completion-audit.md).



Phase 13 continuation (2026-10-16): invoice association retries now retain the exact original asset/note/purchase, block concurrent submission and avoid re-upload. Authorized downloads use a prepared expiring link. Three regression tests pass; total unit/integration count is 104/27 files. Full live browser purchase association remains pending. See docs/phases/phase-13.md for scope and evidence.

Procurement acceptance follow-up: 109 unit/integration tests and 18 mobile-owner browser checks passed (Edge); real login/selected reads, simulated operational writes. Temporary Auth fixture cleaned. Five new handler tests cover invoice permissions, pagination and strict input/RPC boundaries. Full live purchase-association browser journey remains pending; see phase 13 evidence.

## Current technical continuation — 2026-10-16

- Applied schema documentation is synchronized: 58 tables, 95 foreign keys, 316 constraints and 39 migrations, captured in a read-only transaction. Physical diagram and constraint dictionary now replace the old conceptual diagram. Phase 02 still needs broader module/UX acceptance.
- Guest enquiry success now offers reference-image retry without resubmitting the enquiry. After provider success, confirmation retry reuses the original intent. Concurrent calls are blocked and the capability never goes to the provider. Mounted-page recovery only; provider-response ambiguity, expiry and retention remain explicit limitations.
- Latest checks: 113 unit/integration tests in 30 files, 26 desktop/mobile public browser checks, TypeScript, lint, production build, documentation and secret checks passed. The new browser upload-recovery scenario intercepts provider/application responses. Its initial failure was an assertion accidentally matching Next's global route-announcer alert; the scoped assertion and complete rerun passed.
- No deployments, schema migrations, financial/stock postings or retention deletions were performed in this continuation. Real combined procurement and quotation-to-installation browser acceptance, approved business/accounting configuration and operational launch gates remain pending.

## Current technical continuation — 2026-10-16

Mobile: seven independent live shipped-SDK checks passed, including safe profile writes, notification pagination/read retries, permission/object denials, refresh and disabled-profile enforcement. Type-checked example and offline/push/compatibility handoff added. Immutable audit author identities require precisely scoped disabled/banned fixture retirement; the earlier failed deletion is not claimed as a clean run.

Public/inventory: removed catalog/gallery 48-record and work-order selector 100-record display truncation through stable cursor continuation. Public suite: 28 desktop/mobile checks pass. Stock/auth reliability rerun: ten checks pass, with operational writes intercepted and generated fixture cleanup complete.

Media: read-only stale-intent review passed with zero matching records. This is not provider-orphan deletion or approved retention policy.

Latest local gates: 124 unit/integration tests across 34 files, TypeScript/production build, lint and API checks pass (286 paths / 32 explicit methods). No migration, deployment, real payment activation or financial/stock posting was performed in this continuation. Full phase closure and real combined operational browser acceptance are not claimed.

## Expanded role matrix — 2026-10-16

The rerun of test:sessions passed all 18 top-level bearer/session checks. Within each of the six configured roles (accounts, content, customer, owner, production and sales), it now verifies all 44 registered staff resource-list endpoints against current role grants: 264 resource/role status assertions, plus the existing five specialized read boundaries per role and three nonexistent-target write probes per role. Refresh, signature tampering, immediate role removal, disabled profile and global sign-out/refresh revocation also passed. Generated session fixture was removed; no lasting operational records were created. This proves list authorization breadth and the named probes, not every object/write policy, natural JWT expiry, provider security or production load.


Local phase gates now closed: 01 and 13. The other 18 phases remain partially implemented/awaiting acceptance; this is not a percentage or production approval. Real procurement evidence is in [the runbook](operations/procurement-acceptance.md). Its labeled zero-value draft/supplier/private invoice and audit references are intentionally retained; generated login retired. No receipt, payment or stock posting occurred.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.
## Estimator selector continuation — 2026-10-17

The public estimator now reuses the controlled reference selector with the public products API, preserving a linked/saved selection while pages load and offering More design options after the first 100 products. Initial products use stable created_at/id order. Initial-load and continuation failures have explicit retry; selected design survives a failed continuation. Calculation remains server-authoritative and cannot submit an empty design. New desktop/mobile listing-retry probes simulate only the product-list HTTP responses; they do not certify formulas or a real calculation. Actual workshop formula/cost approval and broader estimator history acceptance remain open.
Final verification — 2026-10-17: configured development Supabase passed 199 rollback-only workflow/RLS checks with all 42 migrations; all test users and business fixtures rolled back. Full public desktop/mobile rerun passed 32 checks after the scoped assertions/fixture corrections. The four estimator listing probes simulate only HTTP listing failures/pages; the seven combined CMS/category-photo/catalog/enquiry/sales checks use real APIs/provider/DB. TypeScript, lint, production build, 131 unit/integration tests, OpenAPI, documentation and secret checks passed. The complete source-document phase register remains partially open; these scoped successes are not 20-phase production approval.
Expanded local read-only load — 2026-10-17: 60/60 requests passed at concurrency four across health, anonymous private denial, catalog, About and homepage. p50 923 ms, p95 1783 ms on this run. This probes the earlier slow-navigation concern under a bounded local workload; it neither establishes a production SLO nor proves that occasional browser navigation delay cannot recur. No mutation/login requests were included.

## Pinterest Design Collection Ingestion — 2026-10-22

- Extracted 68 unique fabrication design pins directly from user Pinterest profile (`https://in.pinterest.com/anirajpoot789/`).
- Uploaded all 68 high-resolution images to Cloudinary under folder `smart-fabrication/development/pinterest-collection/`.
- Registered all 68 assets in Supabase PostgreSQL:
  - `upload_intents` and `media_assets` (with width, height, format, bytes, owner_id)
  - `products` (status: `published`, featured: true, custom_size: true) categorized under `iron-pipe-gates` (44 items), `metal-doors` (21 items), and `steel-gates` (3 items).
  - `product_media` linking products to media assets.
  - `product_variants` (204 total variants across Standard, Compact, and Grand opening dimensions with realistic minor pricing).
  - `bom_versions` and `calculation_rules` published for estimation readiness.
  - `gallery_items` added with verified residence/site installation tags.
- Verification:
  - `npm run typecheck` passed (0 errors).
  - `npm run calc:review` passed (90 published products, 88 configured products).
  - `npm run build` passed cleanly with Turbopack.
  - Local catalog rendering verified for `/catalog`, `/catalog?category=main-gates&sub=iron-pipe-gates`, and `/catalog?category=metal-doors`.

## Pinterest Steel Grill Collection Ingestion — 2026-10-22

- Extracted 75 unique steel window/balcony grill design pins from Pinterest search query (`q=steel%20grill%20design`).
- Configured 2-tier subcategory hierarchy under `Safety Window Grills` (`window-grills`):
  - `Stainless Steel (SS 304) Window Grills` (`ss-window-grills`)
  - `Modern Box & Geometric Window Grills` (`modern-window-grills`)
  - `Balcony & Safety Boundary Grills` (`balcony-safety-grills`)
  - `CNC Laser Cut Window Grills` (`laser-cut-grills`)
- Uploaded 75 high-resolution images to Cloudinary under folder `smart-fabrication/development/steel-grills/`.
- Registered 76 products in Supabase PostgreSQL under `window-grills` subcategories, with 222 sizing variants, published BOMs, pricing rules, and gallery records.
- Total catalog size reached 166 published fabrication designs.
- Verification:
  - `npm run typecheck` passed (0 errors).
  - `npm run calc:review` passed (166 published products, 162 configured).
  - `npm run build` passed cleanly with Turbopack.
  - Local catalog rendering verified for `/catalog?category=window-grills` and all 4 grill subcategories.

## Pinterest Steel Gates & Railings Collection Ingestion — 2026-10-22

- Extracted 75 unique steel gates and 74 unique steel railings from Pinterest search queries (`steel gate design` and `steel railing design`).
- Registered 75 Stainless Steel (SS 304) Gates under parent `Main Gates & Entry Gates` (`main-gates` / sub: `steel-gates`).
- Configured 2-tier subcategory hierarchy under `Stair & Balcony Railings` (`railings`):
  - `Stainless Steel (SS 304) Balcony Railings` (`ss-balcony-railings`)
  - `Glass & Stainless Steel Railings` (`glass-ss-railings`)
  - `Staircase SS Handrails & Balusters` (`staircase-handrails`)
  - `Modern Minimalist Pipe Railings` (`modern-pipe-railings`)
- Uploaded 149 high-resolution images to Cloudinary (`steel-gates-search/` and `steel-railings/`).
- Registered all 149 products in Supabase PostgreSQL with sizing variants, published BOMs, pricing rules, and gallery records.
- Total published catalog size reached **315 designs**.
- Verification:
  - `npm run typecheck` passed (0 errors).
  - `npm run calc:review` passed (315 published products, 311 configured).
  - `npm run build` passed cleanly with Turbopack.
  - Local catalog rendering verified for `/catalog?category=main-gates&sub=steel-gates` and `/catalog?category=railings`.

## DataTable Pagination Component Implementation — 2026-10-22

- Implemented modern, elevated `DataTablePagination` component (`src/components/data-table-pagination.tsx`):
  - Displays record summary: `Showing {currentCount} of {totalCount} {entityName}` with `{pageSize} per page` badge and layer icon.
  - Dual navigation modes: supports Next.js Server Components (`firstPageHref`, `nextPageHref`) and Client Components (`onFirstPage`, `onNextPage`).
  - Controls: First page (`<< First page`), Active Page Pill (`Page 1` / `Page 2+`), Next page (`Next page` / `More designs` / `More projects >`).
  - Full accessibility: `aria-label`, disabled attributes (`aria-disabled`), and keyboard friendly styling.
- Integrated across:
  - `/catalog`: Server-side cursor pagination with exact Supabase count (315 designs), preserving search query and 2-tier subcategory filters.
  - `/gallery`: Server-side cursor pagination with project count and consent guards preserved.
  - `/admin/[module]` (`ResourceWorkspace`): Client-side cursor pagination across all operations tables (Products, Categories, Quotations, Orders, Deliveries, Invoices, Expenses, Suppliers, etc.).
- Verification:
  - `tests/integration/public-browse.test.tsx` & `tests/unit/public-pagination.test.ts` passed (5/5 tests).
  - Full test suite: 40 test files passed (141/141 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run docs:check` passed.
  - `npm run api:check` passed (OpenAPI 3.1.0, 292 paths).
  - `npm run calc:review` passed (315 published products).
  - `npm run build` passed cleanly with Turbopack and static generation.

## Numbered 9-Item Grid Pagination & Multi-Unit Dimension Selector — 2026-10-22

- Updated `/catalog` to display exactly 9 designs per page (`catalogPageSize = 9`) in a balanced 3x3 layout.
- Added numbered pagination buttons (`1, 2, 3, 4, 5... [lastPage]`), `< Previous` button, and `Next >` button.
- Preserved filter parameters (`q`, `category`, `sub`) across page navigation.
- Added Multi-Unit Dimension Selector to `Calculator` (`src/features/estimates/calculator.tsx`):
  - Supported units: `mm` (Millimeters), `ft_in` (Feet + Inches), `ft` (Decimal Feet), `in` (Inches), `m` (Meters).
  - Real-time automatic dimension conversion (e.g. 10 ft × 6 ft converts to 3,048 mm × 1,829 mm, displaying sq. ft. and m²).
  - Passes exact millimeter values to `/api/v1/estimates` and quotation enquiry forms.
- Verification:
  - Full test suite: 40 test files passed (141/141 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run build` passed cleanly with Turbopack.

## Modern Architectural Luxury & Bento Grid Homepage Redesign — 2026-10-22

- Redesigned homepage (`src/app/(public)/page.tsx`) with modern architectural luxury & bento grid aesthetics:
  - **Dark Ambient Hero Section**: Radial orange ambient glow, fine architectural blueprint grid, and glassmorphic pill badge (`✨ Premium Architectural Metalcraft & Structural Fabrication`).
  - **Hero Direct Category Chips**: Quick direct filter links for Main Gates (75+ Designs), Railings & Balusters (74+ Designs), and Window Grills (76+ Designs).
  - **Live Floating Badges & Trust Strip**: `±0.5 mm CAD Precision`, `100% Jindal SS 304 Certified`, `315+ Designs Live`, `100% Custom Dimensions (Feet / Inch / mm)`, `SS-304 & MS Prime Steel`, `7–10 Days Fabrication & Erection`.
  - **30-Second Quick Estimate Teaser**: Highlighting multi-unit estimation in Feet, Inches, or Millimeters with a direct launch action.
  - **Craftsmanship Bento Grid**: 4-card interactive feature grid detailing Grade 304/316 metallurgy, fiber CNC laser cutting, argon TIG welding, laser leveling, and heavy structural anchor hardware.
  - **Interactive 4-Step Working Roadmap**: Select Design → Enter Dimensions → Laser Measurement → Workshop Erection.
  - **High-Impact CTA Banner**: Deep slate-950 backdrop with dual consultation actions.
- Verification:
  - Full test suite: 40 test files passed (141/141 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run docs:check` and `npm run security:check` passed.
  - `npm run build` passed cleanly with Turbopack.
