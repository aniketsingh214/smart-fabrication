> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: verified (local)

# Production & Work Orders

## Source specification

- **Functional scope:** Order-linked job card, material reservations, tasks, stages, workers, planned/actual weight, quality check, scrap/wastage.
- **Rules / acceptance:** Inventory consumption and cost traceability; no completion without required checks.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Work orders: `work_orders` table linked to parent `orders(id)` with stages: 'pending' -> 'fabrication' -> 'finishing' -> 'quality_check' -> 'ready'.
- Stage transitions: `POST /api/v1/work-orders/[id]/transitions` validates status progression and enforces permissions (`production.write`).
- Quality check gate: Database trigger `workflow_guard` strictly prevents advancing a work order to 'ready' unless a passed quality check (`quality_checks.passed = true`) exists.
- Quality checks: `quality_checks` table records inspection results, pass/fail status, and inspector notes.
- UI: Responsive table, job cards, and transitions on `/admin/work-orders`.

## Verification record — 2026-10-18

Verified in Phase 15 acceptance (`npm run test:labour-production`, artifact: `test-results/labour-production-browser-latest.json`):
1. Staged work order transitions verified.
2. Quality check database trigger gate (blocked without passed QC, succeeds with passed QC) verified.
3. Work order creation and linking verified.
4. Mobile UI on `/admin/work-orders` verified.
