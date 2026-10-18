> Version: 0.1 | Owner: project team | Updated: 2026-10-18 | Status: done (local)

# Phase 16 — Delivery, Installation & Completion

- **Objective / tasks:** Delivery schedules, crew, evidence, installation checks, customer confirmation, completed job gallery.
- **Deliverables:** delivery APIs, mobile-ready field schemas, tests.
- **API/mobile requirement:** update OpenAPI and mobile integration notes for every added/changed mobile-relevant capability; no browser-only business logic.
- **Docs required:** `docs/phases/phase-16.md`, relevant module docs, `docs/progress.md`, architecture/API/DB/security documents touched by this phase.
- **Verification gate:** Completed order has required sign-offs. Plus lint, typecheck, relevant tests, build, permission/RLS checks and documented actual results.
- **Approval:** stop and obtain review before next phase.

## Execution record

Updated: 2026-10-18. Status: done (local).

The user authorized sequential implementation across phases and requested local-only work without waiting for individual phase approvals.

### Implemented

1. **Delivery Scheduling & Transport Assignment**: Delivery records validate crew, vehicle, scheduled time, and recipient delivery address; initial state is strictly guarded to `'scheduled'`.
2. **Guarded Delivery Transitions & Evidence Gate**: State progression follows `'scheduled' -> 'dispatched' -> 'delivered'`. Transition to `'delivered'` strictly requires confirmed time and `proof_media_id` referencing a verified private `media_assets` row (`context = 'delivery_proof'`, `visibility = 'private'`).
3. **Installation Checklist & Customer Confirmation Gate**: Installation completion requires comprehensive 4-point checklist (`fixings_checked`, `alignment_checked`, `finish_checked`, `site_cleaned`) and `customer_confirmed = true`. Associated delivery must already be in `'delivered'` status.
4. **Order Completion Enforcement**: Order status progression from `'OUT_FOR_DELIVERY'` to `'INSTALLATION'` to `'COMPLETED'` requires verified delivery and completed installation sign-off.
5. **Customer Timeline & RLS Isolation**: Customers access milestones on their authenticated order timeline (`/account/orders/[id]`); stranger customers are denied private timelines (0 rows returned / 404).
6. **Mobile Admin UI**: Responsive management screens on `/admin/deliveries` and `/admin/installations` verified under Playwright mobile viewport.

### Verification Evidence

- Automated suite: `scripts/test-delivery-installation-browser.mjs` (`npm run test:delivery-installation`).
- Artifact: `test-results/delivery-installation-browser-latest.json` (6/6 passing checks, 0 failures).
- TypeScript: `npm run typecheck` passed (0 errors).

See [progress](../progress.md), [test evidence](../testing/evidence.md), the relevant module specification and [master plan](../MASTER_PLAN.md). A passing general build does not replace this phaseâ€™s feature, authorization and reconciliation gates.

### Change safety

Use additive forward migrations for applied schemas. No destructive rollback, real payment activation or production deployment. Current provider credentials must remain in ignored environment configuration.
