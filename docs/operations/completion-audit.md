> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: initial audit complete; remediation in progress

# Completion audit and execution register

## Inputs and scope

The user authorized implementation again after the earlier analysis-only audit. Existing modules, schema and completed checks are retained. No replacement project, destructive migration, permission-policy relaxation or deployment is part of this work.

`SmartFabrication_Codex_Completion_Plan.md` was not found in the workspace or recursive searches of Downloads, Desktop, Documents and the parent work directory. Its exact path has been requested. Its contents have **not** been read or followed by assumption. The supplied [master plan](../MASTER_PLAN.md), all 20 existing phase records, [previous audit](../../PROJECT_STATUS.md), source paths and existing evidence form the available baseline.

The phase register below separates actual code from missing acceptance. One closed phase and nineteen partial phases do not represent a measured implementation percentage.

## Existing phase audit — preserve completed implementation

| Phase | Retained implementation | Remaining gate / next action |
| --- | --- | --- |
| [01](../phases/phase-01.md) | Master and 34-requirement/31-module traceability | Closed in existing register; do not regenerate the source |
| [02](../phases/phase-02.md) | Next.js/API/contract/RBAC/RLS architecture, generated schema | Final ERD and detailed module acceptance synchronization |
| [03](../phases/phase-03.md) | Local app, Git/CI and hosting config | Deployment stays deferred and requires approval |
| [04](../phases/phase-04.md) | Supabase signup/login/SSR/bearer, refresh, roles, disable/revocation | Repair browser failure recovery now; full object/write matrix, natural expiry and email recovery remain |
| [05](../phases/phase-05.md) | Real signed image/video upload, private delivery, guest capabilities | Retention/orphan policy and remaining context acceptance; guest flow already has four real checks |
| [06](../phases/phase-06.md) | Public/CMS/gallery/reviews/SEO and licensed demo photos | Final workshop content, consent; separate About/process page still absent |
| [07](../phases/phase-07.md) | Product/category/options/variant CRUD, preview/copy, choice snapshots | Full publication/customer acceptance and collection continuation |
| [08](../phases/phase-08.md) | Material/rate/BOM history and pricing guards | Real units/formulas and history acceptance |
| [09](../phases/phase-09.md) | Configured server estimator and measurements | Approved workshop formulas and complete boundary/history acceptance |
| [10](../phases/phase-10.md) | Enquiries/notes/assignment/follow-ups and scheduler RPC | Hosted scheduling/retention and remaining staff workflow |
| [11](../phases/phase-11.md) | Immutable quotes/revisions, customer response and historical PDF | Failure recovery now; complete live customer approval/PDF journey and terms |
| [12](../phases/phase-12.md) | Conversion, transitions, customer-safe paging/timeline | Full real browser workflow and commercial cancellation policies |
| [13](../phases/phase-13.md) | Discount/tax, receipt, returns/refunds, invoice images, statements | PDF invoice support and complete live purchase association acceptance |
| [14](../phases/phase-14.md) | Stock ledger/book value/reservations, SQL locks and retry actors | Repair browser retry identity now; navigation recovery, broader stress and workshop acceptance remain |
| [15](../phases/phase-15.md) | Jobs, QC, historical labour rates/earnings/payment guards | Real-role browser workflow and actual allocation/rates |
| [16](../phases/phase-16.md) | Delivery/private proof/installation checklist and SQL completion rules | Full browser/provider journey and service boundaries |
| [17](../phases/phase-17.md) | Financial corrections/refunds/closure/reconciliation | Actual opening data, accounting policies and accountant sign-off; do not invent these |
| [18](../phases/phase-18.md) | Charts/exports/audit/permissions/reminders | Role/export completeness, snapshots and hosted acceptance |
| [19](../phases/phase-19.md) | Synthetic native restore, concurrency/load/security checks | Managed recovery/capacity/accessibility/security/dependencies and approved launch |
| [20](../phases/phase-20.md) | Stable API boundary, DTOs/generated types/bearer client | Remaining specialized examples/native/offline handoff |

Real implementation is connected through the [resource registry](../../src/contracts/resources.ts), [API catch-all](../../src/app/api/v1/[...segments]/route.ts), [operation services](../../src/features/operations/services.ts), [workflow actions](../../src/features/operations/actions.ts) and [migrations](../../supabase/migrations). Browser write simulations are not counted as complete live workflows.

## First remediation: authentication and inventory

### Inventory retry defect

Previously, each StockForm submit generated a fresh idempotency key. A server commit followed by a lost response could make a retry another movement. React form actions could also reset uncontrolled fields after a handled failure.

The form now uses an explicit submission handler and one frozen command containing the exact JSON bytes and key. It guards simultaneous submits and locks fields while the outcome is uncertain. The retry button resends that command. A recognized server validation/authorization/conflict rejection permits editing; a network, malformed JSON, unknown response or server failure preserves the command. Successful confirmation clears it. INR unit-cost entry is converted to exact integer paise from its decimal text rather than binary multiplication.

**Boundary:** the pending command currently lives in the mounted form, not durable storage. Reloading, navigating away or using another tab does not restore it. The UI explicitly tells staff to retry here and check the ledger before recreating it elsewhere. Navigation-safe recovery remains an open follow-up; this fix does not claim cross-tab/offline exactly-once delivery.

Sources: [StockForm](../../src/features/inventory/stock-form.tsx), [posting command](../../src/features/inventory/posting.ts), [regression tests](../../tests/unit/stock-posting.test.ts).

### Auth/customer control recovery

RoleEditor, PermissionEditor and QuoteResponse now catch request/JSON failures and release busy flags in finally blocks. Immediate duplicate calls are guarded. Failed sign-out displays a retry error instead of treating an SDK error as success. Login form submit preserves inputs on handled failure and prevents mode switching while a request is active; POST is the native form fallback to avoid credentials in a GET URL.

