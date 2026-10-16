> Version: 0.1 | Owner: project team | Updated: 2026-10-14 | Status: in_progress

# Phase 02 — Architecture, UX, API & ERD

- **Objective / tasks:** Choose module boundaries, sitemap, design system, state diagrams, RBAC, REST contracts, ERD, threat model, finance assumptions.
- **Deliverables:** architecture.md, wireframes, OpenAPI skeleton, ERD, ADRs, security model.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-02.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Web/mobile contract review, no missing critical entity. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-15. Status: in_progress.

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

One Next.js codebase, server services, RLS/RBAC, public/admin layouts and versioned API boundary exist.

### Remaining acceptance

Synchronize final ERD and module-level acceptance evidence with the applied schema.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phase’s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.
