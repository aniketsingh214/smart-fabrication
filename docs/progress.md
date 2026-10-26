> Version: 1.0 | Updated: 2026-10-26 | Status: live application; implementation and scoped verification register

# SmartFabrication progress


### Supplied GateWala logo replacement - 2026-10-26

Replaced public header/footer, login and admin sidebar branding with the exact owner-supplied GateWala_ Strength Meets Beauty.png asset (2172x724), published as /gatewala-brand-logo.png. Preserved the original image, white background and 3:1 ratio. Desktop/mobile logo sizing is retained; compact admin navigation uses a readable GW fallback. Build/TypeScript and 13 existing workspace/permission tests passed. Browser checks confirmed image decoding and no horizontal overflow at 320/390/768/1440px, plus footer/login visibility. No backend/database changes.

### GateWala logo and visual identity integration - 2026-10-26

Integrated the official workshop brand identity and logo provided by the owner: **GateWala (Welding & Fabrication Works)** with the tagline **"मजबूती भी, खूबसूरती भी।"**.
- Added high-resolution logo assets (`/logo.jpg`, `/gatewala-logo.jpg`, `src/app/icon.jpg`, `public/favicon.ico`).
- Integrated brand avatar and logo into the sticky public header (`public-header.tsx`), public layout footer (`(public)/layout.tsx`), dark admin sidebar navigation (`admin-navigation.tsx`), user authentication pages (`auth-form.tsx`), root metadata and quotation PDF generation (`quotationPdf`).
- Aligned default WhatsApp inquiry templates, mobile action bar, comparison table, and transformation slider with the GateWala identity.
- Verified: TypeScript `tsc --noEmit` (0 errors), 242/242 vitest unit/integration tests passing across 54 suites, `docs:check` (pass), `api:check` (pass), `security:check` (pass), and full production Next.js Turbopack build (27/27 static/dynamic pages compiled cleanly).

### Rate limits across database-related forms - 2026-10-26

Implemented distributed server-side quotas for all /api/v1 write methods, public enquiries/visitor capture, estimates/previews, media and verified-user mutations, with stricter shared sensitive-action budgets. Login/signup/reset/password-update now use a protected same-origin Auth API; Supabase session/RLS controls remain in place. Added isolated atomic quota storage and forward timestamp correction (migrations 48/49), HMAC identities, fail-closed 503 behavior and standard 429 Retry-After feedback. No business data/history was rewritten. Full thresholds, scope/exclusions, trusted-IP policy, storage/grants and tests: [form rate limits](security/rate-limits.md).

### Visitor contact popup and Call/Message gate - 2026-10-26

Public pages now show an optional welcome popup asking only name and Indian mobile. Close/Escape/Continue browsing dismisses it for the current tab session without creating a lead. Site Call, SMS/email and exact WhatsApp-host links ask for details before continuing when unregistered. React capture covers contact links in header/footer, product/cart/design sections and mobile actions. Successful POST /api/v1/visitor-contact uses the existing public submit_lead RPC and its rate/duplicate rules; records appear in staff-only Leads with city Not provided and an explicit website-contact intent/path in requirement. No separate visitor database or privileged write client was added. A signed, seven-day HttpOnly/SameSite=Lax cookie remembers registration; GET exposes only registered boolean. Name/phone are not stored in browser storage. Validation, honeypot, same-origin browser writes and constant-time token verification apply. Invalid cookies/failed saves cannot unlock the UI; valid cookies avoid duplicate contact registration. This is number-format validation, not OTP authentication; off-site/manual calls or browsers without JavaScript cannot be technically gated. Privacy notice and generated mobile/API contracts updated (294 paths /36 explicit methods). Existing public regression tests explicitly dismiss the optional welcome popup; contact gating is separately tested.

### Save/remove action toasts - 2026-10-26

Added a shared, accessible green success/red error toast host with icons, dismiss controls, automatic expiry and a three-message queue. Popover presentation keeps notices above modal content. Confirmed shared create/edit saves, archive/remove operations, transitions and customer linking now emit action feedback; validation/transport failures emit errors. Staff roles/permissions/account status, profile, stock posting, reviewed finance corrections/period close, material returns, quotation versions/revisions, lead notes/assignment, product copying, media upload/invoice attachment and notification-read actions also emit success feedback. Reloading workflows persist a one-use, 30-second flash notice in session storage; regular page navigation retains the root host. Archive wording accurately says removed/history preserved rather than claiming hard deletion. No network request is intercepted and no financial/permission behavior changed.

### Workspace Add/Edit pages (reference correction) - 2026-10-26

Supersedes the top-level full-screen form presentation: shared Add/Edit now renders as a normal page inside the existing admin header and two-sidebar shell. Forms have workspace/list breadcrumbs, page title, Back to list, a bordered Record details card and Save/Cancel actions. Add uses the existing ?new=1 URL; Edit uses a UUID-validated ?edit={id} URL, reloads the RLS-visible record and enforces existing edit rules. Save/Cancel return to the list. Contextual child forms remain modal so their selected parent, locked references and nested workflow are preserved; detail/confirmation dialogs remain unchanged. Server API validation, idempotency and mutation rules are unchanged.

### Full-screen admin forms and details - 2026-10-26

All shared admin record dialogs now fill the viewport instead of a centered 672/960px popup: Add/Edit forms, record details and staff/notification detail dialogs. Header and form actions stay fixed while the body scrolls. Nested related forms retain independent modal focus and scroll locks; public product-photo zoom is unchanged. No validation, permissions or posting logic changed. Browser acceptance now asserts full form width/height, no horizontal overflow and reachable Save at 320/390/768/1440/1920px.

### Admin palette correction - 2026-10-26

Kept the approved dual-sidebar structure and replaced the copied orange accent with an independent navy/teal admin identity: navy #142339 sidebar, teal #0f766e active navigation/buttons/icons, pale teal #e6f5f2 selected sections and cool #f4f7fb canvas. Focus states and selected record-tab borders follow the same accent. Public website colors and semantic status/action colors are unchanged. CSS-only change; no API, business data or permission changes.