No role grants, RLS policies, JWT validation, authorization rules or database financial history were changed. Real role changes remain subject to existing server/database controls.

## Verification scope

- Five focused stock regression tests pass: lost response/same key+bytes, malformed response/frozen payload, explicit rejection/editing, simultaneous submission/distinct future keys and exact paise validation.
- Current unit/integration run: 89 tests across 23 files passed. TypeScript passed after fixing a test mock typing issue. Browser reliability, final lint/build and subsequent checks must be recorded from their actual outputs.
- The first browser attempt passed two desktop auth-control failure cases, then suffered a test PostgreSQL connection reset. It is **not** a passing complete run. Its generated fixture account/material were removed through identity-checked cleanup; no stock movements existed. The harness now has timeouts, handles database disconnects, and reconnects for cleanup.
- Reliability harness login/read paths are real, but role/permission/stock write responses are intentionally intercepted. This checks UI retry behavior without posting financial/stock records or changing staff grants.
- Earlier 180 restored-local SQL checks and 11 isolated committed concurrency assertions remain separate backend evidence; no new database run is implied by the UI tests.

## Execution order

1. Finish verification of auth/inventory reliability changes and synchronize the affected phase/module docs.
2. Address navigation-safe inventory retry recovery, staff/selection pagination and the remaining auth/object boundaries.
3. Complete one isolated real browser customer-to-installation workflow, then purchase invoice association/PDF support and remaining module acceptance.
4. Finish business content/configuration and obtain actual workshop/accounting decisions; retain explicit unavailable-input gates.
5. Complete operational recovery/hardening and seek approval before deployment or destructive/security-sensitive operations.

No phase is marked complete solely because these fixes compile. The unavailable completion-plan file must be read in full once its actual location is supplied, then this register reconciled with its additional requirements.

## Verified continuation — 2026-10-16

The previous mounted-form-only retry limitation is superseded: the stock command now saves its exact key/body to account-scoped sessionStorage **before dispatch**, restores in the same browser tab after reload/navigation, and clears only after a confirmed success or recognized rejection. A storage-write failure prevents dispatch; failure to clear after a server success retains the old command for safe replay. Corrupt/unreadable saved state blocks new posting and offers ledger review plus explicit local reset confirmation. Closing the tab, another device or independent commands in another tab are outside this guarantee; backend actor/payload/idempotency guards remain unchanged.

Inventory controls now have explicit accessible select labels. Auth login/logout perform a same-origin document navigation after the SDK completes so SSR reads the updated session. Role/permission/quotation request-failure recovery is retained.

Staff API/page now provide stable created_at/id cursor continuation. API default remains 100 (maximum 100); the page requests 25 and exposes first/older links. Lead assignment has a More staff action with deduplication and visible errors. Generated schemas include the explicit staff DTO and pagination parameters.

The missing About/process route is implemented at /about: published about/process CMS sections, five explanatory stages, licensed demo image, quotation/catalog links, footer discovery and sitemap entry. No workshop identity, history, prices or accountant figures were fabricated.

Verification completed so far: 95 unit/integration tests across 24 files, TypeScript, 24 public desktop/mobile browser checks (including photo→enquiry reference and About/process) and an earlier six-check desktop/mobile reliability run including stock reload/retry. The reliability run uses real login/reads and intercepted role/permission/stock writes. Its fixtures were cleaned; no ledger transactions or real privilege changes were made. Expanded staff/sign-out browser checks and final build results must be appended from actual outputs.

Testing exposed environmental and harness failures before the passing runs: the first restarted dev server had restricted network access, several attempts had DNS/connection resets, and selectors initially depended on the changing Post/Retry label. The working dev server requires access to the configured development services. Failed runs are not included in the pass counts. No shared database sessions were terminated.

Remaining work is still the phase register above: complete isolated real customer-to-installation browser acceptance, PDF invoice support/live association, remaining collection/role coverage, business content/formulas/accounting decisions, managed recovery and approved deployment. No phase-wide production-readiness claim is made.


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

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.
## Steps 1–2 engineering continuation — 2026-10-17

Step 1: dedicated product delivery/installation availability, safe defaults/display/copy and database-verified product image/video association are implemented. Seven real catalog/media/customer/sales checks passed before starting Step 2. Initial required-label and missing-display-order fixture attempts failed and were archived/retired, not counted as passing.

Step 2: exact effective-rate provenance, explicit public/preview DTOs, protected immutable estimate history, non-persisted draft preview and BOM customer-visible flags are implemented. The latest combined catalog run passed eight real checks including draft preview, live calculator rate changes, original-history preservation and internal-component public redaction. A targeted calculator-only run also passed the same assertions independently. Data/provider/auth responses were real. Native empty-schema/restore on 46 migrations passed 227 SQL/RLS workflows and 15 committed concurrency assertions. Current unit/integration suite: 141 tests / 40 files.

Earlier preview attempts returned an unexpected runtime error; a clean dev-worker restart first exposed repeated login reloads, then moving only the verified project dev cache to an ignored workspace backup and restarting restored stable login and preview HTTP 200. No source or database was deleted. A later corrected complete rerun, not the failed attempts, supports acceptance. Preview server diagnostics record only stage/type/call frames, never request bodies, bearer tokens or raw private errors.

Fixtures: test products/content archived, categories/materials deactivated, generated logins disabled/roles removed/sessions retired. Referenced synthetic photos and immutable BOM/rate/estimate/audit history are intentionally retained and labeled TEST ONLY. No receipt/payment/stock posting occurred. Actual workshop material/rate/BOM inputs are still absent; “ok done” supplied no values/file. Native 2D formula testing is not business/accountant approval or an approved depth/thickness formula.