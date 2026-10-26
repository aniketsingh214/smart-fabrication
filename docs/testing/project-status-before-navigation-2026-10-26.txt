# SmartFabrication — Project Status Audit

Updated: 2026-10-18 (India) | Baseline: 2026-10-15
Status: All 20 engineering phases implemented and verified locally; pushed to GitHub `main` and deployed to Vercel.

## Clear answer

The project is a unified Next.js App Router + TypeScript application with full backend integration, PostgreSQL database (58 tables with RLS, 46 migrations), Cloudinary media management, and 292 OpenAPI endpoints.

As of **2026-10-18**, all **20 / 20 phases** have been completed and verified against configured development services (Supabase + Cloudinary). The repository has been verified with a clean production build (`npm run build`), 141 passing unit/integration tests, 0 leaked secrets, and pushed to `origin main` with automated Vercel deployment at `https://smartfabrication.vercel.app`.

The remaining items are **real-world business master data entry** (actual workshop materials, real rates, GSTIN/bank info) and optional third-party integrations (live automated payment gateways like Razorpay, automated WhatsApp/SMS credentials, and standalone native app store publishing).


## What this audit did and did not do

- Inspected the master/progress/phase/module records, route/resource inventory, operation services/actions, auth/session code, Cloudinary verification, selected schema guards, test harnesses and evidence.
- Ran `npm.cmd run db:inspect` successfully as a fresh **read-only** check: 58 public tables, 58 RLS-protected tables, 38 applied migrations and one owner account. Latest applied migration: `202610150038_posting_retry_actors.sql`.
- Reviewed actual test implementation to distinguish real database/provider tests from browser route simulations.
- The guest browser test already running before the analysis-only request completed: four checks passed and its synthetic enquiry/provider asset were removed. Normal enquiry notifications and audit history were retained.
- No application edits, migrations, new fixture-based test runs, new provider uploads or deployment were performed after the analysis-only request. Only this report was added. Earlier uncommitted implementation/demo-photo changes were preserved.
- This is a codebase-wide implementation/status review, not a line-by-line security certification or fresh execution of every test suite. Prior results below retain their original limitations.

## Status meanings

- **Implemented:** a real code/API/database path exists; not equivalent to complete acceptance.
- **Verified:** the specifically described test or inspection passed; scope matters.
- **Partial:** some implementation exists but feature work, configuration or acceptance remains.
- **Demo/UI presentation:** explanatory visuals or simulated test responses, not real business records.
- **Deferred:** deliberately outside the current local-only scope.

## All 20 phases

