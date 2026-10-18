> Version: 0.1 | Owner: project team | Updated: 2026-10-15 | Status: partially implemented; acceptance pending

# Purchases/Procurement

## Current implementation update — 2026-10-15

Purchase item details now include a permission-scoped return form; posted returns have an immutable history screen. Supplier detail has a cursor-paginated statement with complete all-time posted totals. Paid returns create supplier credit; actual received refunds are recorded separately. Line discount/tax is implemented; attachment and full live journey acceptance remain pending. See [workflow guide](../operations/catalog-procurement-corrections.md).

## Source specification

- **Functional scope:** Supplier, bill number/date, line items, size/unit/quantity/rate/discount/tax, total, payment status, receipt, attachments.
- **Rules / acceptance:** Unique supplier invoice reference policy, atomic posting, returns/corrections and approval.
- **Documentation:** module specification, API examples, DB schema changes, permissions, validation, test cases and user instructions must be maintained.

## Implementation contract to refine in owning phase

- Stories and baseline acceptance: [requirements](../requirements.md).
- Screens/routes, fields/validation, API DTOs, service rules and errors: pending phase specification.
- Database constraints, migrations, permission/RLS matrix, state transitions and audit events: pending phase specification.
- Tests: cover permitted and denied access, ownership, invalid inputs, transitions and applicable calculation/concurrency boundaries.
- UI: responsive layout with loading, empty, error and keyboard-accessible states.
- Current implementation and remaining acceptance: [phase audit](../progress.md). Actual checks and their limits: [verification evidence](../testing/evidence.md). The source specification is target scope, not a completion claim.


## Finance and reporting follow-up — 2026-10-15

Implemented immutable source-linked corrections and actor-aware retries, supplier credit/refund caps, full pre-production customer refunds with atomic cancellation, active-work/reservation guards and reviewed past-period closure. Refunds record verified manual cash movement; no bank transfer occurs. See [refund and period policy](../operations/refunds-periods.md). Official P&L, post-production commercial refunds and accountant acceptance remain open.



## Catalog and hardening follow-up — 2026-10-15

Implemented catalog weight/design fields, published-choice enquiry snapshots, product video, private invoice images and historical-version PDF selection. Reminder dispatch is service-role-only and SQL runtime/deduplication tests pass. Twelve bearer/session/read-role checks, five contention checks and five real browser media checks passed. See [workflow details](../operations/catalog-invoices-sessions.md) and [test evidence](../testing/evidence.md). Full production acceptance remains pending.


Phase 13 continuation (2026-10-16): invoice association retries now retain the exact original asset/note/purchase, block concurrent submission and avoid re-upload. Authorized downloads use a prepared expiring link. Three regression tests pass; total unit/integration count is 104/27 files. Full live browser purchase association remains pending. See docs/phases/phase-13.md for scope and evidence.

## Procurement acceptance continuation — 2026-10-16

Five additional invoice HTTP-handler tests verify combined purchase/finance read authorization, purchase-scoped 25-row continuation, malformed cursor and overposted financial-field rejection, validated transactional RPC arguments, and propagation of denied sessions/RPC permissions. These are mocked-dependency handler tests, not replacement RLS evidence. All 109 unit/integration tests across 28 files passed; TypeScript and lint passed.

The mobile owner run using installed Edge passed all 18 authenticated browser checks, including the new private PDF association lost-response retry, exact frozen payload, single upload and denied/authorized prepared download link. Other passing checks cover purchase returns, supplier statement, discount/tax, refunds, reports and sign-out. Login and selected read APIs are real; operational write responses are simulated. The generated Auth fixture was cleaned, with immutable audit retained. Chrome startup and server-unavailable attempts failed earlier and are not counted as acceptance. The authenticated runner defaults to localhost, supports TEST_BROWSER_CHANNEL, and now saves sanitized outcome metadata under ignored test-results for future runs.

Phase 13 remains in progress: real provider upload and real rollback SQL association are individually verified, but the complete live purchase-to-provider-to-association browser journey is still pending. No permanent demonstration purchase, stock or financial posting was made. Larger customer-to-installation acceptance, business/accountant decisions and launch gates in the phase register remain open.


Latest procurement acceptance: four combined real mobile browser/Auth/Cloudinary/database checks passed; exact same-asset/note retry after a committed-but-lost response returns one immutable attachment. Local phase 13 gate is closed. Retained labeled zero draft, supplier and private invoice evidence, with generated login retired; no receipt/payment/stock posting. Earlier pending/simulated-only descriptions are historical. See [acceptance runbook](../operations/procurement-acceptance.md).
