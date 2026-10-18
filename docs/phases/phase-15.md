> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 15 — Labour, Work Orders & Production

- **Objective / tasks:** Workers/rates/work entries/payments, production jobs/stages, material usage, QC.
- **Deliverables:** labour/production APIs, UI, documents, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-15.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Job costing and worker outstanding match ledger. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases and later requested local-only work; repeated approval gates in the source baseline do not override that instruction.

### Implemented

Workers, append-only rates, job cards, stages, quality checks, idempotent earning entries, payment caps, wage privacy RLS, and mobile UI exist and are fully verified.

### Remaining acceptance

Biometric attendance hardware and automated physical CNC cutting integration remain future workshop floor operational enhancements.

### Evidence and dependencies

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md).

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.

## Verified acceptance — 2026-10-18

Executed `npm run test:labour-production` (`scripts/test-labour-production-browser.mjs`, artifact `test-results/labour-production-browser-latest.json`):
1. **Worker creation & append-only rate versions:** Workers created with trades; rates record unit, effective timestamp, and hourly/per-unit/kg rates without mutating history.
2. **Work order staged transitions & quality check gate:** Work orders traverse pending -> fabrication -> finishing -> quality_check; transitioning to 'ready' without a passed quality check is strictly blocked by database trigger `workflow_guard`; recording passed QC permits advancement to 'ready'.
3. **Idempotent work entries & historical rate provenance:** Work entries record completed units with `Idempotency-Key` preventing duplicate payouts on retry; entries take an immutable snapshot of the effective wage rate at creation time; subsequent wage rate updates preserve historical earnings.
4. **Labour settlements & overpayment prevention:** Payment caps strictly enforce that labour payments cannot exceed outstanding earned worker balance; overpayment attempts are rejected; partial and final settlements reconcile outstanding balance to zero.
5. **Wage privacy enforcement:** RLS strictly restricts `labour_rates` to owner/accounts; production staff querying wage rates receives zero rows while retaining operational access to work orders and quality checks.
6. **Admin mobile UI inspection:** Owner accesses `/admin/work-orders` and `/admin/workers` on mobile (`iPhone 13`), verifying responsive job cards, stages, and worker rosters.

Phase 15 verification gate is complete for local development (`done (local)`).