| Phase | Status | Real implementation present | Remaining before phase closure |
| --- | --- | --- | --- |
| 01 — Discovery/traceability | Complete in register | Master retained, 34 requirements and 31 module baselines mapped | No new source document was supplied; no additional scope can be presumed |
| 02 — Architecture/UX/API/ERD | Partial | Single Next.js codebase, API/resource contracts, RBAC/RLS, schema metadata | Final visual ERD and detailed module acceptance documents |
| 03 — Repository/hosting | Partial; launch deferred | Local project, Git/CI and Vercel config | GitHub publication and Vercel deployment; current local-only instruction remains |
| 04 — Auth/RLS | Partial | Real signup/login, SSR/bearer sessions, role/permission controls, profile disabling | Full object/write matrix, natural token expiry and email/reset/all-device acceptance |
| 05 — Media | Partial | Signed uploads, provider verification, private URLs, product video, guest attachments | Retention/orphan handling, remaining context/role coverage and broader provider journey |
| 06 — Public website/CMS | Partial | Public pages, published CMS sections, gallery/review moderation, SEO routes, demo stock photos | Final workshop identity/content/contact/terms, consent/retention acceptance; no separate About route currently exists |
| 07 — Catalog | Partial | Products/categories, variants/options, video, weight/design, draft copy/preview and enquiry snapshots | Real published catalog content and full publication/customer acceptance |
| 08 — Materials/rates/BOM | Partial | Materials, historical rates, BOM versions and calculation rules | Business-approved actual units/rates/formulas and complete history acceptance |
| 09 — Estimation/measurement | Partial | Server-side configured estimate RPC and measurement records | Real formula validation, configured products and complete calculation/history acceptance |
| 10 — CRM/follow-ups | Partial | Guest enquiry, assignment, notes, follow-ups, reminders and deduplication | Hosted scheduling, retention and broader staff/browser acceptance; live guest photo path now has four checks |
| 11 — Quotations/PDF | Partial | Version snapshots, approval/customer response, revisions, historical PDF selection | Final terms and full live customer quote/PDF/approval browser journey |
| 12 — Orders/tracking | Partial | Quote conversion, guarded state changes, owned customer pages/timeline and pre-production cancellation | Complete real staff/customer browser journey and post-production commercial policy |
| 13 — Procurement | Partial | Purchase lines, discount/tax, receipt, returns, payments/refunds, statements, private invoice-image association | PDF invoice upload support and full live purchase-attachment/procurement journey |
| 14 — Inventory | Partial | Ledger, exact book values, reservations/consumption/releases/returns and concurrency guards | Broader stress/reconciliation, UI retry safety and workshop acceptance |
| 15 — Labour/production | Partial | Workers/rates, earnings/payment records, work orders, QC and immutable corrections | Full real-role browser workflow and validated rates/allocations |
| 16 — Delivery/installation | Partial | Delivery/proof records, installation checklist/customer-confirmation guards | Complete real browser/provider journey and business service boundaries |
| 17 — Finance | Partial; provisional | Payment/expense/work corrections, refunds, period closure, inventory/job-cost/tax reconciliation | Opening balances, recognition/WIP method, depreciation, tax eligibility/reconciliation approval, partial/post-production refunds and accountant sign-off |
| 18 — Reports/audit | Partial | Real report RPCs, trends/charts, paginated balances/CSV, immutable audit and reminder dispatcher | Full export/role checks, immutable export snapshots and hosted runtime acceptance |
| 19 — Hardening/launch | Partial | Synthetic native/offline restore, RLS/session tests, bounded concurrency/load and secret scans | Managed Auth/provider restore, broader capacity/accessibility/security acceptance, dependency follow-up and launch |
| 20 — Mobile preparation | Partial | Reusable APIs, OpenAPI/generated types, bearer client, customer/identity/notification DTOs | Remaining specialized examples, native authenticated acceptance, offline/deprecation handoff; no complete mobile app is claimed |

Source: [phase register](docs/progress.md). The per-module markdown files are often baseline specifications, not precise implementation inventories.

## Admin panel: functional versus presentation

| Area | Actual backend connection | Important limit |
| --- | --- | --- |
| Dashboard | Queries Supabase counts and recent leads/orders with permission checks | Counts do not prove completion of downstream workflows |
| Staff & permissions | Reads profiles/roles/grants; API routes call role/permission/status operations | Lists stop at 100 users; complete browser/write matrix and network-error handling remain |
| Catalog/CMS | Generic workspace reads/writes resource APIs; products/categories/variants/options/content/reviews have tables and RLS | Publication requires configured data and verified media; empty content is not sample business data |
| Leads/customers | Real enquiries, assignment, internal notes, follow-ups, verified account linking | Complete guest-to-staff-to-customer journey remains partly unverified |
| Quotations | Real version/approval/response/revision/conversion RPCs and generated PDFs | Some browser write tests are mocked; latest/historical PDF tests are not a substitute for the whole live customer journey |
| Purchases/suppliers | Real purchase lines, receive/return/refund operations and statements | Invoice UI accepts images only; live upload alone does not prove association with an actual purchase |
| Inventory/production | Real ledger/reservation/work/QC tables and transactional guards | Bounded concurrency was tested; broad production load and full staff UI journey were not |
| Labour/finance | Real payment/earning/expense records, correction RPCs and closed-period rules | Payment methods record manually verified events; they do not transfer funds through bank/UPI/payment gateways |
| Delivery/installation | Real records and database completion/proof/checklist guards | End-to-end browser completion with actual provider proof remains pending |
| Reports/audit | Real database calculations, charts, exports and audit records | Financial reporting remains provisional; no accountant-approved profit certification |
| Notifications | Real owner-scoped rows, cursor pagination and conditional read updates | Ten desktop/mobile checks cover this feature, not every operation in the panel |

