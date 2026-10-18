> Version: 0.2 | Owner: project team | Updated: 2026-10-16 | Status: done (local engineering)

# Phase 13 â€” Suppliers & Procurement

- **Objective / tasks:** Supplier master, purchase orders/bills, line items, goods receipt, partial payments, returns.
- **Deliverables:** supplier/purchase APIs, docs, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-13.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Supplier balances and received stock reconcile. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-16. Status: local engineering gate passed. Earlier dated continuations below are historical.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Supplier/purchase records, item receipt transaction, supplier payments and purchase-return API exist.

### Remaining acceptance

Local scope verified: supplier/purchase/item CRUD, receipt/return/payment/refund reconciliation, discount/tax snapshots, paginated statements and private image/PDF invoice evidence. The four-check combined real browser invoice journey now passes. Production/workshop rollout and professional accounting approval remain separate phase 17/19 gates; see the acceptance runbook.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.


## Verified continuation — 2026-10-16

This section supersedes earlier implementation gaps/counts; earlier dated records remain historical evidence.

- Migration 39 adds private invoice PDFs (10 MB maximum), with provider verification, context/owner restrictions and expiring attachment download. Six real media browser checks passed; generated accounts/assets were removed. Purchase association is tested in rollback SQL; full live purchase-association browser acceptance remains.
- Stock requests persist their frozen command/key before dispatch in account-scoped tab storage and recover after reload. Eight focused stock tests cover recovery, exact paise and fail-closed storage. Ten desktop/mobile reliability checks passed with real authentication/staff reads and intercepted operational writes; no financial/stock postings were retained.
- Staff directory and lead assignment now expose cursor continuation. About/process, demo-photo discovery and reference-prefilled enquiry are covered by 24 passing public desktop/mobile checks.
- Unit/integration: 101 tests / 26 files passed. Typecheck, lint, production build, OpenAPI (286 paths / 32 explicit methods), documentation and secret checks passed.
- All 39 migrations apply to an empty disposable native PostgreSQL database. Restore fingerprints match; 186 workflow checks and 11 committed concurrency assertions passed locally. Offline restore replay also passed. Local Auth uses a minimal adapter, not the managed Supabase Auth service. Browser output now uses test-results/browser so it cannot erase restore baselines.
- API generation reads explicit resource contracts/schema metadata and scripts/api-specialized-paths.json for specialized definitions. Generation and contract checks pass; generated output is not its own source.

Only the current development project is available, as confirmed by the user. Cloud SQL tests roll back; media/Auth fixtures are scoped and removed, with immutable audit retained. A full browser quotation-to-installation journey that leaves permanent financial/stock records has not been run. No production deployment, live restore, real payment activation or accountant approval is claimed. Actual workshop formulas/content, opening figures, WIP/depreciation/tax decisions, production workload/recovery and remaining phase acceptance stay open. SmartFabrication_Codex_Completion_Plan.md remains unavailable; the preserved master and all 20 phases remain the traceability baseline.

## Phase 13 invoice retry remediation — 2026-10-16

The attachment client now freezes the verified asset, original trimmed note and purchase target after upload. Lost/non-JSON/unsuccessful association responses retain this command; retry does not re-upload or silently change its note. Concurrent submissions are blocked before upload. Invoice download uses an explicit authorized expiring link after preparation, avoiding an asynchronous popup. Pagination suppresses concurrent loads and duplicate attachment IDs.

Three regression tests cover lost responses with an exact retry, cross-purchase misuse, malformed confirmation/permission denial and concurrent/upload failures. All 104 unit/integration tests passed; typecheck and production build passed. The updated effect was lint-checked separately. Pending commands are retained only while the component remains mounted; reload recovery is not claimed.

A desktop/mobile simulated-API browser scenario has been added to browser-operational-checks.mjs. It uses real authentication but intercepts purchase, upload and download responses, so it does not demonstrate real purchase association or create financial records. The initial browser run failed at login hydration and cleaned its Auth fixture; rerun results are recorded separately. Complete live association acceptance and the broader procurement journey remain open. No migration, API shape or permission/RLS change was made.

## Procurement acceptance continuation — 2026-10-16

Five additional invoice HTTP-handler tests verify combined purchase/finance read authorization, purchase-scoped 25-row continuation, malformed cursor and overposted financial-field rejection, validated transactional RPC arguments, and propagation of denied sessions/RPC permissions. These are mocked-dependency handler tests, not replacement RLS evidence. All 109 unit/integration tests across 28 files passed; TypeScript and lint passed.

The mobile owner run using installed Edge passed all 18 authenticated browser checks, including the new private PDF association lost-response retry, exact frozen payload, single upload and denied/authorized prepared download link. Other passing checks cover purchase returns, supplier statement, discount/tax, refunds, reports and sign-out. Login and selected read APIs are real; operational write responses are simulated. The generated Auth fixture was cleaned, with immutable audit retained. Chrome startup and server-unavailable attempts failed earlier and are not counted as acceptance. The authenticated runner defaults to localhost, supports TEST_BROWSER_CHANNEL, and now saves sanitized outcome metadata under ignored test-results for future runs.

Phase 13 remains in progress: real provider upload and real rollback SQL association are individually verified, but the complete live purchase-to-provider-to-association browser journey is still pending. No permanent demonstration purchase, stock or financial posting was made. Larger customer-to-installation acceptance, business/accountant decisions and launch gates in the phase register remain open.


## Local gate closure — 2026-10-16

Four real procurement browser checks passed, including a deliberately lost committed response with exact idempotent association recovery. Existing 186 live rollback workflow checks include supplier/received-stock reconciliation; 124 unit/integration tests, build, lint and API checks pass. See [real acceptance runbook](../operations/procurement-acceptance.md) for retained zero-draft fixture boundaries. This closes local phase 13 engineering, not launch/accountant approval. Prior statements that combined invoice acceptance was pending are superseded by this result.
