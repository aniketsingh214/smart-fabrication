> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 20 â€” Future Mobile Client Preparation & Handoff

- **Objective / tasks:** OpenAPI freeze, generated TS client, bearer token tests, offline/sync strategy, push notification plan, app feature mapping.
- **Deliverables:** mobile roadmap, API integration guide, example client, compatibility policy.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-20.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Independent mobile client can complete key API flows without web UI. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

OpenAPI, generated TypeScript types, cookie-independent bearer client and contract unit tests exist.

### Remaining acceptance

286 OpenAPI paths and 32 explicit handler methods passed contract checks. Projected resource-read DTOs and twelve live bearer/session/read-role checks are implemented. Specialized response DTOs/examples, native UI, SDK/offline/deprecation handoff remain.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.



## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.



### Specialized response contracts — 2026-10-15

Identity and notification endpoints now declare concrete safe response schemas, including nullable customer/read timestamps and list continuation. Generated TypeScript is refreshed. Identity RPC failures no longer masquerade as empty successful responses. Ten real desktop/mobile notification checks and three additional identity contract/error tests passed. Other specialized endpoint examples and native client acceptance remain open.