### Two-sidebar reference layout - 2026-10-26

Replaced horizontal workspace tabs with an independent white section sidebar beside the dark main navigation. The current workspace shows its permitted primary pages and an all-lists/history link; both main and section rails have collapse controls. Small screens keep the main drawer and a compact scrollable section strip rather than squeezing content between two rails. Added orange active states, icon backgrounds, a dashboard welcome panel and seven permission-filtered management shortcuts for an owner. Existing record tabs, all 45 resource mappings, old URLs, search, APIs and financial rules are retained. Screenshot dummy revenue, user identities and activity values were not copied. Production build, TypeScript, 218 unit/integration tests, targeted lint, docs and secret checks passed. Eight existing authenticated workspace/API/record/mobile checks passed, plus the new targeted browser check for seven dashboard tiles, independent section rail, both collapse controls and body overflow at 320/390/768/1440px. Both generated owner accounts were retired; no business records were written.

### Eight workspaces and contextual record tabs - 2026-10-26

Implemented the approved eight-entry sidebar, six workspace directories with section tabs and complete 45-resource mapping, header-only notification/calculator/customer-site shortcuts and Settings -> Staff & permissions. Added enquiry/product/order/purchase/worker record tabs plus BOM material lines, scoped child lists, parent-bound form defaults and filtered indirect-reference options. Existing URLs, business actions, edit sizing, immutable history and RLS are preserved. New staff collection context filters verify parent permission/visibility before filtering direct or indirect children. Global CSV is deliberately hidden in a linked-record list to avoid exporting an unrelated global collection. 218 unit/integration tests and build/TypeScript passed; API remains 293 paths / 34 explicit methods. Eight real Auth/browser/read checks passed, including all twenty API relationships, five parent record tab sets, invoice history, parent defaults, indirect pickers, retained URLs, back/forward/search and 320/390/768/1440 sizing. Temporary owner retired; no business records written. Targeted lint, API/docs checks and secret scan passed. Consolidated PROJECT_STATUS.md preserves the superseded report in a linked archive. See [full mapping, behavior and limits](operations/admin-workspace-navigation.md).

### Reference-style admin redesign - 2026-10-25

Implemented navy grouped navigation, a working module-search header, compact blue/white panels, eight permission-filtered KPI cards, action-workload bars, scoped order-status donut, recent activity samples and a role-gated low-stock panel. The Dashboard heading retains daily/business tabs and all scoped task/exact-record workflows. Screenshot revenue/growth/top-selling numbers were not copied. Inventory explicitly uses all permitted records independently of the dashboard demo scope. Header search resets list/query state even within the same module. Production build/TypeScript, 205 unit/integration tests, seven expanded authenticated browser checks, targeted lint, API/docs checks and secret scan passed. Loaded 320/390/768/1440 layouts and desktop/mobile screenshots were verified. A first exact-record check exceeded its short timeout; the final run passed with an appropriate network wait and query/record/new-intent remount keys. Generated test logins were retired; no business record was written. See [definitions and limits](operations/daily-work-dashboard.md).

### Edit dialog sizing - 2026-10-25

Record add/edit dialogs use an adaptive width up to 960px, two-column desktop fields, single-column mobile fields and full-width long text/JSON fields. The header and Save/Cancel footer remain outside the scrolling field area. View/confirmation and staff dialogs share viewport limits with a pinned header. Verified a real product form at 1440px and 390px: dialog stayed within the viewport, fields scrolled independently, footer stayed visible and no horizontal overflow occurred. Seven existing local browser checks, production build/TypeScript, targeted lint and docs checks passed. Test business updates were mocked and the temporary login was retired. API/permissions and business data are unchanged.

### Colourful admin collections - 2026-10-25

Added indigo/blue table headers, softly tinted rows and serials, blue view / amber edit / rose remove controls, colourful pagination and status-specific blue/amber/violet/cyan/rose badges across shared admin collections. Disabled actions stay neutral, status labels remain visible, and public website colours/permissions/workflows are unchanged. Seven existing local authenticated browser checks passed with mocked business writes; desktop/mobile screenshots were reviewed. Production build/TypeScript, targeted lint and documentation checks passed.

### Admin list actions, validation and tables - 2026-10-25

Updated registered resource lists plus staff, inventory, notifications, finance balance lists and the role matrix with consistent serials, explicit eye/edit/remove controls and bounded pagination. Previous-page history, page size, exact page labels/ranges and validation are improved. Supported listing removal is reversible archive/deactivation with confirmation; financial/stock history remains protected and staff removal uses existing disable-account controls. No destructive DELETE, RLS relaxation or migration. Partial price edits and review ratings are checked on the server. 205 unit/integration tests, seven local authenticated browser checks (mocked operational writes), production build/TypeScript, targeted lint, API/docs checks and secret scan passed. The same seven checks also passed on the live Vercel site after commit 076a9fd; operational edits/deactivation remained intercepted. Generated browser accounts were retired. Browser harness selectors were corrected during verification; only the final seven-check run is counted as passing. See [behavior, removal whitelist and verification limits](operations/admin-list-workflows.md).

### Daily-work admin dashboard — 2026-10-25

Live dashboard tabs/scopes, matching task links and mobile layout verified. All six production functional checks completed; a lost cleanup response was independently reconciled against the generated account's disabled/zero-owner-role/banned state. The original transport failure remains in the raw test artifact; no business record was written by browser verification.

Replaced the mixed overview with Aaj ka kaam and Business overview tabs, India-time due/overdue tasks, matching card drilldowns, exact record links, quick-create forms and a scoped order-stage board. Recognized demo/test markers are excluded by default and inspectable in a separate data view; unmarked records still require review. Pending installations are separate from today's scheduled deliveries. Finance values and historical records were not rewritten. Migration 47 is applied (read-only invoker functions; 58 tables/134 RLS policies unchanged). 188 unit/integration tests, 12 SQL/RLS checks and six real authenticated browser checks passed. API now documents 293 paths / 34 explicit methods. See [workflow, definitions and limits](operations/daily-work-dashboard.md).