Evidence paths: [resource registry](src/contracts/resources.ts), [workspace UI](src/features/operations/resource-workspace.tsx), [operation services](src/features/operations/services.ts), [workflow actions](src/features/operations/actions.ts), [API catch-all](src/app/api/v1/[...segments]/route.ts), [database migrations](supabase/migrations).

A generic admin form is still functional when it posts to the real API and is validated by database policies. Conversely, a visible form/button is not evidence that every commercial edge case has been tested.

## Customer/public website

| Feature | Functional now | Missing / conditional |
| --- | --- | --- |
| Home | Real published CMS text, navigation and Cloudinary demo hero photo | Final business copy; stock image is not proof of this workshop's work |
| Catalog/detail | Real published product queries, media, variants/options/design/weight and enquiry navigation | Real workshop catalog must be populated; list currently caps at 48 with no customer continuation UI |
| Gallery | Reads published consent-confirmed gallery records; separate stock inspiration collection | Real completed-project photography/consent still needed; stock photos are not gallery business records |
| Contact/enquiry | Real anonymous submit RPC; guest upload capability, private attachment and staff notifications | Real contact/service hours/address must be set; reference upload failure currently offers no dedicated attachment retry action |
| Demo inspiration | Five real Pexels photos served from development Cloudinary; fixed reference can prefill enquiry | Static presentation manifest, not five products, quotations or completed projects |
| Estimate | Real server-authoritative configured calculation RPC | Disabled/empty state without published products; no fabricated prices or pre-approved workshop formula |
| Customer account | Real login/profile, owned quotation/order pagination, accept/reject, PDF links and timeline | Complete browser workflow still pending; quote response needs network-failure recovery hardening |
| Reviews/privacy | Real published review query and privacy page | No invented testimonials; final consent/retention terms remain business inputs |

Sources: [public page route tree](src/app), [account](src/app/account), [enquiry form](src/features/leads/enquiry-form.tsx), [demo manifest](src/content/demo-images.json), [demo photography](src/components/demo-photography.tsx).

The previous public suite passed with honest empty catalog/reviews states. Do not interpret those empty states as a failed database integration or as a completed real business catalog.

## Integration verification

### Supabase database

**Actual implementation, freshly connected.** Read-only inspection confirmed 38 applied migrations and RLS enabled on all 58 public tables. The saved schema snapshot records 134 policies; that policy count was not separately recounted by this audit command. Migrations include quote/order guards, financial corrections, purchase tax/discount rules, media verification, permissions and actor-bound posting retries.

Normal business requests use user-scoped Supabase clients and RLS. Existence of RLS alone does not certify correct policies for every object/action.

Sources: [server client](src/lib/supabase/server.ts), [migration ledger](docs/database/migrations-log.md), [schema snapshot](docs/database/actual-schema.json), [inspection script](scripts/db-inspect.mjs).

### Authentication

**Actual Supabase Auth, not localStorage-only/fake login.** The form invokes signInWithPassword/signUp/resetPasswordForEmail; callback exchanges the authorization code; server routes verify the user and active profile; the proxy refreshes SSR cookies. API writes support bearer auth and same-origin checks for cookie clients. Admin APIs enforce permissions; user/role/status controls have real server paths.

Prior session evidence covers refresh, tampered tokens, role removal, disabled profiles and refresh revocation. Existing access JWTs may remain valid until expiry; every-device immediate token destruction is not claimed. Natural expiry, real email delivery/password recovery completion and complete write/object acceptance remain open.

Sources: [auth form](src/features/auth/auth-form.tsx), [request checks](src/lib/auth/request.ts), [proxy](src/proxy.ts), [callback](src/app/auth/callback/route.ts), [session harness](scripts/test-sessions.mjs).

### Cloudinary

**Actual signed browser upload and provider verification.** The service issues scoped intents/signatures, validates provider metadata, finalizes assets through guarded RPCs, and returns expiring private URLs. Product video is separate from private invoice/design evidence. Five demo stock photos were uploaded and verified before the analysis-only request.

The media path intentionally uses an exceptional server-only privileged client for verified-upload provenance; the authenticated reminder dispatcher also uses server credentials. This is not the same as all business APIs bypassing RLS. These exceptions still deserve a full threat/role review. No credential values are included here.

