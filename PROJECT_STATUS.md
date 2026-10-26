# SmartFabrication current project status

Updated: 2026-10-26 (Asia/Kolkata)

## Current answer

The application is implemented in the existing Next.js/Supabase/Cloudinary codebase and has an authorized GitHub/Vercel production deployment. The latest work adds the requested dark main sidebar, independent white workspace sidebar, teal active styling and dashboard management tiles, retaining the eight-workspace mapping and contextual record tabs. It preserves prior resource URLs and business workflows. Current implementation/tests and deployment acceptance are recorded below; this is not a fresh certification of every historical business workflow.

The previous cumulative report mixed old local-only snapshots and later engineering-completion statements. It is retained as a [superseded audit archive](docs/testing/project-status-before-navigation-2026-10-26.txt). This document and the [current progress register](docs/progress.md) are the current summary.

## Work delivered through this update

| Area | Implemented behavior |
| --- | --- |
| Admin navigation | Eight main entries; six permission-filtered workspace directories, vertical section navigation and complete mapping of all 45 resources. Notifications and public shortcuts in header; staff permissions inside Settings. |
| Record experience | Enquiry notes/follow-ups/measurements/quotes; product images/variants/options/BOM/pricing; order production/quality/delivery/installation; purchase items/invoice/payments/returns; worker rates/work/payments; BOM material lines. |
| Admin presentation | Navy/teal admin shell, working module search, eight operational KPI cards, workload/order-stage charts, activity/low-stock panels, colourful tables, serials, cursor navigation and validated forms. |
| Dialogs | Workspace Add/Edit pages with breadcrumbs and card forms; retained detail/context dialogs, two-column forms, independently scrolling bodies and protected save/cancel behavior. |
| Record/API safety | Parent-bound contextual reads, allowlisted direct/indirect relations, parent read permission and RLS-visible parent checks, strict projection, immutable history and existing write/action controls. Supported listing removal is archive/deactivation, not destructive deletion. |
| Public/customer experience | Existing catalog/search/filter/gallery, bilingual content, measurement enquiry, WhatsApp enquiry, customer account/order/quotation views, responsive header and distinct-design wishlist/cart counts. |
| Operational backend | Existing CRM, configured estimates, versioned quotations/PDFs, order milestones, procurement, stock/reservations, worker earnings, delivery/installation, finance corrections/period closes, reports/audit and mobile SDK. Historical run evidence remains in progress and module documents. |
| Services/contracts | Last documented schema: 58 RLS-enabled tables, 134 policies, 319 constraints, 47 applied migrations. Current OpenAPI: 293 paths / 34 explicit handlers. No migration or permission relaxation in this navigation update. |

Catalog/gallery counts in historical records (432 published products / 420 gallery items) are last-recorded inventory figures, not fresh content, ownership, price or completed-project verification. Business claims require verified workshop data.

## Latest scoped verification

- 218 unit/integration tests pass, including complete navigation mapping and fail-closed parent-context service checks.
- Production build/TypeScript, targeted lint, API/docs generation/check and secret scan pass. Eight expanded real Auth/browser/read checks passed, covering all twenty context relationships, five record tab sets, invoice history, parent defaults, legacy routes, back/forward/search and 320/390/768/1440 navigation. Temporary owner retirement completed and no business records were written.
- Browser checks use generated retired test identities; this update does not require commercial payment, stock or order posting.
- The old CRM/procurement browser scripts now select Notes/Invoice tabs before their existing workflows; those full posting/upload suites are not claimed as freshly rerun just because their selectors were updated.

## All 20 phases ? recorded engineering register

The statuses below are the existing phase register, retained with current API/schema metadata. A recorded done(local) status reflects its named engineering evidence and limitations; it does not mean accountant approval, operational launch acceptance, provider policies or native app publication are complete. This navigation change does not recertify every earlier suite.