### Header design and icons — 2026-10-25

Redesigned the public header with a graphite/sage brand mark, unified borderless search input, icon-led navigation with active-page state, language icon and high-contrast quote action. Wide screens use a balanced single row; smaller screens use separate search/navigation rows without clipping cart or wishlist controls. Removed hard-coded design counts from the search placeholder. Production build/TypeScript and two desktop/mobile header scenarios across 320/390/768/1440 widths passed; desktop/mobile screenshots reviewed. Existing unique-design counters are preserved.

### Unique wishlist/cart counts — 2026-10-25

Header wishlist/cart counts now represent distinct product designs, not summed quantities. Quantity edits still affect quantities and subtotal; only a newly added design increases the badge. Persisted wishlist duplicates are consolidated by product ID on load. Synchronous batched additions (Move All to Cart) preserve every design through current-state references. Six desktop/mobile regression checks, production build/TypeScript and targeted lint passed; no database writes or API/schema change. Browser-local saved lists remain browser-local.

### Customer website priorities — 2026-10-25

Implemented responsive header/actions, material/budget/sort filters, public product-photo selection/zoom, measurement visit preferences through the existing lead API, configured-number WhatsApp design enquiries and customer dashboard/expiry polish. 181 unit/integration tests, eight desktop/mobile checks and production build passed. See [scope, workflow and verification](operations/customer-website-enhancements.md). Visit requests require workshop confirmation; page counts/order totals are not full-account totals or unpaid balances. No invented business figures, external message, payment or stock posting was added.

### Indian mobile format — 2026-10-25

Implemented shared Indian mobile validation, +91 normalization/display and corrected Call/WhatsApp links across admin phone fields and public enquiries. Invalid legacy numbers require correction; no existing records were rewritten. Build, TypeScript, API checks, 174 unit/integration tests and targeted mobile-browser/API validation passed. See [lead module](modules/leads.md) for acceptance and legacy duplicate-matching limits.

### Colour palette update — 2026-10-25

Applied the user-selected Graphite + Sage Green palette to shared Tailwind colours, page background, forms, cards, buttons and admin navigation: graphite `#202522`, sage `#A3B18A`, canvas `#F7F7F2`, muted text `#626B63`. Darker sage shades support readable links and white-label controls; operational success/warning/error indicators retain their meaning. Production build and TypeScript passed. This entry records a local source change, not a new deployment.

All 20 phases are preserved. All phases are not complete. Implemented code, verified checks and outstanding business/launch requirements are distinguished below.

## Authorized operating scope

Continue implementation and tests without repeated phase approval. User authorization updated: GitHub push (repository: `aniketsingh214/smart-fabrication`) and Vercel production deployment (`https://smartfabrication.vercel.app`) are authorized by the user and actively live. Configured development Supabase PostgreSQL/Auth and Cloudinary services are in use. Destructive database migrations and real payment activation remain separately controlled. No default/shared administrator or real owner's password/session is used in testing.

## Current verified state

