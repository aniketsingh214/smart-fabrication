> Version: 0.1 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 20 — Future Mobile Client Preparation & Handoff

- **Objective / tasks:** OpenAPI freeze, generated TS client, bearer token tests, offline/sync strategy, push notification plan, app feature mapping.
- **Deliverables:** mobile roadmap, API integration guide, example client, compatibility policy.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-20.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Independent mobile client can complete key API flows without web UI. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases without stopping for permission, restricted to local development; production deployment and app store releases remain deferred.

### Implemented & Verified Acceptance

1. **Independent Mobile Client SDK (`src/contracts/client.ts`):**
   - Transpiled and executed real TypeScript client without web UI, cookies, or browser DOM.
   - Verified bearer authorization, profile updates, rejection of privilege overposting (422), cursor pagination for notifications, mark-read retries retaining timestamps, unknown-object and staff permission denials (403/404), token refresh integration, and disabled-profile blocks.
   - Passed 7/7 checks in `npm run test:mobile-client` (`test-results/mobile-client-latest.json`).
2. **OpenAPI Contracts & Typing (`npm run api:check`, `npm run api:types`):**
   - Verified OpenAPI 3.1.0 specification with 292 documented paths.
   - All 33 explicit Route Handler methods have matching OpenAPI paths.
   - Generated TypeScript declarations refreshed in `src/contracts/generated-api.d.ts` without errors.
3. **Mobile Handoff & Architecture (`docs/api/mobile-handoff.md`):**
   - Shipped mobile SDK specification, offline-first conflict resolution rules, push notification architecture, idempotency keys, and versioning/deprecation strategy.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), [mobile handoff](../api/mobile-handoff.md) and [master plan](../MASTER_PLAN.md).


### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.



## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.



### Specialized response contracts — 2026-10-15

Identity and notification endpoints now declare concrete safe response schemas, including nullable customer/read timestamps and list continuation. Generated TypeScript is refreshed. Identity RPC failures no longer masquerade as empty successful responses. Ten real desktop/mobile notification checks and three additional identity contract/error tests passed. Other specialized endpoint examples and native client acceptance remain open.

## Handoff implementation — 2026-10-16

Added the [concrete handoff](../api/mobile-handoff.md), generated-type/runtime-validated profile and notification example, explicit token/error behavior, offline conflict/cache rules, push rollout and compatibility/deprecation strategy. The shipped SDK now explicitly omits cookies, refuses redirects and out-of-base paths, validates response envelopes and preserves status/correlation for unreadable responses. Five SDK regressions and seven independent real SDK/Auth/API checks passed. Full operational quotation/order/upload API acceptance and specialized DTO/example coverage remain; no native app/store release is claimed or required to pretend the current handoff complete.

Audit-safe fixture lifecycle: profile-write acceptance creates an immutable audit actor reference. Generated author identities are disabled/banned rather than deleted; notification/role fixtures are removed and successful sessions globally signed out. The earlier cleanup failure is recorded, not treated as a passing run.

## Verified continuation — 2026-10-17

Seven combined real mobile CMS/category-photo/catalog/enquiry/sales checks passed. Published CMS edits, authorized draft preview, featured publication, exact category search, immutable variant/option snapshots, assigned sales notes/follow-ups and archive behavior are verified. A real edit bug that cleared category_id before reference options loaded is fixed; saved references are controlled/preserved, with paginated choices and recoverable errors. Category photos use verified public product images; private invoice/video/unconfirmed assets are rejected. Homepage category cards now use active database categories rather than hard-coded search terms.

Additive migrations 40–42 are applied to development; 58 public tables remain RLS-protected, with 134 policies, 317 constraints and 96 foreign keys. Native from-empty backup/restore passed all 42 migrations, 199 rollback workflow checks and 15 committed concurrency assertions, including category races at two isolation levels. Earlier failed fixture assertions remain recorded as failures. Current unit/integration evidence: 131 tests / 38 files. Owned-media lists now expose explicit safe metadata with stable cursor continuation; generated OpenAPI/types pass 286 paths / 32 explicit methods.

See [combined publication acceptance](../operations/catalog-publication-acceptance.md) for exact scope and retained fixtures. No financial/stock transactions, deployment or real payment activation were performed by that browser run. Full phase closure still depends on the remaining documented feature/workflow/business/launch gates.