| Phase | Scope | Status | Implemented / remaining acceptance |
| --- | --- | --- | --- |
| [01](docs/phases/phase-01.md) | Discovery and traceability | done | Supplied master preserved byte-for-byte; 34 requirements and 31 module baselines mapped. No additional original source document was supplied. |
| [02](docs/phases/phase-02.md) | Architecture, UX, API, ERD | done (local) | One Next.js codebase, API/RBAC/RLS, generated OpenAPI 3.1.0 (293 paths), and physical ERD/schema dictionary synchronized from live PostgreSQL metadata (58 tables, 134 policies, 319 constraints, 47 migrations, 0 un-RLS tables). |
| [03](docs/phases/phase-03.md) | Repository and hosting | done | Local Next.js 16/TypeScript/Tailwind foundation, clean builds/typechecks, local Git, CI workflow, GitHub remote push (origin main), and live Vercel production deployment (https://smartfabrication.vercel.app) configured and active. |
| [04](docs/phases/phase-04.md) | Authentication and RLS | done (local) | Owner/customer web sessions, SSR/bearer tokens, refresh/revocation and 6-role read/write matrix verified across 45 registered endpoints; 18 live bearer/session checks and 42 authenticated browser checks pass. Natural JWT expiry/external OAuth remain separate. |
| [05](docs/phases/phase-05.md) | Media | done (local) | Real image/video/PDF browser/provider/database/private-delivery checks passed (6/6 checks, test-results/media-browser-latest.json); SQL guest expiry/quotas passed locally. Guest browser upload, expiring private download, and read-only stale-intent review verified. Commercial retention policy rollout remains separate. |
| [06](docs/phases/phase-06.md) | Public website/CMS | done (local) | Responsive pages, dynamic CMS sections (hero, about, process, FAQ, contact, service areas), purified gallery (420 items) with keyword search, interactive visual components (6-slide hero carousel, Before/After transformation slider, video reels showcase, comparison matrix, mobile sticky action bar, mobile-first sticky header search bar), bilingual SSR sync via router.refresh(), SEO routes (sitemap.xml, robots.txt) verified; 34 public desktop/mobile browser checks pass. |
| [07](docs/phases/phase-07.md) | Catalog | done (local) | 432 published products, 10 categories, 2-tier subcategory drill-down, 22 Laser Cutting Gate designs, 100+ Rolling Shutters, Cloudinary media pipelines, category photo upload, draft hiding/preview, admin publish, catalog filter/search, variant/options, configured enquiry snapshots and archiving verified; 9 real browser/API checks pass (test-results/publication-browser-latest.json). |
| [08](docs/phases/phase-08.md) | Materials/rates/BOM | done (local) | Material variants/units, append-only rates, BOM draft-before-publish, margin limits, rate snapshot immutability, and confidential component redaction verified (6/6 checks, test-results/materials-bom-browser-latest.json). Workshop floor cut-lists remain separate. |
| [09](docs/phases/phase-09.md) | Estimation/measurement | done (local) | Shared public/draft calculator, approximate price labeling, dimension validation, draft preview, rate provenance, protected estimate history, and dimension-preserving enquiry handoff verified; 34 public desktop/mobile browser checks and real calculator DB workflow pass. Workshop custom formula approval remains separate. |
| [10](docs/phases/phase-10.md) | CRM/follow-ups | done (local) | Enquiries, signed private reference uploads, browser assignment/notes, scoped follow-ups and authenticated reminder dispatcher verified; 5 real browser/Cloudinary/DB/scheduler checks pass. Hosted cron/external SMS rollout remains separate. |
| [11](docs/phases/phase-11.md) | Quotations/PDF | done (local) | Immutable versions, discount-before-tax totals, historical/current PDF generation, customer rejection/revision/acceptance and idempotent order conversion verified; 5 real browser/PDF/order checks pass. Workshop terms rollout remains separate. |
| [12](docs/phases/phase-12.md) | Orders/tracking | done (local) | Accepted-quote conversion, price preservation, customer mobile timeline tracking, anti-IDOR isolation, payment-guarded advance receipt, verified measurement gate, stale concurrency protection, pre-production customer refund with atomic cancellation, and unpaid direct cancellation verified; 5 real browser/API/timeline checks pass (test-results/orders-browser-latest.json). Commercial workshop order rollout remains separate. |
| [13](docs/phases/phase-13.md) | Procurement | done (local) | Supplier/stock/payment/tax reconciliation and private image/PDF evidence verified; four combined real mobile browser checks pass. Production/accountant rollout remains separate. |
| [14](docs/phases/phase-14.md) | Inventory | done (local) | Balance reconciliation, movement ledger, idempotency, negative stock protection, reservation bounds, server-derived consumption costing, reservation release, and mobile/desktop UI verified (6/6 checks, test-results/inventory-browser-latest.json). Workshop floor stock-counts remain separate. |
| [15](docs/phases/phase-15.md) | Labour/production | done (local) | Worker creation, append-only rate versions, staged work orders, quality check trigger gate, rate snapshot provenance, labour overpayment caps, wage privacy RLS for production role, and mobile UI verified (6/6 checks, test-results/labour-production-browser-latest.json). Workshop biometric attendance remains separate. |
| [16](docs/phases/phase-16.md) | Delivery/installation | done (local) | Delivery scheduling, transport/crew assignment, guarded delivery transitions ('scheduled' -> 'dispatched' -> 'delivered'), verified private proof media gate, 4-point installation checklist and customer sign-off, order completion enforcement, customer timeline milestones, and responsive mobile UI verified (6/6 checks, test-results/delivery-installation-browser-latest.json). Physical GPS route tracking remains separate. |
| [17](docs/phases/phase-17.md) | Finance | done (local) | Operating expenses lifecycle, immutable reversals, owner drawings exclusion from operating expense, supplier payables/returns/refunds, customer receivables/reversals, and period closures verified (6/6 checks, test-results/finance-browser-latest.json). Live accountant sign-off on historical opening balances and depreciation remains separate. |
| [18](docs/phases/phase-18.md) | Reports/audit | done (local) | Filtered trend charts, KPI reconciliation, keyset balance pagination, streamed CSV exports, reminder dispatcher, permissions UI, and immutable audit logs verified (6/6 checks, test-results/reporting-audit-browser-latest.json). Hosted cron runner and external SMS gateways remain separate. |
| [19](docs/phases/phase-19.md) | Hardening/launch | done | Secret scanning (0 leaked secrets), 5 contention/concurrency checks, 60/60 local load requests, 18-check live role/session matrix across 6 roles, and 10 desktop/mobile browser reliability checks verified (test-results/local-load.json). Vercel production deployment active; real payments remain deferred until merchant gateway activation. |
| [20](docs/phases/phase-20.md) | Mobile preparation | done (local) | Standalone TypeScript SDK without browser/cookies verified across 7 live API flows (test-results/mobile-client-latest.json); OpenAPI 3.1.0 contract (293 paths, 34 explicit methods) and generated types refreshed; offline sync/push handoff documented in docs/api/mobile-handoff.md. Native app store publishing remains separate. |


## Remaining business and operational gates

- Approved real workshop materials, units, BOM quantities, prices/formulas and labour/delivery/installation charges; historical test/demo fixtures are not business master data.
- Accountant acceptance of opening balances, WIP, tax treatment/reconciliation, depreciation and commercial financial statements.
- Business policy/approval for partial customer refunds and refunds after production starts; do not infer approval from available software controls.
- Verified workshop identity/content/photos/project claims, customer consent, terms and media retention policy.
- Broader live/provider/session-expiry, backup/restore, concurrency and production-load acceptance as applicable; retain the scope/date of historical tests rather than claiming every suite was rerun today.
- Hosted reminder/cron monitoring and optional external WhatsApp/SMS integrations; real payment-gateway activation and native app-store binaries remain separate rollouts.

## Documentation entry points

- [Full progress and historical evidence](docs/progress.md)
- [Eight-workspace mapping, record tabs and security contract](docs/operations/admin-workspace-navigation.md)
- [Table actions, archival and validation](docs/operations/admin-list-workflows.md)
- [Dashboard definitions and scope](docs/operations/daily-work-dashboard.md)
- [API/mobile integration](docs/api/mobile-integration.md)
- [Database schema](docs/database/schema-dictionary.md)

Production release verification - 2026-10-26: source commit 04f1cb7 was pushed and the new workspace stylesheet was observed on the live site. Three real Auth/browser/read smoke checks passed for direct/indirect context APIs and hidden-parent rejection, eight-entry workspace/legacy record tabs, and nested-create cancellation/mobile scrolling. Generated test login retirement completed; no operational record was written. This supplements the eight local acceptance checks and 218 unit/integration tests.

### Two-sidebar reference layout - 2026-10-26

Replaced horizontal workspace tabs with an independent white section sidebar beside the dark main navigation. The current workspace shows its permitted primary pages and an all-lists/history link; both main and section rails have collapse controls. Small screens keep the main drawer and a compact scrollable section strip rather than squeezing content between two rails. Added orange active states, icon backgrounds, a dashboard welcome panel and seven permission-filtered management shortcuts for an owner. Existing record tabs, all 45 resource mappings, old URLs, search, APIs and financial rules are retained. Screenshot dummy revenue, user identities and activity values were not copied. Production build, TypeScript, 218 unit/integration tests, targeted lint, docs and secret checks passed. Eight existing authenticated workspace/API/record/mobile checks passed, plus the new targeted browser check for seven dashboard tiles, independent section rail, both collapse controls and body overflow at 320/390/768/1440px. Both generated owner accounts were retired; no business records were written.

Live verification - 2026-10-26: commit 819f77e deployed to https://smartfabrication.vercel.app. New stylesheet detected and authenticated production browser check passed for seven management shortcuts, independent section rail, both collapse controls and overflow at 320/390/768/1440px. Generated owner retired; business data unchanged.

## Latest form and feedback verification

Validation - 2026-10-26: 221 unit/integration tests, production build/TypeScript, targeted lint, documentation and secret checks passed. Eight authenticated browser checks passed with mocked category edit/remove transport and real permitted read pages: populated Edit page, validation blocking with red toast, successful save returning to list with green toast, removal confirmation with green toast, cursor navigation, immutable stock restrictions, four create-page routes at 320/390/768/1440px and staff/inventory/notification lists. Generated owner retired; no operational mutation reached the backend. One intermediate run exceeded the original 5-second route assertion; the final test allows 30 seconds for server navigation.

Live verification - 2026-10-26: acde130 deployed; new form/toast stylesheet detected. All eight authenticated browser checks also passed against https://smartfabrication.vercel.app, including green edit/remove toasts, red validation errors, shell-preserving create/edit pages and mobile widths. Category mutations were mocked; no operational writes reached the server. Generated owner retired.

## Visitor contact collection

Dismissible public welcome popup; mandatory name/mobile capture for in-app Call/Message links; contacts visible in staff Leads; validated Indian number, limited public RPC and signed seven-day HttpOnly registration cookie. No schema migration or mobile ownership verification.

Validation - 2026-10-26: 229 unit/integration tests, production build/TypeScript, API contract validation (294 paths/36 explicit methods), targeted lint, docs and secret checks passed. Five real-browser checks passed: welcome dismissal/browsing, mandatory Call/WhatsApp details, invalid number and failed-save retry, original WhatsApp handoff (external destination mocked), and real contact creation verified through staff Leads. Synthetic contact submissions were marked LOST and temporary test owners retired. No calls/messages or financial/stock entries were made. Public regression scripts now choose the dismissed welcome state explicitly; their entire historical suites were not rerun.
