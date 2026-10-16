> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 05 — Cloudinary & Media Management

- **Objective / tasks:** Signed upload flow, validation, asset records, private media rules, image optimization and cleanup.
- **Deliverables:** upload API, media docs, abuse tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-05.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Unauthorized uploads rejected; asset ownership verified. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

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
