# Native local backup/restore drill

Updated 2026-10-15. PostgreSQL 18.6 tools were found under C:\Program Files\PostgreSQL\18\bin after PATH-only discovery missed them. No download or system-service installation was required.

Run npm.cmd run test:restore with ignored local environment configuration. SF_POSTGRES_BIN optionally selects trusted Windows binaries. The script starts its own hidden loopback-only cluster on a dynamic port and guarded sf_restore_<uuid> database names under ignored test-results. It never restores into Supabase or the machine's existing PostgreSQL service.

The source is a verified-TLS schema-only export of public objects and read-only role/permission configuration. No remote customer, financial or Auth rows are copied. A minimal local Auth schema/uid function supports synthetic RLS fixtures; it does not emulate the full Supabase Auth service.

The harness seeds synthetic local data, creates a native custom-format pg_dump, restores with pg_restore, compares every public/Auth table's ordered row fingerprints and table/RLS/policy counts, then checks restored owner/anonymous boundaries. It runs the rollback workflow suite on the restored database and genuinely committed competing transactions against isolated synthetic records.

Verified baseline: identical fingerprints, 58 public tables, 134 policies, restored RLS access and 168 local workflow checks passed. Eleven concurrent-commit assertions cover stock deductions, duplicate stock/receipt/refund retries, payment/refund caps and competing reservations. The harness reported 16 assertions plus the workflow suite; the disposable cluster stopped afterward. Successful manifests/results and synthetic archives remain ignored for review. Failed stopped cluster data was removed after resolved-path/manifest/PID checks.

Initial attempts exposed Windows process pipe handling, guarded database-name suffixes and schema-only versus full-archive public-schema setup. These were corrected before the successful drill. Remote business data was neither copied nor changed.

This is a real native restore of a synthetic clone using the application schema, not a production disaster-recovery certificate. Before launch, configure staging/production backup ownership, protected storage, retention, recovery targets and scheduling; verify managed Supabase recovery including real Auth configuration and provider assets in an isolated environment. No production restore, destructive reset or hosted backup schedule was performed.

Offline reuse: npm.cmd run test:restore:offline -- 202610150037_customer_quotation_pages.sql restarts a verified stopped synthetic snapshot, restores into a new guarded local database, applies the specified forward migration and reruns workflows/concurrency without loading cloud credentials or contacting Supabase. Verified: 171 workflow checks and 11 concurrent-commit assertions; the cluster stopped. Only apply migrations newer than the chosen snapshot. Later online schema-export attempts timed out; offline replay remained successful.


Latest offline command for the saved schema-36 snapshot: npm.cmd run test:restore:offline -- 202610150037_customer_quotation_pages.sql 202610150038_posting_retry_actors.sql. This passed 180 workflow checks and 11 concurrent-commit assertions. It applies forward migrations only to a newly restored synthetic local target.



## Verified continuation — 2026-10-16

This section supersedes earlier implementation gaps/counts; earlier dated records remain historical evidence.

- Migration 39 adds private invoice PDFs (10 MB maximum), with provider verification, context/owner restrictions and expiring attachment download. Six real media browser checks passed; generated accounts/assets were removed. Purchase association is tested in rollback SQL; full live purchase-association browser acceptance remains.
- Stock requests persist their frozen command/key before dispatch in account-scoped tab storage and recover after reload. Eight focused stock tests cover recovery, exact paise and fail-closed storage. Ten desktop/mobile reliability checks passed with real authentication/staff reads and intercepted operational writes; no financial/stock postings were retained.
- Staff directory and lead assignment now expose cursor continuation. About/process, demo-photo discovery and reference-prefilled enquiry are covered by 24 passing public desktop/mobile checks.
- Unit/integration: 101 tests / 26 files passed. Typecheck, lint, production build, OpenAPI (286 paths / 32 explicit methods), documentation and secret checks passed.
- All 39 migrations apply to an empty disposable native PostgreSQL database. Restore fingerprints match; 186 workflow checks and 11 committed concurrency assertions passed locally. Offline restore replay also passed. Local Auth uses a minimal adapter, not the managed Supabase Auth service. Browser output now uses test-results/browser so it cannot erase restore baselines.
- API generation reads explicit resource contracts/schema metadata and scripts/api-specialized-paths.json for specialized definitions. Generation and contract checks pass; generated output is not its own source.

Only the current development project is available, as confirmed by the user. Cloud SQL tests roll back; media/Auth fixtures are scoped and removed, with immutable audit retained. A full browser quotation-to-installation journey that leaves permanent financial/stock records has not been run. No production deployment, live restore, real payment activation or accountant approval is claimed. Actual workshop formulas/content, opening figures, WIP/depreciation/tax decisions, production workload/recovery and remaining phase acceptance stay open. SmartFabrication_Codex_Completion_Plan.md remains unavailable; the preserved master and all 20 phases remain the traceability baseline.
