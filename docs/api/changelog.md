> Version: 0.2 | Owner: project team | Updated: 2026-10-15 | Status: local implementation baseline

# API changelog

2026-10-15 (finance and next reports phase): purchase lines accept discount/tax/recoverability and expose frozen line/stock values. Added reviewed financial corrections and period closure APIs, guarded customer cancellation refunds, supplier credit/refunds and consistent net balances/statements. Added date-filtered trend API and cursor-paged computed balances. CSV exports are now cursor batches of at most 500 rows with continuation headers; clients must consume every batch. See [finance rules](../operations/refunds-periods.md) and [report/export contract](../operations/reporting-exports.md). No payment gateway, bank transfer or automatic period closure was activated.

2026-10-15 (catalog/procurement/finance follow-up): added protected variant/option resources, published-only product configuration, private preview, idempotent draft duplication, cursor-paginated supplier statements, immutable purchase-return listing and approved-expense reversal posting. `finance_summary` now includes gross/reversed/net expenses by India business date. See [workflow guide](../operations/catalog-procurement-corrections.md). Paid-return refunds and other financial reversal types remain pending.

2026-10-15 (quotation follow-up): added `POST /quotations/{id}/revise` and admin equivalent, with a required idempotency header, immutable source linkage and a separate reapproval draft. Added version history/editor, authenticated customer-link copying and discount/tax PDF breakdown. Fractional line rounding now matches PostgreSQL decimal rounding. OpenAPI has 244 paths. Owner bootstrap succeeded; real owner/customer browser authentication checks passed using temporary accounts.

2026-10-15: implemented local v1 handlers and generated OpenAPI/types for catalog, enquiries, estimates, customer tracking, staff operations, finance, media and reports. Added explicit-handler coverage checks, safe customer DTOs, stock reservation release, payment/withdrawal idempotency and private upload verification. See [verification evidence](../testing/evidence.md) for coverage limits. No hosted release has occurred.

2026-10-14: created the initial OpenAPI planning skeleton.


## Catalog and hardening follow-up — 2026-10-15

Added published catalog choice IDs to guest enquiries, typed projected resource-read DTOs, paginated private purchase invoice attachments, product video upload/confirmation and historical quotation PDF version selection. Live bearer refresh and current-role/profile revocation checks passed. Existing list envelope layout remains data array / meta.nextCursor.

Added GET /finance/reconciliation: current scoped inventory/job-cost/tax reconciliation; exact minor-unit strings, null unavailable scopes, official_accounts false. OpenAPI 286 paths / 32 explicit methods.


Customer quotation APIs now use narrow owned projections with cursor pagination; account links support quotation selection and independent collection cursors. Corrected generated read envelopes to data arrays and meta.nextCursor, matching actual HTTP behavior.


Migration 38 binds stock, payment and earning retries to the original authenticated author. Old rows are unchanged; verified INSERT audit provenance supports legacy authors. No client-writable creator fields added. See ../operations/posting-retries.md.


### Identity and notification contracts — 2026-10-15

OpenAPI now specifies the safe response fields for GET/PATCH /me and GET /notifications / POST /notifications/{id}/read. Notification arrays retain meta.nextCursor. The identity endpoint propagates permission/customer RPC failures instead of reporting a successful identity with silently empty permissions/customer. No service credentials or internal notification recipient IDs are part of these DTOs.

### Staff paging and stock recovery — 2026-10-16

GET /admin/users supports limit 1–100 (default 100), opaque created_at/id cursor, a data array and meta.nextCursor. Safe fields are id/display_name/disabled/created_at/user_roles(role_id). The web page uses 25 rows; lead assignment loads additional pages. Authorization remains users.read and RLS. Stock retry request/response contracts are unchanged; the web implementation now restores pending commands from account-scoped tab storage. Mobile clients must preserve their own original key/body before dispatch, and must not recreate an uncertain command with a fresh key.


## Verified continuation — 2026-10-16

This section supersedes earlier implementation gaps/counts; earlier dated records remain historical evidence.

- Migration 39 adds private invoice PDFs (10 MB maximum), with provider verification, context/owner restrictions and expiring attachment download. Six real media browser checks passed; generated accounts/assets were removed. Purchase association is tested in rollback SQL; full live purchase-association browser acceptance remains.
- Stock requests persist their frozen command/key before dispatch in account-scoped tab storage and recover after reload. Eight focused stock tests cover recovery, exact paise and fail-closed storage. Ten desktop/mobile reliability checks passed with real authentication/staff reads and intercepted operational writes; no financial/stock postings were retained.
- Staff directory and lead assignment now expose cursor continuation. About/process, demo-photo discovery and reference-prefilled enquiry are covered by 24 passing public desktop/mobile checks.
- Unit/integration: 101 tests / 26 files passed. Typecheck, lint, production build, OpenAPI (286 paths / 32 explicit methods), documentation and secret checks passed.
- All 39 migrations apply to an empty disposable native PostgreSQL database. Restore fingerprints match; 186 workflow checks and 11 committed concurrency assertions passed locally. Offline restore replay also passed. Local Auth uses a minimal adapter, not the managed Supabase Auth service. Browser output now uses test-results/browser so it cannot erase restore baselines.
- API generation reads explicit resource contracts/schema metadata and scripts/api-specialized-paths.json for specialized definitions. Generation and contract checks pass; generated output is not its own source.