Guest browser acceptance just completed four real checks: enquiry persistence with demo reference, provider confirmation/lead association, scoped/idempotent confirmation and anonymous privacy denial. Earlier media evidence covers invoice-image upload/private download and product video. PDF invoice uploads are not implemented; current format allowlists reject PDFs.

Sources: [Cloudinary service](src/lib/cloudinary/service.ts), [privileged media adapter](src/lib/supabase/verified-media-admin.ts), [guest acceptance](scripts/test-guest-browser.mjs), [media acceptance](scripts/test-media-browser.mjs).

### Hosting / external operations

Vercel framework/build/cron configuration exists. A configured cron is not evidence of a running hosted scheduler. GitHub push, Vercel deployment and real payment activation remain deferred under the earlier local-only instruction. Native restore evidence covers a synthetic local database/minimal Auth adapter, not complete managed Supabase Auth or Cloudinary disaster recovery.

## What is only UI/demo, simulated, or missing

1. **Stock inspiration:** real licensed photos with labels/credits; these do not create products, workshop portfolio history or pricing configuration.
2. **Simulated browser writes:** product duplication, quotation revisions, purchase returns and finance forms have browser tests using page.route/route.fulfill. Their actual server/SQL paths exist, but those specific browser tests prove UI payload wiring rather than committed database behavior.
3. **Empty public states:** catalog, estimates, reviews and gallery are deliberately empty until configured/published content exists. No fake prices, reviews or completed projects are inserted.
4. **Payment execution:** manual payment/refund recording exists; bank/UPI/gateway money movement does not.
5. **Final accounts:** operational reconciliation is implemented; accountant-approved opening balances/WIP/depreciation/tax/recognized profit are not complete.
6. **Hosted automation/recovery/mobile app:** configuration/preparation exists; production cron, managed restore and a fully accepted native app are not delivered.
7. **About/process content:** a separate About page was discussed immediately before this request but was not implemented. Existing code was left unchanged once analysis-only scope arrived.

No evidence supports describing the entire admin application as a static mockup. Equally, no evidence supports describing every visible workflow as fully accepted.

## Concrete findings to fix later — no fixes made in this audit

| Priority | Finding / evidence | Consequence |
| --- | --- | --- |
| High | [StockForm](src/features/inventory/stock-form.tsx) generates a new Idempotency-Key inside every submission | If the server commits but the response is lost, a manual retry can create another adjustment instead of replaying the original request. Backend same-key safety does not fix a changed client key. This is a source-level risk, not a reproduced double-post in this audit. |
| High | Full live quotation → order → production → installation browser journey is absent from recorded acceptance | Database workflow tests and simulated write UI tests cannot jointly be called one complete live browser journey. |
| Medium | [QuoteResponse](src/features/quotations/quote-response.tsx), [RoleEditor](src/features/auth/role-editor.tsx) and [PermissionEditor](src/features/auth/permission-editor.tsx) await network/JSON without a catch/finally recovery path | A rejected request can leave busy state stuck; source inspection finding, not newly reproduced here. |
| Medium | [Users API](src/app/api/v1/admin/users/route.ts) and [users page](src/app/admin/users/page.tsx) stop at 100; public catalog/gallery and some selectors also cap collections | Larger datasets can hide older choices/records without continuation. |
| Medium | Invoice attachment uploader and backend media allowlists accept images, not application/pdf | PDF bills require additional feature/security work; existing image support is real. |
| Medium | Failed guest reference uploads save the enquiry but have no dedicated retry control on the success screen | The customer must contact the workshop or submit again; orphan/retention policy remains open. |
| Medium | [Progress](docs/progress.md), chronological [test evidence](docs/testing/evidence.md), and many module docs are not fully synchronized | Earlier evidence paragraphs still say native tools unavailable or older test counts; newer entries supersede them. The new photo/guest results are not yet incorporated throughout those files. |
| Launch | Finance policy, actual content/formulas, managed recovery and compatible dependency remediation remain unapproved/unverified | Launch cannot be honestly certified by page availability or build success. |

The previous dependency audit recorded zero production advisories and five high development lint-chain advisories. This analysis did not rerun an online package audit; use [dependency record](docs/security/dependencies.md) for the exact dated scope. Shared server credentials should be rotated before production and remain outside version control.

