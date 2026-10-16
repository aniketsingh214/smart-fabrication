> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 04 — Supabase Foundation & Auth/RLS

- **Objective / tasks:** Supabase migrations, profiles, roles, permissions, SSR auth, mobile bearer verification, policies, seed and tests.
- **Deliverables:** migrations, auth endpoints/profile, RLS matrix, security docs.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-04.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Customer/admin/staff access tests and token expiry pass. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Supabase SSR/bearer verification, roles, permissions, account disabling and RLS are implemented.

### Remaining acceptance

The selected confirmed real account has received the owner role. Baseline real owner/customer desktop and mobile login, access and sign-out checks passed using isolated temporary users; no real user's password/session was used. Full role matrix, native refresh/expiry and additional revocation cases remain.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.


## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.

### Identity and notification follow-up — 2026-10-15

GET/PATCH /me and notification list/read responses now have explicit generated safe DTOs. Permission/customer RPC errors are propagated by GET /me. Real desktop/mobile notification pagination, ownership, persisted reads, four concurrent retry timestamps and fault recovery passed in ten isolated browser checks. This supplements earlier auth/session evidence; natural expiry and full per-object/write coverage remain pending.

### Authentication/client recovery remediation

The existing auth/session/RLS implementation was retained. Role/permission and customer quotation controls now recover from rejected network/JSON requests, sign-out checks SDK failure, and login submission preserves inputs and waits for hydration. No security-policy changes or real staff privilege changes were made. See [completion audit](../operations/completion-audit.md) for current verification and open gates. This follow-up does not close Phase 04.

### Pagination and document-navigation follow-up — 2026-10-16

Staff page/API cursor pagination and the lead-assignment More staff control remove the earlier initial-list truncation. Login/logout now reload the same-origin document after successful SDK completion; failed requests remain retryable. The per-account stock recovery flow is described in Phase 14. No role/RLS/JWT policy was relaxed. Full natural expiry, email recovery and complete object/write matrix remain open.