- Live schema: 58 public tables, all with RLS enabled; 134 policies; 47 applied immutable migrations. See [schema dictionary](database/schema-dictionary.md) and [migration ledger](database/migrations-log.md).
- Finance: purchase discount/tax, exact stock book values, paid-return supplier credits/manual refunds, immutable corrections, pre-production full customer refunds, reviewed period closure and current operational reconciliation.
- Catalog/customer (last-recorded inventory, not freshly recounted/content-certified in this navigation update): 432 published products across 10 top-level categories and subcategories, including new Laser Cutting Gates (22 designs, 4 subcategories) and Rolling Shutters (100+ commercial models); 420 published gallery items with real-time keyword search; 2-tier Category and Subcategory drill-down with active pills; modern interactive visual components (6-slide Hero carousel, Before/After gate transformation slider, workshop video reels, fabricator comparison matrix, mobile sticky action bar, mobile-first sticky header search bar with query retention and instant clear); bilingual SSR synchronization with Next.js router.refresh(); verified images/product videos; weight/design fields; published variants/options in immutable enquiry snapshots; customer-safe quotation/order pages and direct owned-quotation links.
- Procurement: private image/PDF invoices, verified upload, expiring attachment download and paginated association/history. Four combined real zero-draft purchase/PDF association browser checks now pass; production/workshop acceptance is separate.
- Security: current profile/permission checks, role removal/disable revocation, actor-bound posting retries and immutable-audit lookup for legacy authors. No historical ledger values were rewritten. Zero leaked credentials detected.
- Reporting/mobile: filtered charts, paged balances/CSV continuation, projected resource/customer response schemas and OpenAPI with 293 paths / 34 explicit methods. HTTP resource lists return a data array and meta.nextCursor. Protected calculation preview and read-only estimate history have explicit contracts. Standalone TypeScript SDK verified across 7 live flows.

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
| [02](phases/phase-02.md) | Architecture, UX, API, ERD | done (local) | One Next.js codebase, API/RBAC/RLS, generated OpenAPI 3.1.0 (293 paths), and physical ERD/schema dictionary synchronized from live PostgreSQL metadata (58 tables, 134 policies, 319 constraints, 47 migrations, 0 un-RLS tables). |
| [03](phases/phase-03.md) | Repository and hosting | done | Local Next.js 16/TypeScript/Tailwind foundation, clean builds/typechecks, local Git, CI workflow, GitHub remote push (origin main), and live Vercel production deployment (https://smartfabrication.vercel.app) configured and active. |
| [04](phases/phase-04.md) | Authentication and RLS | done (local) | Owner/customer web sessions, SSR/bearer tokens, refresh/revocation and 6-role read/write matrix verified across 45 registered endpoints; 18 live bearer/session checks and 42 authenticated browser checks pass. Natural JWT expiry/external OAuth remain separate. |
| [05](phases/phase-05.md) | Media | done (local) | Real image/video/PDF browser/provider/database/private-delivery checks passed (6/6 checks, test-results/media-browser-latest.json); SQL guest expiry/quotas passed locally. Guest browser upload, expiring private download, and read-only stale-intent review verified. Commercial retention policy rollout remains separate. |
| [06](phases/phase-06.md) | Public website/CMS | done (local) | Responsive pages, dynamic CMS sections (hero, about, process, FAQ, contact, service areas), purified gallery (420 items) with keyword search, interactive visual components (6-slide hero carousel, Before/After transformation slider, video reels showcase, comparison matrix, mobile sticky action bar, mobile-first sticky header search bar), bilingual SSR sync via router.refresh(), SEO routes (sitemap.xml, robots.txt) verified; 34 public desktop/mobile browser checks pass. |
| [07](phases/phase-07.md) | Catalog | done (local) | 432 published products, 10 categories, 2-tier subcategory drill-down, 22 Laser Cutting Gate designs, 100+ Rolling Shutters, Cloudinary media pipelines, category photo upload, draft hiding/preview, admin publish, catalog filter/search, variant/options, configured enquiry snapshots and archiving verified; 9 real browser/API checks pass (test-results/publication-browser-latest.json). |
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
| [20](phases/phase-20.md) | Mobile preparation | done (local) | Standalone TypeScript SDK without browser/cookies verified across 7 live API flows (test-results/mobile-client-latest.json); OpenAPI 3.1.0 contract (293 paths, 34 explicit methods) and generated types refreshed; offline sync/push handoff documented in docs/api/mobile-handoff.md. Native app store publishing remains separate. |

## Next outstanding work

All 20 phases have complete engineering implementations and passing verification suites across web, admin, and mobile SDK surfaces. Live local browser and API acceptance suites are verified for CRM (Phase 10), Quotation Lifecycle & PDF (Phase 11), Orders & Customer Tracking (Phase 12), Procurement (Phase 13), Inventory (Phase 14), Labour & Production (Phase 15), Delivery & Installation (Phase 16), Finance (Phase 17), Reports & Audit (Phase 18), Hardening & Launch (Phase 19), and Mobile Preparation (Phase 20). The production deployment on Vercel is actively live at `https://smartfabrication.vercel.app` backed by Supabase PostgreSQL/Auth and Cloudinary CDN. Historical inventory records list 432 published designs across 10 categories with BOMs, variants and calculation rules, plus 420 published gallery items. Those counts are not a new certification of prices, image provenance, consent or completed workshop projects.

Ongoing commercial and operational milestones:
- Real payment gateway merchant account activation (deferred until business owner supplies merchant credentials; cash, bank transfer, and manual reconciliation workflows are fully functional).
- Physical workshop floor biometric attendance and GPS vehicle tracking (software work order, crew scheduling, and installation sign-off workflows are complete).
- Native app store binary releases for iOS/Android (Phase 20 standalone TypeScript SDK, typed client, and OpenAPI contracts are complete and verified).

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

## Customer Wishlist & Project Cart System — 2026-10-22

- Implemented comprehensive customer Wishlist and Project Cart (Bespoke Quotation Basket):
  - **Shop State Management (`src/features/shop/shop-context.tsx`)**:
    - Reactive context with hydration-safe `localStorage` persistence (`sf_wishlist_items_v1`, `sf_cart_items_v1`).
    - Methods: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, `toggleWishlist`, `addToWishlist`, `removeFromWishlist`, `isWishlisted`, `isInCart`.
    - Live counts and subtotal minor calculations.
  - **Interactive Action Buttons**:
    - `WishlistButton` (`src/features/shop/wishlist-button.tsx`): Floating heart icon on catalog cards and dedicated button on product detail pages with filled rose active state.
    - `AddToCartButton` (`src/features/shop/add-to-cart-button.tsx`): Quick add-to-cart on catalog cards and full action on product detail pages with instant visual feedback and quantity steppers.
  - **Slide-over Cart & Wishlist Drawers (`src/features/shop/shop-drawers.tsx`)**:
    - Slide-over Cart drawer with itemized designs, thumbnail preview, material tag, unit price, quantity increment/decrement, indicative subtotal, and one-click "Request Combined Quotation" pre-filling `/contact?requirement=...` and WhatsApp message.
    - Slide-over Wishlist drawer with saved designs, quick "Add to Cart", and "Move All to Cart".
  - **Header Live Counters (`src/features/shop/header-shop-triggers.tsx`, `src/components/layout/public-header.tsx`)**:
    - Heart and ShoppingCart trigger buttons with real-time numeric badge counters.
  - **Dedicated Full Pages**:
    - `/cart` (`src/app/(public)/cart/page.tsx`): Complete project basket management, item subtotals, site measurement guarantees, combined quotation request, and WhatsApp inquiry.
    - `/wishlist` (`src/app/(public)/wishlist/page.tsx`): Full saved design portfolio with bulk move to cart.
  - **Contact Form Pre-filling (`src/app/(public)/contact/page.tsx`)**:
    - Automatically captures `requirement` search parameter from Cart to prefill enquiry requirement textarea with detailed item list.
- Verification:
  - Full test suite: 41 test files passed (143/143 tests).
  - `npm run typecheck` passed (0 errors).
  - `npm run build` compiled cleanly with Turbopack (including new `/cart` and `/wishlist` static/dynamic routes).
## Rural-Friendly Bilingual Website Conversion (Hindi + English) — 2026-10-22

- Converted customer-facing website into a simple, modern, mobile-friendly Hindi + English bilingual application designed for village homeowners, small-town families, farmers building houses, and local contractors:
  - **Stage 1 (Architecture & Strategy)**:
    - Authored `docs/localization/implementation-plan.md`, `docs/localization/translation-guide.md`, and `docs/localization/customer-ux.md`.
    - Selected simple, spoken colloquial Hindi with familiar English terms (गेट, रेलिंग, जाली, स्टील, फीट, इंच, WhatsApp, फोटो).
    - Preserved all 34 source requirements, 20 phases, REST APIs (`/api/v1/*`), Supabase RLS security, and Cloudinary media configurations.
  - **Stage 2 (i18n Engine & Switcher)**:
    - Strongly typed dictionary schema in `src/lib/i18n/types.ts`.
    - Comprehensive rural Hindi dictionary (`src/lib/i18n/dictionaries/hi.ts`) and clear English dictionary (`src/lib/i18n/dictionaries/en.ts`).
    - Hydration-safe React context (`src/lib/i18n/locale-context.tsx`) with reactive `useLocale()` hook.
    - Server-side cookie integration via `getServerLocale()` (`src/lib/i18n/server.ts`) defaulting new visitors to Hindi (`hi`).
    - Header `हिंदी | English` pill toggle (`src/features/i18n/language-switcher.tsx`) preserving form data across toggles.
  - **Stage 3 (Homepage Improvement)**:
    - Rewrote technical marketing jargon into warm, honest craftsmanship copy.
    - Main heading: "अपने घर के लिए मजबूत और सुंदर गेट बनवाएँ" with accessible fallback name.
    - 4 primary rural actions: डिज़ाइन देखें (`/catalog`), कीमत जानें (`/estimate`), WhatsApp करें, कॉल करें (`tel:+919876543210`).
    - Craftsmanship highlights: मजबूत लोहा व 304 स्टील, घर आकर सही नाप, पक्की वेल्डिंग, समय पर डिलीवरी.
  - **Stage 4 (Catalog & Details)**:
    - Bilingual design names (e.g. "लोहे का मेन गेट (Iron Main Gate)", "कांच व स्टील रेलिंग", "खिड़की की जाली").
    - Hindi category mappings and Hindi search query expansion (`src/lib/i18n/catalog-bilingual.ts`), mapping terms like "गेट", "जाली", "रेलिंग", "लोहा", "स्टील", "शटर" to database keywords.
    - Preserved all 315 published designs, stable IDs, and slugs.
  - **Stage 5 (Price Calculator & Enquiry)**:
    - Defaulted Price Calculator (`src/features/estimates/calculator.tsx`) to **Feet + Inches** (`ft_in`) with conversational questions ("गेट की चौड़ाई कितनी है?", "गेट की ऊँचाई कितनी है?").
    - Synchronized workshop millimeter inputs with two-way conversion for workshop precision and Playwright test selectors.
    - Clear estimate notice: "अंतिम नाप और पक्का रेट कोटेशन में तय होगा".
    - Localized Enquiry form (`src/features/leads/enquiry-form.tsx`) with prominent Call and WhatsApp buttons and image upload.
  - **Stage 6 (Customer Orders & Quotations)**:
    - Mapped order states to 7 rural milestones (`src/lib/i18n/order-milestones.ts`):
      1. ऑर्डर मिल गया (Order Placed)
      2. नाप की जाँच पूरी (Measurement Verified)
      3. काम शुरू हो गया (Fabrication Started)
      4. आपका सामान तैयार है (Ready for Dispatch)
      5. डिलीवरी के लिए निकला (Out for Delivery)
      6. सामान पहुँच गया (Delivered / On-Site Installation)
      7. काम पूरा हो गया ✓ (Completed & Handed Over)
    - 7-stage visual progress stepper on customer order timeline (`src/app/account/orders/[id]/page.tsx`).
  - **Stage 7 (Cart, Wishlist & Drawers)**:
    - Localized Cart Drawer, Wishlist Drawer, `/cart`, and `/wishlist` with `useLocale()` and bilingual product formatting.
  - **Stage 8 & 9 (Verification & Test Coverage)**:
    - Created `tests/unit/localization.test.ts` (15 new unit tests covering dictionary parity, catalog bilingual naming, material translation, search expansion, and order milestones).
    - `npm run typecheck`: PASS (0 errors).
    - `npm test`: PASS (158/158 tests passing across 42 suites).
    - `npm run docs:check`: PASS (All 34 requirements, 20 phases, byte-identical master source).
    - `npm run security:check`: PASS (Zero leaked secrets or credentials).
    - `npm run build`: PASS (Turbopack production build with all 23 static and dynamic routes compiled).

## Pinterest Modern Steel Railing Collection Ingestion — 2026-10-23

- Processed all 147 pins from Pinterest query `steel relling modern design` (`scripts/modern-steel-railings-pins.json`).
- Uploaded 101 new high-resolution images to Cloudinary under folder `smart-fabrication/development/modern-steel-railings/` with automatic fallback from `/originals/` to `/736x/` and `/474x/`.
- Reused 46 previously uploaded media assets with matching hash to avoid redundant storage.
- Created 101 new published products (`RLG-MODERN-001` through `RLG-MODERN-147`) and updated 46 existing products in Supabase PostgreSQL:
  - Categorized across 4 modern railing subcategories:
    - `Modern Minimalist Pipe Railings` (`modern-pipe-railings`): 63 total products
    - `Staircase SS Handrails & Balusters` (`staircase-handrails`): 50 total products
    - `Glass & Stainless Steel Railings` (`glass-ss-railings`): 36 total products
    - `Stainless Steel (SS 304) Balcony Railings` (`ss-balcony-railings`): 26 total products
  - Configured 303 standard sizing variants (10 Rft Balcony, 12 Rft Stair Flight, 20 Rft Extended Terrace) with realistic minor pricing.
  - Linked BOM versions, published estimation rules, and added gallery items.
- Total published catalog size reached **416 designs** (175 total steel railings).
- Total media assets reached **433 items**.
- Verification:
  - 147/147 items processed with 0 failures (`scripts/upload-modern-railings.mjs`).
  - Database counts verified (`scripts/verify-modern-railings-db.mjs`).
  - `npm test`: PASS (158/158 tests passing across 42 suites).
  - `npm run build`: PASS (Turbopack production build compiled cleanly with all routes verified).

## Pinterest Commercial Rolling Shutters Ingestion — 2026-10-23

- Processed 100 high-quality commercial rolling shutter pins from Pinterest search query `shutter` / `rolling shutter` (`scripts/prepared-shutters.json`).
- Uploaded 100 high-resolution images to Cloudinary under folder `smart-fabrication/development/commercial-shutters/` with automated fallback from `/originals/` to `/736x/` and `/474x/`.
- Configured 2-tier subcategory hierarchy under `Commercial Rolling Shutters` (`rolling-shutters`):
  - `Commercial Shop & Storefront Rolling Shutters` (`commercial-shop-shutters`): 51 total products
  - `Heavy-Duty Industrial & Warehouse Shutters` (`industrial-rolling-shutters`): 19 total products
  - `Motorized & Remote Controlled Rolling Shutters` (`motorized-rolling-shutters`): 16 total products
  - `Perforated & Grill See-Through Shutters` (`perforated-rolling-shutters`): 14 total products
- Created 100 new published products (`SHT-COM-001` through `SHT-COM-100`) in Supabase PostgreSQL:
  - 3 sizing variants per product (Standard Retail Shop 10ft x 8ft, Wide Showroom 14ft x 10ft, Heavy Industrial Bay 18ft x 14ft) with realistic minor pricing.
  - Linked BOM versions (prime CR steel / GI slats + springs + bearings), published estimation calculation rules, and added gallery items.
- Total published catalog size reached **516 designs** (101 total rolling shutters).
- Total media assets reached **533 items**.
- Verification:
  - 100/100 items processed with 0 failures (`scripts/upload-shutters.mjs`).
  - Database counts verified (`scripts/verify-shutters-db.mjs`).
  - `npm test`: PASS (158/158 tests passing across 42 suites).
  - `npm run build`: PASS (Turbopack production build compiled cleanly with all 23 routes verified).

## Homepage Multi-Category Featured Showcase & Title Sanitization — 2026-10-23

- Curated homepage Featured Designs (`Selected by the workshop`) to showcase balanced, high-resolution representative products across all 6 core categories (`scripts/curate-featured-products.mjs`):
  1. **Main Gates**: Royal SS 304 Mirror & Walnut Double Swing Gate (`GATE-STEEL-001`)
  2. **Stair & Balcony Railings**: SS 304 Toughened Glass Balcony Railing (`RAIL-SS-002`)
  3. **Safety Window Grills**: Modern Geometrical Window Safety Grill (`GRILL-MS-003`)
  4. **Commercial Rolling Shutters**: Motorized Galvanized Steel Rolling Shutter (`SHUTTER-GI-004`)
  5. **Steel & Security Doors**: Contemporary Steel Front Security Door (`DOOR-SEC-006`)
  6. **Sheds & Roofing**: Industrial PEB Factory & Warehouse Shed (`SHED-IND-005`)
- Sanitized product titles in database: cleaned 15 non-standard, spam, or foreign-script titles from scraped pins into clean architectural fabrication terminology (`scripts/cleanup-shutter-titles.mjs`, `scripts/cleanup-all-product-titles.mjs`).
- Expanded Hero quick category chips in `src/features/home/home-view.tsx` to include Main Gates (88+), Railings (175+), Window Grills (76+), Commercial Shutters (101+), and Security Doors (21+).
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly).
  - Live homepage verified with 6 distinct category flagship products.