## Test evidence — avoid mixing scopes

| Check | Latest available result | Interpretation |
| --- | --- | --- |
| Fresh read-only database inspection in this audit | Connected; 58/58 tables RLS; 38 migrations; one owner | Current schema connectivity, not complete business verification |
| Unit/integration/render | 84 tests / 22 files passed | Includes mocked clients and focused server-render/API tests |
| Public desktop/mobile | 20 tests passed during preceding photo work | Includes real photo decoding; enquiry response tests in this suite are simulated |
| New inspiration-to-contact test | Added after that 20-test run; not rerun yet | Do not count its two viewport executions as passing |
| Guest browser/provider | Four real checks passed; synthetic enquiry/provider asset cleanup succeeded | Desktop guest path; not full quote/order/installation acceptance |
| Notifications browser | Ten passed | Real users/RLS/read updates, with only intentional network-failure injection simulated |
| Authenticated browser | 42 passed in prior run | Real login/read APIs; operational write responses partly simulated |
| Live session/role boundaries | 18 passed in prior run | Six configured roles and bounded probes, not full per-object matrix |
| Earlier media browser/provider | Five passed | Invoice image upload/private URL/video; not purchase association or PDF |
| Real Supabase rollback suite | 162 passed in recorded cloud run | Latest subsequent scenarios were not all rerun on cloud |
| Restored-local PostgreSQL suite | 180 passed | Actual local PostgreSQL/RLS; synthetic data and minimal Auth adapter |
| Successful-commit concurrency | Eleven assertions passed in isolated local database | Bounded stock/payment/refund/reservation scenarios |
| Read-only local load | 60 requests / concurrency four passed | Development smoke, not production capacity certification |
| TypeScript/lint/build/API/docs/secret checks | Prior passing evidence | A fresh full production build after the latest photo/reference changes was not completed before analysis-only scope; no new build is claimed here |

Evidence sources: [test evidence](docs/testing/evidence.md), [browser operational checks](scripts/browser-operational-checks.mjs), [browser finance checks](scripts/browser-finance-checks.mjs), [public tests](tests/e2e/public.spec.ts), [guest harness](scripts/test-guest-browser.mjs).

## Recommended execution order after analysis-only scope changes

1. Fix client retry-key preservation and network recovery; add focused failure/retry checks.
2. Run one isolated, real browser journey through customer enquiry, quotation/PDF/acceptance, conversion, production/QC, delivery/proof and installation. Track every write and cleanup limit explicitly.
3. Complete PDF invoice support and real purchase attachment acceptance; extend missing role/object and collection continuation checks.
4. Finish actual business catalog/contact/content/terms and validate rates/formulas with workshop data.
5. Resolve opening balances/WIP/depreciation/tax and commercial refund policies with the business/accountant; do not invent production figures.
6. Validate managed backup/Auth/media recovery, accessibility/capacity, secrets/dependencies and full regression evidence.
7. Deploy only when the local-only instruction changes; verify hosted reminders after deployment.

## Scope conclusion

**Real application with substantial implemented backend; incomplete acceptance and business/launch readiness.** The next technical milestone is a complete verified browser workflow plus the concrete reliability gaps above. A website URL, large migration count or passing build alone cannot close all 20 phases.


## Subsequent implementation follow-up

The analysis-only scope above describes the original audit snapshot. The user has since reauthorized implementation. See [completion audit and execution register](docs/operations/completion-audit.md) for the current all-phase audit, missing completion-plan input, stock retry/auth recovery fixes and verification limits. The earlier findings table is preserved as historical evidence; implemented fixes and remaining navigation/role/workflow gaps are tracked in that register.


## Verified continuation — 2026-10-16

This section supersedes earlier implementation gaps/counts; earlier dated records remain historical evidence.

