> Version: 0.2 | Owner: project team | Updated: 2026-10-17 | Status: done (local)

# Phase 05 — Cloudinary & Media Management

- **Objective / tasks:** Signed upload flow, validation, asset records, private media rules, image optimization and cleanup.
- **Deliverables:** upload API, media docs, abuse tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-05.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Unauthorized uploads rejected; asset ownership verified. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-17. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Live connection/private upload/provenance/private-signature/cleanup test passed; signed authenticated and enquiry-token flows are implemented.

### Remaining acceptance

Verify the complete browser → signed upload → atomic database confirmation flow and expiry/quota edge cases.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.

## Read-only retention review — 2026-10-16

Added bounded, cursor-paginated stale unconfirmed intent reporting in a read-only transaction. The real development run found zero matching intents. It excludes verified media and performs no provider calls/deletion. Review age is not a retention policy; orphan-provider enumeration, approved consent/legal-hold rules and destructive cleanup remain open. See [retention runbook](../media/asset-retention.md).

## Verified browser media acceptance — 2026-10-17

Executed `node --env-file=.env.local scripts/test-media-browser.mjs` against configured development Supabase and Cloudinary. All 6 end-to-end browser media checks passed (exit code 0; artifact: `test-results/media-browser-latest.json`):
1. **Real signed private invoice upload:** Browser requests signed upload parameters (`POST /api/v1/uploads/sign`) and uploads PNG to authenticated Cloudinary storage.
2. **Atomic database confirmation:** Provider webhook/confirmation (`POST /api/v1/uploads/confirm`) atomically creates verified `media_assets` and marks `upload_intents` as confirmed with width, height, format, and private visibility.
3. **Expiring private delivery:** Authorized owner requests download URL (`GET /api/v1/uploads/[id]`), receiving a 300-second expiring signed Cloudinary URL that delivers the file (HTTP 200).
4. **Anti-abuse & unauthenticated denial:** Anonymous requests to private media endpoints return HTTP 401.
5. **Catalog video upload & validation:** WebM video upload traverses browser upload, provider verification, duration constraint enforcement (<= 120s), and database confirmation as public asset.
6. **Private PDF invoice delivery & attachment:** PDF invoice upload confirmed as authenticated private asset, delivering `%PDF-` content with `content-disposition: attachment`. Mismatched context requests rejected (HTTP 422).

All synthetic test media and provider assets cleaned up; generated test accounts banned and roles removed with audit integrity preserved. Phase 05 verification gate is complete for local development (`done (local)`). Production capacity and external legal retention policy remain separate gates.