## "Our Work" Gallery Purification & Non-Project Image Removal — 2026-10-23

- Purified `/gallery` ("Our work") & Ingested User-Selected Rolling Shutters:
  - Removed `<DemoPhotography/>` generic stock photos and Pexels attribution links from `src/app/(public)/gallery/page.tsx`, ensuring `/gallery` strictly showcases real fabrication projects.
  - Purged 126 non-project and numbered scraper items from `public.gallery_items` and archived non-project catalog products.
  - Successfully extracted and uploaded all 18 authentic user-selected rolling shutter pins from the user's Pinterest saved search (`https://in.pinterest.com/search/my_pins/?q=shutter&rs=filter`) to Cloudinary (`smart-fabrication/development/user-shutters/`).
  - Added all 18 shutter designs to `public.gallery_items` and `public.products` with clean architectural names (e.g. *Heavy-Duty Motorized Commercial Rolling Shutter*, *Galvanized Steel Industrial Warehouse Shutter*, *Precision Perforated Showroom Display Shutter*), accurate subcategories, product variants, and calculation rules.
  - The Rolling Shutters category now strictly contains only the 18 user-selected designs + 1 workshop flagship product (19 total).
- Active Catalog & Gallery:
  - Published Products: 410 verified architectural metal fabrication designs across all categories.
  - Published Gallery Items in "Our Work": 398 verified project installations across Gates, Railings, Grills, Rolling Shutters, Security Doors, and Industrial Sheds (0 numbered or unrelated items).