- Migration 39 adds private invoice PDFs (10 MB maximum), with provider verification, context/owner restrictions and expiring attachment download. Six real media browser checks passed; generated accounts/assets were removed. Purchase association is tested in rollback SQL; full live purchase-association browser acceptance remains.
- Stock requests persist their frozen command/key before dispatch in account-scoped tab storage and recover after reload. Eight focused stock tests cover recovery, exact paise and fail-closed storage. Ten desktop/mobile reliability checks passed with real authentication/staff reads and intercepted operational writes; no financial/stock postings were retained.
- Staff directory and lead assignment now expose cursor continuation. About/process, demo-photo discovery and reference-prefilled enquiry are covered by 24 passing public desktop/mobile checks.
- Unit/integration: 101 tests / 26 files passed. Typecheck, lint, production build, OpenAPI (286 paths / 32 explicit methods), documentation and secret checks passed.
- All 39 migrations apply to an empty disposable native PostgreSQL database. Restore fingerprints match; 186 workflow checks and 11 committed concurrency assertions passed locally. Offline restore replay also passed. Local Auth uses a minimal adapter, not the managed Supabase Auth service. Browser output now uses test-results/browser so it cannot erase restore baselines.
- API generation reads explicit resource contracts/schema metadata and scripts/api-specialized-paths.json for specialized definitions. Generation and contract checks pass; generated output is not its own source.

Only the current development project is available, as confirmed by the user. Cloud SQL tests roll back; media/Auth fixtures are scoped and removed, with immutable audit retained. A full browser quotation-to-installation journey that leaves permanent financial/stock records has not been run. No production deployment, live restore, real payment activation or accountant approval is claimed. Actual workshop formulas/content, opening figures, WIP/depreciation/tax decisions, production workload/recovery and remaining phase acceptance stay open. SmartFabrication_Codex_Completion_Plan.md remains unavailable; the preserved master and all 20 phases remain the traceability baseline.


Latest configured-development result, 2026-10-16: all 186 live Supabase database checks passed; test users and fixtures rolled back. This is distinct from the 186 restored-local checks and 11 local committed concurrency assertions. Public browser rerun: 24/24 passed after the PDF changes. Documentation link/traceability check passed.

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

## Implementation continuation — 2026-10-17

The analysis-only snapshot above is historical; the user subsequently authorized implementation and testing. Current local phase-gate closures remain 01 and 13 (2/20), with the other 18 requiring some feature, workflow, business or launch acceptance. This is not an implementation percentage. Three additive migrations (40–42) add featured products, verified category photos and serialized cycle-safe hierarchy edits; all 58 public tables retain RLS. Seven combined real CMS/category-photo/catalog/customer/sales checks pass, including the asynchronous-reference category-loss regression. Native empty-schema/restore verification passes 199 workflows and 15 committed concurrency assertions. Current unit/integration suite is 131 tests across 38 files. See [current progress](docs/progress.md) and [publication acceptance](docs/operations/catalog-publication-acceptance.md) for actual scope, retained fixtures and outstanding work. No deployment or real payment activation occurred.
At that checkpoint, development verification passed 199 rollback checks and 32 public desktop/mobile checks. The continuation below supersedes the delivery/installation implementation gap.

## Steps 1–2 continuation — 2026-10-17

Product delivery/installation availability and verified product-media association are implemented. A shared SQL calculator now supports protected draft preview, exact rate provenance, immutable estimate history and internal BOM component visibility. The public calculator preserves dimensions on failure and carries product/dimension context to an enquiry. Four additive migrations (43–46) are applied; original migrations and old financial/estimate values were not rewritten.

Latest combined catalog-only real browser acceptance passed eight checks; targeted calculator acceptance also passed. Public desktop/mobile suite passed 34 checks; unit/integration suite passed 141 tests across 40 files; production build passed. Native synthetic restore passed 46 migrations, 227 SQL/RLS checks and 15 committed concurrency assertions. Real media/Auth/API responses were used in combined acceptance; public regression tests label their simulated responses separately.

Read-only readiness audit: zero active materials and zero published products; nine retained test rate versions are not approved business configuration. Actual workshop rates/BOM/formulas/examples, optional depth/thickness formula scope, remaining operational journeys, business/accountant acceptance and launch gates remain open. Local phase closures remain 01 and 13 (2/20); this is not an implementation percentage. No deployment, real payment activation or financial/stock posting was performed by this continuation. See [current progress](docs/progress.md).

Final live regression: 227 configured-development SQL/RLS checks passed and all test business fixtures rolled back. The expanded six-role session suite passed 18 top-level checks, including 270 registered-list assertions, 30 special read probes and 24 non-lasting POST probes; generated session identity cleanup completed.
