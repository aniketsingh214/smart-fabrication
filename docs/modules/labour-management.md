> Version: 0.2 | Owner: project team | Updated: 2026-10-18 | Status: verified (local)

# Labour Management

## Source specification

- **Functional scope:** Worker details, work type, per-kg/per-unit/hour rate, work entries by job, earnings, paid/outstanding, rate history.
- **Rules / acceptance:** Approved entries, rate snapshots, partial payments, role restrictions.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract

- Stories and baseline acceptance: [requirements](../requirements.md).
- Workers: `workers` table with `name`, `phone`, `work_type`, `active`.
- Rate versions: `labour_rates` append-only table with `unit`, `rate_minor`, `effective_at`.
- Work entries: `post_work_entry` RPC captures immutable rate snapshots at creation time, preventing retroactive wage calculation discrepancies; protected with `Idempotency-Key`.
- Settlements: `post_payment('labour', ...)` enforces payment caps against total earned balance; overpayment attempts strictly rejected.
- Wage privacy: RLS restricts wage rates to owner and accounts roles; production staff receives 0 rows when querying `labour_rates`.

## Verification record — 2026-10-18

Verified in Phase 15 acceptance (`npm run test:labour-production`, artifact: `test-results/labour-production-browser-latest.json`):
1. Worker creation & append-only rate versioning verified.
2. Idempotent work entries & historical rate provenance snapshot retention verified.
3. Labour payments & overpayment caps verified.
4. Wage privacy RLS for production role verified.
5. Responsive mobile UI on `/admin/workers` verified.