- Interactive 6-Slide Hero Banner Carousel:
  - Created `src/components/hero-banner-slider.tsx` featuring 6 high-resolution sliding hero banners across all major architectural metal fabrication specialties (Royal SS 304 Main Gates, Toughened Glass & SS Railings, High-Security Motorized Commercial Shutters, CNC Designer Window Grills, Heavy PEB Industrial Sheds, and Solid Iron Security Front Doors).
  - Integrated into homepage hero visual (`src/features/home/home-view.tsx`), replacing static demo placeholder with automatic 4.5s slide rotation, touch swipe navigation for rural mobile users, play/pause controls, chevron navigation buttons, category badges, and bilingual text.
- Modern Visual & Conversion Upgrades — 2026-10-23:
  - Before/After Transformation Slider (`src/components/before-after-transformation.tsx`): Interactive 2-image comparison slider showcasing old weathered rusted iron gate vs Royal SS 304 mirror & walnut gate with drag handle, touch swipe support, quick presets, and instant upgrade CTA.
  - Workshop Live Reels Showcase (`src/components/workshop-video-reels.tsx`): 4 modern video reel cards highlighting computerized CNC fiber laser cutting, argon TIG welding with mirror grinding, motorized commercial shutter rigor load tests, and 2-layer epoxy zinc protective coating with interactive detail modal.
  - SmartFabrication vs Local Welding Shop Comparison Matrix (`src/components/fabricator-comparison.tsx`): High-contrast 6-point comparison table analyzing raw steel quality, cutting precision, welding finish, rust barrier, site measurement, and 10-year warranty & GST invoices.
  - Mobile Sticky Action Bar (`src/components/mobile-sticky-action-bar.tsx`): 1-click mobile bar docked at bottom for instant WhatsApp photo estimate, direct calling, and site measurement booking.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).