Only the current development project is available, as confirmed by the user. Cloud SQL tests roll back; media/Auth fixtures are scoped and removed, with immutable audit retained. A full browser quotation-to-installation journey that leaves permanent financial/stock records has not been run. No production deployment, live restore, real payment activation or accountant approval is claimed. Actual workshop formulas/content, opening figures, WIP/depreciation/tax decisions, production workload/recovery and remaining phase acceptance stay open. SmartFabrication_Codex_Completion_Plan.md remains unavailable; the preserved master and all 20 phases remain the traceability baseline.

## SDK transport hardening — 2026-10-16

Client-only change: cookie omission, redirect rejection, API-base traversal checks, remote HTTPS enforcement and status/request-ID-preserving malformed-response errors. No endpoint, request body or response schema change. A typed profile/notification example and offline/push/versioning handoff are available in [mobile handoff](mobile-handoff.md). Seven real independent SDK checks passed; complete operational mobile acceptance remains open.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.
## Product services and calculation APIs — 2026-10-17

Product create/update/read/configuration DTOs include delivery_availability and installation_availability (`confirm_with_workshop`, `available`, `unavailable`). Existing/default state is confirmation; unrelated PATCH preserves values. Product media requires a confirmed public product-context image/video in the database.

`POST /estimates` returns an explicit validated EstimateResult with immutable formula/BOM/rate provenance. Only customer-visible material lines appear; fully internal BOMs return an empty material array while retaining full totals. `POST /estimates/preview` requires BOTH materials.read and catalog.read, accepts product_id/bom_id/rule_id and dimensions, and returns preview:true without an issued ID or saved snapshot. Staff preview/history retains internal components. The private shared SQL helper cannot be called directly by application roles.

Protected `/admin/estimate-history` and `/estimate-history` resource reads use materials.read; exports use materials.export. Legacy stored result JSON retains its original shape. New requests create history once per submitted calculation; there is no automatic write replay. See [typed cookie-independent example](../../examples/mobile/calculation.ts) and [workshop configuration](../operations/calculation-configuration.md). Generated contracts currently cover 292 paths / 33 explicit methods and 45 registered resource lists. Broader native-app/operational acceptance remains separate.
# Indian mobile inputs — 2026-10-25

## Daily operational dashboard — 2026-10-25

Added `GET /dashboard` with scope (business/demo/all), task (all/new/followup/approval/delivery) and bounded one-based page. One operational read grant is required; underlying source RLS remains authoritative. Explicit DTO returns nullable permission-scoped metrics, ten-row matching task pages, bounded order-stage samples and recent activity. No financial balances, contact addresses or private actor fields are exposed. India-time boundaries and recognized marker classification are documented in [daily-work dashboard](../operations/daily-work-dashboard.md). OpenAPI now covers 293 paths / 34 explicit methods.

## Measurement preferences — 2026-10-25

Guest `POST /leads` accepts optional `measurement_request` with preferred_date (ISO date, today/future in Asia/Kolkata), time_window (morning/afternoon/evening/any), address (10–400 characters) and postal_code (six-digit Indian PIN). Validated preferences are appended to the private lead requirement and excluded as a separate RPC property. Combined requirement must fit 2000 characters; invalid requests return 422 before a write. Existing 201/upload capability response and anti-spam/RLS remain intact. This requests a visit; it does not confirm a slot. OpenAPI/generated types are synchronized. See [customer website workflow](../operations/customer-website-enhancements.md).

Phone write schemas now require an Indian mobile starting 6–9 with ten national digits. National, +91/91 and domestic 0-prefixed input with separators is accepted and canonicalized to `+91` plus ten digits. Invalid input returns 422. Existing read responses/history are not bulk rewritten. OpenAPI input patterns regenerated; syntax validation does not establish ownership/OTP verification.


2026-10-25: Existing admin PATCH validates partial product/variant price bounds against their RLS-visible stored counterpart and rejects review ratings above five before update. Listing removal reuses documented archive/active/hidden PATCH fields; no DELETE endpoint or permission change. See [admin list policy](../operations/admin-list-workflows.md).