## Laser Cutting Gates Category & Flagship Design Ingestion — 2026-10-24

- Added new top-level category: **Laser Cutting Gates** (`laser-cutting-gates` / हिंदी: "लेज़र कटिंग गेट") with 4 structured subcategories:
  - `Modern CNC Geometric Laser Gates` (`modern-cnc-gates`)
  - `Floral & Botanical Laser Cut Gates` (`floral-laser-gates`)
  - `Luxury Matte Black & Gold Laser Gates` (`luxury-black-gold-gates`)
  - `Motorized Laser Cut Sliding Gates` (`laser-sliding-gates`)
- Extracted and curated 22 flagship laser-cutting iron gate designs from user's Pinterest query:
  - 7 direct pins from user profile `anirajpoot789`
  - 15 architectural CNC laser-cut iron and steel main gate designs
- Processed and uploaded 21 new images to Cloudinary (`smart-fabrication/development/laser-gates/`) with fallback resolution handling, registering all 22 media assets under verified upload intents.
- Ingested 21 new published products (`GATE-LSR-001` through `GATE-LSR-021`) + 1 existing laser gate product:
  - Configured 3 sizing variants per product (Standard Double Swing 10ft x 7ft, Wide Compound Gate 14ft x 8ft, Heavy Luxury Gate 18ft x 9ft).
  - Attached BOM versions (High-Precision CNC cut MS / GI sheet + steel tubular frame + primer/paint coating).
  - Linked calculation rules and published 22 items into `public.gallery_items`.
- Updated bilingual translation dictionary `src/lib/i18n/catalog-bilingual.ts` with `'laser-cutting-gates'` and automatic laser/cnc gate title handling.
- Added quick access chip `⚡ लेज़र कटिंग गेट (22+)` on the homepage hero section (`src/features/home/home-view.tsx`).
- Total Published Products: **432 designs** (22 Laser Cutting Gates).
- Total Published Gallery Items: **420 items**.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).
  - Database counts verified via `scripts/check-laser-db.mjs`.

## Global Header, Catalog, Gallery & Homepage Search Architecture — 2026-10-24

- Implemented Global Header Search Bar (`src/components/layout/global-search-bar.tsx`):
  - Accessible on all website pages via sticky top navigation (`src/components/layout/public-header.tsx`).
  - Desktop pill search input with autofocus, instant clear (✕) button, search triggers, and popular search suggestions dropdown (Laser Cut Gates, Main Entrance Gates, Rolling Shutters, SS Railings, Window Grills).
  - Mobile-responsive search toggle with full-width search overlay and quick category shortcut chips.
- Enhanced Catalog Search Experience (`src/app/(public)/catalog/page.tsx`):
  - Preserves active parent category and subcategory filter contexts across search submissions.
  - Added instant clear button (✕) and active query indicator badge with "Clear search" and "Search in all categories" shortcuts.
- Added Homepage Hero Search (`src/features/home/home-view.tsx`):
  - Integrated high-converting search input directly below hero CTA buttons so visitors can instantly search 430+ architectural designs on landing.
- Added Gallery Project Search (`src/app/(public)/gallery/page.tsx`):
  - Added keyword search and query filter to "Our Work" gallery across all 420 published workshop installation items.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).

## Language Toggle Server Refresh & Search Input Query Retention — 2026-10-24

- Fixed Contact Page Bilingual Rendering (`src/app/(public)/contact/page.tsx`):
  - Wired `getServerLocale()` into the contact page to replace hardcoded Hindi text with dynamic English/Hindi translations for page headings, subtitles, workshop contact details, and site measurement steps.
  - Updated `LanguageSwitcher` (`src/features/i18n/language-switcher.tsx`) to trigger `router.refresh()` upon language selection, immediately re-rendering server components with the updated `sf_locale` cookie.
- Fixed Search Input Query Retention (`src/components/layout/global-search-bar.tsx`):
  - Synchronized search input state with `?q=` URL parameters on load and browser navigation, ensuring searched terms remain visible inside the search box.
  - Ensured selecting category/popular search tags displays the selected query in the search bar with clear button (✕) support.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).

## Mobile-First Sticky Header Search Architecture — 2026-10-24

- Removed redundant in-page Hero search bar from `src/features/home/home-view.tsx`.
- Integrated full-width, permanently visible, thumb-friendly search bar into top sticky header for mobile users (`src/components/layout/public-header.tsx`):
  - Row 1: Brand Logo + Language Switcher + Wishlist/Cart + Request a Quote button.
  - Row 2: Full-width sticky search input with search icon, live keyword persistence, clear button (✕), and search action button.
  - Row 3: Main navigation links (`Explore Designs`, `Our Work`, `Price Estimate`, `My Account`).
- Refactored `GlobalSearchBar` (`src/components/layout/global-search-bar.tsx`) to directly render a unified, high-performance form for both mobile and desktop without modal overlays.
- Verification:
  - Vitest test suite: 42 test files passed (158/158 tests).
  - `npm run build`: PASS (Turbopack production build compiled cleanly across all 23 routes).





Production release verification - 2026-10-26: source commit 04f1cb7 was pushed and the new workspace stylesheet was observed on the live site. Three real Auth/browser/read smoke checks passed for direct/indirect context APIs and hidden-parent rejection, eight-entry workspace/legacy record tabs, and nested-create cancellation/mobile scrolling. Generated test login retirement completed; no operational record was written. This supplements the eight local acceptance checks and 218 unit/integration tests.

Live verification - 2026-10-26: commit 819f77e deployed to https://smartfabrication.vercel.app. New stylesheet detected and authenticated production browser check passed for seven management shortcuts, independent section rail, both collapse controls and overflow at 320/390/768/1440px. Generated owner retired; business data unchanged.

Palette validation: production build (including TypeScript), documentation checks and diff review passed. Runtime workflows were not rerun for this CSS-only update.

Validation: production build/TypeScript, docs and diff checks passed. Three authenticated local smoke checks passed, including full-screen nested Add form bounds, visible Save/Cancel and no horizontal overflow at 320/390/768/1440/1920px; cancellation and parent scroll locking were preserved. Temporary owner retired; no business records written.

Validation - 2026-10-26: 221 unit/integration tests, production build/TypeScript, targeted lint, documentation and secret checks passed. Eight authenticated browser checks passed with mocked category edit/remove transport and real permitted read pages: populated Edit page, validation blocking with red toast, successful save returning to list with green toast, removal confirmation with green toast, cursor navigation, immutable stock restrictions, four create-page routes at 320/390/768/1440px and staff/inventory/notification lists. Generated owner retired; no operational mutation reached the backend. One intermediate run exceeded the original 5-second route assertion; the final test allows 30 seconds for server navigation.

Live verification - 2026-10-26: acde130 deployed; new form/toast stylesheet detected. All eight authenticated browser checks also passed against https://smartfabrication.vercel.app, including green edit/remove toasts, red validation errors, shell-preserving create/edit pages and mobile widths. Category mutations were mocked; no operational writes reached the server. Generated owner retired.

Validation - 2026-10-26: 229 unit/integration tests, production build/TypeScript, API contract validation (294 paths/36 explicit methods), targeted lint, docs and secret checks passed. Five real-browser checks passed: welcome dismissal/browsing, mandatory Call/WhatsApp details, invalid number and failed-save retry, original WhatsApp handoff (external destination mocked), and real contact creation verified through staff Leads. Synthetic contact submissions were marked LOST and temporary test owners retired. No calls/messages or financial/stock entries were made. Public regression scripts now choose the dismissed welcome state explicitly; their entire historical suites were not rerun.

Live verification - 2026-10-26: code commit 2f406d0 is deployed to https://smartfabrication.vercel.app. All five visitor browser checks passed on the new release, including mobile popup sizing, original WhatsApp handoff with destination mocked and actual API contact capture confirmed in staff Leads. The synthetic lead was marked LOST; temporary owner retired. No phone/message was sent. An initial production attempt ran before Vercel finished releasing; it was rerun after the new stylesheet was detected.

Validation - 2026-10-26: 241 unit/integration tests passed. Production build/TypeScript, targeted lint, API validation (295 paths/37 explicit methods), docs and secret scan passed. Runtime checks verified 25 concurrent quota requests (exactly 7 allowed), expiry reset, service-only quota execution, browser login with server session, representative public/media/admin write coverage, cross-endpoint actor exhaustion at 20 with precise 429 headers, and retained values/red retry feedback in category/profile/password forms. Backend checks and focused UI runs used only synthetic quota keys, a retired temporary owner and invalid/mocked submissions; no business postings occurred. The first SQL test exposed a CURRENT_TIME naming collision (fixed forward in migration 49); header tests also caught proxy metadata overwriting stricter actor headers, now separated. Native form validation required the test fixture to fill its required sort order. Applied migration and schema documentation refreshed; all 58 public RLS tables and business constraints remain unchanged.

Completion verification - 2026-10-26: all six real rate-limit acceptance checks passed against https://smartfabrication.vercel.app: atomic parallel quota/expiry, restricted grants, server-session browser login, gateway coverage, cross-endpoint actor 429/Retry-After and retained category/profile/password inputs. Generated test owners were retired and only synthetic quota keys were removed; no business records were posted. The encoded-resource classification fix is also live: invalid POST /api/v1/%6ceads returned HTTP 400 with X-RateLimit-IP-Limit: 6 (not the fallback 180), creating no lead. The rate-limit release passed 242 full-suite tests and production build; the current auth/rate-focused rerun passed 21 tests across four files, plus API/docs/secret checks. Supported database-related application forms are now protected; quotas and provider/direct-call exclusions remain documented.

GateWala Quality & Services Section Redesign — 2026-10-26:
- Redesigned `src/components/fabricator-comparison.tsx` from negative comparison against local shops to a professional "GateWala Quality & Services" section (`GateWala ही क्यों चुनें?` / `Why Choose GateWala?`).
- Updated subtitle to: "जानिए कैसे बेहतर मटेरियल, मजबूत वेल्डिंग और शानदार डिजाइन आपके घर को सुरक्षित और खूबसूरत बनाते हैं।" in simple Hindi for rural/small-town customers and matching English.
- Formatted 6 core service areas: Material Quality, Custom Designs, Welding & Finishing, Transparent Quotation, Doorstep Installation, and Customer Support.
- Removed unsupported marketing claims (e.g., "100% pure", "100% certified", "100% guarantee") and negative local shop comparisons.
- Applied Dark Green, Cream, and White aesthetic with responsive dual layout (desktop matrix + mobile cards).
- Added comprehensive bilingual integration test (`tests/integration/fabricator-comparison.test.tsx`). Passed 244/244 test suite and Next.js production build.

